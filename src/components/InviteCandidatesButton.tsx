"use client";

import { useState, useTransition } from "react";
import { generateInvitationsAction } from "@/actions/candidates";
import { Send, CheckCircle2, Copy, Check, X, MailCheck, AlertTriangle } from "lucide-react";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
}

interface GeneratedInvite {
  candidateName: string;
  email: string;
  url: string;
  token: string;
  emailSent?: boolean;
}

export function InviteCandidatesButton({
  campaignId,
  candidates,
}: {
  campaignId: string;
  candidates: Candidate[];
}) {
  const [isPending, startTransition] = useTransition();
  const [successData, setSuccessData] = useState<GeneratedInvite[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleInvite = () => {
    setErrorMessage(null);

    // Cibler tous les candidats n'ayant pas encore passé l'épreuve
    const targetCandidates = candidates.filter(
      (c) => c.status === "added" || c.status === "invited"
    );

    if (targetCandidates.length === 0) {
      alert("Aucun candidat à inviter dans cette campagne.");
      return;
    }

    const count = targetCandidates.length;
    const confirmMsg = `Voulez-vous générer et envoyer les invitations pour ${count} candidat(s) ?`;

    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      try {
        const ids = targetCandidates.map((c) => c.id);
        const res = await generateInvitationsAction(campaignId, ids);
        setSuccessData(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        setErrorMessage(msg);
      }
    });
  };

  const handleCopy = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const allSent = successData ? successData.every((i) => i.emailSent) : false;
  const sentCount = successData ? successData.filter((i) => i.emailSent).length : 0;

  return (
    <>
      <button
        type="button"
        onClick={handleInvite}
        disabled={isPending}
        className="btn btn-primary"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          cursor: isPending ? "not-allowed" : "pointer",
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? (
          <>
            <span className="spinner" /> Envoi des invitations en cours...
          </>
        ) : (
          <>
            <Send size={15} /> Générer &amp; envoyer les invitations
          </>
        )}
      </button>

      {/* Message d'erreur réseau / serveur */}
      {errorMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#fef2f2",
            border: "1.5px solid #f87171",
            borderRadius: 12,
            padding: "16px 20px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: 12,
            maxWidth: 420,
          }}
        >
          <AlertTriangle color="#dc2626" size={24} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: 13, color: "#991b1b" }}>
            <strong>Erreur lors du traitement :</strong>
            <div>{errorMessage}</div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#991b1b" }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* MODAL DE SUCCÈS DÉTAILLÉ */}
      {successData && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              maxWidth: 620,
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            {/* Header Succès / Statut */}
            <div
              style={{
                background: allSent
                  ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                  : "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                padding: "24px 28px",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.2)",
                    borderRadius: 12,
                    padding: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MailCheck size={28} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>
                    {allSent ? "Invitations expédiées avec succès !" : "Invitations générées"}
                  </h3>
                  <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.9 }}>
                    {sentCount} / {successData.length} e-mail(s) délivré(s) avec succès
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSuccessData(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "none",
                  borderRadius: 8,
                  padding: 8,
                  color: "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps du message */}
            <div style={{ padding: "24px 28px", maxHeight: "60vh", overflowY: "auto" }}>
              <div
                style={{
                  background: allSent ? "#f0fdf4" : "#fffbeb",
                  border: `1px solid ${allSent ? "#bbf7d0" : "#fde68a"}`,
                  borderRadius: 10,
                  padding: "12px 16px",
                  fontSize: 13,
                  color: allSent ? "#166534" : "#92400e",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <CheckCircle2 size={18} color={allSent ? "#16a34a" : "#d97706"} style={{ flexShrink: 0 }} />
                <span>
                  {allSent
                    ? "Les e-mails de convocation officielle ont été transmis avec succès via votre messagerie Microsoft 365. Les liens sont également disponibles ci-dessous :"
                    : "Les invitations sont générées et actives. Vous pouvez copier directement les liens ci-dessous pour les transmettre aux candidats :"}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {successData.map((item, index) => (
                  <div
                    key={item.token}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: "14px 16px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <strong style={{ fontSize: 14, color: "#1e293b" }}>{item.candidateName}</strong>
                        <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>({item.email})</span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: item.emailSent ? "#dcfce7" : "#fef3c7",
                          color: item.emailSent ? "#166534" : "#92400e",
                          padding: "2px 8px",
                          borderRadius: 999,
                        }}
                      >
                        {item.emailSent ? "Email expédié ✓" : "Lien prêt"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="text"
                        readOnly
                        value={item.url}
                        style={{
                          flex: 1,
                          height: 34,
                          padding: "0 10px",
                          fontSize: 12,
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: 6,
                          color: "#334155",
                          fontFamily: "monospace",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(item.url, index)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          height: 34,
                          padding: "0 14px",
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: 6,
                          border: "1px solid #cbd5e1",
                          background: copiedIndex === index ? "#10b981" : "#ffffff",
                          color: copiedIndex === index ? "#ffffff" : "#1e293b",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check size={14} /> Copié !
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Copier
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "16px 28px",
                background: "#f8fafc",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setSuccessData(null)}
                className="btn btn-secondary"
                style={{
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
