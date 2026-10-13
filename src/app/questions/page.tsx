import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { CompanyFilter } from "@/components/CompanyFilter";
import { QuestionRowActions } from "@/components/QuestionRowActions";
import { getCompanies } from "@/actions/campaigns";
import { getQuestions, createQuestionAction } from "@/actions/questions";
import { BookOpen, Plus, Tag, Layers, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const { companyId } = await searchParams;
  const companies = await getCompanies();
  const questions = await getQuestions(companyId);

  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Banque de questions" />
        <div className="content-area">
          <div className="page-heading">
            <div>
              <div className="section-kicker">CONTENU D'ÉVALUATION</div>
              <h1>Banque de questions</h1>
              <p>Constituez un référentiel réutilisable pour vos campagnes MRS et CORLAY.</p>
            </div>

            <CompanyFilter
              companies={companies}
              defaultValue={companyId || ""}
              placeholder="Toutes les questions partagées"
            />
          </div>

          {/* Formulaire d'ajout de question Stylisé */}
          <div className="form-card">
            <div className="form-card-header">
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#243445" }}>
                  Ajouter une question au référentiel
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#748593" }}>
                  Enrichissez la banque de questions partagée pour les épreuves de sélection MRS & CORLAY.
                </p>
              </div>
              <span className="badge tone-blue">Banque RH</span>
            </div>

            <form
              action={async (formData: FormData) => {
                "use server";
                await createQuestionAction(formData);
              }}
            >
              <div className="form-card-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  Énoncé complet de la question *
                  <textarea name="prompt" required rows={3} placeholder="Rédigez l'intitulé ou la consigne précise..." />
                  <span className="field-hint">Visible par le candidat lors du test</span>
                </label>

                <label className="field">
                  Format de réponse *
                  <select name="kind">
                    <option value="single_choice">Choix unique (QCM)</option>
                    <option value="multiple_choice">Choix multiple (QCM)</option>
                    <option value="long_text">Réponse développée / Rédaction</option>
                    <option value="short_text">Réponse courte</option>
                    <option value="true_false">Vrai / Faux</option>
                  </select>
                </label>

                <label className="field">
                  Catégorie métier *
                  <input name="category" defaultValue="Général" required placeholder="Ex. Comptabilité, Logistique..." />
                </label>

                <label className="field">
                  Compétence évaluée
                  <input name="competency" placeholder="Ex. Rigueur, Gestion des stocks..." />
                  <span className="field-hint">Facultatif</span>
                </label>

                <label className="field">
                  Niveau de difficulté *
                  <select name="difficulty">
                    <option value="easy">Facile</option>
                    <option value="medium">Intermédiaire</option>
                    <option value="hard">Avancée</option>
                  </select>
                </label>

                <label className="field">
                  Barème (Points accordés) *
                  <input type="number" name="points" defaultValue={5} min={1} max={50} required />
                  <span className="field-hint">Poids dans le total</span>
                </label>

                <label className="field">
                  Société propriétaire
                  <select name="companyId" defaultValue="">
                    <option value="">Partagée (MRS & CORLAY)</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  Options de choix (pour QCM uniquement)
                  <textarea name="choices" rows={3} placeholder={"Option A\nOption B\nOption C"} />
                  <span className="field-hint">Saisir un choix par ligne</span>
                </label>

                <label className="field" style={{ gridColumn: "1 / -1" }}>
                  Repère de correction / Réponse attendue (confidentiel RH)
                  <textarea name="expectedAnswer" rows={2} placeholder="Indiquez les critères ou la solution attendue pour les évaluateurs..." />
                  <span className="field-hint">Visible uniquement par l'équipe RH lors de la notation</span>
                </label>
              </div>

              <div className="form-card-footer">
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Enregistrer la question
                </button>
              </div>
            </form>
          </div>

          {/* Liste des questions */}
          <div style={{ display: "grid", gap: 14 }}>
            {questions.length === 0 ? (
              <div className="panel" style={{ textAlign: "center", padding: "40px 0", color: "#87939d" }}>
                <BookOpen size={32} style={{ margin: "0 auto 12px", color: "#1d725e" }} />
                <h3>Aucune question enregistrée</h3>
                <p>Enregistrez vos premières questions pour composer vos épreuves.</p>
              </div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span className="badge tone-neutral">{q.category}</span>
                      {q.competency && <span className="badge tone-blue">{q.competency}</span>}
                      <span className="badge tone-amber">
                        {q.difficulty === "easy" ? "Facile" : q.difficulty === "hard" ? "Avancé" : "Moyen"}
                      </span>
                      {q.companyName && <span className="badge tone-green">{q.companyName}</span>}
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "#2c3d4d", margin: "0 0 10px" }}>{q.prompt}</h3>

                    {q.choices && q.choices.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                        {q.choices.map((choice, i) => (
                          <span key={i} style={{ padding: "4px 10px", borderRadius: 6, background: "#f0f4ef", fontSize: 12, color: "#425565" }}>
                            • {choice}
                          </span>
                        ))}
                      </div>
                    )}

                    {q.expectedAnswer && (
                      <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 6, background: "#f7f9f7", borderLeft: "3px solid #1d725e", fontSize: 12, color: "#32544a" }}>
                        <strong>Repère RH :</strong> {q.expectedAnswer}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <strong style={{ fontSize: 18, color: "#1d725e", fontWeight: 800 }}>
                      {q.points} pt{q.points > 1 ? "s" : ""}
                    </strong>
                    <small style={{ fontSize: 11, color: "#8d979c" }}>{q.kind}</small>
                    <QuestionRowActions question={q} companies={companies} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
