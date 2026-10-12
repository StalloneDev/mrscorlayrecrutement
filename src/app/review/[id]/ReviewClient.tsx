"use client";

import { useState, useTransition } from "react";
import { saveAttemptGradesAction } from "@/actions/grading";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Save, Award, User, Clock, AlertCircle } from "lucide-react";

interface QuestionReview {
  id: string;
  prompt: string;
  kind: string;
  points: number;
  expectedAnswer: string | null;
  competency: string;
  answer: string;
  score: number | null;
  comment: string;
  validated: boolean;
}

interface ReviewClientProps {
  attemptId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  campaignId: string;
  campaignTitle: string;
  submissionType: string | null;
  submittedAt: string;
  initialValidated: boolean;
  questions: QuestionReview[];
}

export function ReviewClient({
  attemptId,
  candidateName,
  candidateEmail,
  campaignId,
  campaignTitle,
  submissionType,
  submittedAt,
  initialValidated,
  questions,
}: ReviewClientProps) {
  const [grades, setGrades] = useState(
    questions.map((q) => ({
      questionId: q.id,
      score: q.score ?? 0,
      comment: q.comment || "",
    }))
  );
  const [isValidated, setIsValidated] = useState(initialValidated);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const currentTotal = grades.reduce((sum, g) => sum + (g.score || 0), 0);
  const percentage = totalPoints > 0 ? Math.round((currentTotal / totalPoints) * 100) : 0;

  const handleScoreChange = (questionId: string, val: number) => {
    setGrades((prev) =>
      prev.map((g) => (g.questionId === questionId ? { ...g, score: val } : g))
    );
  };

  const handleCommentChange = (questionId: string, val: string) => {
    setGrades((prev) =>
      prev.map((g) => (g.questionId === questionId ? { ...g, comment: val } : g))
    );
  };

  const handleSave = (validate: boolean) => {
    setMessage(null);
    startTransition(async () => {
      try {
        await saveAttemptGradesAction({
          attemptId,
          grades,
          validate,
        });
        if (validate) {
          setIsValidated(true);
          setMessage("✓ Évaluation officiellement validée ! Le score global a été calculé et synchronisé.");
        } else {
          setMessage("✓ Brouillon de notation enregistré avec succès.");
        }
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : "Erreur inconnue";
        setMessage(`Erreur: ${errorMsg}`);
      }
    });
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", padding: "28px 24px 80px", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Bouton retour */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href={`/campaigns/${campaignId}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "#ffffff",
            border: "1px solid #dce3e4",
            borderRadius: 8,
            color: "#334155",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <ArrowLeft size={15} />
          <span>Retour à la campagne</span>
        </Link>
      </div>

      {/* Carte d'en-tête du candidat & score global */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
          padding: "26px 30px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #E06810 0%, #B44E09 100%)",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontSize: 20,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            <User size={24} />
          </div>

          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <span
                style={{
                  background: "#fff7ed",
                  color: "#c2410c",
                  border: "1px solid #fed7aa",
                  padding: "3px 9px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {campaignTitle}
              </span>
              <span
                style={{
                  background: "#f1f5f9",
                  color: "#475569",
                  padding: "3px 9px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Clock size={12} />
                {submissionType === "automatic" ? "Fin du temps" : "Soumission volontaire"}
              </span>
              {isValidated && (
                <span
                  style={{
                    background: "#ecfdf5",
                    color: "#059669",
                    border: "1px solid #a7f3d0",
                    padding: "3px 9px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <CheckCircle2 size={12} /> Validé RH
                </span>
              )}
            </div>

            <h1 style={{ margin: "2px 0 4px", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
              {candidateName}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              {candidateEmail} • Soumis le {submittedAt ? new Date(submittedAt).toLocaleString("fr-FR") : "N/A"}
            </p>
          </div>
        </div>

        {/* Bloc score total */}
        <div
          style={{
            background: "#fafbfa",
            border: "1.5px solid #e5eae7",
            borderRadius: 12,
            padding: "14px 22px",
            textAlign: "right",
            minWidth: 160,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
            <Award size={14} color="#E06810" />
            <span>Note Globale</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#E06810", marginTop: 2 }}>
            {currentTotal} <span style={{ fontSize: 18, color: "#94a3b8", fontWeight: 600 }}>/ {totalPoints}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: percentage >= 60 ? "#059669" : "#dc2626" }}>
            {percentage}% {percentage >= 60 ? "(Admissible)" : "(Non admissible)"}
          </div>
        </div>
      </div>

      {/* Notification de statut */}
      {message && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: 10,
            marginBottom: 20,
            background: message.startsWith("✓") ? "#ecfdf5" : "#fef2f2",
            color: message.startsWith("✓") ? "#065f46" : "#991b1b",
            border: `1px solid ${message.startsWith("✓") ? "#a7f3d0" : "#fecaca"}`,
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {message.startsWith("✓") ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message}</span>
        </div>
      )}

      {/* Liste des questions & copies à évaluer */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {questions.map((q, idx) => {
          const currentGrade = grades.find((g) => g.questionId === q.id);

          return (
            <div
              key={q.id}
              style={{
                background: "#ffffff",
                borderRadius: 12,
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                overflow: "hidden",
              }}
            >
              {/* En-tête de la question */}
              <div
                style={{
                  background: "#f8fafc",
                  padding: "14px 22px",
                  borderBottom: "1px solid #eef2f6",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      background: "#26394b",
                      color: "#ffffff",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Question {idx + 1}
                  </span>
                  {q.competency && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                      • {q.competency}
                    </span>
                  )}
                </div>

                <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                  Barème max : {q.points} point{q.points > 1 ? "s" : ""}
                </span>
              </div>

              {/* Contenu et copie */}
              <div style={{ padding: "22px 24px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 16px", lineHeight: 1.5 }}>
                  {q.prompt}
                </h3>

                {/* Repère / Réponse attendue RH */}
                {q.expectedAnswer && (
                  <div
                    style={{
                      background: "#fffaf0",
                      border: "1px dashed #fed7aa",
                      borderRadius: 8,
                      padding: "12px 16px",
                      marginBottom: 16,
                      fontSize: 12,
                      color: "#9a3412",
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ display: "block", marginBottom: 2 }}>
                      💡 Critères / Réponse attendue (confidentiel RH) :
                    </strong>
                    <div>{q.expectedAnswer}</div>
                  </div>
                )}

                {/* Copie soumise par le candidat */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: 10,
                    padding: "16px 18px",
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 800,
                      color: "#64748b",
                      marginBottom: 8,
                    }}
                  >
                    RÉPONSE DU CANDIDAT :
                  </div>
                  {q.answer ? (
                    <div style={{ whiteSpace: "pre-wrap", fontSize: 14, color: "#0f172a", lineHeight: 1.6, fontWeight: 500 }}>
                      {q.answer}
                    </div>
                  ) : (
                    <em style={{ color: "#94a3b8", fontSize: 13 }}>Aucune réponse renseignée par le candidat.</em>
                  )}
                </div>

                {/* Formulaire de notation de l'évaluateur */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "180px 1fr",
                    gap: 16,
                    alignItems: "flex-end",
                    background: "#fdfefe",
                    padding: "14px 16px",
                    borderRadius: 8,
                    border: "1px solid #eef2f6",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#334155",
                        marginBottom: 6,
                      }}
                    >
                      Note attribuée (/ {q.points}) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={q.points}
                      step={0.5}
                      value={currentGrade?.score ?? 0}
                      onChange={(e) => handleScoreChange(q.id, Number(e.target.value))}
                      disabled={isPending}
                      style={{
                        width: "100%",
                        height: 42,
                        padding: "0 12px",
                        borderRadius: 8,
                        border: "1.5px solid #cbd5e1",
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#E06810",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#334155",
                        marginBottom: 6,
                      }}
                    >
                      Commentaire / Justification RH
                    </label>
                    <input
                      type="text"
                      placeholder="Commentaire ou observation sur la réponse..."
                      value={currentGrade?.comment ?? ""}
                      onChange={(e) => handleCommentChange(q.id, e.target.value)}
                      disabled={isPending}
                      style={{
                        width: "100%",
                        height: 42,
                        padding: "0 14px",
                        borderRadius: 8,
                        border: "1.5px solid #cbd5e1",
                        fontSize: 13,
                        color: "#0f172a",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barre d'action inférieure sticky */}
      <div
        style={{
          position: "sticky",
          bottom: 16,
          marginTop: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          background: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(8px)",
          border: "1px solid #dce3e4",
          borderRadius: 12,
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontSize: 13, color: "#64748b" }}>
          Total provisoire : <strong style={{ color: "#E06810", fontSize: 15 }}>{currentTotal} / {totalPoints} ({percentage}%)</strong>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isPending}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "1.5px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: 13,
              fontWeight: 600,
              cursor: isPending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Save size={15} />
            <span>Sauvegarder le brouillon</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isPending}
            style={{
              padding: "10px 22px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #E06810 0%, #B44E09 100%)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 800,
              cursor: isPending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(224, 104, 16, 0.35)",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{isPending ? "Validation..." : "Valider la correction définitivement"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}