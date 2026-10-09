import { createHmac, randomBytes } from "node:crypto";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateCampaignBody,
  CreateCampaignCandidateBody,
  CreateCampaignCandidateParams,
  CreateCampaignCandidateResponse,
  CreateCampaignResponse,
  CreateInvitationsBody,
  CreateInvitationsParams,
  CreateInvitationsResponse,
  CreateQuestionBody,
  CreateQuestionResponse,
  GetAttemptReviewParams,
  GetAttemptReviewResponse,
  GetCampaignRankingsParams,
  GetCampaignRankingsResponse,
  GetDashboardQueryParams,
  GetDashboardResponse,
  ListCampaignCandidatesParams,
  ListCampaignCandidatesResponse,
  ListCampaignsQueryParams,
  ListCampaignsResponse,
  ListCompaniesResponse,
  ListQuestionsQueryParams,
  ListQuestionsResponse,
  SaveAttemptGradesBody,
  SaveAttemptGradesParams,
  SaveAttemptGradesResponse,
  UpdateCampaignBody,
  UpdateCampaignParams,
  UpdateCampaignResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  answersTable,
  assessmentAttemptsTable,
  campaignsTable,
  candidatesTable,
  companiesTable,
  gradesTable,
  invitationsTable,
  questionsTable,
} from "@workspace/db";
import {
  canAccessCompany,
  getCampaignForStaff,
  getStaffContext,
  writeAuditLog,
} from "../lib/recruitment-data";

const router: IRouter = Router();

function asIso(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

async function campaignResponse(row: typeof campaignsTable.$inferSelect) {
  const [company] = await db
    .select({ name: companiesTable.name })
    .from(companiesTable)
    .where(eq(companiesTable.id, row.companyId))
    .limit(1);
  const campaignCandidates = await db
    .select({ status: candidatesTable.status })
    .from(candidatesTable)
    .where(eq(candidatesTable.campaignId, row.id));
  return {
    id: row.id,
    companyId: row.companyId,
    companyName: company?.name ?? "",
    title: row.title,
    reference: row.reference,
    description: row.description,
    status: row.status,
    durationMinutes: row.durationMinutes,
    passingScore: row.passingScore,
    shortlistSize: row.shortlistSize,
    questionIds: row.questionIds,
    questionCount: row.questionIds.length,
    opensAt: asIso(row.opensAt),
    closesAt: asIso(row.closesAt),
    candidateCount: campaignCandidates.length,
    startedCount: campaignCandidates.filter((candidate) => candidate.status === "in_progress").length,
    submittedCount: campaignCandidates.filter((candidate) =>
      ["submitted", "submitted_automatically", "to_review", "reviewed", "shortlisted"].includes(
        candidate.status,
      ),
    ).length,
    reviewCount: campaignCandidates.filter((candidate) => candidate.status === "to_review").length,
    createdAt: row.createdAt.toISOString(),
  };
}

async function candidateResponse(row: typeof candidatesTable.$inferSelect) {
  const [attempt] = await db
    .select({ id: assessmentAttemptsTable.id })
    .from(assessmentAttemptsTable)
    .where(eq(assessmentAttemptsTable.candidateId, row.id))
    .limit(1);
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    companyId: row.companyId,
    campaignId: row.campaignId,
    status: row.status,
    score: row.score,
    invitedAt: asIso(row.invitedAt ?? null),
    attemptId: attempt?.id ?? null,
  };
}

async function listAccessibleCampaignRows(staff: Awaited<ReturnType<typeof getStaffContext>>) {
  if (!staff) return [];
  if (staff.role === "admin") {
    return db.select().from(campaignsTable).orderBy(desc(campaignsTable.createdAt));
  }
  if (staff.companyIds.length === 0) return [];
  return db
    .select()
    .from(campaignsTable)
    .where(inArray(campaignsTable.companyId, staff.companyIds))
    .orderBy(desc(campaignsTable.createdAt));
}

router.get("/companies", async (req, res): Promise<void> => {
  const staff = await getStaffContext(req, res);
  if (!staff) return;
  const companies = await db.select().from(companiesTable);
  const accessible =
    staff.role === "admin"
      ? companies
      : companies.filter((company) => staff.companyIds.includes(company.id));
  res.json(
    ListCompaniesResponse.parse(
      accessible.map((company) => ({
        id: company.id,
        name: company.name,
        code: company.code,
        accentColor: company.accentColor,
        logoUrl: company.logoUrl,
      })),
    ),
  );
});

router.get("/dashboard", async (req, res): Promise<void> => {
  const staff = await getStaffContext(req, res);
  if (!staff) return;
  const query = GetDashboardQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  if (query.data.companyId && !canAccessCompany(staff, query.data.companyId)) {
    res.status(403).json({ error: "Accès à cette société non autorisé." });
    return;
  }
  const allCampaigns = await listAccessibleCampaignRows(staff);
  const campaignRows = query.data.companyId
    ? allCampaigns.filter((campaign) => campaign.companyId === query.data.companyId)
    : allCampaigns;
  const companyIds = query.data.companyId ? [query.data.companyId] : staff.companyIds;
  const candidates =
    staff.role === "admin" || companyIds.length > 0
      ? await db
          .select({ status: candidatesTable.status })
          .from(candidatesTable)
          .where(
            staff.role === "admin"
              ? undefined
              : inArray(candidatesTable.companyId, companyIds),
          )
      : [];
  const activeCampaigns = campaignRows.filter((campaign) =>
    ["published", "in_progress"].includes(campaign.status),
  );
  const overview = {
    activeCampaigns: activeCampaigns.length,
    invitedCandidates: candidates.filter((candidate) => candidate.status === "invited").length,
    testsInProgress: candidates.filter((candidate) => candidate.status === "in_progress").length,
    awaitingReview: candidates.filter((candidate) => candidate.status === "to_review").length,
    shortlisted: candidates.filter((candidate) => candidate.status === "shortlisted").length,
    recentCampaigns: await Promise.all(campaignRows.slice(0, 5).map(campaignResponse)),
  };
  res.json(GetDashboardResponse.parse(overview));
});

router.get("/campaigns", async (req, res): Promise<void> => {
  const staff = await getStaffContext(req, res);
  if (!staff) return;
  const query = ListCampaignsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  if (query.data.companyId && !canAccessCompany(staff, query.data.companyId)) {
    res.status(403).json({ error: "Accès à cette société non autorisé." });
    return;
  }
  let rows = await listAccessibleCampaignRows(staff);
  if (query.data.companyId) {
    rows = rows.filter((campaign) => campaign.companyId === query.data.companyId);
  }
  if (query.data.status) rows = rows.filter((campaign) => campaign.status === query.data.status);
  res.json(ListCampaignsResponse.parse(await Promise.all(rows.map(campaignResponse))));
});

router.post("/campaigns", async (req, res): Promise<void> => {
  const staff = await getStaffContext(req, res);
  if (!staff) return;
  const parsed = CreateCampaignBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!canAccessCompany(staff, parsed.data.companyId)) {
    res.status(403).json({ error: "Accès à cette société non autorisé." });
    return;
  }
  const selectedQuestions = parsed.data.questionIds ?? [];
  if (selectedQuestions.length > 0) {
    const validQuestions = await db
      .select({ id: questionsTable.id })
      .from(questionsTable)
      .where(
        and(
          inArray(questionsTable.id, selectedQuestions),
          or(
            eq(questionsTable.companyId, parsed.data.companyId),
            sql`${questionsTable.companyId} is null`,
          ),
        ),
      );
    if (validQuestions.length !== new Set(selectedQuestions).size) {
      res.status(400).json({ error: "Une ou plusieurs questions ne sont pas disponibles pour cette société." });
      return;
    }
  }
  const [created] = await db
    .insert(campaignsTable)
    .values({
      companyId: parsed.data.companyId,
      title: parsed.data.title,
      reference: parsed.data.reference,
      description: parsed.data.description,
      durationMinutes: parsed.data.durationMinutes,
      passingScore: parsed.data.passingScore,
      shortlistSize: parsed.data.shortlistSize,
      opensAt: parsed.data.opensAt ? new Date(parsed.data.opensAt) : null,
      closesAt: parsed.data.closesAt ? new Date(parsed.data.closesAt) : null,
      questionIds: selectedQuestions,
      status: parsed.data.status ?? "draft",
    })
    .returning();
  if (!created) {
    res.status(500).json({ error: "La campagne n’a pas pu être créée." });
    return;
  }
  await writeAuditLog(staff, created.companyId, "campaign.created", "campaign", created.id);
  res.status(201).json(CreateCampaignResponse.parse(await campaignResponse(created)));
});

router.patch("/campaigns/:campaignId", async (req, res): Promise<void> => {
  const staff = await getStaffContext(req, res);
  if (!staff) return;
  const params = UpdateCampaignParams.safeParse(req.params);
  const parsed = UpdateCampaignBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.error?.message ?? parsed.error?.message });
    return;
  }
  const campaign = await getCampaignForStaff(params.data.campaignId, staff);
  if (!campaign) {
    res.status(404).json({ error: "Campagne introuvable." });
    return;
  }
  const changes = parsed.data;
  if (changes.questionIds) {
    const validQuestions = await db
      .select({ id: questionsTable.id })
      .from(questionsTable)
      .where(
        and(
          inArray(questionsTable.id, changes.questionIds),
          or(
            eq(questionsTable.companyId, campaign.companyId),
            sql`${questionsTable.companyId} is null`,
          ),
        ),
      );
    if (validQuestions.length !== new Set(changes.questionIds).size) {
      res.status(400).json({ error: "Une ou plusieurs questions ne sont pas disponibles pour cette société." });
      return;
    }
  }
  const update: Partial<typeof campaignsTable.$inferInsert> = { updatedAt: new Date() };
  if (changes.title !== undefined) update.title = changes.title;
  if (changes.reference !== undefined) update.reference = changes.reference;
  if (changes.description !== undefined) update.description = changes.description;
  if (changes.durationMinutes !== undefined) update.durationMinutes = changes.durationMinutes;
  if (changes.passingScore !== undefined) update.passingScore = changes.passingScore;
  if (changes.shortlistSize !== undefined) update.shortlistSize = changes.shortlistSize;
  if (changes.opensAt !== undefined) update.opensAt = changes.opensAt ? new Date(changes.opensAt) : null;
  if (changes.closesAt !== undefined) update.closesAt = changes.closesAt ? new Date(changes.closesAt) : null;
  if (changes.status !== undefined) update.status = changes.status;
  if (changes.questionIds !== undefined) update.questionIds = changes.questionIds;
  const [updated] = await db
    .update(campaignsTable)
    .set(update)
    .where(eq(campaignsTable.id, campaign.id))
    .returning();
  if (!updated) {
    res.status(500).json({ error: "La campagne n’a pas pu être mise à jour." });
    return;
  }
  await writeAuditLog(staff, updated.companyId, "campaign.updated", "campaign", updated.id, {
    fields: Object.keys(changes),
  });
  res.json(UpdateCampaignResponse.parse(await campaignResponse(updated)));
});

router.get("/questions", async (req, res): Promise<void> => {
  const staff = await getStaffContext(req, res);
  if (!staff) return;
  const query = ListQuestionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }
  if (query.data.companyId && !canAccessCompany(staff, query.data.companyId)) {
    res.status(403).json({ error: "Accès à cette société non autorisé." });
    return;
  }
  const visibleCompanies = query.data.companyId ? [query.data.companyId] : staff.companyIds;
  const whereClause =
    staff.role === "admin" && !query.data.companyId
      ? undefined
      : visibleCompanies.length > 0
        ? or(
            inArray(questionsTable.companyId, visibleCompanies),
            sql`${questionsTable.companyId} is null`,
          )
        : sql`${questionsTable.companyId} is null`;
  const questions = await db.select().from(questionsTable).where(whereClause);
  res.json(
    ListQuestionsResponse.parse(
      questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        kind: question.kind,
        points: question.points,
        required: question.required,
        category: question.category,
        competency: question.competency,
        difficulty: question.difficulty,
        choices: question.choices,
        expectedAnswer: question.expectedAnswer,
        maxCharacters: question.maxCharacters,
      })),
    ),
  );
});

router.post("/questions", async (req, res): Promise<void> => {
  const staff = await getStaffContext(req, res);
  if (!staff) return;
  const parsed = CreateQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const companyId = parsed.data.companyId ?? null;
  if (companyId && !canAccessCompany(staff, companyId)) {
    res.status(403).json({ error: "Accès à cette société non autorisé." });
    return;
  }
  const [question] = await db
    .insert(questionsTable)
    .values({
      companyId,
      prompt: parsed.data.prompt,
      kind: parsed.data.kind,
      points: parsed.data.points,
      required: parsed.data.required,
      category: parsed.data.category,
      competency: parsed.data.competency,
      difficulty: parsed.data.difficulty,
      choices: parsed.data.choices ?? [],
      expectedAnswer: parsed.data.expectedAnswer ?? null,
      maxCharacters: parsed.data.maxCharacters ?? null,
    })
    .returning();
  if (!question) {
    res.status(500).json({ error: "La question n’a pas pu être créée." });
    return;
  }
  await writeAuditLog(staff, companyId, "question.created", "question", question.id);
  res.status(201).json(
    CreateQuestionResponse.parse({
      id: question.id,
      prompt: question.prompt,
      kind: question.kind,
      points: question.points,
      required: question.required,
      category: question.category,
      competency: question.competency,
      difficulty: question.difficulty,
      choices: question.choices,
      expectedAnswer: question.expectedAnswer,
      maxCharacters: question.maxCharacters,
    }),
  );
});

router.get("/campaigns/:campaignId/candidates", async (req, res): Promise<void> => {
  const staff = await getStaffContext(req, res);
  if (!staff) return;
  const params = ListCampaignCandidatesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const campaign = await getCampaignForStaff(params.data.campaignId, staff);
  if (!campaign) {
    res.status(404).json({ error: "Campagne introuvable." });
    return;
  }
  const rows = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.campaignId, campaign.id))
    .orderBy(desc(candidatesTable.createdAt));
  res.json(
    ListCampaignCandidatesResponse.parse(
      await Promise.all(rows.map(candidateResponse)),
    ),
  );
});

router.post("/campaigns/:campaignId/candidates", async (req, res): Promise<void> => {
  const staff = await getStaffContext(req, res);
  if (!staff) return;
  const params = CreateCampaignCandidateParams.safeParse(req.params);
  const parsed = CreateCampaignCandidateBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.error?.message ?? parsed.error?.message });
    return;
  }
  const campaign = await getCampaignForStaff(params.data.campaignId, staff);
  if (!campaign) {
    res.status(404).json({ error: "Campagne introuvable." });
    return;
  }
  const [candidate] = await db
    .insert(candidatesTable)
    .values({
      companyId: campaign.companyId,
      campaignId: campaign.id,
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      phone: parsed.data.phone?.trim() || null,
      status: "added",
    })
    .onConflictDoNothing()
    .returning();
  if (!candidate) {
    res.status(409).json({ error: "Cette adresse e-mail existe déjà dans la campagne." });
    return;
  }
  await writeAuditLog(staff, campaign.companyId, "candidate.created", "candidate", candidate.id);
  res.status(201).json(
    CreateCampaignCandidateResponse.parse(await candidateResponse(candidate)),
  );
});

router.post("/campaigns/:campaignId/invitations", async (req, res): Promise<void> => {
  const staff = await getStaffContext(req, res);
  if (!staff) return;
  const params = CreateInvitationsParams.safeParse(req.params);
  const parsed = CreateInvitationsBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.error?.message ?? parsed.error?.message });
    return;
  }
  const campaign = await getCampaignForStaff(params.data.campaignId, staff);
  if (!campaign) {
    res.status(404).json({ error: "Campagne introuvable." });
    return;
  }
  const selectedIds = [...new Set(parsed.data.candidateIds)];
  const candidates = await db
    .select()
    .from(candidatesTable)
    .where(
      and(
        eq(candidatesTable.campaignId, campaign.id),
        inArray(candidatesTable.id, selectedIds),
      ),
    );
  if (candidates.length !== selectedIds.length) {
    res.status(400).json({ error: "Un ou plusieurs candidats ne font pas partie de cette campagne." });
    return;
  }
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Le service de création des liens n’est pas configuré." });
    return;
  }
  const expiry = campaign.closesAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const protocol = process.env.NODE_ENV === "production" ? "https" : req.protocol;
  const host = req.get("host");
  if (!host) {
    res.status(500).json({ error: "Impossible de déterminer l’adresse de la plateforme." });
    return;
  }
  const output = [];
  for (const candidate of candidates) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHmac("sha256", secret).update(token).digest("hex");
    await db
      .update(invitationsTable)
      .set({ revokedAt: new Date(), status: "revoked" })
      .where(
        and(
          eq(invitationsTable.candidateId, candidate.id),
          sql`${invitationsTable.revokedAt} is null`,
        ),
      );
    await db.insert(invitationsTable).values({
      candidateId: candidate.id,
      campaignId: campaign.id,
      tokenHash,
      status: "ready",
      expiresAt: expiry,
    });
    await db
      .update(candidatesTable)
      .set({ status: "invited", invitedAt: new Date(), updatedAt: new Date() })
      .where(eq(candidatesTable.id, candidate.id));
    output.push({
      candidateId: candidate.id,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      email: candidate.email,
      status: "ready",
      url: `${protocol}://${host}/assessment/${token}`,
    });
  }
  await writeAuditLog(staff, campaign.companyId, "invitations.created", "campaign", campaign.id, {
    count: output.length,
  });
  res.status(201).json(CreateInvitationsResponse.parse(output));
});

router.get("/campaigns/:campaignId/rankings", async (req, res): Promise<void> => {
  const staff = await getStaffContext(req, res);
  if (!staff) return;
  const params = GetCampaignRankingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const campaign = await getCampaignForStaff(params.data.campaignId, staff);
  if (!campaign) {
    res.status(404).json({ error: "Campagne introuvable." });
    return;
  }
  const rows = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.campaignId, campaign.id));
  const eligibleRows = rows
    .filter((candidate) => candidate.score !== null && candidate.status === "reviewed")
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const toRanked = (candidate: (typeof eligibleRows)[number], index: number) => ({
    candidateId: candidate.id,
    name: `${candidate.firstName} ${candidate.lastName}`,
    score: candidate.score ?? 0,
    rank: index + 1,
    status: (candidate.score ?? 0) >= campaign.passingScore ? "Admissible" : "Sous le seuil",
  });
  const eligible = eligibleRows
    .filter((candidate) => (candidate.score ?? 0) >= campaign.passingScore)
    .map((candidate) => toRanked(candidate, eligibleRows.indexOf(candidate)));
  const result = {
    campaignId: campaign.id,
    topCandidates: eligibleRows
      .slice(0, campaign.shortlistSize)
      .map((candidate, index) => toRanked(candidate, index)),
    eligibleCandidates: eligible,
  };
  res.json(GetCampaignRankingsResponse.parse(result));
});

router.get("/attempts/:attemptId/review", async (req, res): Promise<void> => {
  const staff = await getStaffContext(req, res);
  if (!staff) return;
  const params = GetAttemptReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [attempt] = await db
    .select()
    .from(assessmentAttemptsTable)
    .where(eq(assessmentAttemptsTable.id, params.data.attemptId))
    .limit(1);
  if (!attempt || !(await getCampaignForStaff(attempt.campaignId, staff))) {
    res.status(404).json({ error: "Épreuve introuvable." });
    return;
  }
  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, attempt.candidateId))
    .limit(1);
  const questionIds =
    (await getCampaignForStaff(attempt.campaignId, staff))?.questionIds ?? [];
  const questions =
    questionIds.length > 0
      ? await db.select().from(questionsTable).where(inArray(questionsTable.id, questionIds))
      : [];
  const answers = await db
    .select()
    .from(answersTable)
    .where(eq(answersTable.attemptId, attempt.id));
  const grades = await db
    .select()
    .from(gradesTable)
    .where(eq(gradesTable.attemptId, attempt.id));
  const gradeMap = new Map(grades.map((grade) => [grade.questionId, grade]));
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer.value]));
  const totalScore = grades.reduce((sum, grade) => sum + grade.score, 0);
  const result = {
    attemptId: attempt.id,
    candidateId: candidate?.id ?? "",
    candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : "",
    campaignId: attempt.campaignId,
    submittedAt: (attempt.submittedAt ?? attempt.deadlineAt).toISOString(),
    submissionType: attempt.submissionType === "automatic" ? "automatic" : "voluntary",
    questions: questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      kind: question.kind,
      points: question.points,
      required: question.required,
      answer: answerMap.get(question.id) ?? null,
      expectedAnswer: question.expectedAnswer,
      score: gradeMap.get(question.id)?.score ?? null,
      comment: gradeMap.get(question.id)?.comment ?? "",
      competency: question.competency,
    })),
    validated: grades.length > 0 && grades.every((grade) => grade.validated),
    totalScore: grades.length > 0 ? totalScore : null,
  };
  res.json(GetAttemptReviewResponse.parse(result));
});

router.put("/attempts/:attemptId/grades", async (req, res): Promise<void> => {
  const staff = await getStaffContext(req, res);
  if (!staff) return;
  const params = SaveAttemptGradesParams.safeParse(req.params);
  const parsed = SaveAttemptGradesBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: params.error?.message ?? parsed.error?.message });
    return;
  }
  const [attempt] = await db
    .select()
    .from(assessmentAttemptsTable)
    .where(eq(assessmentAttemptsTable.id, params.data.attemptId))
    .limit(1);
  const campaign = attempt
    ? await getCampaignForStaff(attempt.campaignId, staff)
    : null;
  if (!attempt || !campaign) {
    res.status(404).json({ error: "Épreuve introuvable." });
    return;
  }
  if (!attempt.submittedAt) {
    res.status(409).json({ error: "Cette épreuve n’a pas encore été soumise." });
    return;
  }
  const questionIds = campaign.questionIds;
  const questions =
    questionIds.length > 0
      ? await db.select().from(questionsTable).where(inArray(questionsTable.id, questionIds))
      : [];
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const gradeIds = new Set<string>();
  for (const grade of parsed.data.grades) {
    const question = questionMap.get(grade.questionId);
    if (!question || grade.score > question.points || gradeIds.has(grade.questionId)) {
      res.status(400).json({ error: "Une note est invalide ou dépasse le barème de la question." });
      return;
    }
    gradeIds.add(grade.questionId);
  }
  if (parsed.data.validate && questions.some((question) => !gradeIds.has(question.id))) {
    res.status(400).json({ error: "Toutes les questions doivent être corrigées avant validation." });
    return;
  }
  const oldGrades = await db
    .select()
    .from(gradesTable)
    .where(eq(gradesTable.attemptId, attempt.id));
  const oldByQuestion = new Map(oldGrades.map((grade) => [grade.questionId, grade]));
  for (const grade of parsed.data.grades) {
    await db
      .insert(gradesTable)
      .values({
        attemptId: attempt.id,
        questionId: grade.questionId,
        score: grade.score,
        comment: grade.comment ?? "",
        validated: parsed.data.validate,
        gradedBy: staff.id,
      })
      .onConflictDoUpdate({
        target: [gradesTable.attemptId, gradesTable.questionId],
        set: {
          score: grade.score,
          comment: grade.comment ?? "",
          validated: parsed.data.validate,
          gradedBy: staff.id,
          updatedAt: new Date(),
        },
      });
  }
  const totalScore = parsed.data.grades.reduce((sum, grade) => sum + grade.score, 0);
  const maxScore = questions.reduce((sum, question) => sum + question.points, 0);
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 10000) / 100 : 0;
  if (parsed.data.validate) {
    await db
      .update(candidatesTable)
      .set({ status: "reviewed", score: totalScore, updatedAt: new Date() })
      .where(eq(candidatesTable.id, attempt.candidateId));
  } else {
    await db
      .update(candidatesTable)
      .set({ status: "to_review", updatedAt: new Date() })
      .where(eq(candidatesTable.id, attempt.candidateId));
  }
  await writeAuditLog(
    staff,
    campaign.companyId,
    parsed.data.validate ? "grades.validated" : "grades.saved",
    "assessment",
    attempt.id,
    {
      grades: parsed.data.grades.map((grade) => ({
        questionId: grade.questionId,
        oldScore: oldByQuestion.get(grade.questionId)?.score ?? null,
        newScore: grade.score,
      })),
    },
  );
  res.json(
    SaveAttemptGradesResponse.parse({
      attemptId: attempt.id,
      totalScore,
      maxScore,
      percentage,
      validated: parsed.data.validate,
    }),
  );
});

export default router;
