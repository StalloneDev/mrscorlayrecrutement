"use client";

import { useState, useTransition } from "react";
import { updateQuestionAction, deleteQuestionAction } from "@/actions/questions";
import { Edit2, Trash2, X, Check, AlertCircle } from "lucide-react";

interface Company {
  id: string;
  name: string;
}

interface Question {
  id: string;
  companyId: string | null;
  companyName: string | null;
  prompt: string;
  kind: string;
  points: number;
  required: boolean;
  category: string;
  competency: string;
  difficulty: string;
  choices: string[] | null;
  expectedAnswer: string | null;
  maxCharacters: number | null;
}

export function QuestionRowActions({
  question,
  companies,
}: {
  question: Question;
  companies: Company[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [prompt, setPrompt] = useState(question.prompt);
  const [kind, setKind] = useState(question.kind);
  const [points, setPoints] = useState(question.points);
  const [required, setRequired] = useState(question.required);
  const [category, setCategory] = useState(question.category || "Général");
  const [competency, setCompetency] = useState(question.competency || "");
  const [difficulty, setDifficulty] = useState(question.difficulty || "medium");
  const [companyId, setCompanyId] = useState(question.companyId || "");
  const [choicesText, setChoicesText] = useState((question.choices || []).join("\n"));
  const [expectedAnswer, setExpectedAnswer] = useState(question.expectedAnswer || "");

  const handleDelete = async () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette question ?\n"${question.prompt.slice(0, 60)}..."`)) {
      setIsDeleting(true);
      try {
        const res = await deleteQuestionAction(question.id);
        if ("error" in res && res.error) {
          alert("Erreur : " + res.error);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur lors de la suppression.";
        alert(msg);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("companyId", companyId);
    formData.append("prompt", prompt);
    formData.append("kind", kind);
    formData.append("points", String(points));
    if (required) formData.append("required", "true");
    formData.append("category", category);
    formData.append("competency", competency);
    formData.append("difficulty", difficulty);
    formData.append("choices", choicesText);
    formData.append("expectedAnswer", expectedAnswer);

    startTransition(async () => {
      try {
        await updateQuestionAction(question.id, formData);
        setIsEditing(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur de modification.";
        setError(msg);
      }
    });
  };

  return (
    <>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          title="Modifier la question"
          style={{
            background: "#f1f5f9",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            padding: "5px 8px",
            color: "#475569",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <Edit2 size={13} />
        </button>

        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Supprimer la question"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 6,
            padding: "5px 8px",
            color: "#dc2626",
            cursor: isDeleting ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <Trash2 size={13} />
        </button>
      </div>

      {isEditing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditing(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              maxWidth: 680,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 26,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
                    Modifier la question
                  </h3>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Ajustez l'énoncé, le barème ou les critères de notation
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "#fef2f2",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Énoncé de la question *
                </label>
                <textarea
                  required
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 14,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Type d'évaluation
                  </label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="single_choice">Choix unique (QCM)</option>
                    <option value="multiple_choice">Choix multiples</option>
                    <option value="true_false">Vrai / Faux</option>
                    <option value="number">Valeur numérique</option>
                    <option value="long_text">Texte long / Rédaction</option>
                    <option value="short_text">Texte court</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Barème (points) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Compétence testée
                  </label>
                  <input
                    type="text"
                    value={competency}
                    onChange={(e) => setCompetency(e.target.value)}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Difficulté
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{
                      width: "100%",
                      height: 38,
                      padding: "0 10px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="easy">Facile</option>
                    <option value="medium">Moyen</option>
                    <option value="hard">Avancé</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Entreprise assignée
                </label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Banque partagée (MRS & CORLAY)</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {(kind === "single_choice" || kind === "multiple_choice") && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Options de choix (une option par ligne)
                  </label>
                  <textarea
                    rows={4}
                    value={choicesText}
                    onChange={(e) => setChoicesText(e.target.value)}
                    placeholder={"Option A\nOption B\nOption C"}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontSize: 13,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Repère RH / Réponse attendue (utilisé pour la correction automatique des QCM)
                </label>
                <textarea
                  rows={2}
                  value={expectedAnswer}
                  onChange={(e) => setExpectedAnswer(e.target.value)}
                  placeholder="Texte exact du choix pour les QCM, ou critères d'évaluation RH pour le texte..."
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: 13 }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-primary"
                  style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Check size={14} />
                  {isPending ? "Enregistrement..." : "Mettre à jour la question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
