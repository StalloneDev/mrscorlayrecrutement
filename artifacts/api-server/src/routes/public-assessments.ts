import { createHmac } from "node:crypto";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetPublicInvitationParams,
  GetPublicInvitationResponse,
  SaveAnswerBody,
  SaveAnswerParams,
  SaveAnswerResponse,
  StartAssessmentBody,
  StartAssessmentParams,
  StartAssessmentResponse,
  SubmitAssessmentParams,
  SubmitAssessmentResponse,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  answersTable,
  assessmentAttemptsTable,
  campaignsTable,
  candidatesTable,
  companiesTable,
  invitationsTable,
  questionsTable,
} from "@workspace/db";

const router: IRouter = Router();

function invitationTokenHash(token: string): string | null {
  const secret = process.env.SESSION_SECRET;
  if (!secret || token.length < 32 || token.length > 256) return null;
  return createHmac("sha256", secret).update(token).digest("hex");
}

async function getValidInvitation(token: string) {
  const tokenHash = invitationTokenHash(token);
  if (!tokenHash) return null;
  const [invitation] = await db
    .select()
    .from(invitationsTable)
    .where(
      and(
        eq(invitationsTable.tokenHash, tokenHash),
        isNull(invitationsTable.revokedAt),
        gt(invitationsTable.expiresAt, new Date()),
      ),
    )
    .limit(1);
  return invitation ?? null;
}

router.get("/public/invitations/:token", async (req, res): Promise<void> => {
  const params = GetPublicInvitationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Lien d’invitation invalide." });
    return;
  }
  const invitation = await getValidInvitation(params.data.token);
  if (!invitation) {
    res.status(404).json({ error: "Ce lien n’est pas valide ou a expiré. Veuillez contacter l’équipe RH." });
    return;
  }
  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, invitation.candidateId))
    .limit(1);
  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, invitation.campaignId))
    .limit(1);
  const [company] = campaign
    ? await db
        .select()
        .from(companiesTable)
        .where(eq(companiesTable.id, campaign.companyId))
        .limit(1)
    : [];
  if (!candidate || !campaign || !company) {
    res.status(404).json({ error: "Ce lien n’est pas valide ou a expiré. Veuillez contacter l’équipe RH." });
    return;
  }
  const questionCount = campaign.questionIds.length;
  res.json(
    GetPublicInvitationResponse.parse({
      candidateFirstName: candidate.firstName,
      candidateLastName: candidate.lastName,
      companyName: company.name,
      campaignTitle: campaign.title,
      durationMinutes: campaign.durationMinutes,
      questionCount,
      closesAt: (campaign.closesAt ?? invitation.expiresAt).toISOString(),
      status: candidate.status,
    }),
  );
});

router.post("/public/invitations/:token/start", async (req, res): Promise<void> => {
  const params = StartAssessmentParams.safeParse(req.params);
  const body = StartAssessmentBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: params.error?.message ?? body.error?.message });
    return;
  }
  const invitation = await getValidInvitation(params.data.token);
  if (!invitation) {
    res.status(404).json({ error: "Ce lien n’est pas valide ou a expiré. Veuillez contacter l’équipe RH." });
    return;
  }
  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, invitation.candidateId))
    .limit(1);
  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, invitation.campaignId))
    .limit(1);
  if (!candidate || !campaign) {
    res.status(404).json({ error: "Ce lien n’est pas valide ou a expiré." });
    return;
  }
  const sameIdentity =
    candidate.firstName.trim().toLocaleLowerCase() === body.data.firstName.trim().toLocaleLowerCase() &&
    candidate.lastName.trim().toLocaleLowerCase() === body.data.lastName.trim().toLocaleLowerCase() &&
    candidate.email.trim().toLocaleLowerCase() === body.data.email.trim().toLocaleLowerCase();
  if (!sameIdentity) {
    res.status(403).json({ error: "Les informations ne correspondent pas à cette invitation." });
    return;
  }
  if (campaign.status !== "published" && campaign.status !== "in_progress") {
    res.status(409).json({ error: "Cette campagne n’accepte pas de nouvelle épreuve." });
    return;
  }
  if (campaign.opensAt && campaign.opensAt.getTime() > Date.now()) {
    res.status(409).json({ error: "L’épreuve n’est pas encore ouverte." });
    return;
  }
  if (campaign.closesAt && campaign.closesAt.getTime() <= Date.now()) {
    res.status(410).json({ error: "La date limite de cette épreuve est dépassée." });
    return;
  }
  if (campaign.questionIds.length === 0) {
    res.status(409).json({ error: "Cette épreuve ne contient pas encore de questions." });
    return;
  }

  let [attempt] = await db
    .select()
    .from(assessmentAttemptsTable)
    .where(eq(assessmentAttemptsTable.candidateId, candidate.id))
    .limit(1);
  if (attempt?.submittedAt) {
    res.status(409).json({ error: "Cette épreuve a déjà été soumise." });
    return;
  }
  if (!attempt) {
    const now = new Date();
    const durationLimit = new Date(now.getTime() + campaign.durationMinutes * 60_000);
    const deadlineAt =
      campaign.closesAt && campaign.closesAt.getTime() < durationLimit.getTime()
        ? campaign.closesAt
        : durationLimit;
    const [created] = await db
      .insert(assessmentAttemptsTable)
      .values({
        candidateId: candidate.id,
        campaignId: campaign.id,
        startedAt: now,
        deadlineAt,
      })
      .onConflictDoNothing()
      .returning();
    attempt =
      created ??
      (
        await db
          .select()
          .from(assessmentAttemptsTable)
          .where(eq(assessmentAttemptsTable.candidateId, candidate.id))
          .limit(1)
      )[0];
    await db
      .update(candidatesTable)
      .set({ status: "in_progress", updatedAt: new Date() })
      .where(eq(candidatesTable.id, candidate.id));
  }
  if (!attempt) {
    res.status(500).json({ error: "L’épreuve n’a pas pu démarrer." });
    return;
  }
  if (attempt.deadlineAt.getTime() <= Date.now()) {
    res.status(410).json({ error: "Le temps imparti à cette épreuve est écoulé." });
    return;
  }
  const questions = await db
    .select()
    .from(questionsTable)
    // The ids are an explicit campaign-owned snapshot; expected answers are
    // intentionally omitted from this candidate-facing response.
    .where(inArray(questionsTable.id, campaign.questionIds));
  const orderedQuestions = campaign.questionIds
    .map((id) => questions.find((question) => question.id === id))
    .filter((question): question is NonNullable<typeof question> => !!question);
  const savedAnswers = await db
    .select()
    .from(answersTable)
    .where(eq(answersTable.attemptId, attempt.id));
  const answerMap = new Map(savedAnswers.map((answer) => [answer.questionId, answer.value]));
  res.json(
    StartAssessmentResponse.parse({
      id: attempt.id,
      startedAt: attempt.startedAt.toISOString(),
      deadlineAt: attempt.deadlineAt.toISOString(),
      secondsRemaining: Math.max(0, Math.floor((attempt.deadlineAt.getTime() - Date.now()) / 1000)),
      questions: orderedQuestions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        kind: question.kind,
        points: question.points,
        required: question.required,
        choices: question.choices,
        maxCharacters: question.maxCharacters,
        answer: answerMap.get(question.id) ?? "",
      })),
    }),
  );
});

router.put("/public/attempts/:attemptId/answers/:questionId", async (req, res): Promise<void> => {
  const params = SaveAnswerParams.safeParse(req.params);
  const body = SaveAnswerBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: params.error?.message ?? body.error?.message });
    return;
  }
  const [attempt] = await db
    .select()
    .from(assessmentAttemptsTable)
    .where(eq(assessmentAttemptsTable.id, params.data.attemptId))
    .limit(1);
  if (!attempt) {
    res.status(404).json({ error: "Épreuve introuvable." });
    return;
  }
  const now = new Date();
  if (attempt.submittedAt || attempt.deadlineAt.getTime() <= now.getTime()) {
    res.status(409).json({ error: "Le délai est écoulé; cette réponse ne peut plus être enregistrée." });
    return;
  }
  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, attempt.campaignId))
    .limit(1);
  if (!campaign?.questionIds.includes(params.data.questionId)) {
    res.status(404).json({ error: "Question introuvable dans cette épreuve." });
    return;
  }
  const [question] = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.id, params.data.questionId))
    .limit(1);
  if (!question) {
    res.status(404).json({ error: "Question introuvable." });
    return;
  }
  if (question.maxCharacters && body.data.value.length > question.maxCharacters) {
    res.status(400).json({ error: `La réponse dépasse ${question.maxCharacters} caractères.` });
    return;
  }
  await db
    .insert(answersTable)
    .values({
      attemptId: attempt.id,
      questionId: question.id,
      value: body.data.value,
      savedAt: now,
    })
    .onConflictDoUpdate({
      target: [answersTable.attemptId, answersTable.questionId],
      set: { value: body.data.value, savedAt: now },
    });
  res.json(SaveAnswerResponse.parse({ savedAt: now.toISOString() }));
});

router.post("/public/attempts/:attemptId/submit", async (req, res): Promise<void> => {
  const params = SubmitAssessmentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [attempt] = await db
    .select()
    .from(assessmentAttemptsTable)
    .where(eq(assessmentAttemptsTable.id, params.data.attemptId))
    .limit(1);
  if (!attempt) {
    res.status(404).json({ error: "Épreuve introuvable." });
    return;
  }
  const submittedAt = attempt.submittedAt ?? new Date();
  const type =
    attempt.submissionType ??
    (attempt.deadlineAt.getTime() <= submittedAt.getTime() ? "automatic" : "voluntary");
  if (!attempt.submittedAt) {
    await db
      .update(assessmentAttemptsTable)
      .set({ submittedAt, submissionType: type, updatedAt: submittedAt })
      .where(eq(assessmentAttemptsTable.id, attempt.id));
    await db
      .update(candidatesTable)
      .set({
        status: type === "automatic" ? "submitted_automatically" : "to_review",
        updatedAt: submittedAt,
      })
      .where(eq(candidatesTable.id, attempt.candidateId));
  }
  res.json(
    SubmitAssessmentResponse.parse({
      submittedAt: submittedAt.toISOString(),
      type,
    }),
  );
});

export default router;
