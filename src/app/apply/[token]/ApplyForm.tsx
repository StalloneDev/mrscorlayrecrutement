"use client";

import { useState, useTransition } from "react";
import { submitJobApplicationAction } from "@/actions/job-applications";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Send,
  User,
  Mail,
  Phone,
  Globe,
  Sparkles,
} from "lucide-react";

export function ApplyForm({
  token,
  jobTitle,
  companyLabel,
}: {
  token: string;
  jobTitle: string;
  companyLabel: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fichiers sélectionnés
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [letterMode, setLetterMode] = useState<"text" | "file">("text");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!cvFile) {
      setErrorMsg("Veuillez sélectionner votre Curriculum Vitae.");
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("cv", cvFile);
    if (letterFile) {
      formData.set("coverLetterFile", letterFile);
    }

    startTransition(async () => {
      try {
        const result = await submitJobApplicationAction(token, formData);
        if (result && "error" in result && result.error) {
          setErrorMsg(result.error);
        } else {
          setIsSubmitted(true);
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Erreur lors de la soumission");
      }
    });
  };

  if (isSubmitted) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "36px 20px",
          background: "#f0fdf4",
          border: "2px solid #86efac",
          borderRadius: 14,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "#22c55e",
            color: "#ffffff",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
            boxShadow: "0 6px 16px rgba(34, 197, 94, 0.3)",
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#14532d" }}>
          Candidature envoyée avec succès !
        </h3>

        <p style={{ margin: "0 0 16px", fontSize: 14, color: "#166534", lineHeight: 1.6, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
          Merci d&apos;avoir postulé au poste de <strong>{jobTitle}</strong> au sein de <strong>{companyLabel}</strong>.
          Votre dossier a bien été transmis à la Direction des Ressources Humaines.
        </p>

        <div
          style={{
            background: "#ffffff",
            borderRadius: 8,
            padding: "12px 18px",
            display: "inline-block",
            fontSize: 12,
            color: "#475569",
            border: "1px solid #bbf7d0",
          }}
        >
          ✉️ Un e-mail d&apos;accusé de réception vous a été transmis avec les détails de votre démarche.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>
          Formulaire de candidature
        </h3>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
          Remplissez tous les champs ci-dessous et joignez votre CV au format PDF.
        </p>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: "12px 16px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#991b1b",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Informations personnelles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 5 }}>
            Prénom *
          </label>
          <div style={{ position: "relative" }}>
            <User size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: 13 }} />
            <input
              type="text"
              name="firstName"
              required
              placeholder="Ex. Jean"
              style={{
                width: "100%",
                height: 42,
                padding: "0 12px 0 36px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                fontSize: 13,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 5 }}>
            Nom de famille *
          </label>
          <div style={{ position: "relative" }}>
            <User size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: 13 }} />
            <input
              type="text"
              name="lastName"
              required
              placeholder="Ex. KONAN"
              style={{
                width: "100%",
                height: 42,
                padding: "0 12px 0 36px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                fontSize: 13,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 5 }}>
            Adresse e-mail *
          </label>
          <div style={{ position: "relative" }}>
            <Mail size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: 13 }} />
            <input
              type="email"
              name="email"
              required
              placeholder="Ex. jean.konan@gmail.com"
              style={{
                width: "100%",
                height: 42,
                padding: "0 12px 0 36px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                fontSize: 13,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 5 }}>
            Numéro de téléphone *
          </label>
          <div style={{ position: "relative" }}>
            <Phone size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: 13 }} />
            <input
              type="tel"
              name="phone"
              required
              placeholder="Ex. +225 07 00 00 00"
              style={{
                width: "100%",
                height: 42,
                padding: "0 12px 0 36px",
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                fontSize: 13,
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 5 }}>
          Pays de résidence / Nationalité *
        </label>
        <div style={{ position: "relative" }}>
          <Globe size={15} color="#94a3b8" style={{ position: "absolute", left: 12, top: 13 }} />
          <input
            type="text"
            name="country"
            required
            placeholder="Ex. Côte d'Ivoire, Bénin, Togo, Sénégal..."
            style={{
              width: "100%",
              height: 42,
              padding: "0 12px 0 36px",
              borderRadius: 8,
              border: "1.5px solid #cbd5e1",
              fontSize: 13,
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Upload CV */}
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
          Curriculum Vitae (CV) *
        </label>
        <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b" }}>
          Formats acceptés : PDF, DOC, DOCX (Maximum 8 Mo).
        </p>

        <label
          style={{
            border: cvFile ? "2px solid #22c55e" : "2px dashed #cbd5e1",
            borderRadius: 12,
            padding: "20px",
            textAlign: "center",
            display: "block",
            cursor: "pointer",
            background: cvFile ? "#f0fdf4" : "#f8fafc",
            transition: "all 0.2s",
          }}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setCvFile(e.target.files[0]);
              }
            }}
            style={{ display: "none" }}
          />

          {cvFile ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <CheckCircle2 size={24} color="#22c55e" />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#166534" }}>
                  {cvFile.name}
                </div>
                <div style={{ fontSize: 11, color: "#4ade80" }}>
                  {(cvFile.size / (1024 * 1024)).toFixed(2)} Mo · Cliquez pour changer
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Upload size={28} color="#E06810" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                Cliquez pour importer votre CV
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                PDF recommandé pour une analyse optimale de votre profil
              </div>
            </div>
          )}
        </label>
      </div>

      {/* Lettre de motivation */}
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
            Lettre de motivation (Optionnelle)
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              onClick={() => setLetterMode("text")}
              style={{
                padding: "3px 10px",
                borderRadius: 6,
                border: "1px solid",
                borderColor: letterMode === "text" ? "#E06810" : "#cbd5e1",
                background: letterMode === "text" ? "#fff7ed" : "#ffffff",
                color: letterMode === "text" ? "#c2410c" : "#64748b",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Saisie directe
            </button>
            <button
              type="button"
              onClick={() => setLetterMode("file")}
              style={{
                padding: "3px 10px",
                borderRadius: 6,
                border: "1px solid",
                borderColor: letterMode === "file" ? "#E06810" : "#cbd5e1",
                background: letterMode === "file" ? "#fff7ed" : "#ffffff",
                color: letterMode === "file" ? "#c2410c" : "#64748b",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Fichier joint
            </button>
          </div>
        </div>

        {letterMode === "text" ? (
          <textarea
            name="coverLetterText"
            rows={4}
            placeholder="Exprimez vos motivations, vos atouts majeurs et votre intérêt pour rejoindre MRS & CORLAY..."
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1.5px solid #cbd5e1",
              fontSize: 13,
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        ) : (
          <label
            style={{
              border: letterFile ? "2px solid #22c55e" : "2px dashed #cbd5e1",
              borderRadius: 12,
              padding: "16px",
              textAlign: "center",
              display: "block",
              cursor: "pointer",
              background: letterFile ? "#f0fdf4" : "#f8fafc",
            }}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setLetterFile(e.target.files[0]);
                }
              }}
              style={{ display: "none" }}
            />
            <div style={{ fontSize: 12, color: letterFile ? "#166534" : "#64748b", fontWeight: 600 }}>
              {letterFile ? `✓ ${letterFile.name}` : "Cliquez pour importer votre lettre de motivation (PDF/DOC)"}
            </div>
          </label>
        )}
      </div>

      {/* Bouton de soumission */}
      <button
        type="submit"
        disabled={isPending}
        style={{
          marginTop: 10,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: "linear-gradient(135deg, #E06810 0%, #B44E09 100%)",
          color: "#ffffff",
          border: "none",
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 800,
          cursor: isPending ? "not-allowed" : "pointer",
          boxShadow: "0 6px 16px rgba(224, 104, 16, 0.35)",
        }}
      >
        <Send size={16} />
        <span>{isPending ? "Transmission de votre candidature..." : "Soumettre ma candidature"}</span>
      </button>

      <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8" }}>
        En soumettant ce formulaire, vous attestez de l&apos;exactitude des informations transmises à MRS &amp; CORLAY Holdings.
      </div>
    </form>
  );
}
