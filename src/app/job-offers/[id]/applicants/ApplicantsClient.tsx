"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Sparkles,
  Download,
  FileText,
  Mail,
  Phone,
  Globe,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Eye,
  X,
  ExternalLink,
} from "lucide-react";
import {
  updateApplicationStatusAction,
  scoreAllApplicationsForOfferAction,
} from "@/actions/job-applications";

interface JobOffer {
  id: string;
  companyLabel: string;
  title: string;
  reference: string | null;
  location: string;
  contractType: string;
  description: string;
  requirements: string;
  closingDate: Date | string | null;
  publicToken: string;
  status: string;
}

interface Application {
  id: string;
  jobOfferId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string | null;
  cvUrl: string;
  cvFileName: string | null;
  coverLetterUrl: string | null;
  coverLetterFileName: string | null;
  coverLetterText: string | null;
  aiScore: number | null;
  aiKeywordsMatched: string[];
  aiSummary: string | null;
  status: string;
  submittedAt: Date | string;
}

function formatDate(d: any): string {
  if (!d) return "";
  try {
    const date = new Date(d);
    return isNaN(date.getTime()) ? "" : date.toLocaleDateString("fr-FR");
  } catch {
    return "";
  }
}

export function ApplicantsClient({
  offer,
  initialApplications,
}: {
  offer: JobOffer;
  initialApplications: Application[];
}) {
  const [applications, setApplications] = useState<Application[]>(initialApplications || []);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [isScoring, setIsScoring] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal pour lire la lettre de motivation
  const [selectedLetter, setSelectedLetter] = useState<{ name: string; text: string } | null>(null);

  const handleScoreAll = async () => {
    setIsScoring(true);
    setFeedbackMsg(null);
    try {
      const res = await scoreAllApplicationsForOfferAction(offer.id);
      if (res && res.success) {
        setFeedbackMsg({
          text: `✓ Analyse IA terminée : ${res.scoredCount} CV(s) analysés et notés !`,
          type: "success",
        });
        // Recharger les données fraîches
        window.location.reload();
      }
    } catch (err: unknown) {
      setFeedbackMsg({
        text: err instanceof Error ? err.message : "Erreur lors du scoring IA",
        type: "error",
      });
    } finally {
      setIsScoring(false);
    }
  };

  const handleStatusChange = (applicationId: string, newStatus: string) => {
    startTransition(async () => {
      try {
        await updateApplicationStatusAction(applicationId, newStatus);
        setApplications((prev) =>
          prev.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
        );
      } catch (err) {
        alert("Erreur lors de la mise à jour du statut");
      }
    });
  };

  const safeApps = applications || [];

  // Filtrage
  const filteredApps = safeApps.filter((app) => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "SHORTLISTED") return app.status === "shortlisted" || (app.aiScore !== null && app.aiScore >= 70);
    return app.status === filterStatus;
  });

  // Statistiques
  const totalCount = safeApps.length;
  const shortlistedCount = safeApps.filter(
    (a) => a.status === "shortlisted" || (a.aiScore !== null && a.aiScore >= 70)
  ).length;
  const averageScore =
    totalCount > 0
      ? Math.round(
          safeApps.reduce((acc, a) => acc + (a.aiScore || 0), 0) / totalCount
        )
      : 0;

  return (
    <div>
      {/* Bouton retour */}
      <Link
        href="/job-offers"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "#64748b",
          textDecoration: "none",
          marginBottom: 16,
          fontWeight: 600,
        }}
      >
        <ArrowLeft size={16} /> Retour à la liste des offres
      </Link>

      {/* En-tête de l'offre */}
      <div
        className="panel"
        style={{
          padding: "24px 28px",
          borderRadius: 14,
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  background: "#fff7ed",
                  color: "#c2410c",
                  border: "1px solid #fed7aa",
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {offer.companyLabel}
              </span>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                {offer.contractType} · {offer.location}
              </span>
            </div>

            <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
              {offer.title}
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
              Gestion des dossiers de candidature et présélection automatique par analyse de CV.
            </p>
          </div>

          {/* Bouton IA de scoring */}
          <button
            type="button"
            onClick={handleScoreAll}
            disabled={isScoring || applications.length === 0}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #E06810 0%, #B44E09 100%)",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 800,
              cursor: isScoring || applications.length === 0 ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(224, 104, 16, 0.35)",
              opacity: isScoring || applications.length === 0 ? 0.7 : 1,
            }}
          >
            <Sparkles size={16} />
            <span>{isScoring ? "Analyse IA en cours..." : "Analyser & Noter les CVs par l'IA"}</span>
          </button>
        </div>

        {/* Bannière de feedback */}
        {feedbackMsg && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: feedbackMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${feedbackMsg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
              color: feedbackMsg.type === "success" ? "#166534" : "#991b1b",
            }}
          >
            {feedbackMsg.text}
          </div>
        )}

        {/* Métriques clés */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
            marginTop: 20,
            borderTop: "1px solid #f1f5f9",
            paddingTop: 18,
          }}
        >
          <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
              Total candidatures
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
              {totalCount}
            </div>
          </div>

          <div style={{ background: "#ecfdf5", padding: "12px 16px", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#065f46", textTransform: "uppercase", fontWeight: 600 }}>
              ⭐ Profils convaincants (≥ 70%)
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#047857", marginTop: 2 }}>
              {shortlistedCount}
            </div>
          </div>

          <div style={{ background: "#fff7ed", padding: "12px 16px", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#9a3412", textTransform: "uppercase", fontWeight: 600 }}>
              Score IA moyen
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#c2410c", marginTop: 2 }}>
              {averageScore}%
            </div>
          </div>
        </div>
      </div>

      {/* Onglets de filtrage */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "ALL", label: `Toutes (${totalCount})` },
          { key: "SHORTLISTED", label: `⭐ Présélectionnés IA (${shortlistedCount})` },
          { key: "new", label: `Nouveaux (${safeApps.filter((a) => a.status === "new").length})` },
          { key: "reviewing", label: `En étude (${safeApps.filter((a) => a.status === "reviewing").length})` },
          { key: "rejected", label: `Non retenus (${safeApps.filter((a) => a.status === "rejected").length})` },
        ].map((tab) => {
          const isActive = filterStatus === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterStatus(tab.key)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid",
                borderColor: isActive ? "#E06810" : "#cbd5e1",
                background: isActive ? "#fff7ed" : "#ffffff",
                color: isActive ? "#c2410c" : "#475569",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Liste des candidatures */}
      {filteredApps.length === 0 ? (
        <div
          className="panel"
          style={{
            padding: 40,
            textAlign: "center",
            background: "#ffffff",
            borderRadius: 12,
          }}
        >
          <Users size={32} color="#94a3b8" style={{ margin: "0 auto 10px" }} />
          <h4 style={{ margin: "0 0 4px", fontSize: 16, color: "#1e293b" }}>
            Aucune candidature dans cette catégorie
          </h4>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
            Les dossiers transmis apparaîtront ici automatiquement dès réception.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {filteredApps.map((app) => {
            const score = app.aiScore ?? 0;
            const isGood = score >= 70;
            const isMedium = score >= 50 && score < 70;

            return (
              <div
                key={app.id}
                className="panel"
                style={{
                  padding: "20px 24px",
                  borderRadius: 12,
                  background: "#ffffff",
                  border: isGood ? "1.5px solid #86efac" : "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                        {app.firstName} {app.lastName}
                      </h3>

                      {isGood && (
                        <span
                          style={{
                            background: "#dcfce7",
                            color: "#15803d",
                            border: "1px solid #86efac",
                            padding: "2px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 800,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Sparkles size={12} /> Profil convaincant
                        </span>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Mail size={13} color="#E06810" /> {app.email}
                      </span>
                      {app.phone && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Phone size={13} color="#E06810" /> {app.phone}
                        </span>
                      )}
                      {app.country && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Globe size={13} color="#E06810" /> {app.country}
                        </span>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Calendar size={13} /> <span suppressHydrationWarning>{formatDate(app.submittedAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Badge Score IA */}
                  <div
                    style={{
                      background: isGood ? "#ecfdf5" : isMedium ? "#fff7ed" : "#f8fafc",
                      border: `1.5px solid ${isGood ? "#86efac" : isMedium ? "#fed7aa" : "#e2e8f0"}`,
                      borderRadius: 10,
                      padding: "8px 14px",
                      textAlign: "center",
                      minWidth: 120,
                    }}
                  >
                    <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                      Score Matching IA
                    </div>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: isGood ? "#15803d" : isMedium ? "#c2410c" : "#64748b",
                        marginTop: 2,
                      }}
                    >
                      {app.aiScore !== null ? `${app.aiScore}%` : "En attente"}
                    </div>
                  </div>
                </div>

                {/* Explication & Mots-clés trouvés */}
                {app.aiSummary && (
                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 12,
                      color: "#334155",
                      border: "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                      <Sparkles size={13} color="#E06810" />
                      <span>Synthèse IA :</span>
                    </div>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>{app.aiSummary}</p>

                    {Array.isArray(app.aiKeywordsMatched) && app.aiKeywordsMatched.length > 0 && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        {app.aiKeywordsMatched.map((kw, i) => (
                          <span
                            key={i}
                            style={{
                              background: "#e2e8f0",
                              color: "#334155",
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            ✓ {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Barre d'action documents & statut */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: 12,
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  {/* Pièces jointes */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <a
                      href={app.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        fontSize: 12,
                        textDecoration: "none",
                      }}
                    >
                      <Download size={14} />
                      <span>Télécharger le CV</span>
                    </a>

                    {app.coverLetterUrl && (
                      <a
                        href={app.coverLetterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          fontSize: 12,
                          textDecoration: "none",
                        }}
                      >
                        <FileText size={14} />
                        <span>Lettre de motivation (PDF)</span>
                      </a>
                    )}

                    {app.coverLetterText && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedLetter({
                            name: `${app.firstName} ${app.lastName}`,
                            text: app.coverLetterText || "",
                          })
                        }
                        className="btn btn-secondary"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          fontSize: 12,
                        }}
                      >
                        <Eye size={14} />
                        <span>Lire la lettre</span>
                      </button>
                    )}
                  </div>

                  {/* Changement de statut */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Statut RH :</span>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      disabled={isPending}
                      style={{
                        height: 34,
                        padding: "0 10px",
                        borderRadius: 6,
                        border: "1.5px solid #cbd5e1",
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          app.status === "shortlisted"
                            ? "#dcfce7"
                            : app.status === "reviewing"
                            ? "#fff7ed"
                            : app.status === "rejected"
                            ? "#fee2e2"
                            : "#ffffff",
                        color:
                          app.status === "shortlisted"
                            ? "#15803d"
                            : app.status === "reviewing"
                            ? "#c2410c"
                            : app.status === "rejected"
                            ? "#b91c1c"
                            : "#334155",
                        cursor: "pointer",
                      }}
                    >
                      <option value="new">Nouveau dossier</option>
                      <option value="reviewing">En étude approfondie</option>
                      <option value="shortlisted">⭐ Retenu / Présélectionné</option>
                      <option value="rejected">Non retenu</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL LECTURE DE LA LETTRE DE MOTIVATION */}
      {selectedLetter && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 580,
              background: "#ffffff",
              borderRadius: 14,
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <FileText size={18} color="#E06810" />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                  Lettre de motivation — {selectedLetter.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLetter(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px", maxHeight: "60vh", overflowY: "auto" }}>
              <p style={{ margin: 0, fontSize: 13, color: "#334155", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                {selectedLetter.text}
              </p>
            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setSelectedLetter(null)}
                className="btn btn-secondary"
                style={{ padding: "6px 14px", fontSize: 12 }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
