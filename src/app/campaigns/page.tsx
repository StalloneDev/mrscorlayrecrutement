import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { CompanyFilter } from "@/components/CompanyFilter";
import { getCompanies, getCampaigns, createCampaignAction } from "@/actions/campaigns";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Plus,
  ArrowUpRight,
  Clock3,
  Users,
  Target,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const { companyId } = await searchParams;
  const companies = await getCompanies();
  const campaigns = await getCampaigns(companyId);

  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Campagnes de recrutement" />
        <div className="content-area">
          <div className="page-heading">
            <div>
              <div className="section-kicker">PILOTAGE DU RECRUTEMENT</div>
              <h1>Campagnes</h1>
              <p>Créez, configurez et suivez vos campagnes pour MRS et CORLAY.</p>
            </div>

            {/* Filtre Société */}
            <div style={{ display: "flex", gap: 12 }}>
              <CompanyFilter
                companies={companies}
                defaultValue={companyId || ""}
                placeholder="Toutes les entités"
              />
            </div>
          </div>

          {/* Formulaire Création Rapide Stylisé */}
          <div className="form-card">
            <div className="form-card-header">
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#243445" }}>
                  Créer une nouvelle campagne
                </h2>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#748593" }}>
                  Définissez l'intitulé, la durée et les seuils d'évaluation pour MRS ou CORLAY.
                </p>
              </div>
              <span className="badge tone-green">Nouveau</span>
            </div>

            <form
              action={async (formData: FormData) => {
                "use server";
                await createCampaignAction(formData);
              }}
            >
              <div className="form-card-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <label className="field">
                  Société bénéficiaire *
                  <select name="companyId" required defaultValue={companies[0]?.id || ""}>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  Intitulé du poste *
                  <input name="title" required placeholder="Ex. Responsable Logistique" />
                </label>

                <label className="field">
                  Référence interne *
                  <input name="reference" required placeholder="Ex. COR-2026-LOG" />
                </label>

                <label className="field">
                  Durée de l'épreuve (minutes) *
                  <input type="number" name="durationMinutes" defaultValue={45} min={5} max={300} required />
                  <span className="field-hint">Chronométré côté serveur</span>
                </label>

                <label className="field">
                  Seuil de réussite (%) *
                  <input type="number" name="passingScore" defaultValue={60} min={1} max={100} required />
                  <span className="field-hint">Candidats admissibles</span>
                </label>

                <label className="field">
                  Taille du Top pré-sélectionné *
                  <input type="number" name="shortlistSize" defaultValue={5} min={1} max={50} required />
                  <span className="field-hint">Ex: Top 5 meilleurs scores</span>
                </label>
              </div>

              <div className="form-card-footer">
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} /> Enregistrer et publier la campagne
                </button>
              </div>
            </form>
          </div>

          {/* Grille des campagnes existantes */}
          <div style={{ display: "grid", gap: 14 }}>
            {campaigns.length === 0 ? (
              <div className="panel" style={{ textAlign: "center", padding: "40px 0", color: "#87939d" }}>
                <BriefcaseBusiness size={32} style={{ margin: "0 auto 12px", color: "#1d725e" }} />
                <h3>Aucune campagne pour le moment</h3>
                <p>Utilisez le formulaire ci-dessus pour lancer votre première campagne.</p>
              </div>
            ) : (
              campaigns.map((c) => (
                <div
                  key={c.id}
                  className="panel"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", transition: "transform 0.15s, border-color 0.15s" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: c.companyAccent ? `${c.companyAccent}20` : "#e4f0e7", color: c.companyAccent || "#2e715d", display: "grid", placeItems: "center", fontWeight: "bold", fontSize: 16 }}>
                      {c.companyName.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#324658" }}>{c.title}</h3>
                        <span className={`badge tone-${c.status === "published" ? "green" : c.status === "in_progress" ? "blue" : "neutral"}`}>
                          <i />
                          {c.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#87929a", marginTop: 4 }}>
                        {c.companyName} • <span className="mono">{c.reference}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "right" }}>
                      <span style={{ fontSize: 11, color: "#8d979c" }}>Durée de l'épreuve</span>
                      <strong style={{ fontSize: 14, color: "#35495a", display: "flex", alignItems: "center", gap: 5 }}>
                        <Clock3 size={14} /> {c.durationMinutes} min
                      </strong>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "right" }}>
                      <span style={{ fontSize: 11, color: "#8d979c" }}>Seuil d'admissibilité</span>
                      <strong style={{ fontSize: 14, color: "#35495a", display: "flex", alignItems: "center", gap: 5 }}>
                        <Target size={14} /> {c.passingScore}%
                      </strong>
                    </div>

                    <Link href={`/campaigns/${c.id}`} className="btn btn-secondary">
                      Gérer la campagne <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
