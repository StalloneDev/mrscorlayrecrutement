"use server";

import {
  db,
  invitationsTable,
  candidatesTable,
  campaignsTable,
  companiesTable,
  questionsTable,
  assessmentAttemptsTable,
  answersTable,
} from "@/db";
import { eq, and, isNull, gt, inArray } from "drizzle-orm";
import { hashInvitationToken } from "@/lib/security";
import { logAuditEvent } from "@/lib/audit";

export async function getInvitationData(token: string) {
  const tokenHash = hashInvitationToken(token);
  if (!tokenHash) return { error: "Lien d'invitation non valide ou format incorrect." };

  const [invitation] = await db
    .select()
    .from(invitationsTable)
    .where(
      and(
        eq(invitationsTable.tokenHash, tokenHash),
        isNull(invitationsTable.revokedAt),
        gt(invitationsTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!invitation) {
    return { error: "Ce lien d'invitation n'est pas valide ou a expiré." };
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
    ? await db.select().from(companiesTable).where(eq(companiesTable.id, campaign.companyId)).limit(1)
    : [];

  if (!candidate || !campaign || !company) {
    return { error: "Données de campagne ou candidat introuvables." };
  }

  // Vérifier tentative existante
  const [existingAttempt] = await db
    .select()
    .from(assessmentAttemptsTable)
    .where(eq(assessmentAttemptsTable.candidateId, candidate.id))
    .limit(1);

  return {
    candidateFirstName: candidate.firstName,
    candidateLastName: candidate.lastName,
    candidateEmail: candidate.email,
    candidatePhone: candidate.phone,
    candidateStatus: candidate.status,
    companyName: company.name,
    companyCode: company.code,
    companyAccent: company.accentColor,
    campaignTitle: campaign.title,
    campaignDescription: campaign.description,
    durationMinutes: campaign.durationMinutes,
    questionCount: campaign.questionIds.length,
    attemptId: existingAttempt?.id || null,
    submittedAt: existingAttempt?.submittedAt || null,
  };
}

export async function startAssessmentAction(
  token: string,
  verification: { firstName: string; lastName: string; email: string }
) {
  const tokenHash = hashInvitationToken(token);
  if (!tokenHash) throw new Error("Jeton invalide.");

  const [invitation] = await db
    .select()
    .from(invitationsTable)
    .where(
      and(
        eq(invitationsTable.tokenHash, tokenHash),
        isNull(invitationsTable.revokedAt),
        gt(invitationsTable.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!invitation) throw new Error("Invitation non trouvée ou expirée.");

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, invitation.candidateId))
    .limit(1);

  if (!candidate) throw new Error("Candidat non trouvé.");

  // Vérification d'identité
  if (
    candidate.email.trim().toLowerCase() !== verification.email.trim().toLowerCase() ||
    candidate.lastName.trim().toLowerCase() !== verification.lastName.trim().toLowerCase()
  ) {
    throw new Error("Les informations saisies ne correspondent pas à l'invitation.");
  }

  // Vérifier si tentative existe déjà
  const [existingAttempt] = await db
    .select()
    .from(assessmentAttemptsTable)
    .where(eq(assessmentAttemptsTable.candidateId, candidate.id))
    .limit(1);

  if (existingAttempt) {
    if (existingAttempt.submittedAt) {
      throw new Error("Cette épreuve a déjà été soumise.");
    }
    return { attemptId: existingAttempt.id, resumed: true };
  }

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, invitation.campaignId))
    .limit(1);

  if (!campaign) throw new Error("Campagne non trouvée.");

  const now = new Date();
  const deadlineAt = new Date(now.getTime() + campaign.durationMinutes * 60 * 1000);

  const [attempt] = await db
    .insert(assessmentAttemptsTable)
    .values({
      candidateId: candidate.id,
      campaignId: campaign.id,
      startedAt: now,
      deadlineAt,
    })
    .returning();

  await db
    .update(candidatesTable)
    .set({ status: "in_progress", updatedAt: now })
    .where(eq(candidatesTable.id, candidate.id));

  await logAuditEvent({
    companyId: campaign.companyId,
    action: "ASSESSMENT_STARTED",
    entityType: "assessment",
    entityId: attempt.id,
    detail: { candidateId: candidate.id, campaignId: campaign.id },
  });

  return { attemptId: attempt.id, resumed: false };
}

export async function getAttemptQuestionsAndAnswers(attemptId: string) {
  const [attempt] = await db
    .select()
    .from(assessmentAttemptsTable)
    .where(eq(assessmentAttemptsTable.id, attemptId))
    .limit(1);

  if (!attempt) throw new Error("Tentative introuvable.");

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, attempt.campaignId))
    .limit(1);

  const [candidate] = await db
    .select()
    .from(candidatesTable)
    .where(eq(candidatesTable.id, attempt.candidateId))
    .limit(1);

  const [company] = campaign
    ? await db.select().from(companiesTable).where(eq(companiesTable.id, campaign.companyId)).limit(1)
    : [];

  const questionIds = campaign?.questionIds ?? [];
  let questions: any[] = [];
  if (questionIds.length > 0) {
    const rawQuestions = await db
      .select({
        id: questionsTable.id,
        prompt: questionsTable.prompt,
        kind: questionsTable.kind,
        points: questionsTable.points,
        required: questionsTable.required,
        category: questionsTable.category,
        competency: questionsTable.competency,
        choices: questionsTable.choices,
        maxCharacters: questionsTable.maxCharacters,
      })
      .from(questionsTable)
      .where(inArray(questionsTable.id, questionIds));

    // Préserver l'ordre configuré
    questions = questionIds
      .map((qid) => rawQuestions.find((q) => q.id === qid))
      .filter(Boolean);
  }

  const answers = await db
    .select()
    .from(answersTable)
    .where(eq(answersTable.attemptId, attemptId));

  const answersMap = Object.fromEntries(answers.map((a) => [a.questionId, a.value]));

  const now = new Date();
  const secondsRemaining = Math.max(0, Math.floor((attempt.deadlineAt.getTime() - now.getTime()) / 1000));

  // Clôture automatique serveur si délai dépassé et non soumis
  const isExpired = secondsRemaining === 0 && !attempt.submittedAt;
  if (isExpired) {
    await db
      .update(assessmentAttemptsTable)
      .set({ submittedAt: now, submissionType: "automatic", updatedAt: now })
      .where(eq(assessmentAttemptsTable.id, attemptId));

    await db
      .update(candidatesTable)
      .set({ status: "submitted_automatically", updatedAt: now })
      .where(eq(candidatesTable.id, attempt.candidateId));
  }

  return {
    attemptId: attempt.id,
    submittedAt: attempt.submittedAt || (isExpired ? now : null),
    submissionType: attempt.submissionType,
    secondsRemaining: isExpired ? 0 : secondsRemaining,
    questions,
    answers: answersMap,
    candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : "",
    companyName: company?.name || "",
    campaignTitle: campaign?.title || "",
  };
}

export async function saveCandidateAnswerAction(attemptId: string, questionId: string, value: string) {
  const [attempt] = await db
    .select()
    .from(assessmentAttemptsTable)
    .where(eq(assessmentAttemptsTable.id, attemptId))
    .limit(1);

  if (!attempt) throw new Error("Tentative introuvable.");

  if (attempt.submittedAt) {
    throw new Error("L'épreuve est déjà soumise. Modification interdite.");
  }

  const now = new Date();
  if (now.getTime() > attempt.deadlineAt.getTime()) {
    // Clôture automatique immédiate
    await db
      .update(assessmentAttemptsTable)
      .set({ submittedAt: now, submissionType: "automatic", updatedAt: now })
      .where(eq(assessmentAttemptsTable.id, attemptId));

    await db
      .update(candidatesTable)
      .set({ status: "submitted_automatically", updatedAt: now })
      .where(eq(candidatesTable.id, attempt.candidateId));

    throw new Error("Temps imparti écoulé. Vos réponses ont été soumises automatiquement.");
  }

  await db
    .insert(answersTable)
    .values({ attemptId, questionId, value, savedAt: now })
    .onConflictDoUpdate({
      target: [answersTable.attemptId, answersTable.questionId],
      set: { value, savedAt: now },
    });

  return { success: true, savedAt: now.toISOString() };
}

export async function submitAssessmentAction(attemptId: string) {
  const [attempt] = await db
    .select()
    .from(assessmentAttemptsTable)
    .where(eq(assessmentAttemptsTable.id, attemptId))
    .limit(1);

  if (!attempt) throw new Error("Tentative introuvable.");
  if (attempt.submittedAt) return { success: true, alreadySubmitted: true };

  const now = new Date();
  const isTimeOut = now.getTime() > attempt.deadlineAt.getTime();
  const submissionType = isTimeOut ? "automatic" : "voluntary";
  const candidateStatus = isTimeOut ? "submitted_automatically" : "submitted";

  await db
    .update(assessmentAttemptsTable)
    .set({ submittedAt: now, submissionType, updatedAt: now })
    .where(eq(assessmentAttemptsTable.id, attemptId));

  await db
    .update(candidatesTable)
    .set({ status: candidateStatus, updatedAt: now })
    .where(eq(candidatesTable.id, attempt.candidateId));

  await logAuditEvent({
    companyId: null,
    action: isTimeOut ? "ASSESSMENT_AUTO_SUBMITTED" : "ASSESSMENT_VOLUNTARY_SUBMITTED",
    entityType: "assessment",
    entityId: attemptId,
    detail: { candidateId: attempt.candidateId },
  });

  return { success: true, submissionType, submittedAt: now.toISOString() };
}
