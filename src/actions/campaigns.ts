"use server";

import { db, campaignsTable, companiesTable, candidatesTable } from "@/db";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";

export async function getCompanies() {
  return await db.select().from(companiesTable).orderBy(companiesTable.name);
}

export async function getCampaigns(companyId?: string) {
  const query = db
    .select({
      id: campaignsTable.id,
      companyId: campaignsTable.companyId,
      companyName: companiesTable.name,
      companyAccent: companiesTable.accentColor,
      title: campaignsTable.title,
      reference: campaignsTable.reference,
      description: campaignsTable.description,
      status: campaignsTable.status,
      durationMinutes: campaignsTable.durationMinutes,
      passingScore: campaignsTable.passingScore,
      shortlistSize: campaignsTable.shortlistSize,
      questionIds: campaignsTable.questionIds,
      createdAt: campaignsTable.createdAt,
    })
    .from(campaignsTable)
    .innerJoin(companiesTable, eq(campaignsTable.companyId, companiesTable.id))
    .orderBy(desc(campaignsTable.createdAt));

  const list = await query;
  if (companyId) {
    return list.filter((c) => c.companyId === companyId);
  }
  return list;
}

export async function getCampaignById(campaignId: string) {
  const [row] = await db
    .select({
      id: campaignsTable.id,
      companyId: campaignsTable.companyId,
      companyName: companiesTable.name,
      companyAccent: companiesTable.accentColor,
      title: campaignsTable.title,
      reference: campaignsTable.reference,
      description: campaignsTable.description,
      status: campaignsTable.status,
      durationMinutes: campaignsTable.durationMinutes,
      passingScore: campaignsTable.passingScore,
      shortlistSize: campaignsTable.shortlistSize,
      questionIds: campaignsTable.questionIds,
      opensAt: campaignsTable.opensAt,
      closesAt: campaignsTable.closesAt,
      createdAt: campaignsTable.createdAt,
    })
    .from(campaignsTable)
    .innerJoin(companiesTable, eq(campaignsTable.companyId, companiesTable.id))
    .where(eq(campaignsTable.id, campaignId))
    .limit(1);

  return row || null;
}

export async function createCampaignAction(formData: FormData) {
  const companyId = formData.get("companyId") as string;
  const title = (formData.get("title") as string)?.trim();
  const reference = (formData.get("reference") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || "";
  const durationMinutes = Number(formData.get("durationMinutes") || 45);
  const passingScore = Number(formData.get("passingScore") || 60);
  const shortlistSize = Number(formData.get("shortlistSize") || 5);

  if (!companyId || !title || !reference) {
    throw new Error("Veuillez renseigner les champs obligatoires (Société, Titre, Référence).");
  }

  const [campaign] = await db
    .insert(campaignsTable)
    .values({
      companyId,
      title,
      reference,
      description,
      durationMinutes,
      passingScore,
      shortlistSize,
      status: "draft",
    })
    .returning();

  await logAuditEvent({
    companyId,
    action: "CAMPAIGN_CREATED",
    entityType: "campaign",
    entityId: campaign.id,
    detail: { title, reference },
  });

  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  return campaign;
}

export async function updateCampaignStatusAction(campaignId: string, status: string) {
  const [campaign] = await db
    .update(campaignsTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(campaignsTable.id, campaignId))
    .returning();

  if (campaign) {
    await logAuditEvent({
      companyId: campaign.companyId,
      action: "CAMPAIGN_STATUS_UPDATED",
      entityType: "campaign",
      entityId: campaign.id,
      detail: { newStatus: status },
    });
  }

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  return campaign;
}

export async function updateCampaignQuestionsAction(campaignId: string, questionIds: string[]) {
  const [campaign] = await db
    .update(campaignsTable)
    .set({ questionIds, updatedAt: new Date() })
    .where(eq(campaignsTable.id, campaignId))
    .returning();

  revalidatePath(`/campaigns/${campaignId}`);
  return campaign;
}

export async function updateCampaignAction(campaignId: string, data: {
  title: string;
  reference: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  shortlistSize: number;
  opensAt?: string | null;
  closesAt?: string | null;
}) {
  if (!data.title || !data.reference) {
    throw new Error("Le titre et la référence sont obligatoires.");
  }

  const [campaign] = await db
    .update(campaignsTable)
    .set({
      title: data.title,
      reference: data.reference,
      description: data.description,
      durationMinutes: data.durationMinutes,
      passingScore: data.passingScore,
      shortlistSize: data.shortlistSize,
      opensAt: data.opensAt ? new Date(data.opensAt) : null,
      closesAt: data.closesAt ? new Date(data.closesAt) : null,
      updatedAt: new Date(),
    })
    .where(eq(campaignsTable.id, campaignId))
    .returning();

  await logAuditEvent({
    companyId: campaign.companyId,
    action: "CAMPAIGN_UPDATED",
    entityType: "campaign",
    entityId: campaignId,
    detail: { title: data.title },
  });

  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
  return campaign;
}

