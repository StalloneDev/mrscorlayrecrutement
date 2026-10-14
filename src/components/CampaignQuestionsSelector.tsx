"use client";

import { useState, useTransition, useMemo } from "react";
import { updateCampaignQuestionsAction } from "@/actions/campaigns";
import {
  Search,
  Filter,
  CheckCircle2,
  CheckSquare,
  Square,
  Award,
  Layers,
  Save,
  Tag,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface Question {
  id: string;
  prompt: string;
  kind: string;
  points: number;
  category: string;
  competency: string;
  difficulty: string;
  companyName?: string | null;
}

interface CampaignQuestionsSelectorProps {
  campaignId: string;
  initialQuestionIds: string[];
  allQuestions: Question[];
}

export function CampaignQuestionsSelector({
  campaignId,
  initialQuestionIds,
  allQuestions,
}: CampaignQuestionsSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialQuestionIds)
  );
  const [selectedCompetency, setSelectedCompetency] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Extraire toutes les compétences uniques existantes
  const competencies = useMemo(() => {
    const set = new Set<string>();
    for (const q of allQuestions) {
      if (q.competency && q.competency.trim()) {
        set.add(q.competency.trim());
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [allQuestions]);

  // Nombre de questions par compétence
  const countsByCompetency = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of allQuestions) {
      const comp = q.competency?.trim() || "Sans compétence";
      counts[comp] = (counts[comp] || 0) + 1;
    }
    return counts;
  }, [allQuestions]);

  // Filtrage combiné par compétence et mot-clé
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      const matchComp =
        selectedCompetency === "all" ||
        (selectedCompetency === "none"
          ? !q.competency || !q.competency.trim()
          : q.competency?.trim() === selectedCompetency);

      const query = searchQuery.trim().toLowerCase();
      const matchQuery =
        !query ||
        q.prompt.toLowerCase().includes(query) ||
        (q.category && q.category.toLowerCase().includes(query)) ||
        (q.competency && q.competency.toLowerCase().includes(query));

      return matchComp && matchQuery;
    });
  }, [allQuestions, selectedCompetency, searchQuery]);

  // Calculs du barème en temps réel
  const totalSelectedPoints = useMemo(() => {
    let sum = 0;
    for (const q of allQuestions) {
      if (selectedIds.has(q.id)) {
        sum += q.points;
      }
    }
    return sum;
  }, [allQuestions, selectedIds]);

  // Toggle d'une question
  const toggleQuestion = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setSavedMessage(null);
  };

  // Sélection rapide pour les questions actuellement filtrées
  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const q of filteredQuestions) {
        next.add(q.id);
      }
      return next;
    });
    setSavedMessage(null);
  };

  const deselectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const q of filteredQuestions) {
        next.delete(q.id);
      }
      return next;
    });
    setSavedMessage(null);
  };

  // Enregistrement
  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateCampaignQuestionsAction(campaignId, Array.from(selectedIds));
        setSavedMessage(
          `✓ Composition mise à jour : ${selectedIds.size} question(s) sélectionnée(s) (${totalSelectedPoints} points)`
        );
        setTimeout(() => setSavedMessage(null), 5000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement.";
        alert("Erreur : " + msg);
      }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── BARRE DE RÉSUMÉ ET D'ACTION FIXE / FLOTTANTE ─────────────────── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Questions sélectionnées
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", marginTop: 2 }}>
              {selectedIds.size}{" "}
              <span style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }}>
                / {allQuestions.length} disponible(s)
              </span>
            </div>
          </div>

          <div style={{ width: 1, height: 32, background: "#e2e8f0" }} />

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              Barème cumulé
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#E06810", marginTop: 2 }}>
              {totalSelectedPoints}{" "}
              <span style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }}>points</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {savedMessage && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#059669",
                background: "#ecfdf5",
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #a7f3d0",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <CheckCircle2 size={15} /> {savedMessage}
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="btn btn-primary"
            style={{
              fontSize: 13,
              fontWeight: 700,
              padding: "10px 20px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Save size={15} />
            {isPending ? "Enregistrement..." : "Enregistrer la composition"}
          </button>
        </div>
      </div>

      {/* ── BARRE DE RECHERCHE ET FILTRE PAR COMPÉTENCE ───────────────────── */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
          {/* 1. Sélecteur par compétence */}
          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              <Filter size={14} style={{ color: "#E06810" }} />
              Filtrer par Compétence évaluée :
            </label>
            <select
              value={selectedCompetency}
              onChange={(e) => setSelectedCompetency(e.target.value)}
              style={{
                width: "100%",
                height: 40,
                borderRadius: 8,
                border: "1.5px solid #cbd5e1",
                padding: "0 12px",
                fontSize: 13,
                fontWeight: 600,
                color: "#1e293b",
                background: "#f8fafc",
                cursor: "pointer",
              }}
            >
              <option value="all">
                ✦ Toutes les compétences ({allQuestions.length} questions)
              </option>
              {competencies.map((comp) => (
                <option key={comp} value={comp}>
                  {comp} ({countsByCompetency[comp] || 0} questions)
                </option>
              ))}
              {countsByCompetency["Sans compétence"] && (
                <option value="none">
                  (Non renseignée) ({countsByCompetency["Sans compétence"]})
                </option>
              )}
            </select>
          </div>

          {/* 2. Recherche textuelle */}
          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              <Search size={14} style={{ color: "#64748b" }} />
              Rechercher dans l'énoncé :
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Mot-clé dans la question, catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  borderRadius: 8,
                  border: "1.5px solid #cbd5e1",
                  padding: "0 12px",
                  fontSize: 13,
                  boxSizing: "border-box",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Boutons d'action rapide pour la sélection courante */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 10,
            paddingTop: 10,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Affichage de <strong>{filteredQuestions.length}</strong> question(s) sur{" "}
            {allQuestions.length}
            {selectedCompetency !== "all" && (
              <span style={{ marginLeft: 6, color: "#E06810", fontWeight: 700 }}>
                • Compétence : « {selectedCompetency} »
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={selectAllFiltered}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <CheckSquare size={14} /> Tout cocher affiché ({filteredQuestions.length})
            </button>
            <button
              type="button"
              onClick={deselectAllFiltered}
              className="btn btn-secondary"
              style={{ fontSize: 12, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Square size={14} /> Tout décocher affiché
            </button>
          </div>
        </div>
      </div>

      {/* ── LISTE DES QUESTIONS ───────────────────────────────────────────── */}
      <div style={{ display: "grid", gap: 10 }}>
        {filteredQuestions.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              border: "1px dashed #cbd5e1",
              borderRadius: 12,
              padding: "48px 20px",
              textAlign: "center",
              color: "#64748b",
            }}
          >
            <HelpCircle size={36} style={{ color: "#94a3b8", margin: "0 auto 10px" }} />
            <h4 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
              Aucune question trouvée
            </h4>
            <p style={{ margin: 0, fontSize: 13 }}>
              Modifiez vos filtres de recherche ou sélectionnez une autre compétence.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isChecked = selectedIds.has(q.id);
            return (
              <div
                key={q.id}
                onClick={() => toggleQuestion(q.id)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "16px 18px",
                  borderRadius: 10,
                  border: isChecked ? "2px solid #E06810" : "1.5px solid #e2e8f0",
                  background: isChecked ? "#fffaf5" : "#ffffff",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isChecked
                    ? "0 4px 12px rgba(224, 104, 16, 0.08)"
                    : "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ paddingTop: 2 }}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // géré par le wrapper
                    style={{
                      width: 19,
                      height: 19,
                      accentColor: "#E06810",
                      cursor: "pointer",
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: isChecked ? "#1e293b" : "#334155",
                      lineHeight: 1.5,
                      marginBottom: 8,
                    }}
                  >
                    {q.prompt}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                    {/* Badge Compétence mis en valeur */}
                    {q.competency ? (
                      <span
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Award size={12} /> {q.competency}
                      </span>
                    ) : (
                      <span
                        style={{
                          background: "#f1f5f9",
                          color: "#64748b",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                        }}
                      >
                        Général
                      </span>
                    )}

                    {/* Catégorie */}
                    {q.category && (
                      <span
                        style={{
                          background: "#f8fafc",
                          color: "#475569",
                          border: "1px solid #e2e8f0",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {q.category}
                      </span>
                    )}

                    {/* Type de question */}
                    <span
                      style={{
                        background: "#fafaf9",
                        color: "#78716c",
                        border: "1px solid #e7e5e4",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                      }}
                    >
                      {q.kind === "single_choice"
                        ? "QCM unique"
                        : q.kind === "multiple_choice"
                        ? "QCM multiple"
                        : q.kind === "true_false"
                        ? "Vrai/Faux"
                        : q.kind === "number"
                        ? "Numérique"
                        : "Rédaction"}
                    </span>

                    {/* Difficulté */}
                    <span
                      style={{
                        background:
                          q.difficulty === "easy"
                            ? "#ecfdf5"
                            : q.difficulty === "hard"
                            ? "#fef2f2"
                            : "#fffbeb",
                        color:
                          q.difficulty === "easy"
                            ? "#047857"
                            : q.difficulty === "hard"
                            ? "#b91c1c"
                            : "#b45309",
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {q.difficulty === "easy"
                        ? "Facile"
                        : q.difficulty === "hard"
                        ? "Avancé"
                        : "Moyen"}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <strong
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: isChecked ? "#E06810" : "#475569",
                    }}
                  >
                    {q.points} pt{q.points > 1 ? "s" : ""}
                  </strong>
                  {isChecked && (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#E06810",
                        background: "#ffedd5",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      ✓ Sélectionnée
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── BOUTON ENREGISTRER INFÉRIEUR ──────────────────────────────────── */}
      {filteredQuestions.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="btn btn-primary"
            style={{
              fontSize: 14,
              fontWeight: 700,
              padding: "12px 28px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(224, 104, 16, 0.3)",
            }}
          >
            <Save size={16} />
            {isPending ? "Enregistrement..." : "Enregistrer la composition de l'épreuve"}
          </button>
        </div>
      )}
    </div>
  );
}
