"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  saveCandidateAnswerAction,
  submitAssessmentAction,
  recordProctoringEventAction,
} from "@/actions/assessments";
import { Brand } from "@/components/Brand";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

interface Question {
  id: string;
  prompt: string;
  kind: string;
  points: number;
  required: boolean;
  category: string;
  competency: string;
  choices: string[] | null;
  maxCharacters: number | null;
}

interface AssessmentClientProps {
  attemptId: string;
  initialSecondsRemaining: number;
  initialAnswers: Record<string, string>;
  questions: Question[];
  candidateName: string;
  companyName: string;
  campaignTitle: string;
  submittedAt: string | null;
}

export function AssessmentClient({
  attemptId,
  initialSecondsRemaining,
  initialAnswers,
  questions,
  candidateName,
  companyName,
  campaignTitle,
  submittedAt: initialSubmittedAt,
}: AssessmentClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [secondsRemaining, setSecondsRemaining] = useState(initialSecondsRemaining);
  const [isSubmitted, setIsSubmitted] = useState(Boolean(initialSubmittedAt));
  const [submissionReason, setSubmissionReason] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [isPending, startTransition] = useTransition();

  // ── ÉTATS ANTI-TRICHE (PROCTORING) ──────────────────────────────────────────
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const isPageHiddenRef = useRef(false);
  const warningCountRef = useRef(0);

  const currentQ = questions[currentIndex];

  const showCopyAlert = (msg = "⚠️ La copie ou capture du contenu est formellement interdite.") => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 3500);
  };

  // ── GESTIONNAIRES ANTI-COPIE (OPTION 1) ─────────────────────────────────────
  useEffect(() => {
    if (isSubmitted) return;

    const handleCopyCut = (e: ClipboardEvent) => {
      e.preventDefault();
      showCopyAlert("⚠️ La copie du contenu des questions est interdite.");
      recordProctoringEventAction(attemptId, "COPY_ATTEMPT");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showCopyAlert("⚠️ Le clic droit est désactivé durant l'épreuve.");
      recordProctoringEventAction(attemptId, "COPY_ATTEMPT");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquer DevTools: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key))
      ) {
        e.preventDefault();
        showCopyAlert("⚠️ L'accès aux outils de développement est interdit.");
        recordProctoringEventAction(attemptId, "DEVTOOLS_ATTEMPT");
        return;
      }

      // Bloquer Impression / Export PDF : Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        showCopyAlert("⚠️ L'impression ou la capture de l'épreuve est interdite.");
        return;
      }

      // Bloquer Afficher source : Ctrl+U
      if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        return;
      }

      // Bloquer Ctrl+C / Cmd+C sur les questions
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C" || e.key === "x" || e.key === "X")) {
        const target = e.target as HTMLElement;
        const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
        const selection = window.getSelection()?.toString() || "";
        if (selection.length > 0 && !isInput) {
          e.preventDefault();
          showCopyAlert("⚠️ La copie du texte des questions est interdite.");
          recordProctoringEventAction(attemptId, "COPY_ATTEMPT");
        }
      }
    };

    document.addEventListener("copy", handleCopyCut);
    document.addEventListener("cut", handleCopyCut);
    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("copy", handleCopyCut);
      document.removeEventListener("cut", handleCopyCut);
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSubmitted, attemptId]);

  // ── DÉTECTION SORTIE D'ONGLET / ÉCRAN (OPTION 2) ───────────────────────────
  useEffect(() => {
    if (isSubmitted) return;

    const handleWindowLeave = () => {
      if (isSubmitted || isPageHiddenRef.current) return;
      isPageHiddenRef.current = true;

      const nextCount = warningCountRef.current + 1;
      warningCountRef.current = nextCount;
      setWarningCount(nextCount);

      recordProctoringEventAction(attemptId, "TAB_SWITCH", {
        warningNumber: nextCount,
        timestamp: new Date().toISOString(),
      });
    };

    const handleWindowReturn = () => {
      if (isSubmitted || !isPageHiddenRef.current) return;
      isPageHiddenRef.current = false;

      if (warningCountRef.current >= 4) {
        // Déclencher soumission automatique forcée pour violation proctoring
        setSubmissionReason("proctoring_violation");
        handleAutoSubmit("proctoring_violation");
      } else {
        setShowWarningModal(true);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleWindowLeave();
      } else {
        handleWindowReturn();
      }
    };

    window.addEventListener("blur", handleWindowLeave);
    window.addEventListener("focus", handleWindowReturn);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleWindowLeave);
      window.removeEventListener("focus", handleWindowReturn);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isSubmitted, attemptId]);

  // ── COMPTE À REBOURS ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSubmitted || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, secondsRemaining]);

  const handleAutoSubmit = async (reason?: string) => {
    try {
      if (reason === "proctoring_violation") {
        setSubmissionReason("proctoring_violation");
      }
      await submitAssessmentAction(attemptId, reason);
      setIsSubmitted(true);
    } catch (e) {
      console.error("Erreur clôture auto:", e);
      setIsSubmitted(true);
    }
  };

  const handleAnswerChange = (val: string) => {
    if (!currentQ || isSubmitted) return;
    const newAnswers = { ...answers, [currentQ.id]: val };
    setAnswers(newAnswers);
    setSaveStatus("saving");

    startTransition(async () => {
      try {
        await saveCandidateAnswerAction(attemptId, currentQ.id, val);
        setSaveStatus("saved");
      } catch (e) {
        console.error("Save error:", e);
        setSaveStatus("error");
      }
    });
  };

  const handleVoluntarySubmit = () => {
    if (
      confirm(
        "Êtes-vous certain(e) de vouloir soumettre définitivement votre épreuve ?\n\nVos réponses seront immédiatement transmises au comité de recrutement de MRS & CORLAY."
      )
    ) {
      startTransition(async () => {
        await submitAssessmentAction(attemptId);
        setIsSubmitted(true);
      });
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isLowTime = secondsRemaining < 300 && secondsRemaining > 0;

  // ── ÉCRAN DE FIN DE COMPOSITION ─────────────────────────────────────────────
  if (isSubmitted) {
    const isViolation = submissionReason === "proctoring_violation";

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1f2d3d 0%, #26394b 50%, #1a2530 100%)",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: 540,
            width: "100%",
            background: "#ffffff",
            borderRadius: 16,
            boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
            padding: "48px 36px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <Brand size="lg" />
          </div>

          <div
            style={{
              margin: "0 auto 16px",
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: isViolation ? "#fef2f2" : "#ecfdf5",
              color: isViolation ? "#dc2626" : "#059669",
              border: `2px solid ${isViolation ? "#fecaca" : "#a7f3d0"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: "bold",
            }}
          >
            {isViolation ? "⚠️" : "✓"}
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: "0 0 10px" }}>
            {isViolation ? "Épreuve clôturée pour violation de sécurité" : "Épreuve terminée & transmise"}
          </h2>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" }}>
            {isViolation ? (
              <>
                Votre session pour l&apos;épreuve <strong>{campaignTitle}</strong> a été automatiquement
                interrompue suite à des <strong>sorties d&apos;écran répétées (4 infractions)</strong>. Les réponses
                déjà enregistrées ont été transmises au comité de recrutement.
              </>
            ) : (
              <>
                Merci <strong>{candidateName}</strong>. L&apos;ensemble de vos réponses pour l&apos;épreuve{" "}
                <strong>{campaignTitle}</strong> a bien été enregistré avec succès.
              </>
            )}
          </p>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "16px",
              fontSize: 13,
              color: "#475569",
              lineHeight: 1.5,
              marginBottom: 10,
            }}
          >
            L&apos;équipe RH examinera votre copie. Vous serez tenu(e) informé(e) de la suite donnée à votre
            candidature.
          </div>
        </div>
      </div>
    );
  }

  // Vérification si la question est de type texte
  const isTextKind =
    currentQ &&
    (currentQ.kind === "text" ||
      currentQ.kind === "long_text" ||
      currentQ.kind === "short_text" ||
      (!currentQ.choices || currentQ.choices.length === 0));

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f4f6f8",
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* ── TOAST ANTI-COPIE ──────────────────────────────────────────────── */}
      {copyToast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#991b1b",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            fontSize: 13,
            fontWeight: 700,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertTriangle size={18} />
          <span>{copyToast}</span>
        </div>
      )}

      {/* ── MODALE D'ALERTE CHANGEMENT D'ONGLET (OPTION 2) ────────────────── */}
      {showWarningModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              maxWidth: 520,
              width: "100%",
              padding: "32px 28px",
              textAlign: "center",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
              border: "2px solid #ef4444",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#fef2f2",
                color: "#dc2626",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 16px",
                border: "2px solid #fecaca",
              }}
            >
              <AlertTriangle size={30} />
            </div>

            <h3 style={{ fontSize: 19, fontWeight: 800, color: "#991b1b", margin: "0 0 10px" }}>
              Alerte Sécurité — Sortie d&apos;écran détectée !
            </h3>

            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: "0 0 16px" }}>
              Vous venez de quitter l&apos;onglet ou la fenêtre de composition de l&apos;épreuve. Cette action est{" "}
              <strong>immédiatement consignée</strong> dans le journal d&apos;audit de recrutement MRS &amp; CORLAY.
            </p>

            <div
              style={{
                background: warningCount >= 3 ? "#fef2f2" : "#fff7ed",
                border: `1.5px solid ${warningCount >= 3 ? "#fca5a5" : "#fed7aa"}`,
                borderRadius: 10,
                padding: "14px 18px",
                marginBottom: 20,
                fontSize: 13,
                fontWeight: 700,
                color: warningCount >= 3 ? "#b91c1c" : "#c2410c",
                lineHeight: 1.5,
              }}
            >
              {warningCount < 3 ? (
                <span>
                  Avertissement <strong>{warningCount}</strong> sur 3 autorisé(s). À la 4ème sortie, l&apos;épreuve
                  sera <strong>automatiquement transmise et invalidée</strong>.
                </span>
              ) : (
                <span>
                  ⚠️ <strong>DERNIER AVERTISSEMENT (3/3) !</strong> Toute nouvelle sortie d&apos;écran entraînera la
                  clôture et l&apos;invalidation immédiate de votre copie.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowWarningModal(false)}
              style={{
                background: "linear-gradient(135deg, #E06810 0%, #B44E09 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                padding: "14px 24px",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                width: "100%",
                boxShadow: "0 4px 14px rgba(224, 104, 16, 0.4)",
              }}
            >
              Je confirme reprendre mon épreuve
            </button>
          </div>
        </div>
      )}

      {/* Barre supérieure fixe & statut */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "12px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 30,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Brand size="sm" />
          <div style={{ height: 24, width: 1, background: "#e2e8f0" }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{campaignTitle}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{companyName}</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Badge surveillance anti-triche */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: warningCount > 0 ? "#fef2f2" : "#f0fdf4",
              color: warningCount > 0 ? "#dc2626" : "#166534",
              border: `1px solid ${warningCount > 0 ? "#fecaca" : "#bbf7d0"}`,
              padding: "5px 12px",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
            }}
            title="Protection anti-triche active : copie interdite et sorties d'écran surveillées"
          >
            {warningCount > 0 ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
            <span>
              {warningCount === 0 ? "Protection anti-triche active" : `Sorties d'écran : ${warningCount}/3`}
            </span>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{candidateName}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Candidat(e) connecté(e)</div>
          </div>

          {/* Chronomètre avec alerte temps faible */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: isLowTime ? "#fef2f2" : "#fff7ed",
              color: isLowTime ? "#b91c1c" : "#c2410c",
              border: `1.5px solid ${isLowTime ? "#fca5a5" : "#fdba74"}`,
              padding: "6px 14px",
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 15,
              fontFamily: "monospace",
              letterSpacing: "0.05em",
            }}
          >
            <Clock size={16} />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main
        style={{
          maxWidth: 920,
          width: "100%",
          margin: "24px auto",
          padding: "0 20px",
          flex: 1,
          boxSizing: "border-box",
        }}
      >
        {/* Barre de navigation des questions */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: "14px 20px",
            border: "1px solid #e2e8f0",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {questions.map((q, idx) => {
              const answered = Boolean(answers[q.id] && answers[q.id].trim().length > 0);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: isCurrent
                      ? "2px solid #E06810"
                      : answered
                      ? "1px solid #cbd5e1"
                      : "1px solid #e2e8f0",
                    background: isCurrent ? "#E06810" : answered ? "#f8fafc" : "#ffffff",
                    color: isCurrent ? "#ffffff" : answered ? "#0f172a" : "#64748b",
                    fontWeight: isCurrent || answered ? 800 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            {saveStatus === "saving" && (
              <span style={{ color: "#d97706" }}>Enregistrement en cours...</span>
            )}
            {saveStatus === "saved" && (
              <span style={{ color: "#059669", display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircle2 size={14} /> Réponses enregistrées
              </span>
            )}
            {saveStatus === "error" && (
              <span style={{ color: "#dc2626", display: "flex", alignItems: "center", gap: 4 }}>
                <AlertCircle size={14} /> Erreur de connexion
              </span>
            )}
          </div>
        </div>

        {/* Carte de la question courante */}
        {currentQ ? (
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              padding: "32px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
                paddingBottom: 14,
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    background: "#E06810",
                    color: "#ffffff",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Question {currentIndex + 1} / {questions.length}
                </span>
                <span
                  style={{
                    background: "#f1f5f9",
                    color: "#475569",
                    padding: "4px 10px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {currentQ.competency || currentQ.category}
                </span>
              </div>
              <span style={{ fontWeight: 700, color: "#64748b", fontSize: 13 }}>
                Valeur : {currentQ.points} point{currentQ.points > 1 ? "s" : ""}
              </span>
            </div>

            <div
              style={{
                fontSize: 15,
                lineHeight: 1.8,
                marginBottom: 28,
                fontWeight: 500,
                color: "#1e293b",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "20px 24px",
                letterSpacing: "0.01em",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {currentQ.prompt}
            </div>

            {/* Saisie de la réponse selon le type */}

            {/* 1. Zone de texte (long_text, short_text, text, ou sans choix QCM) */}
            {isTextKind && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: 8,
                  }}
                >
                  Votre réponse argumentée :
                </label>
                <textarea
                  style={{
                    minHeight: 180,
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 10,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontFamily: "inherit",
                    color: "#0f172a",
                    outline: "none",
                    boxSizing: "border-box",
                    background: "#ffffff",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                    userSelect: "text",
                    WebkitUserSelect: "text",
                  }}
                  placeholder="Rédigez clairement votre réponse ici..."
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  maxLength={currentQ.maxCharacters || undefined}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 6,
                    fontSize: 11,
                    color: "#94a3b8",
                  }}
                >
                  <span>Vos réponses sont automatiquement mémorisées.</span>
                  {currentQ.maxCharacters && (
                    <span>
                      {(answers[currentQ.id] || "").length} / {currentQ.maxCharacters} caractères max
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 2. Type Numérique */}
            {currentQ.kind === "number" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#475569",
                    marginBottom: 8,
                  }}
                >
                  Valeur numérique attendue :
                </label>
                <input
                  type="number"
                  style={{
                    width: "100%",
                    maxWidth: 320,
                    height: 44,
                    padding: "0 14px",
                    borderRadius: 8,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 14,
                    outline: "none",
                    userSelect: "text",
                    WebkitUserSelect: "text",
                  }}
                  placeholder="Ex. 15000"
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                />
              </div>
            )}

            {/* 3. Choix uniques / Choix multiples (QCM) */}
            {!isTextKind &&
              (currentQ.kind === "single_choice" ||
                currentQ.kind === "multiple_choice" ||
                currentQ.kind === "true_false") &&
              currentQ.choices &&
              currentQ.choices.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {currentQ.choices.map((choice, cIdx) => {
                    const isChecked =
                      currentQ.kind === "single_choice" || currentQ.kind === "true_false"
                        ? answers[currentQ.id] === choice
                        : (answers[currentQ.id] || "").split(";;").includes(choice);

                    return (
                      <label
                        key={cIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "14px 18px",
                          border: isChecked ? "2px solid #E06810" : "1.5px solid #e2e8f0",
                          borderRadius: 10,
                          background: isChecked ? "#fff7ed" : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                        }}
                      >
                        <input
                          type={
                            currentQ.kind === "single_choice" || currentQ.kind === "true_false"
                              ? "radio"
                              : "checkbox"
                          }
                          name={`q_${currentQ.id}`}
                          checked={isChecked}
                          onChange={() => {
                            if (currentQ.kind === "single_choice" || currentQ.kind === "true_false") {
                              handleAnswerChange(choice);
                            } else {
                              const curList = (answers[currentQ.id] || "").split(";;").filter(Boolean);
                              const updated = isChecked
                                ? curList.filter((c) => c !== choice)
                                : [...curList, choice];
                              handleAnswerChange(updated.join(";;"));
                            }
                          }}
                          style={{
                            accentColor: "#E06810",
                            width: 18,
                            height: 18,
                            cursor: "pointer",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: isChecked ? 700 : 500,
                            color: isChecked ? "#9a3412" : "#1e293b",
                          }}
                        >
                          {choice}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
          </div>
        ) : (
          <div
            style={{
              background: "#ffffff",
              padding: 40,
              borderRadius: 12,
              textAlign: "center",
              color: "#64748b",
            }}
          >
            Aucune question n&apos;est disponible dans cette épreuve.
          </div>
        )}

        {/* Barre d'action inférieure : Précédente / Suivante / Soumission */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 0 32px",
          }}
        >
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "1.5px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: 13,
              fontWeight: 600,
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
              opacity: currentIndex === 0 ? 0.5 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ArrowLeft size={16} />
            <span>Question précédente</span>
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                border: "none",
                background: "#26394b",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 2px 6px rgba(38, 57, 75, 0.2)",
              }}
            >
              <span>Question suivante</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleVoluntarySubmit}
              disabled={isPending}
              style={{
                padding: "11px 24px",
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
                boxShadow: "0 4px 14px rgba(224, 104, 16, 0.4)",
              }}
            >
              <Send size={15} />
              <span>{isPending ? "Transmission en cours..." : "Soumettre définitivement ma copie"}</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}