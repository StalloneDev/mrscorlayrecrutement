"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import {
  saveCandidateAnswerAction,
  submitAssessmentAction,
  recordProctoringEventAction,
} from "@/actions/assessments";
import { Brand } from "@/components/Brand";
import { FormattedPrompt } from "@/components/FormattedPrompt";
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
  Layers,
  FileText,
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

interface Epreuve {
  id: string;
  code: string;
  shortCode: string;
  title: string;
  points: number;
  questions: (Question & { globalIndex: number })[];
}

function groupQuestionsIntoEpreuves(questions: Question[]): Epreuve[] {
  const map = new Map<string, { code: string; shortCode: string; title: string; points: number; questions: (Question & { globalIndex: number })[] }>();

  questions.forEach((q, idx) => {
    // Détecte "Partie A : Questions..." ou "Épreuve 1 : ..."
    const match = q.prompt.match(/^(?:Partie|Épreuve)\s*([A-Z0-9]+)\s*:\s*([^(\n\r]+)(?:\((\d+)\s*points?\))?/i);
    let key = "";
    let code = "";
    let shortCode = "";
    let title = "";

    if (match) {
      const partLetter = match[1].trim();
      key = `PART_${partLetter}`;
      code = `Partie ${partLetter}`;
      shortCode = `Partie ${partLetter}`;
      title = match[2].trim();
    } else if (q.category && q.category !== "Général") {
      key = `CAT_${q.category}`;
      code = q.category;
      shortCode = q.category;
      title = q.competency || q.category;
    } else {
      key = `ALL`;
      code = `Épreuve Complète`;
      shortCode = `Épreuve 1`;
      title = `Évaluation Technique`;
    }

    if (!map.has(key)) {
      map.set(key, { code, shortCode, title, points: 0, questions: [] });
    }
    const group = map.get(key)!;
    group.questions.push({ ...q, globalIndex: idx + 1 });
    group.points += q.points;
  });

  return Array.from(map.entries()).map(([k, g], idx) => ({
    id: `epreuve-${idx + 1}`,
    code: `Épreuve ${idx + 1} (${g.code})`,
    shortCode: `Épreuve ${idx + 1} — ${g.shortCode}`,
    title: g.title,
    points: g.points,
    questions: g.questions,
  }));
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
  const epreuves = useMemo(() => groupQuestionsIntoEpreuves(questions), [questions]);
  const [currentEpreuveIndex, setCurrentEpreuveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [secondsRemaining, setSecondsRemaining] = useState(initialSecondsRemaining);
  const [isSubmitted, setIsSubmitted] = useState(Boolean(initialSubmittedAt));
  const [submissionReason, setSubmissionReason] = useState<string | null>(null);
  const [saveStatuses, setSaveStatuses] = useState<Record<string, "saved" | "saving" | "error">>({});
  const [isPending, startTransition] = useTransition();

  // ── ÉTATS ANTI-TRICHE (PROCTORING) ──────────────────────────────────────────
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const isPageHiddenRef = useRef(false);
  const warningCountRef = useRef(0);

  const currentEpreuve = epreuves[currentEpreuveIndex] || epreuves[0];

  const showCopyAlert = (msg = "⚠️ La copie ou capture du contenu est formellement interdite.") => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 3500);
  };

  // ── GESTIONNAIRES ANTI-COPIE ───────────────────────────────────────────────
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
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "i", "J", "j", "C", "c"].includes(e.key))
      ) {
        e.preventDefault();
        showCopyAlert("⚠️ L'accès aux outils de développement est interdit.");
        recordProctoringEventAction(attemptId, "DEVTOOLS_ATTEMPT");
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        showCopyAlert("⚠️ L'impression ou la capture de l'épreuve est interdite.");
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        return;
      }

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

  // ── DÉTECTION SORTIE D'ONGLET / ÉCRAN ──────────────────────────────────────
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

  const handleAnswerChange = (questionId: string, val: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: val }));
    setSaveStatuses((prev) => ({ ...prev, [questionId]: "saving" }));

    startTransition(async () => {
      try {
        await saveCandidateAnswerAction(attemptId, questionId, val);
        setSaveStatuses((prev) => ({ ...prev, [questionId]: "saved" }));
      } catch (e) {
        console.error("Save error:", e);
        setSaveStatuses((prev) => ({ ...prev, [questionId]: "error" }));
      }
    });
  };

  const totalAnswered = useMemo(() => {
    return questions.filter((q) => answers[q.id] && answers[q.id].trim().length > 0).length;
  }, [questions, answers]);

  const handleVoluntarySubmit = () => {
    const unanswered = questions.length - totalAnswered;
    let confirmMsg = `Êtes-vous certain(e) de vouloir soumettre définitivement votre épreuve ?\n\n`;
    confirmMsg += `• Questions répondues : ${totalAnswered} / ${questions.length}\n`;
    if (unanswered > 0) {
      confirmMsg += `⚠️ Attention : vous avez encore ${unanswered} question(s) sans réponse.\n\n`;
    }
    confirmMsg += `Vos réponses seront immédiatement transmises au comité de recrutement de MRS HOLDINGS.`;

    if (confirm(confirmMsg)) {
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
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            width: "100%",
            background: "#ffffff",
            borderRadius: 16,
            boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
            padding: "48px 36px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              margin: "0 auto 18px",
              width: 68,
              height: 68,
              borderRadius: "50%",
              background: isViolation ? "#fef2f2" : "#eff6ff",
              color: isViolation ? "#dc2626" : "#1e3a8a",
              border: `2px solid ${isViolation ? "#fecaca" : "#bfdbfe"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: "bold",
            }}
          >
            {isViolation ? "⚠️" : "✓"}
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 10px" }}>
            {isViolation ? "Épreuve clôturée pour violation de sécurité" : "Épreuve terminée & transmise avec succès"}
          </h2>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: "0 0 20px" }}>
            {isViolation ? (
              <>
                Votre session pour l&apos;épreuve <strong>{campaignTitle}</strong> a été automatiquement
                interrompue suite à des <strong>sorties d&apos;écran répétées (4 infractions)</strong>. Les réponses
                déjà enregistrées ont été transmises au comité de recrutement.
              </>
            ) : (
              <>
                Merci <strong>{candidateName}</strong>. L&apos;ensemble de vos réponses pour l&apos;épreuve{" "}
                <strong>{campaignTitle}</strong> a bien été enregistré ({totalAnswered} / {questions.length} questions traitées).
              </>
            )}
          </p>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: "16px",
              fontSize: 13,
              color: "#334155",
              lineHeight: 1.5,
              marginBottom: 24,
            }}
          >
            L&apos;équipe Recrutement de MRS HOLDINGS examinera attentivement votre copie. Vous serez tenu(e) informé(e) des résultats.
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <Brand size="md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f1f5f9",
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

      {/* ── MODALE D'ALERTE CHANGEMENT D'ONGLET ───────────────────────────── */}
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
              Vous venez de quitter l&apos;onglet ou la fenêtre de composition. Cette tentative est{" "}
              <strong>immédiatement consignée</strong> dans le journal d&apos;audit de recrutement MRS HOLDINGS.
            </p>

            <div
              style={{
                background: warningCount >= 3 ? "#fef2f2" : "#eff6ff",
                border: `1.5px solid ${warningCount >= 3 ? "#fca5a5" : "#bfdbfe"}`,
                borderRadius: 10,
                padding: "14px 18px",
                marginBottom: 20,
                fontSize: 13,
                fontWeight: 700,
                color: warningCount >= 3 ? "#b91c1c" : "#1e3a8a",
                lineHeight: 1.5,
              }}
            >
              {warningCount < 3 ? (
                <span>
                  Avertissement <strong>{warningCount}</strong> sur 3 autorisé(s). À la 4ème infraction, l&apos;épreuve
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
                background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 10,
                padding: "14px 24px",
                fontSize: 14,
                fontWeight: 800,
                cursor: "pointer",
                width: "100%",
                boxShadow: "0 4px 14px rgba(30, 58, 138, 0.4)",
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
          borderBottom: "1px solid #cbd5e1",
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
          <div style={{ height: 24, width: 1, background: "#cbd5e1" }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>{campaignTitle}</div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>{companyName} · MRS HOLDINGS</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Badge surveillance anti-triche */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: warningCount > 0 ? "#fef2f2" : "#eff6ff",
              color: warningCount > 0 ? "#dc2626" : "#1e3a8a",
              border: `1px solid ${warningCount > 0 ? "#fecaca" : "#bfdbfe"}`,
              padding: "5px 12px",
              borderRadius: 8,
              fontSize: 11.5,
              fontWeight: 700,
            }}
            title="Protection anti-triche active : copie interdite et sorties d'écran surveillées"
          >
            {warningCount > 0 ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
            <span>
              {warningCount === 0 ? "Surveillance active" : `Sorties d'écran : ${warningCount}/3`}
            </span>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{candidateName}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Candidat(e) en composition</div>
          </div>

          {/* Chronomètre avec alerte temps faible */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: isLowTime ? "#fef2f2" : "#eff6ff",
              color: isLowTime ? "#b91c1c" : "#1e3a8a",
              border: `1.5px solid ${isLowTime ? "#fca5a5" : "#93c5fd"}`,
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
          maxWidth: 960,
          width: "100%",
          margin: "24px auto",
          padding: "0 20px",
          flex: 1,
          boxSizing: "border-box",
        }}
      >
        {/* ── ONGLETS PAR ÉPREUVE ────────────────────────────────────────── */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 12,
            padding: "10px 14px",
            border: "1px solid #cbd5e1",
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <Layers size={14} color="#1e3a8a" />
              <span>Onglets des épreuves ({epreuves.length} épreuves)</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1e3a8a" }}>
              Progression globale : {totalAnswered} / {questions.length} questions traitées
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {epreuves.map((ep, idx) => {
              const isCurrent = idx === currentEpreuveIndex;
              const answeredCount = ep.questions.filter((q) => answers[q.id] && answers[q.id].trim().length > 0).length;
              const isComplete = answeredCount === ep.questions.length && ep.questions.length > 0;

              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => {
                    setCurrentEpreuveIndex(idx);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: isCurrent
                      ? "2px solid #1e3a8a"
                      : isComplete
                      ? "1px solid #86efac"
                      : "1px solid #cbd5e1",
                    background: isCurrent
                      ? "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)"
                      : isComplete
                      ? "#f0fdf4"
                      : "#ffffff",
                    color: isCurrent ? "#ffffff" : isComplete ? "#15803d" : "#334155",
                    fontWeight: isCurrent ? 800 : 600,
                    fontSize: 12.5,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: isCurrent ? "0 4px 10px rgba(30,58,138,0.25)" : "none",
                  }}
                >
                  <span>{ep.shortCode}</span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 6px",
                      borderRadius: 10,
                      background: isCurrent ? "rgba(255,255,255,0.2)" : isComplete ? "#bbf7d0" : "#f1f5f9",
                      color: isCurrent ? "#ffffff" : isComplete ? "#166534" : "#64748b",
                      fontWeight: 700,
                    }}
                  >
                    {answeredCount}/{ep.questions.length}
                  </span>
                  {isComplete && !isCurrent && <span style={{ fontSize: 12 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── BANNIÈRE DE L'ÉPREUVE ACTIVE ───────────────────────────────── */}
        {currentEpreuve && (
          <div
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
              color: "#ffffff",
              borderRadius: 14,
              padding: "22px 26px",
              marginBottom: 24,
              boxShadow: "0 6px 20px rgba(15,23,42,0.15)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,0.18)",
                  color: "#93c5fd",
                  padding: "3px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                Épreuve {currentEpreuveIndex + 1} sur {epreuves.length} · {currentEpreuve.code}
              </div>
              <h2 style={{ margin: "2px 0 4px", fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>
                {currentEpreuve.title}
              </h2>
              <div style={{ fontSize: 12.5, color: "#cbd5e1" }}>
                Cette épreuve regroupe <strong>{currentEpreuve.questions.length} question{currentEpreuve.questions.length > 1 ? "s" : ""}</strong> à traiter directement ci-dessous.
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 10,
                padding: "10px 18px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 10.5, textTransform: "uppercase", color: "#93c5fd", fontWeight: 700 }}>
                Barème total épreuve
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>
                {currentEpreuve.points} pts
              </div>
            </div>
          </div>
        )}

        {/* ── LISTE DES QUESTIONS DE CETTE ÉPREUVE SUR LA MÊME PAGE ─────── */}
        {currentEpreuve && currentEpreuve.questions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {currentEpreuve.questions.map((q) => {
              const qSave = saveStatuses[q.id] || "saved";
              const currentVal = answers[q.id] || "";
              const isAnswered = currentVal.trim().length > 0;

              const isTextKind =
                q.kind === "text" ||
                q.kind === "long_text" ||
                q.kind === "short_text" ||
                (!q.choices || q.choices.length === 0);

              return (
                <div
                  key={q.id}
                  id={`q-${q.id}`}
                  style={{
                    background: "#ffffff",
                    borderRadius: 14,
                    border: isAnswered ? "1.5px solid #cbd5e1" : "1.5px solid #e2e8f0",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                    padding: "28px 30px",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  {/* En-tête de la question */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                      paddingBottom: 12,
                      borderBottom: "1px solid #f1f5f9",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span
                        style={{
                          background: "#1e3a8a",
                          color: "#ffffff",
                          padding: "4px 12px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 800,
                          letterSpacing: "0.02em",
                        }}
                      >
                        Question {q.globalIndex} / {questions.length}
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
                        {q.competency || q.category}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      {/* Statut sauvegarde spécifique question */}
                      <div style={{ fontSize: 11.5, fontWeight: 600 }}>
                        {qSave === "saving" && (
                          <span style={{ color: "#d97706" }}>Enregistrement...</span>
                        )}
                        {qSave === "saved" && isAnswered && (
                          <span style={{ color: "#059669", display: "flex", alignItems: "center", gap: 4 }}>
                            <CheckCircle2 size={13} /> Enregistré
                          </span>
                        )}
                        {qSave === "error" && (
                          <span style={{ color: "#dc2626", display: "flex", alignItems: "center", gap: 4 }}>
                            <AlertCircle size={13} /> Erreur
                          </span>
                        )}
                      </div>

                      <span style={{ fontWeight: 800, color: "#1e3a8a", fontSize: 13 }}>
                        {q.points} point{q.points > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Énoncé aéré, tabulé et structuré */}
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: "20px 24px",
                      marginBottom: 22,
                      userSelect: "none",
                      WebkitUserSelect: "none",
                    }}
                  >
                    <FormattedPrompt prompt={q.prompt} hidePartHeader={true} />
                  </div>

                  {/* Zone de saisie selon le type */}
                  {isTextKind && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <label
                          htmlFor={`ans-${q.id}`}
                          style={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: "#1e3a8a",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <FileText size={14} />
                          <span>Votre réponse argumentée pour cette question :</span>
                        </label>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          Sauvegarde automatique à chaque frappe
                        </span>
                      </div>
                      <textarea
                        id={`ans-${q.id}`}
                        style={{
                          minHeight: 180,
                          width: "100%",
                          padding: "14px 16px",
                          borderRadius: 10,
                          border: isAnswered ? "1.5px solid #93c5fd" : "1.5px solid #cbd5e1",
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
                        placeholder="Rédigez clairement votre réponse, vos calculs et vos justifications ici..."
                        value={currentVal}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        maxLength={q.maxCharacters || undefined}
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
                        <span>
                          {isAnswered ? "✓ Réponse mémorisée" : "Question non encore répondue"}
                        </span>
                        {q.maxCharacters ? (
                          <span>
                            {currentVal.length} / {q.maxCharacters} caractères max
                          </span>
                        ) : (
                          <span>{currentVal.length} caractère{currentVal.length > 1 ? "s" : ""}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. Type Numérique */}
                  {q.kind === "number" && (
                    <div>
                      <label
                        htmlFor={`ans-${q.id}`}
                        style={{
                          display: "block",
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#1e3a8a",
                          marginBottom: 8,
                        }}
                      >
                        Valeur numérique attendue :
                      </label>
                      <input
                        id={`ans-${q.id}`}
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
                        value={currentVal}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      />
                    </div>
                  )}

                  {/* 3. Choix uniques / Choix multiples (QCM) */}
                  {!isTextKind &&
                    (q.kind === "single_choice" ||
                      q.kind === "multiple_choice" ||
                      q.kind === "true_false") &&
                    q.choices &&
                    q.choices.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {q.choices.map((choice, cIdx) => {
                          const isChecked =
                            q.kind === "single_choice" || q.kind === "true_false"
                              ? currentVal === choice
                              : currentVal.split(";;").includes(choice);

                          return (
                            <label
                              key={cIdx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                                padding: "14px 18px",
                                border: isChecked ? "2px solid #1e3a8a" : "1.5px solid #e2e8f0",
                                borderRadius: 10,
                                background: isChecked ? "#eff6ff" : "#ffffff",
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                                userSelect: "none",
                                WebkitUserSelect: "none",
                              }}
                            >
                              <input
                                type={
                                  q.kind === "single_choice" || q.kind === "true_false"
                                    ? "radio"
                                    : "checkbox"
                                }
                                name={`q_${q.id}`}
                                checked={isChecked}
                                onChange={() => {
                                  if (q.kind === "single_choice" || q.kind === "true_false") {
                                    handleAnswerChange(q.id, choice);
                                  } else {
                                    const curList = currentVal.split(";;").filter(Boolean);
                                    const updated = isChecked
                                      ? curList.filter((c) => c !== choice)
                                      : [...curList, choice];
                                    handleAnswerChange(q.id, updated.join(";;"));
                                  }
                                }}
                                style={{
                                  accentColor: "#1e3a8a",
                                  width: 18,
                                  height: 18,
                                  cursor: "pointer",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: isChecked ? 700 : 500,
                                  color: isChecked ? "#1e3a8a" : "#1e293b",
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
              );
            })}
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

        {/* ── BARRE D'ACTION INFÉRIEURE : NAVIGATION ENTRE ÉPREUVES & SOUMISSION ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px 0 40px",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <button
            type="button"
            onClick={() => {
              setCurrentEpreuveIndex((prev) => Math.max(0, prev - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={currentEpreuveIndex === 0}
            style={{
              padding: "12px 20px",
              borderRadius: 8,
              border: "1.5px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              fontSize: 13,
              fontWeight: 700,
              cursor: currentEpreuveIndex === 0 ? "not-allowed" : "pointer",
              opacity: currentEpreuveIndex === 0 ? 0.4 : 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <ArrowLeft size={16} />
            <span>Épreuve précédente</span>
          </button>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {currentEpreuveIndex < epreuves.length - 1 && (
              <button
                type="button"
                onClick={() => {
                  setCurrentEpreuveIndex((prev) => Math.min(epreuves.length - 1, prev + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  padding: "12px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
                  color: "#ffffff",
                  fontSize: 13.5,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(30, 58, 138, 0.35)",
                }}
              >
                <span>Épreuve suivante ({epreuves[currentEpreuveIndex + 1]?.shortCode || ""})</span>
                <ArrowRight size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={handleVoluntarySubmit}
              disabled={isPending}
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                border: "none",
                background: currentEpreuveIndex === epreuves.length - 1
                  ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                  : "linear-gradient(135deg, #334155 0%, #0f172a 100%)",
                color: "#ffffff",
                fontSize: 13.5,
                fontWeight: 800,
                cursor: isPending ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: currentEpreuveIndex === epreuves.length - 1
                  ? "0 4px 14px rgba(5, 150, 105, 0.35)"
                  : "0 4px 14px rgba(15, 23, 42, 0.25)",
              }}
            >
              <Send size={15} />
              <span>
                {isPending
                  ? "Transmission en cours..."
                  : currentEpreuveIndex === epreuves.length - 1
                  ? "Soumettre définitivement ma copie"
                  : "Terminer & Soumettre"}
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}