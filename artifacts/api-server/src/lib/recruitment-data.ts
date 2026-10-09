import { and, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import {
  auditLogsTable,
  assessmentAttemptsTable,
  campaignsTable,
  candidatesTable,
  companiesTable,
  questionsTable,
  staffCompanyAccessTable,
  staffUsersTable,
} from "@workspace/db";

export type StaffContext = {
  id: string;
  clerkUserId: string;
  role: string;
  companyIds: string[];
};

export async function seedRecruitmentData(): Promise<void> {
  await db
    .insert(companiesTable)
    .values([
      { name: "MRS", code: "MRS", accentColor: "#176b62" },
      { name: "CORLAY", code: "CORLAY", accentColor: "#c47a35" },
    ])
    .onConflictDoNothing();

  const companies = await db.select().from(companiesTable);
  const mrs = companies.find((company) => company.code === "MRS");
  const corlay = companies.find((company) => company.code === "CORLAY");
  if (!mrs || !corlay) {
    throw new Error("Initial MRS and CORLAY company records are missing.");
  }

  const firstPrompt =
    "Présentez une méthode fiable pour vérifier une pièce comptable avant son enregistrement.";
  const [existingQuestion] = await db
    .select({ id: questionsTable.id })
    .from(questionsTable)
    .where(eq(questionsTable.prompt, firstPrompt))
    .limit(1);
  if (!existingQuestion) {
    await db.insert(questionsTable).values([
      {
        companyId: mrs.id,
        prompt: firstPrompt,
        kind: "long_text",
        points: 10,
        category: "Comptabilité",
        competency: "Rigueur",
        difficulty: "medium",
        maxCharacters: 1500,
      },
      {
        companyId: mrs.id,
        prompt: "Quel document confirme le règlement d'une facture fournisseur ?",
        kind: "single_choice",
        points: 5,
        category: "Comptabilité",
        competency: "Comptabilité fournisseurs",
        difficulty: "easy",
        choices: ["Le bon de commande", "La preuve de paiement", "Le devis"],
        expectedAnswer: "La preuve de paiement",
      },
    ]);
  }
  const demoQuestions = await db
    .select({ id: questionsTable.id })
    .from(questionsTable)
    .where(eq(questionsTable.companyId, mrs.id));

  const existingCampaigns = await db.select().from(campaignsTable);
  const demoCampaign =
    existingCampaigns.find((campaign) => campaign.reference === "DEMO-AC-2026") ??
    (
      await db
        .insert(campaignsTable)
        .values({
          companyId: mrs.id,
          title: "Assistant comptable · Démonstration",
          reference: "DEMO-AC-2026",
          description: "Campagne de démonstration — remplacez ces exemples avant toute utilisation réelle.",
          status: "in_progress",
          durationMinutes: 45,
          passingScore: 60,
          shortlistSize: 5,
        })
        .onConflictDoNothing()
        .returning()
    )[0];
  const campaign = demoCampaign ?? existingCampaigns.find(
    (row) => row.reference === "DEMO-AC-2026",
  );
  if (!campaign) return;
  if (campaign.questionIds.length === 0 && demoQuestions.length > 0) {
    await db
      .update(campaignsTable)
      .set({ questionIds: demoQuestions.map((question) => question.id) })
      .where(eq(campaignsTable.id, campaign.id));
  }

  await db
    .insert(candidatesTable)
    .values([
      {
        companyId: mrs.id,
        campaignId: campaign.id,
        firstName: "Aïcha",
        lastName: "Diallo",
        email: "aicha.diallo@example.invalid",
        status: "invited",
      },
      {
        companyId: mrs.id,
        campaignId: campaign.id,
        firstName: "Marc",
        lastName: "Kouassi",
        email: "marc.kouassi@example.invalid",
        status: "in_progress",
      },
      {
        companyId: mrs.id,
        campaignId: campaign.id,
        firstName: "Fatou",
        lastName: "Mensah",
        email: "fatou.mensah@example.invalid",
        status: "to_review",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(campaignsTable)
    .values({
      companyId: corlay.id,
      title: "Responsable logistique · Démonstration",
      reference: "DEMO-RL-2026",
      description: "Campagne de démonstration — données fictives.",
      status: "draft",
      durationMinutes: 60,
      passingScore: 60,
      shortlistSize: 5,
    })
    .onConflictDoNothing();
}

export async function getStaffContext(
  req: Request,
  res: Response,
): Promise<StaffContext | null> {
  const auth = getAuth(req);
  const clerkUserId = auth.userId;
  if (!clerkUserId) {
    res.status(401).json({ error: "Connexion requise." });
    return null;
  }

  let [staff] = await db
    .select()
    .from(staffUsersTable)
    .where(eq(staffUsersTable.clerkUserId, clerkUserId))
    .limit(1);

  if (!staff) {
    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(staffUsersTable);
    const isFirstStaffUser = (countRow?.count ?? 0) === 0;
    const [created] = await db
      .insert(staffUsersTable)
      .values({
        clerkUserId,
        email: `${clerkUserId}@identity.invalid`,
        displayName: "Équipe RH",
        role: isFirstStaffUser ? "admin" : "hr",
      })
      .onConflictDoNothing()
      .returning();
    staff =
      created ??
      (
        await db
          .select()
          .from(staffUsersTable)
          .where(eq(staffUsersTable.clerkUserId, clerkUserId))
          .limit(1)
      )[0];
  }

  if (!staff) {
    res.status(500).json({ error: "Impossible de créer le profil de l’équipe." });
    return null;
  }

  let companyIds: string[];
  if (staff.role === "admin") {
    companyIds = (await db.select({ id: companiesTable.id }).from(companiesTable)).map(
      (company) => company.id,
    );
  } else {
    companyIds = (
      await db
        .select({ id: staffCompanyAccessTable.companyId })
        .from(staffCompanyAccessTable)
        .where(eq(staffCompanyAccessTable.staffUserId, staff.id))
    ).map((access) => access.id);
  }

  return {
    id: staff.id,
    clerkUserId,
    role: staff.role,
    companyIds,
  };
}

export async function expireAssessments(): Promise<void> {
  const now = new Date();
  const expired = await db
    .update(assessmentAttemptsTable)
    .set({ submittedAt: now, submissionType: "automatic", updatedAt: now })
    .where(
      and(
        isNull(assessmentAttemptsTable.submittedAt),
        lte(assessmentAttemptsTable.deadlineAt, now),
      ),
    )
    .returning({
      candidateId: assessmentAttemptsTable.candidateId,
    });
  if (expired.length === 0) return;
  await db
    .update(candidatesTable)
    .set({ status: "submitted_automatically", updatedAt: now })
    .where(
      inArray(
        candidatesTable.id,
        expired.map((attempt) => attempt.candidateId),
      ),
    );
}

export function startAssessmentExpiryWorker(): void {
  const timer = setInterval(() => {
    void expireAssessments().catch((error: unknown) => {
      // The shared logger handles application-level background failures.
      import("./logger").then(({ logger }) =>
        logger.error({ err: error }, "Assessment expiry worker failed"),
      );
    });
  }, 15_000);
  timer.unref();
}

export function canAccessCompany(staff: StaffContext, companyId: string): boolean {
  return staff.role === "admin" || staff.companyIds.includes(companyId);
}

export async function getCampaignForStaff(
  campaignId: string,
  staff: StaffContext,
) {
  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, campaignId))
    .limit(1);
  if (!campaign || !canAccessCompany(staff, campaign.companyId)) return null;
  return campaign;
}

export async function writeAuditLog(
  staff: StaffContext,
  companyId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  detail: Record<string, unknown> = {},
): Promise<void> {
  await db.insert(auditLogsTable).values({
    companyId,
    actorUserId: staff.id,
    action,
    entityType,
    entityId,
    detail,
  });
}

export async function accessibleCampaignIds(staff: StaffContext): Promise<string[]> {
  if (staff.role === "admin") {
    return (await db.select({ id: campaignsTable.id }).from(campaignsTable)).map(
      (campaign) => campaign.id,
    );
  }
  if (staff.companyIds.length === 0) return [];
  return (
    await db
      .select({ id: campaignsTable.id })
      .from(campaignsTable)
      .where(inArray(campaignsTable.companyId, staff.companyIds))
  ).map((campaign) => campaign.id);
}

export async function hasCompanyAccess(staff: StaffContext, companyId: string) {
  if (canAccessCompany(staff, companyId)) return true;
  if (staff.companyIds.length === 0) return false;
  const [access] = await db
    .select({ companyId: staffCompanyAccessTable.companyId })
    .from(staffCompanyAccessTable)
    .where(
      and(
        eq(staffCompanyAccessTable.staffUserId, staff.id),
        eq(staffCompanyAccessTable.companyId, companyId),
      ),
    )
    .limit(1);
  return !!access;
}
