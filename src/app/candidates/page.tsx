import { db, candidatesTable, campaignsTable, companiesTable, assessmentAttemptsTable } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { Users, Mail, Phone, ExternalLink, Clock, CheckCircle } from "lucide-react";

interface Props {
  searchParams: Promise<{ companyId?: string; search?: string }>;
}

export default async function CandidatesPage({ searchParams }: Props) {
  const { companyId, search } = await searchParams;

  const companies = await db.select().from(companiesTable);

  const rawCandidates = await db
    .select({
      id: candidatesTable.id,
      firstName: candidatesTable.firstName,
      lastName: candidatesTable.lastName,
      email: candidatesTable.email,
      phone: candidatesTable.phone,
      status: candidatesTable.status,
      score: candidatesTable.score,
      companyId: candidatesTable.companyId,
      campaignId: candidatesTable.campaignId,
      createdAt: candidatesTable.createdAt,
      campaignTitle: campaignsTable.title,
      companyName: companiesTable.name,
      companyCode: companiesTable.code,
    })
    .from(candidatesTable)
    .leftJoin(campaignsTable, eq(candidatesTable.campaignId, campaignsTable.id))
    .leftJoin(companiesTable, eq(candidatesTable.companyId, companiesTable.id))
    .orderBy(desc(candidatesTable.createdAt));

  let candidates = rawCandidates;
  if (companyId) {
    candidates = candidates.filter((c) => c.companyId === companyId);
  }
  if (search) {
    const q = search.toLowerCase();
    candidates = candidates.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.campaignTitle && c.campaignTitle.toLowerCase().includes(q))
    );
  }

  const attempts = await db.select().from(assessmentAttemptsTable);
  const attemptsMap = Object.fromEntries(attempts.map((a) => [a.candidateId, a.id]));

  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Candidats" />
        <div className="content-area">
          <div className="page-heading">
            <div>
              <div className="section-kicker">SUIVI DES POSTULANTS</div>
              <h1>Vivier des Candidats</h1>
              <p>Consultez la liste complète des candidats inscrits sur MRS & CORLAY.</p>
            </div>

            {/* Filtres */}
            <form method="get" style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                name="search"
                defaultValue={search || ""}
                placeholder="Rechercher par nom, email..."
                style={{ height: 40, padding: "0 14px", borderRadius: 8, border: "1px solid #dce2e2", background: "white", fontSize: 13 }}
              />
              <select
                name="companyId"
                defaultValue={companyId || ""}
                style={{ height: 40, padding: "0 14px", borderRadius: 8, border: "1px solid #dce2e2", background: "white", fontSize: 13, color: "#34485a", cursor: "pointer" }}
              >
                <option value="">Toutes les sociétés</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-primary" style={{ minHeight: 40, padding: "0 16px" }}>
                Filtrer
              </button>
            </form>
          </div>

          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#4d5e6c" }}>
                Total : {candidates.length} candidat{candidates.length > 1 ? "s" : ""}
              </div>
            </div>

            {candidates.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#8a969f" }}>
                <Users size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p>Aucun candidat trouvé pour cette sélection.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e0e5e2", color: "#667784" }}>
                      <th style={{ padding: "10px 14px" }}>Candidat</th>
                      <th style={{ padding: "10px 14px" }}>Société & Campagne</th>
                      <th style={{ padding: "10px 14px" }}>Statut</th>
                      <th style={{ padding: "10px 14px" }}>Note</th>
                      <th style={{ padding: "10px 14px" }}>Date d'ajout</th>
                      <th style={{ padding: "10px 14px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => {
                      const attemptId = attemptsMap[c.id];
                      return (
                        <tr key={c.id} style={{ borderBottom: "1px solid #f0f3f2" }}>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontWeight: 600, color: "#293b4c" }}>
                              {c.firstName} {c.lastName}
                            </div>
                            <div style={{ fontSize: 11, color: "#77838e", display: "flex", gap: 8, marginTop: 2 }}>
                              <span>{c.email}</span>
                              {c.phone && <span>• {c.phone}</span>}
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span className="badge tone-neutral" style={{ marginBottom: 4 }}>
                              {c.companyName}
                            </span>
                            <div style={{ fontSize: 12, color: "#34485a", fontWeight: 500 }}>
                              <Link href={`/campaigns/${c.campaignId}`} style={{ color: "inherit", textDecoration: "none" }}>
                                {c.campaignTitle}
                              </Link>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <span
                              className={`badge tone-${
                                c.status === "reviewed"
                                  ? "green"
                                  : c.status === "in_progress"
                                  ? "blue"
                                  : c.status === "submitted" || c.status === "submitted_automatically"
                                  ? "amber"
                                  : "neutral"
                              }`}
                            >
                              <i />
                              {c.status === "added" && "Inscrit"}
                              {c.status === "invited" && "Invité"}
                              {c.status === "in_progress" && "En cours"}
                              {c.status === "submitted" && "Soumis"}
                              {c.status === "submitted_automatically" && "Soumis auto."}
                              {c.status === "reviewed" && "Évalué"}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            {c.score !== null ? (
                              <span style={{ fontWeight: 700, color: c.score >= 60 ? "#B44E09" : "#ad4946" }}>
                                {c.score}%
                              </span>
                            ) : (
                              <span style={{ color: "#a5b1b7" }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px", color: "#6a7b87", fontSize: 12 }}>
                            {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                          </td>
                          <td style={{ padding: "12px 14px", textAlign: "right" }}>
                            {attemptId ? (
                              <Link href={`/review/${attemptId}`} className="btn btn-secondary" style={{ minHeight: 32, padding: "0 10px", fontSize: 11 }}>
                                Évaluer / Revoir
                              </Link>
                            ) : (
                              <Link href={`/campaigns/${c.campaignId}`} className="btn btn-quiet" style={{ minHeight: 32, padding: "0 8px", fontSize: 11 }}>
                                Voir campagne
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}