"use client";

import { useState, useTransition } from "react";
import { updateCampaignAction } from "@/actions/campaigns";
import { Edit3, X, Check, AlertCircle } from "lucide-react";

interface CampaignData {
  id: string;
  title: string;
  reference: string;
  description: string;
  durationMinutes: number;
  passingScore: number;
  shortlistSize: number;
  opensAt?: Date | string | null;
  closesAt?: Date | string | null;
}

export function EditCampaignButton({ campaign }: { campaign: CampaignData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(campaign.title);
  const [reference, setReference] = useState(campaign.reference);
  const [description, setDescription] = useState(campaign.description || "");
  const [durationMinutes, setDurationMinutes] = useState(campaign.durationMinutes || 60);
  const [passingScore, setPassingScore] = useState(campaign.passingScore || 60);
  const [shortlistSize, setShortlistSize] = useState(campaign.shortlistSize || 5);
  const [opensAt, setOpensAt] = useState(
    campaign.opensAt ? new Date(campaign.opensAt).toISOString().slice(0, 16) : ""
  );
  const [closesAt, setClosesAt] = useState(
    campaign.closesAt ? new Date(campaign.closesAt).toISOString().slice(0, 16) : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await updateCampaignAction(campaign.id, {
          title,
          reference,
          description,
          durationMinutes: Number(durationMinutes),
          passingScore: Number(passingScore),
          shortlistSize: Number(shortlistSize),
          opensAt: opensAt || null,
          closesAt: closesAt || null,
        });
        setIsOpen(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur lors de la mise à jour.";
        setError(msg);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
      >
        <Edit3 size={14} /> Modifier
      </button>

      {isOpen && (
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
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 14,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              maxWidth: 620,
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
                marginBottom: 18,
                paddingBottom: 14,
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "#fff7ed",
                    color: "#E06810",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
                    Paramètres de la campagne
                  </h3>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Ajustez les modalités et informations de l'épreuve
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
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

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Titre du poste / de l'épreuve *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Référence interne *
                  </label>
                  <input
                    type="text"
                    required
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
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

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Durée de composition (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={360}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
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

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                  Description / Consignes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objectif de l'épreuve, contexte, compétences recherchées..."
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Seuil d'admissibilité (%) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
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

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Taille de la shortlist (Top N) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={shortlistSize}
                    onChange={(e) => setShortlistSize(Number(e.target.value))}
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                    Date d'ouverture (facultatif)
                  </label>
                  <input
                    type="datetime-local"
                    value={opensAt}
                    onChange={(e) => setOpensAt(e.target.value)}
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
                    Date de clôture (facultatif)
                  </label>
                  <input
                    type="datetime-local"
                    value={closesAt}
                    onChange={(e) => setClosesAt(e.target.value)}
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
              </div>

              {/* Boutons footer */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
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
                  {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
