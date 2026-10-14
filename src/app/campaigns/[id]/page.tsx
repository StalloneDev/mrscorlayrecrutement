import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { StatusSelector } from "@/components/StatusSelector";
import { CandidateRowActions } from "@/components/CandidateRowActions";
import { InviteCandidatesButton } from "@/components/InviteCandidatesButton";
import { EditCampaignButton } from "@/components/EditCampaignButton";
import { ImportCSVButton } from "@/components/ImportCSVButton";
import { CampaignQuestionsSelector } from "@/components/CampaignQuestionsSelector";
import { getCampaignById, updateCampaignStatusAction, updateCampaignQuestionsAction } from "@/actions/campaigns";
import { getQuestions } from "@/actions/questions";
import { getCandidatesByCampaign, addCandidateAction, generateInvitationsAction } from "@/actions/candidates";
import { getCampaignRankings } from "@/actions/grading";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Target,
  Users,
  Send,
  Plus,
  ShieldCheck,
  Award,
  CheckCircle,
  FileCheck,
  ExternalLink,
  Download,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id: campaignId } = await params;
  const { tab = "candidates" } = await searchParams;

  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    return (
      <div className="app-frame">
        <Sidebar />
        <main className="main-frame" style={{ padding: 40 }}>
          <h2>Campagne introuvable</h2>
          <Link href="/campaigns" className="btn btn-secondary" style={{ marginTop: 12 }}>
            <ArrowLeft size={16} /> Retour aux campagnes
          </Link>
        </main>
      </div>
    );
  }

  const allQuestions = await getQuestions(campaign.companyId);
  const candidates = await getCandidatesByCampaign(campaignId);
  const rankings = await getCampaignRankings(campaignId);

  // Actions serveur bindées
  async function handleStatusChange(formData: FormData) {
    "use server";
    const newStatus = formData.get("status") as string;
    await updateCampaignStatusAction(campaignId, newStatus);
  }

  async function handleQuestionSelection(formData: FormData) {
    "use server";
    const selected = formData.getAll("questionIds") as string[];
    await updateCampaignQuestionsAction(campaignId, selected);
  }

  async function handleInviteAll() {
    "use server";
    const pendingIds = candidates.filter((c) => c.status === "added").map((c) => c.id);
    if (pendingIds.length > 0) {
      await generateInvitationsAction(campaignId, pendingIds);
    }
  }

  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title={campaign.title} />
        <div className="content-area">
          <Link href="/campaigns" className="btn btn-quiet" style={{ padding: 0, minHeight: 32, marginBottom: 16 }}>
            <ArrowLeft size={15} /> Toutes les campagnes
          </Link>

          <div className="page-heading">
            <div>
              <div className="section-kicker">
                {campaign.companyName} • <span className="mono">{campaign.reference}</span>
              </div>
              <h1>{campaign.title}</h1>
              <p>{campaign.description || "Aucune description saisie."}</p>
            </div>

            {/* Actions d'en-tête & statut */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <EditCampaignButton campaign={campaign} />
              <form action={handleStatusChange} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className={`badge tone-${campaign.status === "published" ? "green" : campaign.status === "in_progress" ? "blue" : "neutral"}`}>
                  <i />
                  {campaign.status}
                </span>
                <StatusSelector currentStatus={campaign.status} />
              </form>
            </div>
          </div>

          {/* Cartes de synthèse */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 24 }}>
            <div className="panel" style={{ padding: "14px 18px" }}>
              <span style={{ fontSize: 11, color: "#8d979c" }}>Durée de l'épreuve</span>
              <strong style={{ fontSize: 18, color: "#2c3d4d", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Clock3 size={16} /> {campaign.durationMinutes} min
              </strong>
            </div>

            <div className="panel" style={{ padding: "14px 18px" }}>
              <span style={{ fontSize: 11, color: "#8d979c" }}>Seuil d'admissibilité</span>
              <strong style={{ fontSize: 18, color: "#2c3d4d", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Target size={16} /> {campaign.passingScore}%
              </strong>
            </div>

            <div className="panel" style={{ padding: "14px 18px" }}>
              <span style={{ fontSize: 11, color: "#8d979c" }}>Taille Top</span>
              <strong style={{ fontSize: 18, color: "#2c3d4d", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Award size={16} /> Top {campaign.shortlistSize}
              </strong>
            </div>

            <div className="panel" style={{ padding: "14px 18px" }}>
              <span style={{ fontSize: 11, color: "#8d979c" }}>Questions associées</span>
              <strong style={{ fontSize: 18, color: "#2c3d4d", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                {campaign.questionIds.length} question{campaign.questionIds.length > 1 ? "s" : ""}
              </strong>
            </div>

            <div className="panel" style={{ padding: "14px 18px" }}>
              <span style={{ fontSize: 11, color: "#8d979c" }}>Candidats inscrits</span>
              <strong style={{ fontSize: 18, color: "#2c3d4d", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Users size={16} /> {candidates.length}
              </strong>
            </div>
          </div>

          {/* Navigation Onglets */}
          <div style={{ display: "flex", gap: 20, borderBottom: "1px solid #dfe4e0", marginBottom: 20 }}>
            <Link
              href={`/campaigns/${campaignId}?tab=candidates`}
              style={{
                padding: "10px 4px",
                borderBottom: tab === "candidates" ? "2px solid #1d725e" : "2px solid transparent",
                fontWeight: 600,
                color: tab === "candidates" ? "#1d725e" : "#7a8791",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Candidats ({candidates.length})
            </Link>
            <Link
              href={`/campaigns/${campaignId}?tab=questions`}
              style={{
                padding: "10px 4px",
                borderBottom: tab === "questions" ? "2px solid #1d725e" : "2px solid transparent",
                fontWeight: 600,
                color: tab === "questions" ? "#1d725e" : "#7a8791",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Composition de l'épreuve ({campaign.questionIds.length})
            </Link>
            <Link
              href={`/campaigns/${campaignId}?tab=rankings`}
              style={{
                padding: "10px 4px",
                borderBottom: tab === "rankings" ? "2px solid #1d725e" : "2px solid transparent",
                fontWeight: 600,
                color: tab === "rankings" ? "#1d725e" : "#7a8791",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Classement & Présélection ({rankings.totalReviewed})
            </Link>
          </div>

          {/* Onglet 1 : CANDIDATS */}
          {tab === "candidates" && (
            <div>
              {/* Formulaire ajout candidat */}
              <div className="panel" style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px", color: "#2f4152" }}>
                  Ajouter un candidat
                </h2>
                <form
                  action={async (formData: FormData) => {
                    "use server";
                    await addCandidateAction(formData);
                  }}
                  style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}
                >
                  <input type="hidden" name="companyId" value={campaign.companyId} />
                  <input type="hidden" name="campaignId" value={campaign.id} />

                  <label className="field">
                    Prénom
                    <input name="firstName" required placeholder="Prénom" />
                  </label>
                  <label className="field">
                    Nom
                    <input name="lastName" required placeholder="Nom" />
                  </label>
                  <label className="field">
                    Adresse e-mail
                    <input type="email" name="email" required placeholder="prenom.nom@email.com" />
                  </label>
                  <label className="field">
                    Téléphone (facultatif)
                    <input name="phone" placeholder="+33 6 00 00 00 00" />
                  </label>

                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <button type="submit" className="btn btn-secondary" style={{ width: "100%" }}>
                      <Plus size={15} /> Inscrire le candidat
                    </button>
                  </div>
                </form>
              </div>

              {/* Actions groupées */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Liste des candidats</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ImportCSVButton campaignId={campaign.id} companyId={campaign.companyId} />
                  <InviteCandidatesButton campaignId={campaign.id} candidates={candidates} />
                </div>
              </div>

              {/* Tableau candidats */}
              <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f8f9f8", borderBottom: "1px solid #e2e6e3", color: "#647486" }}>
                      <th style={{ padding: "12px 18px" }}>CANDIDAT</th>
                      <th style={{ padding: "12px 18px" }}>STATUT</th>
                      <th style={{ padding: "12px 18px" }}>NOTE / 100</th>
                      <th style={{ padding: "12px 18px", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: "30px 18px", textAlign: "center", color: "#8d979c" }}>
                          Aucun candidat inscrit pour le moment.
                        </td>
                      </tr>
                    ) : (
                      candidates.map((c) => (
                        <tr key={c.id} style={{ borderBottom: "1px solid #edf0ec" }}>
                          <td style={{ padding: "14px 18px" }}>
                            <strong>{c.firstName} {c.lastName}</strong>
                            <div style={{ fontSize: 11, color: "#87929a" }}>{c.email} {c.phone && `• ${c.phone}`}</div>
                          </td>
                          <td style={{ padding: "14px 18px" }}>
                            <span className={`badge tone-${c.status === "reviewed" ? "green" : c.status === "in_progress" ? "blue" : c.status === "submitted" || c.status === "submitted_automatically" ? "amber" : "neutral"}`}>
                              <i />
                              {c.status}
                            </span>
                          </td>
                          <td style={{ padding: "14px 18px", fontWeight: "bold" }}>
                            {c.score !== null ? `${c.score}%` : "—"}
                          </td>
                          <td style={{ padding: "14px 18px", textAlign: "right" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                              {c.attemptId ? (
                                <Link href={`/review/${c.attemptId}`} className="btn btn-secondary" style={{ fontSize: 12, minHeight: 34 }}>
                                  <FileCheck size={14} /> Corriger / Consulter
                                </Link>
                              ) : (
                                <span style={{ fontSize: 12, color: "#9aa3a7" }}>Non démarré</span>
                              )}
                              <CandidateRowActions candidate={c} campaignId={campaign.id} />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Onglet 2 : COMPOSITION DE L'ÉPREUVE */}
          {tab === "questions" && (
            <div className="panel" style={{ padding: "24px 20px" }}>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 6px", color: "#1e293b" }}>
                  Composition de l&apos;épreuve &amp; Sélection des questions
                </h2>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                  Filtrez rapidement par <strong>Compétence évaluée</strong> ou mot-clé, cochez les questions du référentiel et enregistrez la composition de votre test.
                </p>
              </div>

              <CampaignQuestionsSelector
                campaignId={campaign.id}
                initialQuestionIds={campaign.questionIds || []}
                allQuestions={allQuestions}
              />
            </div>
          )}

          {/* Onglet 3 : DOUBLE CLASSEMENT (TOP 5 & ADMISSIBILITÉ) */}
          {tab === "rankings" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1e293b" }}>Classement et Résultats Officiels</h3>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>Double lecture : Top shortlist et admissibilité au seuil fixé.</p>
                </div>
                <a
                  href={`/api/export/${campaign.id}`}
                  className="btn btn-secondary"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}
                  download
                >
                  <Download size={15} /> Exporter les résultats (CSV)
                </a>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Vue A : TOP 5 */}
              <div className="panel">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Award size={20} style={{ color: "#c39446" }} />
                  <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#2f4152" }}>
                    Vue A — Top {campaign.shortlistSize} Officiel
                  </h2>
                </div>
                <p style={{ fontSize: 12, color: "#77838d", margin: "0 0 16px" }}>
                  Les {campaign.shortlistSize} meilleurs candidats parmi les notes validées par la RH.
                </p>

                {rankings.topCandidates.length === 0 ? (
                  <div style={{ padding: "30px 0", textAlign: "center", color: "#8d979c", fontSize: 13 }}>
                    Aucun résultat validé pour le Top {campaign.shortlistSize}.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {rankings.topCandidates.map((c) => (
                      <div
                        key={c.candidateId}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 8, background: "#fdfbf7", border: "1px solid #ebdcc5" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#c39446", color: "white", display: "grid", placeItems: "center", fontWeight: "bold", fontSize: 12 }}>
                            {c.rank}
                          </span>
                          <strong>{c.name}</strong>
                        </div>
                        <strong style={{ fontSize: 16, color: "#1d725e" }}>{c.score}%</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vue B : CANDIDATS ADMISSIBLES */}
              <div className="panel">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <CheckCircle size={20} style={{ color: "#1d725e" }} />
                  <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#2f4152" }}>
                    Vue B — Admissibles (≥ {campaign.passingScore}%)
                  </h2>
                </div>
                <p style={{ fontSize: 12, color: "#77838d", margin: "0 0 16px" }}>
                  Tous les candidats ayant atteint ou dépassé le seuil de réussite de la campagne.
                </p>

                {rankings.eligibleCandidates.length === 0 ? (
                  <div style={{ padding: "30px 0", textAlign: "center", color: "#8d979c", fontSize: 13 }}>
                    Aucun candidat n'a encore atteint le seuil d'admissibilité ({campaign.passingScore}%).
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {rankings.eligibleCandidates.map((c) => (
                      <div
                        key={c.candidateId}
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 8, background: "#f4f9f6", border: "1px solid #cce5d7" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "#1d725e", color: "white", display: "grid", placeItems: "center", fontWeight: "bold", fontSize: 12 }}>
                            {c.rank}
                          </span>
                          <strong>{c.name}</strong>
                        </div>
                        <strong style={{ fontSize: 16, color: "#1d725e" }}>{c.score}%</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
