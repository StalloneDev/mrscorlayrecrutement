"use server";

import { db, questionsTable, companiesTable } from "@/db";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logAuditEvent } from "@/lib/audit";

export async function getQuestions(companyId?: string) {
  const query = db
    .select({
      id: questionsTable.id,
      companyId: questionsTable.companyId,
      companyName: companiesTable.name,
      prompt: questionsTable.prompt,
      kind: questionsTable.kind,
      points: questionsTable.points,
      required: questionsTable.required,
      category: questionsTable.category,
      competency: questionsTable.competency,
      difficulty: questionsTable.difficulty,
      choices: questionsTable.choices,
      expectedAnswer: questionsTable.expectedAnswer,
      maxCharacters: questionsTable.maxCharacters,
      createdAt: questionsTable.createdAt,
    })
    .from(questionsTable)
    .leftJoin(companiesTable, eq(questionsTable.companyId, companiesTable.id))
    .orderBy(desc(questionsTable.createdAt));

  const list = await query;
  if (companyId) {
    return list.filter((q) => !q.companyId || q.companyId === companyId);
  }
  return list;
}

export async function createQuestionAction(formData: FormData) {
  const companyId = (formData.get("companyId") as string) || null;
  const prompt = (formData.get("prompt") as string)?.trim();
  const kind = (formData.get("kind") as string) || "single_choice";
  const points = Number(formData.get("points") || 5);
  const required = formData.get("required") === "on" || formData.get("required") === "true";
  const category = (formData.get("category") as string)?.trim() || "Général";
  const competency = (formData.get("competency") as string)?.trim() || "";
  const difficulty = (formData.get("difficulty") as string) || "medium";
  const expectedAnswer = (formData.get("expectedAnswer") as string)?.trim() || null;
  const maxCharacters = formData.get("maxCharacters") ? Number(formData.get("maxCharacters")) : null;

  const rawChoices = formData.get("choices") as string;
  let choices: string[] = [];
  if (rawChoices) {
    choices = rawChoices
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
  }

  if (!prompt) {
    throw new Error("L'énoncé de la question est obligatoire.");
  }

  const [question] = await db
    .insert(questionsTable)
    .values({
      companyId,
      prompt,
      kind,
      points,
      required,
      category,
      competency,
      difficulty,
      choices,
      expectedAnswer,
      maxCharacters,
    })
    .returning();

  await logAuditEvent({
    companyId,
    action: "QUESTION_CREATED",
    entityType: "question",
    entityId: question.id,
    detail: { category, competency, points },
  });

  revalidatePath("/questions");
  return question;
}

export async function updateQuestionAction(questionId: string, formData: FormData) {
  const companyId = (formData.get("companyId") as string) || null;
  const prompt = (formData.get("prompt") as string)?.trim();
  const kind = (formData.get("kind") as string) || "single_choice";
  const points = Number(formData.get("points") || 5);
  const required = formData.get("required") === "on" || formData.get("required") === "true";
  const category = (formData.get("category") as string)?.trim() || "Général";
  const competency = (formData.get("competency") as string)?.trim() || "";
  const difficulty = (formData.get("difficulty") as string) || "medium";
  const expectedAnswer = (formData.get("expectedAnswer") as string)?.trim() || null;
  const maxCharacters = formData.get("maxCharacters") ? Number(formData.get("maxCharacters")) : null;

  const rawChoices = formData.get("choices") as string;
  let choices: string[] = [];
  if (rawChoices) {
    choices = rawChoices
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
  }

  if (!prompt) {
    throw new Error("L'énoncé de la question est obligatoire.");
  }

  const [question] = await db
    .update(questionsTable)
    .set({
      companyId,
      prompt,
      kind,
      points,
      required,
      category,
      competency,
      difficulty,
      choices,
      expectedAnswer,
      maxCharacters,
      updatedAt: new Date(),
    })
    .where(eq(questionsTable.id, questionId))
    .returning();

  await logAuditEvent({
    companyId,
    action: "QUESTION_UPDATED",
    entityType: "question",
    entityId: questionId,
    detail: { category, competency, points },
  });

  revalidatePath("/questions");
  return question;
}

export async function deleteQuestionAction(questionId: string) {
  const [question] = await db
    .select()
    .from(questionsTable)
    .where(eq(questionsTable.id, questionId))
    .limit(1);

  if (!question) return { error: "Question introuvable." };

  await db.delete(questionsTable).where(eq(questionsTable.id, questionId));

  await logAuditEvent({
    companyId: question.companyId ?? null,
    action: "QUESTION_DELETED",
    entityType: "question",
    entityId: questionId,
    detail: { prompt: question.prompt.slice(0, 80) },
  });

  revalidatePath("/questions");
  return { success: true };
}

