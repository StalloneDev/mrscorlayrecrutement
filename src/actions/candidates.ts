"use server";

import { db, candidatesTable, invitationsTable, assessmentAttemptsTable, campaignsTable } from "@/db";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateInvitationToken, hashInvitationToken } from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";
import { sendInvitationEmail, getAppUrl } from "@/lib/email";

export async function getCandidatesByCampaign(campaignId: string) {
  const candidates = await db
    .select({
      id: candidatesTable.id,
      companyId: candidatesTable.companyId,
      campaignId: candidatesTable.campaignId,
      firstName: candidatesTable.firstName,
      lastName: candidatesTable.lastName,
      email: candidatesTable.email,
      phone: candidatesTable.phone,
      status: candidatesTable.status,
      score: candidatesTable.score,
      invitedAt: candidatesTable.invitedAt,
      createdAt: candidatesTable.createdAt,
    })
    .from(candidatesTable)
    .where(eq(candidatesTable.campaignId, campaignId))
    .orderBy(desc(candidatesTable.createdAt));

  // Récupérer les invitations existantes et tentatives
  const result = await Promise.all(
    candidates.map(async (c) => {
      const [invitation] = await db
        .select({ id: invitationsTable.id, status: invitationsTable.status })
        .from(invitationsTable)
        .where(eq(invitationsTable.candidateId, c.id))
        .limit(1);

      const [attempt] = await db
        .select({ id: assessmentAttemptsTable.id, submissionType: assessmentAttemptsTable.submissionType })
        .from(assessmentAttemptsTable)
        .where(eq(assessmentAttemptsTable.candidateId, c.id))
        .limit(1);

      return {
        ...c,
        invitationId: invitation?.id || null,
        attemptId: attempt?.id || null,
      };
    })
  );

  return result;
}

export async function addCandidateAction(formData: FormData) {
  const companyId = formData.get("companyId") as string;
  const campaignId = formData.get("campaignId") as string;
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!companyId || !campaignId || !firstName || !lastName || !email) {
    throw new Error("Veuillez renseigner les informations obligatoires du candidat.");
  }

  // Vérifier doublon pour cette campagne
  const [existing] = await db
    .select()
    .from(candidatesTable)
    .where(and(eq(candidatesTable.campaignId, campaignId), eq(candidatesTable.email, email)))
    .limit(1);

  if (existing) {
    throw new Error("Un candidat avec cet e-mail est déjà inscrit à cette campagne.");
  }

  const [candidate] = await db
    .insert(candidatesTable)
    .values({
      companyId,
      campaignId,
      firstName,
      lastName,
      email,
      phone,
      status: "added",
    })
    .returning();

  await logAuditEvent({
    companyId,
    action: "CANDIDATE_ADDED",
    entityType: "candidate",
    entityId: candidate.id,
    detail: { email, name: `${firstName} ${lastName}` },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  return candidate;
}

export async function generateInvitationsAction(campaignId: string, candidateIds: string[]) {
  const generated: { candidateName: string; email: string; url: string; token: string; emailSent?: boolean }[] = [];
  const appUrl = getAppUrl();

  const [campaign] = await db
    .select({ title: campaignsTable.title })
    .from(campaignsTable)
    .where(eq(campaignsTable.id, campaignId))
    .limit(1);

  const campaignTitle = campaign?.title || "Campagne de Recrutement";

  for (const candidateId of candidateIds) {
    const [candidate] = await db
      .select()
      .from(candidatesTable)
      .where(eq(candidatesTable.id, candidateId))
      .limit(1);

    if (!candidate) continue;

    const rawToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(rawToken);
    if (!tokenHash) continue;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 heures de validité

    await db.insert(invitationsTable).values({
      candidateId,
      campaignId,
      tokenHash,
      status: "sent",
      expiresAt,
    });

    await db
      .update(candidatesTable)
      .set({ status: "invited", invitedAt: new Date() })
      .where(eq(candidatesTable.id, candidateId));

    const invitationUrl = `${appUrl}/invitation/${rawToken}`;
    const candidateName = `${candidate.firstName} ${candidate.lastName}`;

    let emailSuccess = true;
    try {
      const emailRes = await sendInvitationEmail({
        to: candidate.email,
        candidateName,
        campaignTitle,
        invitationUrl,
        expiresInDays: 1,
      });
      emailSuccess = emailRes?.success ?? true;
    } catch (err) {
      console.error(`Erreur d'envoi d'email à ${candidate.email}:`, err);
      emailSuccess = false;
    }

    generated.push({
      candidateName,
      email: candidate.email,
      url: invitationUrl,
      token: rawToken,
      emailSent: emailSuccess,
    });
  }

  revalidatePath(`/campaigns/${campaignId}`);
  return generated;
}

export async function updateCandidateAction(formData: FormData) {
  const candidateId = formData.get("candidateId") as string;
  const campaignId = formData.get("campaignId") as string;
  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!candidateId || !campaignId || !firstName || !lastName || !email) {
    throw new Error("Veuillez renseigner les informations obligatoires.");
  }

  const [updated] = await db
    .update(candidatesTable)
    .set({
      firstName,
      lastName,
      email,
      phone,
      updatedAt: new Date(),
    })
    .where(eq(candidatesTable.id, candidateId))
    .returning();

  await logAuditEvent({
    companyId: updated.companyId,
    action: "CANDIDATE_UPDATED",
    entityType: "candidate",
    entityId: candidateId,
    detail: { email, name: `${firstName} ${lastName}` },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  return updated;
}

export async function deleteCandidateAction(candidateId: string, campaignId: string) {
  if (!candidateId || !campaignId) {
    throw new Error("Identifiants manquants pour la suppression.");
  }

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, candidateId))
    .limit(1);

  if (!candidate) return;

  // Supprimer les invitations associées d'abord
  await db.delete(invitationsTable).where(eq(invitationsTable.candidateId, candidateId));

  // Supprimer le candidat
  await db.delete(candidatesTable).where(eq(candidatesTable.id, candidateId));

  await logAuditEvent({
    companyId: candidate.companyId,
    action: "CANDIDATE_DELETED",
    entityType: "candidate",
    entityId: candidateId,
    detail: { email: candidate.email, name: `${candidate.firstName} ${candidate.lastName}` },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true };
}

export async function importCandidatesFromCSVAction(
  campaignId: string,
  companyId: string,
  rows: { firstName: string; lastName: string; email: string; phone?: string }[]
) {
  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const email = row.email.trim().toLowerCase();
    const firstName = row.firstName.trim();
    const lastName = row.lastName.trim();
    const phone = row.phone?.trim() || null;

    if (!email || !firstName || !lastName) {
      errors.push(`Ligne ignorée (données manquantes) : ${JSON.stringify(row)}`);
      skipped++;
      continue;
    }

    const [existing] = await db
      .select({ id: candidatesTable.id })
      .from(candidatesTable)
      .where(and(eq(candidatesTable.campaignId, campaignId), eq(candidatesTable.email, email)))
      .limit(1);

    if (existing) {
      skipped++;
      continue;
    }

    try {
      await db.insert(candidatesTable).values({
        companyId,
        campaignId,
        firstName,
        lastName,
        email,
        phone,
        status: "added",
      });
      added++;
    } catch {
      errors.push(`Erreur pour ${email}`);
      skipped++;
    }
  }

  await logAuditEvent({
    companyId,
    action: "CANDIDATES_IMPORTED",
    entityType: "campaign",
    entityId: campaignId,
    detail: { added, skipped },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  return { added, skipped, errors };
}

export async function resendInvitationAction(candidateId: string, campaignId: string) {
  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, candidateId))
    .limit(1);

  if (!candidate) return { error: "Candidat introuvable." };

  const [invitation] = await db
    .select()
    .from(invitationsTable)
    .where(and(eq(invitationsTable.candidateId, candidateId), eq(invitationsTable.campaignId, campaignId)))
    .limit(1);

  if (!invitation) return { error: "Aucune invitation trouvée pour ce candidat." };

  const rawToken = generateInvitationToken();
  const newHash = hashInvitationToken(rawToken);
  if (!newHash) return { error: "Erreur de génération du token." };

  const newExpiresAt = new Date();
  newExpiresAt.setHours(newExpiresAt.getHours() + 24);

  await db
    .update(invitationsTable)
    .set({ tokenHash: newHash, expiresAt: newExpiresAt, revokedAt: null })
    .where(eq(invitationsTable.id, invitation.id));

  await db
    .update(candidatesTable)
    .set({ invitedAt: new Date(), updatedAt: new Date() })
    .where(eq(candidatesTable.id, candidateId));

  const [campaign] = await db
    .select({ title: campaignsTable.title })
    .from(campaignsTable)
    .where(eq(campaignsTable.id, campaignId))
    .limit(1);

  const appUrl = getAppUrl();
  const invitationUrl = `${appUrl}/invitation/${rawToken}`;
  const candidateName = `${candidate.firstName} ${candidate.lastName}`;

  let emailSent = true;
  try {
    const emailRes = await sendInvitationEmail({
      to: candidate.email,
      candidateName,
      campaignTitle: campaign?.title || "Campagne de Recrutement",
      invitationUrl,
      expiresInDays: 1,
    });
    emailSent = emailRes?.success ?? true;
  } catch (err) {
    console.error("Erreur relance email :", err);
    emailSent = false;
  }

  await logAuditEvent({
    companyId: candidate.companyId,
    action: "INVITATION_RESENT",
    entityType: "candidate",
    entityId: candidateId,
    detail: { email: candidate.email, emailSent },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  return { success: true, emailSent, invitationUrl };
}


