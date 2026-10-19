"use server";

import { db, jobOffersTable, jobApplicationsTable } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadFile } from "@/lib/storage";
import { scoreCv } from "@/lib/cvScoring";
import { sendApplicationConfirmationEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";

export async function submitJobApplicationAction(token: string, formData: FormData) {
  const [offer] = await db
    .select()
    .from(jobOffersTable)
    .where(eq(jobOffersTable.publicToken, token))
    .limit(1);

  if (!offer) {
    return { error: "Offre d'emploi introuvable ou lien expiré." };
  }

  if (offer.status === "closed") {
    return { error: "Les candidatures pour cette offre sont désormais clôturées." };
  }

  if (offer.closingDate && new Date(offer.closingDate) < new Date()) {
    return { error: "La date limite de dépôt de candidature est dépassée." };
  }

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const country = (formData.get("country") as string)?.trim() || null;
  const coverLetterText = (formData.get("coverLetterText") as string)?.trim() || null;

  if (!firstName || !lastName || !email) {
    return { error: "Veuillez renseigner votre prénom, nom et adresse e-mail." };
  }

  // Vérifier si ce candidat a déjà postulé à cette offre
  const [existing] = await db
    .select({ id: jobApplicationsTable.id })
    .from(jobApplicationsTable)
    .where(
      and(
        eq(jobApplicationsTable.jobOfferId, offer.id),
        eq(jobApplicationsTable.email, email)
      )
    )
    .limit(1);

  if (existing) {
    return {
      error: "Vous avez déjà soumis votre candidature pour ce poste. Votre dossier est en cours de traitement.",
    };
  }

  // ── GESTION DU CV (OBLIGATOIRE) ──────────────────────────────────────────
  const cvFile = formData.get("cv") as File | null;
  if (!cvFile || cvFile.size === 0) {
    return { error: "Veuillez joindre votre Curriculum Vitae (format PDF ou document)." };
  }

  if (cvFile.size > 8 * 1024 * 1024) {
    return { error: "Le fichier de CV est trop volumineux (maximum 8 Mo)." };
  }

  const cvBuffer = Buffer.from(await cvFile.arrayBuffer());
  const cvUpload = await uploadFile({
    fileBuffer: cvBuffer,
    fileName: cvFile.name,
    contentType: cvFile.type || "application/pdf",
  });

  // ── GESTION DE LA LETTRE DE MOTIVATION (OPTIONNELLE) ───────────────────
  let coverLetterUrl: string | null = null;
  let coverLetterFileName: string | null = null;
  const letterFile = formData.get("coverLetterFile") as File | null;
  if (letterFile && letterFile.size > 0) {
    const letterBuffer = Buffer.from(await letterFile.arrayBuffer());
    const letterUpload = await uploadFile({
      fileBuffer: letterBuffer,
      fileName: letterFile.name,
      contentType: letterFile.type || "application/pdf",
    });
    coverLetterUrl = letterUpload.url;
    coverLetterFileName = letterUpload.fileName;
  }

  // ── SCORING IA PRÉALABLE DU CV ──────────────────────────────────────────
  let aiScore: number | null = null;
  let aiKeywordsMatched: string[] = [];
  let aiSummary: string | null = null;

  try {
    const scoreResult = await scoreCv({
      cvUrl: cvUpload.url,
      requirements: offer.requirements,
      description: offer.description,
    });
    aiScore = scoreResult.score;
    aiKeywordsMatched = scoreResult.matchedKeywords;
    aiSummary = scoreResult.summary;
  } catch (err) {
    console.error("[CvScoring Error lors de la soumission] :", err);
  }

  // ── INSERTION EN BASE DE DONNÉES ────────────────────────────────────────
  const [createdApp] = await db
    .insert(jobApplicationsTable)
    .values({
      jobOfferId: offer.id,
      firstName,
      lastName,
      email,
      phone,
      country,
      cvUrl: cvUpload.url,
      cvFileName: cvUpload.fileName,
      coverLetterUrl,
      coverLetterFileName,
      coverLetterText,
      aiScore,
      aiKeywordsMatched,
      aiSummary,
      status: "new",
    })
    .returning();

  // ── ENVOI DE L'EMAIL DE CONFIRMATION AU CANDIDAT ───────────────────────
  try {
    await sendApplicationConfirmationEmail({
      to: email,
      candidateName: `${firstName} ${lastName}`,
      jobTitle: offer.title,
      companyLabel: offer.companyLabel,
    });
  } catch (err) {
    console.error("[Email Error] Échec de l'envoi de l'accusé de réception :", err);
  }

  await logAuditEvent({
    companyId: null,
    action: "JOB_APPLICATION_SUBMITTED",
    entityType: "job_application",
    entityId: createdApp.id,
    detail: {
      offerTitle: offer.title,
      email,
      aiScore,
    },
  });

  revalidatePath(`/job-offers/${offer.id}/applicants`);
  return { success: true, applicantId: createdApp.id };
}

export async function getApplicationsByOfferAction(jobOfferId: string) {
  const applications = await db
    .select()
    .from(jobApplicationsTable)
    .where(eq(jobApplicationsTable.jobOfferId, jobOfferId))
    .orderBy(desc(jobApplicationsTable.submittedAt));

  return applications;
}

export async function updateApplicationStatusAction(
  applicationId: string,
  status: string
) {
  const [updated] = await db
    .update(jobApplicationsTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(jobApplicationsTable.id, applicationId))
    .returning();

  return updated;
}

export async function scoreAllApplicationsForOfferAction(jobOfferId: string) {
  const [offer] = await db
    .select()
    .from(jobOffersTable)
    .where(eq(jobOffersTable.id, jobOfferId))
    .limit(1);

  if (!offer) throw new Error("Offre introuvable.");

  const applications = await db
    .select()
    .from(jobApplicationsTable)
    .where(eq(jobApplicationsTable.jobOfferId, jobOfferId));

  let scoredCount = 0;

  for (const app of applications) {
    try {
      const scoreResult = await scoreCv({
        cvUrl: app.cvUrl,
        requirements: offer.requirements,
        description: offer.description,
      });

      await db
        .update(jobApplicationsTable)
        .set({
          aiScore: scoreResult.score,
          aiKeywordsMatched: scoreResult.matchedKeywords,
          aiSummary: scoreResult.summary,
          // Si le score est >= 70, on peut pré-sélectionner automatiquement
          status: scoreResult.score >= 70 && app.status === "new" ? "shortlisted" : app.status,
          updatedAt: new Date(),
        })
        .where(eq(jobApplicationsTable.id, app.id));

      scoredCount++;
    } catch (err) {
      console.error(`Erreur scoring pour candidature ${app.id} :`, err);
    }
  }

  revalidatePath(`/job-offers/${jobOfferId}/applicants`);
  return { success: true, scoredCount };
}
