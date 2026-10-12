"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  Target,
  Layers,
  Sparkles,
  ChevronRight,
  Eye,
  CheckCircle2,
  HelpCircle,
  Hash,
  ShieldCheck,
  Building2,
  BookOpen,
} from "lucide-react";

interface Question {
  id: string;
  prompt: string;
  kind: string;
  points: number;
  category: string;
  competency: string;
  difficulty: string;
  choices: string[] | null;
  expectedAnswer: string | null;
}

interface CampaignComposition {
  id: string;
  title: string;
  reference: string;
  companyName: string;
  companyAccent: string | null;
  status: string;
  durationMinutes: number;
  passingScore: number;
  shortlistSize: number;
  questionIds: string[];
  questions: Question[];
}

export function CompositionViewer({ campaigns }: { campaigns: CampaignComposition[] }) {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    campaigns[0]?.id || ""
  );
  const [activeMode, setActiveMode] = useState<"exam" | "scoring" | "spec">("exam");

  const current = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  if (!current) {
    return (
      <div className="panel" style={{ textAlign: "center", padding: "60px 20px" }}>
        <FileText size={42} style={{ margin: "0 auto 16px", color: "#8a969f" }} />
        <h3>Aucune campagne configurée</h3>
        <p className="text-muted">Créez d'abord une campagne pour prévisualiser sa composition.</p>
        <Link href="/campaigns" className="btn btn-primary" style={{ marginTop: 16 }}>
          Aller aux Campagnes
        </Link>
      </div>
    );
  }

  const totalPoints = current.questions.reduce((sum, q) => sum + (q.points || 0), 0);
  const passingPoints = Math.round((totalPoints * current.passingScore) / 100);

  // Répartition par compétence/catégorie
  const categoriesCount = current.questions.reduce((acc, q) => {
    acc[q.category] = (acc[q.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div style={{ width: "100%", display: "grid", gridTemplateColumns: "260px minmax(0, 1fr)", gap: 20, alignItems: "start" }}>
      {/* Colonne de sélection de l'épreuve */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="panel" style={{ padding: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#778490", letterSpacing: "0.08em", marginBottom: 12 }}>
            SÉLECTIONNER UNE ÉPREUVE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {campaigns.map((c) => {
              const isSelected = c.id === current.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCampaignId(c.id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 9,
                    border: `1.5px solid ${isSelected ? "var(--green)" : "#e1e6e4"}`,
                    background: isSelected ? "#FFF7ED" : "#ffffff",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all .16s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: isSelected ? "var(--green)" : "#7f8e9b", textTransform: "uppercase" }}>
                      {c.companyName}
                    </span>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#edf0f0", color: "#546473", fontWeight: 600 }}>
                      {c.reference}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: isSelected ? "#243445" : "#34485a", lineHeight: 1.3 }}>
                    {c.title}
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 6, fontSize: 11, color: "#8a969f" }}>
                    <span>⏱ {c.durationMinutes} min</span>
                    <span>•</span>
                    <span>📝 {c.questions.length} questions</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fiche technique rapide */}
        <div className="panel" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#34485a", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Layers size={15} style={{ color: "var(--green)" }} />
            Architecture du barème
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f0f3f2", paddingBottom: 6 }}>
              <span className="text-muted">Total des points</span>
              <strong style={{ color: "#243445" }}>{totalPoints} pts</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f0f3f2", paddingBottom: 6 }}>
              <span className="text-muted">Seuil d'admissibilité ({current.passingScore}%)</span>
              <strong style={{ color: "var(--green)" }}>{passingPoints} pts</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f0f3f2", paddingBottom: 6 }}>
              <span className="text-muted">Taille shortlist visée</span>
              <strong style={{ color: "#243445" }}>Top {current.shortlistSize}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-muted">Temps moyen / question</span>
              <strong style={{ color: "#243445" }}>
                {current.questions.length > 0
                  ? `${Math.round(current.durationMinutes / current.questions.length)} min`
                  : "—"}
              </strong>
            </div>
          </div>

          {/* Domaines évalués */}
          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #edf1f0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#667786", marginBottom: 8 }}>
              RÉPARTITION PAR DOMAINE
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(categoriesCount).map(([cat, count]) => (
                <span key={cat} className="badge tone-neutral" style={{ fontSize: 11 }}>
                  {cat} : {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Zone d'affichage et de prévisualisation */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Barre de contrôle des modes */}
        <div
          className="panel"
          style={{
            padding: "12px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Onglets de mode */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setActiveMode("exam")}
              className={`btn ${activeMode === "exam" ? "btn-primary" : "btn-secondary"}`}
              style={{ minHeight: 36, padding: "0 14px", fontSize: 12 }}
            >
              <Eye size={14} /> Vue Candidat (Épreuve)
            </button>
            <button
              onClick={() => setActiveMode("scoring")}
              className={`btn ${activeMode === "scoring" ? "btn-primary" : "btn-secondary"}`}
              style={{ minHeight: 36, padding: "0 14px", fontSize: 12 }}
            >
              <CheckCircle2 size={14} /> Corrigé & Barème RH
            </button>
            <button
              onClick={() => setActiveMode("spec")}
              className={`btn ${activeMode === "spec" ? "btn-primary" : "btn-secondary"}`}
              style={{ minHeight: 36, padding: "0 14px", fontSize: 12 }}
            >
              <Sparkles size={14} /> Fiche Pédagogique
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Link
              href={`/campaigns/${current.id}`}
              className="btn btn-secondary"
              style={{ minHeight: 36, fontSize: 12, padding: "0 14px" }}
            >
              Gérer la campagne →
            </Link>
          </div>
        </div>

        {/* CONTENU SELON LE MODE */}

        {/* Mode 1 : Vue Candidat (Épreuve brute) */}
        {activeMode === "exam" && (
          <div className="panel" style={{ padding: 32, background: "#fff" }}>
            <div style={{ borderBottom: "2px solid #e2e8e6", paddingBottom: 20, marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="badge tone-neutral" style={{ marginBottom: 6 }}>
                  {current.companyName}
                </span>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: "4px 0 6px", color: "#243445" }}>
                  {current.title}
                </h2>
                <div style={{ fontSize: 12, color: "#6e808e" }}>
                  Référence épreuve : <span className="mono">{current.reference}</span>
                </div>
              </div>

              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 4 }}>
                <span className="badge tone-amber" style={{ fontSize: 12, padding: "6px 12px" }}>
                  ⏱ Durée allouée : {current.durationMinutes} min
                </span>
                <span style={{ fontSize: 11, color: "#82929e" }}>
                  Barème global : {totalPoints} points
                </span>
              </div>
            </div>

            {current.questions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#8a969f" }}>
                <HelpCircle size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p>Aucune question n'a encore été rattachée à cette campagne.</p>
                <Link href={`/campaigns/${current.id}?tab=questions`} className="btn btn-primary" style={{ marginTop: 12 }}>
                  Composer le questionnaire
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
                {current.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    style={{
                      padding: "24px 28px",
                      borderRadius: 12,
                      border: "1.5px solid #e2e8e6",
                      background: "#ffffff",
                      boxShadow: "0 2px 8px rgba(30,45,60,0.03)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--green)", color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13 }}>
                          {idx + 1}
                        </span>
                        <span className="badge tone-neutral" style={{ fontSize: 12, padding: "4px 10px" }}>
                          {q.category}
                        </span>
                        {q.competency && (
                          <span style={{ fontSize: 12, color: "#61727f", fontWeight: 500 }}>
                            • {q.competency}
                          </span>
                        )}
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 13, color: "var(--deep)", background: "var(--mint)", padding: "4px 10px", borderRadius: 6 }}>
                        {q.points} pt{q.points > 1 ? "s" : ""}
                      </span>
                    </div>

                    <h4 style={{ fontSize: 16, fontWeight: 700, color: "#1e2f3e", margin: "0 0 18px", lineHeight: 1.5 }}>
                      {q.prompt}
                    </h4>

                    {/* Choix QCM */}
                    {q.choices && q.choices.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                        {q.choices.map((c, cIdx) => (
                          <div
                            key={cIdx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "12px 16px",
                              borderRadius: 8,
                              background: "#fbfcfc",
                              border: "1.5px solid #dce4e2",
                              fontSize: 14,
                              color: "#283949",
                              fontWeight: 500,
                            }}
                          >
                            <span style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #9fb1b4", display: "inline-block", flexShrink: 0 }} />
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Zone de rédaction */}
                    {!q.choices && (
                      <div
                        style={{
                          height: 100,
                          borderRadius: 8,
                          border: "1.5px dashed #c5d5d3",
                          background: "#fafcfb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#84989b",
                          fontSize: 13,
                          marginTop: 12,
                        }}
                      >
                        Zone de réponse développée réservée au candidat...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mode 2 : Corrigé & Barème RH */}
        {activeMode === "scoring" && (
          <div className="panel" style={{ padding: 32, background: "#fff" }}>
            <div style={{ borderBottom: "2px solid #e2e8e6", paddingBottom: 16, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className="badge tone-green" style={{ marginBottom: 6 }}>
                  DOCUMENT STRICTEMENT CONFIDENTIEL RH
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: "4px 0 0", color: "#243445" }}>
                  Barème & Critères d'évaluation — {current.title}
                </h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>
                  Total barème : {totalPoints} pts
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {current.questions.map((q, idx) => (
                <div
                  key={q.id}
                  style={{
                    padding: 20,
                    borderRadius: 10,
                    border: "1.5px solid #fed7aa",
                    background: "#fffaf5",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontWeight: 800, color: "#C45508", fontSize: 13 }}>
                        Question {idx + 1}
                      </span>
                      <span className="badge tone-neutral">{q.category}</span>
                      <span className="badge tone-blue">{q.difficulty}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: "#C45508", fontSize: 13 }}>
                      Barème : {q.points} points
                    </span>
                  </div>

                  <p style={{ margin: "0 0 12px", fontWeight: 600, color: "#263545", fontSize: 14 }}>
                    {q.prompt}
                  </p>

                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: 8,
                      border: "1px solid #fed7aa",
                      padding: "12px 16px",
                      fontSize: 13,
                    }}
                  >
                    <strong style={{ color: "#9a3412", display: "block", marginBottom: 4 }}>
                      🎯 Repère de correction RH attendu :
                    </strong>
                    <div style={{ color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                      {q.expectedAnswer || "Aucun critère spécifique renseigné dans le référentiel."}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mode 3 : Fiche Pédagogique & Objectifs */}
        {activeMode === "spec" && (
          <div className="panel" style={{ padding: 32, background: "#fff" }}>
            <div style={{ borderBottom: "2px solid #e2e8e6", paddingBottom: 16, marginBottom: 24 }}>
              <span className="badge tone-blue" style={{ marginBottom: 6 }}>
                FICHE DE CADRAGE ÉVALUATION
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: "4px 0 0", color: "#243445" }}>
                Objectifs & Structure de l'épreuve
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
              <div style={{ padding: 18, borderRadius: 10, background: "#f8faf9", border: "1px solid #e0e6e4" }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "#263445" }}>Sécurité & Anti-fraude</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#566875", lineHeight: 1.8 }}>
                  <li>Horodatage rigoureux de début et fin côté serveur PostgreSQL.</li>
                  <li>Sauvegarde incrémentale à chaque frappe du candidat.</li>
                  <li>Clôture automatique forcée à l'expiration des {current.durationMinutes} minutes.</li>
                  <li>Jeton d'accès unique chiffré à usage contrôlé.</li>
                </ul>
              </div>

              <div style={{ padding: 18, borderRadius: 10, background: "#f8faf9", border: "1px solid #e0e6e4" }}>
                <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "#263445" }}>Critères de sélection</h4>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#566875", lineHeight: 1.8 }}>
                  <li>Note minimale requise : <strong>{current.passingScore}%</strong> (soit {passingPoints} / {totalPoints} pts).</li>
                  <li>Capacité d'admissibilité en liste restreinte : <strong>Top {current.shortlistSize}</strong>.</li>
                  <li>Double classement consultable dans l'onglet Classement.</li>
                  <li>Notation individuelle avec traçabilité intégrale dans le journal d'audit.</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 style={{ margin: "0 0 12px", fontSize: 14, color: "#263445" }}>
                Détail des questions mobilisées ({current.questions.length})
              </h4>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e1e7e5", color: "#667786", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px" }}>#</th>
                    <th style={{ padding: "8px 10px" }}>Question</th>
                    <th style={{ padding: "8px 10px" }}>Domaine</th>
                    <th style={{ padding: "8px 10px" }}>Type</th>
                    <th style={{ padding: "8px 10px" }}>Difficulté</th>
                    <th style={{ padding: "8px 10px", textAlign: "right" }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {current.questions.map((q, idx) => (
                    <tr key={q.id} style={{ borderBottom: "1px solid #f0f3f2" }}>
                      <td style={{ padding: "10px", fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: "10px", color: "#263445", maxWidth: 300 }}>{q.prompt}</td>
                      <td style={{ padding: "10px" }}>{q.category}</td>
                      <td style={{ padding: "10px" }}>{q.kind}</td>
                      <td style={{ padding: "10px" }}>
                        <span className="badge tone-neutral">{q.difficulty}</span>
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: "var(--green)" }}>
                        {q.points} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}