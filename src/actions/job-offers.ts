"use server";

import { db, jobOffersTable, jobApplicationsTable } from "@/db";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import crypto from "crypto";

export async function getJobOffers() {
  const offers = await db
    .select({
      id: jobOffersTable.id,
      companyLabel: jobOffersTable.companyLabel,
      title: jobOffersTable.title,
      reference: jobOffersTable.reference,
      location: jobOffersTable.location,
      contractType: jobOffersTable.contractType,
      description: jobOffersTable.description,
      requirements: jobOffersTable.requirements,
      closingDate: jobOffersTable.closingDate,
      publicToken: jobOffersTable.publicToken,
      status: jobOffersTable.status,
      createdAt: jobOffersTable.createdAt,
      applicantsCount: sql<number>`cast(count(${jobApplicationsTable.id}) as int)`,
    })
    .from(jobOffersTable)
    .leftJoin(jobApplicationsTable, eq(jobOffersTable.id, jobApplicationsTable.jobOfferId))
    .groupBy(jobOffersTable.id)
    .orderBy(desc(jobOffersTable.createdAt));

  return offers;
}

export async function getJobOfferById(id: string) {
  const [offer] = await db
    .select()
    .from(jobOffersTable)
    .where(eq(jobOffersTable.id, id))
    .limit(1);

  return offer || null;
}

export async function getJobOfferByToken(token: string) {
  const [offer] = await db
    .select({
      id: jobOffersTable.id,
      companyLabel: jobOffersTable.companyLabel,
      title: jobOffersTable.title,
      reference: jobOffersTable.reference,
      location: jobOffersTable.location,
      contractType: jobOffersTable.contractType,
      description: jobOffersTable.description,
      requirements: jobOffersTable.requirements,
      closingDate: jobOffersTable.closingDate,
      status: jobOffersTable.status,
    })
    .from(jobOffersTable)
    .where(eq(jobOffersTable.publicToken, token))
    .limit(1);

  return offer || null;
}

export async function createJobOfferAction(data: {
  title: string;
  companyLabel: string;
  reference?: string;
  location?: string;
  contractType?: string;
  description: string;
  requirements: string;
  closingDate?: string | null;
}) {
  if (!data.title?.trim()) {
    throw new Error("L'intitulé du poste est obligatoire.");
  }

  // Génération d'un token public unique et propre (ex: 16 caractères hex)
  const publicToken = crypto.randomBytes(8).toString("hex");

  const [created] = await db
    .insert(jobOffersTable)
    .values({
      title: data.title.trim(),
      companyLabel: data.companyLabel || "MRS/CORLAY",
      reference: data.reference?.trim() || `OFFRE-${Date.now().toString().slice(-4)}`,
      location: data.location?.trim() || "Abidjan, Côte d'Ivoire",
      contractType: data.contractType?.trim() || "CDI",
      description: data.description?.trim() || "",
      requirements: data.requirements?.trim() || "",
      closingDate: data.closingDate ? new Date(data.closingDate) : null,
      publicToken,
      status: "active",
    })
    .returning();

  await logAuditEvent({
    companyId: null,
    action: "JOB_OFFER_CREATED",
    entityType: "job_offer",
    entityId: created.id,
    detail: { title: created.title, publicToken },
  });

  revalidatePath("/job-offers");
  return created;
}

export async function updateJobOfferAction(
  id: string,
  data: {
    title: string;
    companyLabel: string;
    reference?: string;
    location?: string;
    contractType?: string;
    description: string;
    requirements: string;
    closingDate?: string | null;
    status: string;
  }
) {
  const [updated] = await db
    .update(jobOffersTable)
    .set({
      title: data.title.trim(),
      companyLabel: data.companyLabel,
      reference: data.reference?.trim() || null,
      location: data.location?.trim() || "Abidjan, Côte d'Ivoire",
      contractType: data.contractType?.trim() || "CDI",
      description: data.description?.trim() || "",
      requirements: data.requirements?.trim() || "",
      closingDate: data.closingDate ? new Date(data.closingDate) : null,
      status: data.status,
      updatedAt: new Date(),
    })
    .where(eq(jobOffersTable.id, id))
    .returning();

  await logAuditEvent({
    companyId: null,
    action: "JOB_OFFER_UPDATED",
    entityType: "job_offer",
    entityId: id,
    detail: { title: updated.title, status: updated.status },
  });

  revalidatePath("/job-offers");
  revalidatePath(`/job-offers/${id}`);
  return updated;
}

export async function toggleJobOfferStatusAction(id: string) {
  const offer = await getJobOfferById(id);
  if (!offer) throw new Error("Offre introuvable.");

  const nextStatus = offer.status === "active" ? "closed" : "active";

  await db
    .update(jobOffersTable)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(eq(jobOffersTable.id, id));

  revalidatePath("/job-offers");
  revalidatePath(`/job-offers/${id}`);
  return { success: true, status: nextStatus };
}

export async function deleteJobOfferAction(id: string) {
  await db.delete(jobOffersTable).where(eq(jobOffersTable.id, id));

  await logAuditEvent({
    companyId: null,
    action: "JOB_OFFER_DELETED",
    entityType: "job_offer",
    entityId: id,
    detail: {},
  });

  revalidatePath("/job-offers");
  return { success: true };
}
