import { db, campaignsTable, companiesTable, questionsTable } from "@/db";
import { eq, inArray, desc } from "drizzle-orm";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { CompositionViewer } from "./CompositionViewer";
import { Layers } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CompositionPage() {
  const rawCampaigns = await db
    .select({
      id: campaignsTable.id,
      title: campaignsTable.title,
      reference: campaignsTable.reference,
      companyId: campaignsTable.companyId,
      status: campaignsTable.status,
      durationMinutes: campaignsTable.durationMinutes,
      passingScore: campaignsTable.passingScore,
      shortlistSize: campaignsTable.shortlistSize,
      questionIds: campaignsTable.questionIds,
      companyName: companiesTable.name,
      companyAccent: companiesTable.accentColor,
    })
    .from(campaignsTable)
    .leftJoin(companiesTable, eq(campaignsTable.companyId, companiesTable.id))
    .orderBy(desc(campaignsTable.createdAt));

  // Récupérer toutes les questions mobilisées
  const allQuestionIds = Array.from(
    new Set(rawCampaigns.flatMap((c) => c.questionIds || []))
  );

  let questionsMap: Record<string, any> = {};
  if (allQuestionIds.length > 0) {
    const rawQuestions = await db
      .select({
        id: questionsTable.id,
        prompt: questionsTable.prompt,
        kind: questionsTable.kind,
        points: questionsTable.points,
        category: questionsTable.category,
        competency: questionsTable.competency,
        difficulty: questionsTable.difficulty,
        choices: questionsTable.choices,
        expectedAnswer: questionsTable.expectedAnswer,
      })
      .from(questionsTable)
      .where(inArray(questionsTable.id, allQuestionIds));

    questionsMap = Object.fromEntries(rawQuestions.map((q) => [q.id, q]));
  }

  const campaignsWithQuestions = rawCampaigns.map((c) => ({
    id: c.id,
    title: c.title,
    reference: c.reference,
    companyName: c.companyName || "Société",
    companyAccent: c.companyAccent,
    status: c.status,
    durationMinutes: c.durationMinutes,
    passingScore: c.passingScore,
    shortlistSize: c.shortlistSize,
    questionIds: c.questionIds || [],
    questions: (c.questionIds || [])
      .map((qid) => questionsMap[qid])
      .filter(Boolean),
  }));

  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Composition des Épreuves" />
        <div className="content-area">
          <div className="page-heading">
            <div>
              <div className="section-kicker">INGÉNIERIE D'ÉVALUATION</div>
              <h1>Composition des Épreuves</h1>
              <p>Visualisez, testez et analysez la structure détaillée des examens MRS & CORLAY.</p>
            </div>
          </div>

          <CompositionViewer campaigns={campaignsWithQuestions} />
        </div>
      </main>
    </div>
  );
}