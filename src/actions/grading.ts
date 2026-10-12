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
import { eq, inArray, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";

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

  const questionsWithReview = questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    kind: q.kind,
    points: q.points,
    expectedAnswer: q.expectedAnswer,
    competency: q.competency,
    answer: answersMap[q.id] || "",
    score: gradesMap[q.id]?.score ?? null,
    comment: gradesMap[q.id]?.comment ?? "",
    validated: gradesMap[q.id]?.validated ?? false,
  }));

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
