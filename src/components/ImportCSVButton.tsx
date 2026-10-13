"use client";

import { useState, useTransition, useRef } from "react";
import { importCandidatesFromCSVAction } from "@/actions/candidates";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X, Download } from "lucide-react";

interface ImportCSVButtonProps {
  campaignId: string;
  companyId: string;
}

interface ParsedCandidate {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export function ImportCSVButton({ campaignId, companyId }: ImportCSVButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [candidates, setCandidates] = useState<ParsedCandidate[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string) => {
    setParseError(null);
    setResult(null);

    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setParseError("Le fichier doit comporter au moins une ligne d'en-tête et une ligne de données.");
      setCandidates([]);
      return;
    }

    // Détection séparateur : virgule ou point-virgule ou tabulation
    const firstLine = lines[0];
    let sep = ",";
    if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
      sep = ";";
    } else if (firstLine.includes("\t")) {
      sep = "\t";
    }

    const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));

    // Trouver les indices des colonnes
    const fnIndex = headers.findIndex((h) => h.includes("prenom") || h.includes("prénom") || h.includes("first"));
    const lnIndex = headers.findIndex((h) => (h.includes("nom") && !h.includes("prenom") && !h.includes("prénom")) || h.includes("last"));
    const emailIndex = headers.findIndex((h) => h.includes("mail") || h.includes("courriel"));
    const phoneIndex = headers.findIndex((h) => h.includes("tel") || h.includes("tél") || h.includes("phone"));

    if (fnIndex === -1 || lnIndex === -1 || emailIndex === -1) {
      setParseError(
        `Colonnes obligatoires manquantes dans l'en-tête. En-têtes attendus : Prénom, Nom, Email (trouvés : ${headers.join(", ")})`
      );
      setCandidates([]);
      return;
    }

    const parsed: ParsedCandidate[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const firstName = row[fnIndex]?.trim() || "";
      const lastName = row[lnIndex]?.trim() || "";
      const email = row[emailIndex]?.trim() || "";
      const phone = phoneIndex !== -1 ? row[phoneIndex]?.trim() : undefined;

      if (firstName && lastName && email && email.includes("@")) {
        parsed.push({ firstName, lastName, email, phone });
      }
    }

    if (parsed.length === 0) {
      setParseError("Aucun candidat valide trouvé dans le fichier. Vérifiez les formats d'e-mail.");
      setCandidates([]);
    } else {
      setCandidates(parsed);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file, "UTF-8");
  };

  const downloadSample = () => {
    const sample = "Prénom,Nom,Email,Téléphone\nJean,Dupont,jean.dupont@example.com,+229 97 00 00 01\nAwa,Kouassi,awa.kouassi@example.com,+225 07 00 00 02\n";
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele_candidats.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (candidates.length === 0) return;
    startTransition(async () => {
      try {
        const res = await importCandidatesFromCSVAction(campaignId, companyId, candidates);
        setResult({ added: res.added, skipped: res.skipped });
        setCandidates([]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur lors de l'import";
        setParseError(msg);
      }
    });
  };

  const reset = () => {
    setCandidates([]);
    setFileName(null);
    setParseError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          reset();
          setIsOpen(true);
        }}
        className="btn btn-secondary"
        style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13 }}
      >
        <Upload size={14} /> Importer un CSV
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
              maxWidth: 640,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {/* Header modal */}
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
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#1e293b" }}>
                    Importer des candidats (CSV)
                  </h3>
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Ajoutez plusieurs candidats en un clic depuis un fichier tableur
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Télécharger modèle */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#f8fafc",
                padding: "10px 14px",
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 12,
                color: "#475569",
              }}
            >
              <span>Format attendu : <code>Prénom, Nom, Email, Téléphone</code></span>
              <button
                type="button"
                onClick={downloadSample}
                style={{
                  background: "none",
                  border: "none",
                  color: "#E06810",
                  cursor: "pointer",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <Download size={13} /> Télécharger modèle .csv
              </button>
            </div>

            {/* Zone upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed #cbd5e1",
                borderRadius: 10,
                padding: "28px 20px",
                textAlign: "center",
                background: "#fafbfd",
                cursor: "pointer",
                marginBottom: 16,
                transition: "border 0.2s",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
              <Upload size={28} style={{ color: "#E06810", margin: "0 auto 8px" }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#334155" }}>
                {fileName ? fileName : "Cliquez pour sélectionner un fichier CSV"}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                Séparateurs supportés : virgule (,) ou point-virgule (;)
              </div>
            </div>

            {/* Erreur de parsing */}
            {parseError && (
              <div
                style={{
                  padding: "12px 14px",
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
                <span>{parseError}</span>
              </div>
            )}

            {/* Résultat import réussi */}
            {result && (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 8,
                  background: "#ecfdf5",
                  color: "#059669",
                  border: "1px solid #a7f3d0",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={18} />
                  <span>
                    <strong>{result.added}</strong> candidat(s) importé(s) avec succès !
                    {result.skipped > 0 && ` (${result.skipped} ignoré(s) car déjà existants)`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: "6px 12px" }}
                >
                  Fermer
                </button>
              </div>
            )}

            {/* Aperçu des candidats détectés */}
            {candidates.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>
                    Aperçu ({candidates.length} candidats détectés) :
                  </span>
                </div>
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: "auto",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                  }}
                >
                  <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                    <thead style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
                      <tr style={{ textAlign: "left", color: "#64748b" }}>
                        <th style={{ padding: "8px 10px" }}>Nom complet</th>
                        <th style={{ padding: "8px 10px" }}>Email</th>
                        <th style={{ padding: "8px 10px" }}>Téléphone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidates.map((c, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "6px 10px", fontWeight: 600 }}>
                            {c.firstName} {c.lastName}
                          </td>
                          <td style={{ padding: "6px 10px", color: "#64748b" }}>{c.email}</td>
                          <td style={{ padding: "6px 10px", color: "#94a3b8" }}>{c.phone || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer boutons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn btn-secondary"
                style={{ fontSize: 13 }}
              >
                Annuler
              </button>
              {candidates.length > 0 && (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isPending}
                  className="btn btn-primary"
                  style={{
                    fontSize: 13,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Upload size={14} />
                  {isPending ? "Import en cours..." : `Importer ${candidates.length} candidat(s)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
