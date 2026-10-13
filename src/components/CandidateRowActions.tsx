"use client";

import { useState, useTransition } from "react";
import { updateCandidateAction, deleteCandidateAction, resendInvitationAction } from "@/actions/candidates";
import { Edit2, Trash2, X, Check, RotateCcw, Send } from "lucide-react";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
}

export function CandidateRowActions({
  candidate,
  campaignId,
}: {
  candidate: Candidate;
  campaignId: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResending, startResendTransition] = useTransition();
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleResend = () => {
    if (!confirm(`Renvoyer un e-mail d'invitation à ${candidate.firstName} ${candidate.lastName} (${candidate.email}) ?`)) {
      return;
    }
    startResendTransition(async () => {
      try {
        const res = await resendInvitationAction(candidate.id, campaignId);
        if ("error" in res && res.error) {
          alert("Erreur : " + res.error);
        } else {
          setResendStatus("Relancé !");
          setTimeout(() => setResendStatus(null), 4000);
          if (res.emailSent) {
            alert(`✓ E-mail d'invitation renvoyé avec succès à ${candidate.email} !`);
          } else {
            alert(`Invitation régénérée avec succès. Attention: l'e-mail n'a pas pu être délivré immédiatement. Lien direct: ${res.invitationUrl}`);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur";
        alert("Erreur lors de la relance : " + msg);
      }
    });
  };

  const handleDelete = async () => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le candidat ${candidate.firstName} ${candidate.lastName} ?`)) {
      setIsDeleting(true);
      try {
        await deleteCandidateAction(candidate.id, campaignId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur";
        alert("Erreur lors de la suppression : " + msg);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
        {candidate.status === "invited" && (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            title="Relancer l'invitation par e-mail"
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 6,
              padding: "5px 8px",
              color: "#2563eb",
              cursor: isResending ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <RotateCcw size={12} className={isResending ? "spin" : ""} />
            <span>{resendStatus ? resendStatus : isResending ? "..." : "Relancer"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          title="Modifier le candidat"
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
          title="Supprimer le candidat"
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

      {/* Modal / Popup de modification */}
      {isEditing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "18px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1e293b" }}>
                Modifier le candidat
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              action={async (formData: FormData) => {
                await updateCandidateAction(formData);
                setIsEditing(false);
              }}
              style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}
            >
              <input type="hidden" name="candidateId" value={candidate.id} />
              <input type="hidden" name="campaignId" value={campaignId} />

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Prénom
                </label>
                <input
                  name="firstName"
                  defaultValue={candidate.firstName}
                  required
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Nom
                </label>
                <input
                  name="lastName"
                  defaultValue={candidate.lastName}
                  required
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Adresse e-mail
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={candidate.email}
                  required
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                  Téléphone (facultatif)
                </label>
                <input
                  name="phone"
                  defaultValue={candidate.phone || ""}
                  style={{
                    width: "100%",
                    height: 40,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: "none",
                    background: "#E06810",
                    color: "#ffffff",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Check size={14} /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
