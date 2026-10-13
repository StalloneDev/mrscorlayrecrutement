"use server";

import {
  db,
  assessmentAttemptsTable,
  candidatesTable,
  campaignsTable,
  questionsTable,
  answersTable,
  gradesTable,
} from "@/db";
import { eq, inArray, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";
import { autoGradeAttempt } from "@/lib/autoGrade";
import { sendResultEmail } from "@/lib/email";

export async function getAttemptForReview(attemptId: string) {
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

  const questionIds = campaign?.questionIds ?? [];
  let questions: any[] = [];
  if (questionIds.length > 0) {
    const rawQuestions = await db
      .select()
      .from(questionsTable)
      .where(inArray(questionsTable.id, questionIds));

    questions = questionIds
      .map((qid) => rawQuestions.find((q) => q.id === qid))
      .filter(Boolean);
  }

  const answers = await db
    .select()
    .from(answersTable)
    .where(eq(answersTable.attemptId, attemptId));
  const answersMap = Object.fromEntries(answers.map((a) => [a.questionId, a.value]));

  const grades = await db
    .select()
    .from(gradesTable)
    .where(eq(gradesTable.attemptId, attemptId));
  const gradesMap = Object.fromEntries(grades.map((g) => [g.questionId, g]));

  const isValidated = grades.length > 0 && grades.every((g) => g.validated);

  const questionsWithReview = questions.map((q) => {
    const grade = gradesMap[q.id];
    const isAutoGradable =
      q.kind !== "long_text" && q.kind !== "short_text" && q.kind !== "text" && !!q.expectedAnswer;
    return {
      id: q.id,
      prompt: q.prompt,
      kind: q.kind,
      points: q.points,
      choices: (q.choices as string[]) || [],
      expectedAnswer: q.expectedAnswer,
      competency: q.competency,
      answer: answersMap[q.id] || "",
      score: grade?.score ?? null,
      comment: grade?.comment ?? "",
      validated: grade?.validated ?? false,
      isAutoGraded: isAutoGradable && grade !== undefined,
    };
  });

  return {
    attemptId: attempt.id,
    candidateId: candidate?.id || "",
    candidateName: candidate ? `${candidate.firstName} ${candidate.lastName}` : "",
    candidateEmail: candidate?.email || "",
    campaignId: campaign?.id || "",
    campaignTitle: campaign?.title || "",
    submissionType: attempt.submissionType,
    submittedAt: attempt.submittedAt?.toISOString() || "",
    validated: isValidated,
    questions: questionsWithReview,
  };
}

export async function saveAttemptGradesAction({
  attemptId,
  grades,
  validate = false,
}: {
  attemptId: string;
  grades: { questionId: string; score: number; comment?: string }[];
  validate?: boolean;
}) {
  const [attempt] = await db
    .select()
    .from(assessmentAttemptsTable)
    .where(eq(assessmentAttemptsTable.id, attemptId))
    .limit(1);

  if (!attempt) throw new Error("Tentative introuvable.");

  let totalScore = 0;

  for (const grade of grades) {
    totalScore += grade.score;
    await db
      .insert(gradesTable)
      .values({
        attemptId,
        questionId: grade.questionId,
        score: grade.score,
        comment: grade.comment || "",
        validated: validate,
      })
      .onConflictDoUpdate({
        target: [gradesTable.attemptId, gradesTable.questionId],
        set: {
          score: grade.score,
          comment: grade.comment || "",
          validated: validate,
          updatedAt: new Date(),
        },
      });
  }

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, attempt.campaignId))
    .limit(1);

  // Calcul du score en % si validé
  if (validate && campaign) {
    const questionIds = campaign.questionIds || [];
    let maxTotal = 0;
    if (questionIds.length > 0) {
      const qRows = await db
        .select({ points: questionsTable.points })
        .from(questionsTable)
        .where(inArray(questionsTable.id, questionIds));
      maxTotal = qRows.reduce((sum, q) => sum + q.points, 0);
    }

    const percentageScore = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;

    await db
      .update(candidatesTable)
      .set({
        score: percentageScore,
        status: "reviewed",
        updatedAt: new Date(),
      })
      .where(eq(candidatesTable.id, attempt.candidateId));

    await logAuditEvent({
      companyId: campaign.companyId,
      action: "GRADES_VALIDATED",
      entityType: "assessment",
      entityId: attemptId,
      detail: { candidateId: attempt.candidateId, percentageScore, totalScore, maxTotal },
    });

    // Envoi de l'e-mail de résultat au candidat (non bloquant)
    try {
      const [cand] = await db
        .select({
          email: candidatesTable.email,
          firstName: candidatesTable.firstName,
          lastName: candidatesTable.lastName,
        })
        .from(candidatesTable)
        .where(eq(candidatesTable.id, attempt.candidateId))
        .limit(1);

      if (cand && cand.email) {
        await sendResultEmail({
          to: cand.email,
          candidateName: `${cand.firstName} ${cand.lastName}`,
          campaignTitle: campaign.title,
          score: percentageScore,
          passingScore: campaign.passingScore || 60,
        });
      }
    } catch (emailErr) {
      console.error("[Email Result Error] Échec de l'envoi de l'e-mail de résultat :", emailErr);
    }
  }

  revalidatePath(`/review/${attemptId}`);
  revalidatePath(`/campaigns/${attempt.campaignId}`);
  return { success: true, validated: validate };
}

export async function getCampaignRankings(campaignId: string) {
  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, campaignId))
    .limit(1);

  if (!campaign) throw new Error("Campagne introuvable.");

  const candidates = await db
    .select({
      id: candidatesTable.id,
      firstName: candidatesTable.firstName,
      lastName: candidatesTable.lastName,
      score: candidatesTable.score,
      status: candidatesTable.status,
    })
    .from(candidatesTable)
    .where(eq(candidatesTable.campaignId, campaignId));

  // Candidats validés avec note
  const reviewed = candidates
    .filter((c) => c.score !== null && c.score !== undefined)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const passingScore = campaign.passingScore || 60;
  const shortlistLimit = campaign.shortlistSize || 5;

  const ranked = reviewed.map((c, index) => ({
    candidateId: c.id,
    name: `${c.firstName} ${c.lastName}`,
    score: c.score || 0,
    rank: index + 1,
    isTop: index < shortlistLimit,
    isEligible: (c.score || 0) >= passingScore,
    status: c.status,
  }));

  const topCandidates = ranked.filter((c) => c.isTop);
  const eligibleCandidates = ranked.filter((c) => c.isEligible);

  return {
    campaignTitle: campaign.title,
    passingScore,
    shortlistLimit,
    totalReviewed: reviewed.length,
    topCandidates,
    eligibleCandidates,
  };
}

/**
 * Server Action : ré-applique la correction automatique des QCM pour un attempt existant.
 * Utilisé via le bouton "Réappliquer la correction automatique" dans ReviewClient.
 */
export async function autoGradeAttemptAction(attemptId: string) {
  const [attempt] = await db
    .select()
    .from(assessmentAttemptsTable)
    .where(eq(assessmentAttemptsTable.id, attemptId))
    .limit(1);

  if (!attempt) return { error: "Tentative introuvable." };

  const [campaign] = await db
    .select()
    .from(campaignsTable)
    .where(eq(campaignsTable.id, attempt.campaignId))
    .limit(1);

  const questionIds = campaign?.questionIds ?? [];
  if (questionIds.length === 0) return { error: "Aucune question dans cette campagne." };

  const rawQuestions = await db
    .select({
      id: questionsTable.id,
      kind: questionsTable.kind,
      points: questionsTable.points,
      choices: questionsTable.choices,
      expectedAnswer: questionsTable.expectedAnswer,
    })
    .from(questionsTable)
    .where(inArray(questionsTable.id, questionIds));

  const answers = await db
    .select()
    .from(answersTable)
    .where(eq(answersTable.attemptId, attemptId));

  const answersMap = Object.fromEntries(answers.map((a) => [a.questionId, a.value]));

  const { autoGraded, manualRequired } = autoGradeAttempt({
    questions: rawQuestions,
    answersMap,
  });

  if (autoGraded.length === 0) {
    return { error: "Aucune question auto-corrigeable trouvée (ou réponses attendues manquantes)." };
  }

  const now = new Date();

  for (const grade of autoGraded) {
    await db
      .insert(gradesTable)
      .values({
        attemptId,
        questionId: grade.questionId,
        score: grade.score,
        comment: grade.comment,
        validated: false,
      })
      .onConflictDoUpdate({
        target: [gradesTable.attemptId, gradesTable.questionId],
        set: {
          score: grade.score,
          comment: grade.comment,
          validated: false,
          updatedAt: now,
        },
      });
  }

  // Si 100% QCM → valider automatiquement et mettre à jour le score candidat
  if (manualRequired.length === 0 && autoGraded.length > 0) {
    const totalPoints = rawQuestions.reduce((sum, q) => sum + q.points, 0);
    const earnedPoints = autoGraded.reduce((sum, g) => sum + g.score, 0);
    const percentageScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    for (const grade of autoGraded) {
      await db
        .update(gradesTable)
        .set({ validated: true, updatedAt: now })
        .where(
          and(
            eq(gradesTable.attemptId, attemptId),
            eq(gradesTable.questionId, grade.questionId)
          )
        );
    }

    await db
      .update(candidatesTable)
      .set({ score: percentageScore, status: "reviewed", updatedAt: now })
      .where(eq(candidatesTable.id, attempt.candidateId));
  }

  await logAuditEvent({
    companyId: null,
    action: "ASSESSMENT_AUTO_GRADED",
    entityType: "assessment",
    entityId: attemptId,
    detail: { autoGradedCount: autoGraded.length, manualRequired: manualRequired.length },
  });

  revalidatePath(`/review/${attemptId}`);

  return {
    success: true,
    autoGradedCount: autoGraded.length,
    manualRequired: manualRequired.length,
  };
}
