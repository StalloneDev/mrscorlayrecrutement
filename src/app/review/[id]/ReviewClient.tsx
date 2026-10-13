"use client";

import { useState, useTransition } from "react";
import { saveAttemptGradesAction, autoGradeAttemptAction } from "@/actions/grading";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  Award,
  User,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

interface QuestionReview {
  id: string;
  prompt: string;
  kind: string;
  points: number;
  choices: string[];
  expectedAnswer: string | null;
  competency: string;
  answer: string;
  score: number | null;
  comment: string;
  validated: boolean;
  isAutoGraded: boolean;
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
  proctoring?: {
    tabSwitches: number;
    copyAttempts: number;
  };
}

/** Types de questions corrigibles automatiquement */
const AUTO_GRADABLE_KINDS = ["single_choice", "multiple_choice", "true_false", "number"];

/** Vérifie si la réponse du candidat correspond à la réponse attendue */
function isAnswerCorrect(kind: string, candidateAnswer: string, expectedAnswer: string): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

  if (kind === "single_choice" || kind === "true_false") {
    return normalize(candidateAnswer) === normalize(expectedAnswer);
  }

  if (kind === "multiple_choice") {
    const candidate = candidateAnswer.split(";;").map(normalize).filter(Boolean).sort();
    const expected = expectedAnswer.split(/;;|,/).map(normalize).filter(Boolean).sort();
    return (
      candidate.length === expected.length &&
      candidate.every((c, i) => c === expected[i])
    );
  }

  if (kind === "number") {
    const a = parseFloat(candidateAnswer.replace(",", "."));
    const b = parseFloat(expectedAnswer.replace(",", "."));
    return !isNaN(a) && !isNaN(b) && Math.abs(a - b) < 0.001;
  }

  return false;
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
  proctoring,
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
  const [isAutoGradePending, startAutoGradeTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  const currentTotal = grades.reduce((sum, g) => sum + (g.score || 0), 0);
  const percentage = totalPoints > 0 ? Math.round((currentTotal / totalPoints) * 100) : 0;

  // Nombre de questions auto-corrigeables dans cette épreuve
  const autoGradableCount = questions.filter(
    (q) => AUTO_GRADABLE_KINDS.includes(q.kind) && q.expectedAnswer
  ).length;

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
        await saveAttemptGradesAction({ attemptId, grades, validate });
        if (validate) {
          setIsValidated(true);
          setMessage({
            text: "✓ Évaluation officiellement validée ! Le score global a été calculé et synchronisé.",
            type: "success",
          });
        } else {
          setMessage({ text: "✓ Brouillon de notation enregistré avec succès.", type: "success" });
        }
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : "Erreur inconnue";
        setMessage({ text: `Erreur: ${errorMsg}`, type: "error" });
      }
    });
  };

  /** Ré-applique la correction automatique depuis le serveur, puis met à jour les scores locaux */
  const handleAutoGrade = () => {
    setMessage(null);
    startAutoGradeTransition(async () => {
      try {
        const result = await autoGradeAttemptAction(attemptId);
        if ("error" in result) {
          setMessage({ text: result.error ?? "Erreur inconnue", type: "error" });
          return;
        }
        // Mise à jour optimiste des scores côté client
        setGrades((prev) =>
          prev.map((g) => {
            const q = questions.find((q) => q.id === g.questionId);
            if (!q || !AUTO_GRADABLE_KINDS.includes(q.kind) || !q.expectedAnswer) return g;
            if (q.kind === "multiple_choice") {
              const norm = (s: string) => s.trim().toLowerCase();
              const candidateChoices = q.answer.split(";;").map(norm).filter(Boolean);
              const expectedChoices = q.expectedAnswer.split(/;;|,/).map(norm).filter(Boolean);
              const correctCount = candidateChoices.filter((c) => expectedChoices.includes(c)).length;
              const incorrectCount = candidateChoices.filter((c) => !expectedChoices.includes(c)).length;
              const rawScore = correctCount - incorrectCount;
              const partial = Math.max(0, Math.round((rawScore / expectedChoices.length) * q.points * 10) / 10);
              return { ...g, score: partial };
            }
            const correct = isAnswerCorrect(q.kind, q.answer, q.expectedAnswer);
            return { ...g, score: correct ? q.points : 0 };
          })
        );
        setMessage({
          text: `✓ Correction automatique appliquée : ${result.autoGradedCount} question(s) corrigée(s)${
            result.manualRequired > 0
              ? `, ${result.manualRequired} question(s) à corriger manuellement`
              : " — épreuve entièrement auto-corrigée"
          }.`,
          type: "success",
        });
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : "Erreur inconnue";
        setMessage({ text: `Erreur: ${errorMsg}`, type: "error" });
      }
    });
  };

  // Libellé du type de question
  const kindLabel: Record<string, string> = {
    single_choice: "Choix unique",
    multiple_choice: "Choix multiples",
    true_false: "Vrai / Faux",
    number: "Valeur numérique",
    long_text: "Réponse longue",
    short_text: "Réponse courte",
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
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
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
              {autoGradableCount > 0 && (
                <span
                  style={{
                    background: "#f0f9ff",
                    color: "#0369a1",
                    border: "1px solid #bae6fd",
                    padding: "3px 9px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Zap size={12} /> {autoGradableCount} QCM auto-corrigé{autoGradableCount > 1 ? "s" : ""}
                </span>
              )}
              {proctoring && (
                <span
                  style={{
                    background: proctoring.tabSwitches > 0 || proctoring.copyAttempts > 0 ? "#fef2f2" : "#f0fdf4",
                    color: proctoring.tabSwitches > 0 || proctoring.copyAttempts > 0 ? "#b91c1c" : "#15803d",
                    border: `1px solid ${proctoring.tabSwitches > 0 || proctoring.copyAttempts > 0 ? "#fca5a5" : "#86efac"}`,
                    padding: "3px 9px",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {proctoring.tabSwitches > 0 || proctoring.copyAttempts > 0 ? (
                    <>
                      <ShieldAlert size={12} />
                      {proctoring.tabSwitches > 0 && `${proctoring.tabSwitches} sortie(s) d'écran`}
                      {proctoring.tabSwitches > 0 && proctoring.copyAttempts > 0 && " • "}
                      {proctoring.copyAttempts > 0 && `${proctoring.copyAttempts} tentative(s) de copie`}
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={12} /> Intégrité respectée (0 sortie)
                    </>
                  )}
                </span>
              )}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{candidateName}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{candidateEmail}</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              Soumis le{" "}
              {new Date(submittedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>

        {/* Jauge score */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background: `conic-gradient(#E06810 ${percentage}%, #f1f5f9 0%)`,
              display: "grid",
              placeItems: "center",
              position: "relative",
              margin: "0 auto 8px",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#ffffff",
                display: "grid",
                placeItems: "center",
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 900, color: "#E06810" }}>{percentage}%</span>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
            <Award size={12} style={{ display: "inline", marginRight: 4 }} />
            {currentTotal} / {totalPoints} pts
          </div>
        </div>
      </div>

      {/* Bandeau message feedback */}
      {message && (
        <div
          style={{
            padding: "13px 18px",
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background:
              message.type === "success"
                ? "#ecfdf5"
                : message.type === "error"
                ? "#fef2f2"
                : "#eff6ff",
            color:
              message.type === "success"
                ? "#059669"
                : message.type === "error"
                ? "#dc2626"
                : "#2563eb",
            border: `1px solid ${
              message.type === "success"
                ? "#a7f3d0"
                : message.type === "error"
                ? "#fecaca"
                : "#bfdbfe"
            }`,
          }}
        >
          {message.type === "success" ? <CheckCircle2 size={16} /> : <Zap size={16} />}
          {message.text}
        </div>
      )}

      {/* Bouton correction automatique */}
      {autoGradableCount > 0 && (
        <div
          style={{
            background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
            border: "1px solid #bae6fd",
            borderRadius: 12,
            padding: "16px 22px",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0c4a6e", marginBottom: 3 }}>
              <Zap size={14} style={{ display: "inline", marginRight: 6 }} />
              Correction automatique disponible
            </div>
            <div style={{ fontSize: 12, color: "#0369a1" }}>
              {autoGradableCount} question(s) QCM peuvent être corrigées automatiquement en comparant les réponses attendues.
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoGrade}
            disabled={isAutoGradePending || isPending}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: isAutoGradePending
                ? "#7dd3fc"
                : "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 700,
              cursor: isAutoGradePending ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(2,132,199,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            <Zap size={15} />
            {isAutoGradePending ? "Correction en cours..." : "Réappliquer la correction automatique"}
          </button>
        </div>
      )}

      {/* Liste des questions & copies à évaluer */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {questions.map((q, idx) => {
          const currentGrade = grades.find((g) => g.questionId === q.id);
          const isAutoGradable = AUTO_GRADABLE_KINDS.includes(q.kind) && !!q.expectedAnswer;
          const hasAnswer = q.answer && q.answer.trim().length > 0;

          // Calculer si la réponse est correcte pour le badge visuel
          const isCorrect =
            isAutoGradable && hasAnswer
              ? isAnswerCorrect(q.kind, q.answer, q.expectedAnswer!)
              : null;

          return (
            <div
              key={q.id}
              style={{
                background: "#ffffff",
                borderRadius: 12,
                border: `1.5px solid ${
                  isAutoGradable && isCorrect === true
                    ? "#a7f3d0"
                    : isAutoGradable && isCorrect === false
                    ? "#fecaca"
                    : "#e2e8f0"
                }`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                overflow: "hidden",
              }}
            >
              {/* En-tête de la question */}
              <div
                style={{
                  background:
                    isAutoGradable && isCorrect === true
                      ? "linear-gradient(90deg, #f0fdf4 0%, #dcfce7 100%)"
                      : isAutoGradable && isCorrect === false
                      ? "linear-gradient(90deg, #fff5f5 0%, #fee2e2 100%)"
                      : "#f8fafc",
                  padding: "14px 22px",
                  borderBottom: "1px solid #eef2f6",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
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

                  {/* Badge type de question */}
                  <span
                    style={{
                      background: isAutoGradable ? "#eff6ff" : "#f8fafc",
                      color: isAutoGradable ? "#2563eb" : "#64748b",
                      border: `1px solid ${isAutoGradable ? "#bfdbfe" : "#e2e8f0"}`,
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {kindLabel[q.kind] || q.kind}
                  </span>

                  {/* Badge résultat auto-correction */}
                  {isAutoGradable && isCorrect === true && (
                    <span
                      style={{
                        background: "#ecfdf5",
                        color: "#059669",
                        border: "1px solid #6ee7b7",
                        padding: "3px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <CheckCircle size={12} /> Correct ✓
                    </span>
                  )}
                  {isAutoGradable && isCorrect === false && (
                    <span
                      style={{
                        background: "#fef2f2",
                        color: "#dc2626",
                        border: "1px solid #fca5a5",
                        padding: "3px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <XCircle size={12} /> Incorrect ✗
                    </span>
                  )}
                  {isAutoGradable && !hasAnswer && (
                    <span
                      style={{
                        background: "#fefce8",
                        color: "#854d0e",
                        border: "1px solid #fde68a",
                        padding: "3px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      Sans réponse
                    </span>
                  )}

                  {q.competency && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                      • {q.competency}
                    </span>
                  )}
                </div>

                <span style={{ fontSize: 12, fontWeight: 700, color: "#475569", whiteSpace: "nowrap" }}>
                  Barème max : {q.points} point{q.points > 1 ? "s" : ""}
                </span>
              </div>

              {/* Contenu et copie */}
              <div style={{ padding: "22px 24px" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 16px", lineHeight: 1.5 }}>
                  {q.prompt}
                </h3>

                {/* Réponse attendue */}
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
                      💡{" "}
                      {isAutoGradable
                        ? "Réponse correcte (auto-correction) :"
                        : "Critères / Réponse attendue (confidentiel RH) :"}
                    </strong>
                    <div>{q.expectedAnswer}</div>
                  </div>
                )}

                {/* Copie soumise par le candidat */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: `1.5px solid ${
                      isAutoGradable && isCorrect === true
                        ? "#86efac"
                        : isAutoGradable && isCorrect === false
                        ? "#fca5a5"
                        : "#cbd5e1"
                    }`,
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
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        fontSize: 14,
                        color: "#0f172a",
                        lineHeight: 1.6,
                        fontWeight: 500,
                      }}
                    >
                      {/* Choix multiples → liste à puces */}
                      {q.kind === "multiple_choice"
                        ? q.answer.split(";;").map((choice, i) => (
                            <div key={i} style={{ marginBottom: 2 }}>
                              ▪ {choice.trim()}
                            </div>
                          ))
                        : q.answer}
                    </div>
                  ) : (
                    <em style={{ color: "#94a3b8", fontSize: 13 }}>Aucune réponse renseignée par le candidat.</em>
                  )}
                </div>

                {/* Formulaire de notation */}
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
                      {isAutoGradable ? "Note auto (modifiable)" : "Note attribuée"} (/{q.points}) *
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
                        border: `1.5px solid ${
                          isAutoGradable && isCorrect === true
                            ? "#6ee7b7"
                            : isAutoGradable && isCorrect === false
                            ? "#fca5a5"
                            : "#cbd5e1"
                        }`,
                        fontSize: 15,
                        fontWeight: 800,
                        color:
                          isAutoGradable && isCorrect === true
                            ? "#059669"
                            : isAutoGradable && isCorrect === false
                            ? "#dc2626"
                            : "#E06810",
                        outline: "none",
                        boxSizing: "border-box",
                        background:
                          isAutoGradable && isCorrect === true
                            ? "#f0fdf4"
                            : isAutoGradable && isCorrect === false
                            ? "#fff5f5"
                            : "#ffffff",
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
                      placeholder={
                        isAutoGradable
                          ? "Commentaire auto-généré, modifiable..."
                          : "Commentaire ou observation sur la réponse..."
                      }
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
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 13, color: "#64748b" }}>
          Total provisoire :{" "}
          <strong style={{ color: "#E06810", fontSize: 15 }}>
            {currentTotal} / {totalPoints} ({percentage}%)
          </strong>
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