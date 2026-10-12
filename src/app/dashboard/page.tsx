import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { CompanyFilter } from "@/components/CompanyFilter";
import { getCompanies, getCampaigns } from "@/actions/campaigns";
import { db, candidatesTable, assessmentAttemptsTable } from "@/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Users,
  Activity,
  FileText,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const { companyId } = await searchParams;
  const companies = await getCompanies();
  const campaigns = await getCampaigns(companyId);

  // Statistiques globales
  const allCandidates = await db.select().from(candidatesTable);
  const filteredCandidates = companyId
    ? allCandidates.filter((c) => c.companyId === companyId)
    : allCandidates;

  const totalInvited = filteredCandidates.filter((c) => c.status === "invited").length;
  const testsInProgress = filteredCandidates.filter((c) => c.status === "in_progress").length;
  const awaitingReview = filteredCandidates.filter((c) =>
    ["submitted", "submitted_automatically"].includes(c.status)
  ).length;
  const activeCampaigns = campaigns.filter((c) => ["published", "in_progress"].includes(c.status)).length;

  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Vue d'ensemble" />
        <div className="content-area">
          <div className="page-heading">
            <div>
              <div className="section-kicker">ESPACE DE TRAVAIL</div>
              <h1>Vue d'ensemble</h1>
              <p>Pilotez vos recrutements pour MRS et CORLAY en temps réel.</p>
            </div>

            {/* Sélecteur de Société */}
            <CompanyFilter
              companies={companies}
              defaultValue={companyId || ""}
              placeholder="Toutes les sociétés (MRS & CORLAY)"
            />
          </div>

          {/* Cartes Métriques */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#e2f1e7", color: "#276d5a", display: "grid", placeItems: "center" }}>
                <BriefcaseBusiness size={18} />
              </div>
              <span style={{ fontSize: 13, color: "#77838d" }}>Campagnes actives</span>
              <strong style={{ fontSize: 32, fontWeight: 800, color: "#2c3d4d" }}>{activeCampaigns}</strong>
              <small style={{ fontSize: 11, color: "#9aa3a7" }}>En cours d'évaluation</small>
            </div>

            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#f6efdf", color: "#9b7133", display: "grid", placeItems: "center" }}>
                <Users size={18} />
              </div>
              <span style={{ fontSize: 13, color: "#77838d" }}>Candidatures invitées</span>
              <strong style={{ fontSize: 32, fontWeight: 800, color: "#2c3d4d" }}>{totalInvited}</strong>
              <small style={{ fontSize: 11, color: "#9aa3a7" }}>En attente de démarrage</small>
            </div>

            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#e9eff3", color: "#52708b", display: "grid", placeItems: "center" }}>
                <Activity size={18} />
              </div>
              <span style={{ fontSize: 13, color: "#77838d" }}>Tests en cours</span>
              <strong style={{ fontSize: 32, fontWeight: 800, color: "#2c3d4d" }}>{testsInProgress}</strong>
              <small style={{ fontSize: 11, color: "#9aa3a7" }}>Chronomètre serveur actif</small>
            </div>

            <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "#f8ebe5", color: "#a76151", display: "grid", placeItems: "center" }}>
                <FileText size={18} />
              </div>
              <span style={{ fontSize: 13, color: "#77838d" }}>Copies à évaluer</span>
              <strong style={{ fontSize: 32, fontWeight: 800, color: "#2c3d4d" }}>{awaitingReview}</strong>
              <small style={{ fontSize: 11, color: "#9aa3a7" }}>En attente de notation RH</small>
            </div>
          </div>

          {/* Liste des campagnes récentes */}
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: 20 }}>
            <div className="panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div>
                  <span className="section-kicker">ACTIVITÉ RÉCENTE</span>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: "4px 0 0", color: "#2f4152" }}>Campagnes récentes</h2>
                </div>
                <Link href="/campaigns" className="btn btn-quiet" style={{ fontSize: 12 }}>
                  Toutes les campagnes <ArrowRight size={14} />
                </Link>
              </div>

              {campaigns.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "#87939d" }}>
                  <p>Aucune campagne créée pour cette société.</p>
                  <Link href="/campaigns" className="btn btn-secondary" style={{ marginTop: 10 }}>
                    Créer une campagne
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {campaigns.slice(0, 5).map((c) => (
                    <Link
                      key={c.id}
                      href={`/campaigns/${c.id}`}
                      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 8px", borderBottom: "1px solid #edf0ec", textDecoration: "none", color: "inherit" }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: c.companyAccent ? `${c.companyAccent}20` : "#e7f1e9", color: c.companyAccent || "#357863", display: "grid", placeItems: "center", fontWeight: "bold" }}>
                        {c.companyName.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: "#344658" }}>{c.title}</div>
                        <div style={{ fontSize: 12, color: "#87929a" }}>
                          {c.companyName} • <span className="mono">{c.reference}</span>
                        </div>
                      </div>
                      <span className={`badge tone-${c.status === "published" ? "green" : c.status === "in_progress" ? "blue" : "neutral"}`}>
                        <i />
                        {c.status}
                      </span>
                      <ArrowUpRight size={16} style={{ color: "#9eaaa9" }} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Panneau Point d'attention */}
            <div className="panel" style={{ background: "#edf2ed", borderColor: "#dce5dd" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#76867f", fontSize: 11, fontWeight: "bold" }}>
                <Sparkles size={16} style={{ color: "#27745e" }} />
                <span>POINT D'ATTENTION RH</span>
              </div>
              <h3 style={{ fontSize: 18, color: "#314755", margin: "14px 0 8px" }}>
                {awaitingReview > 0
                  ? `${awaitingReview} copie${awaitingReview > 1 ? "s" : ""} en attente de correction`
                  : "Toutes les copies sont corrigées"}
              </h3>
              <p style={{ fontSize: 13, color: "#718079", lineHeight: 1.6, margin: "0 0 20px" }}>
                {awaitingReview > 0
                  ? "Des candidats ont terminé leur évaluation. Notez les questions ouvertes et validez la notation pour alimenter le classement officiel Top 5."
                  : "Aucune évaluation n'attend de correction manuelle. Les nouvelles soumissions apparaîtront automatiquement ici."}
              </p>
              <Link href="/campaigns" className="btn btn-primary" style={{ fontSize: 12 }}>
                Accéder aux campagnes <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
