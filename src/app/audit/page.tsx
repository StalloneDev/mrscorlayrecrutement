import { db, auditLogsTable, companiesTable, staffUsersTable } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { CompanyFilter } from "@/components/CompanyFilter";
import { ShieldAlert, Activity, Building2, User } from "lucide-react";

interface Props {
  searchParams: Promise<{ companyId?: string }>;
}

export default async function AuditPage({ searchParams }: Props) {
  const { companyId } = await searchParams;

  const companies = await db.select().from(companiesTable);

  const rawLogs = await db
    .select({
      id: auditLogsTable.id,
      action: auditLogsTable.action,
      entityType: auditLogsTable.entityType,
      entityId: auditLogsTable.entityId,
      detail: auditLogsTable.detail,
      createdAt: auditLogsTable.createdAt,
      companyId: auditLogsTable.companyId,
      companyName: companiesTable.name,
      companyCode: companiesTable.code,
    })
    .from(auditLogsTable)
    .leftJoin(companiesTable, eq(auditLogsTable.companyId, companiesTable.id))
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(100);

  let logs = rawLogs;
  if (companyId) {
    logs = logs.filter((l) => l.companyId === companyId);
  }

  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Journal d'audit & Traçabilité" />
        <div className="content-area">
          <div className="page-heading">
            <div>
              <div className="section-kicker">CONFORMITÉ & SÉCURITÉ</div>
              <h1>Journal d'Audit</h1>
              <p>Traçabilité intégrale et horodatage de toutes les actions sensibles pour MRS & CORLAY.</p>
            </div>

            {/* Filtre société */}
            <CompanyFilter
              companies={companies}
              defaultValue={companyId || ""}
              placeholder="Toutes les sociétés"
            />
          </div>

          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#4d5e6c" }}>
                Derniers événements ({logs.length})
              </div>
            </div>

            {logs.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "#8a969f" }}>
                <Activity size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p>Aucun événement consigné pour le moment.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e0e5e2", color: "#667784" }}>
                      <th style={{ padding: "10px 14px" }}>Date & Heure</th>
                      <th style={{ padding: "10px 14px" }}>Action</th>
                      <th style={{ padding: "10px 14px" }}>Entité</th>
                      <th style={{ padding: "10px 14px" }}>Société</th>
                      <th style={{ padding: "10px 14px" }}>Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: "1px solid #f0f3f2" }}>
                        <td style={{ padding: "12px 14px", color: "#4d5e6c", whiteSpace: "nowrap" }}>
                          {new Date(log.createdAt).toLocaleString("fr-FR")}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span className="badge tone-blue">
                            <i />
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#34485a", fontWeight: 500 }}>
                          {log.entityType}
                          {log.entityId && (
                            <div style={{ fontSize: 10, color: "#8a969f", fontFamily: "monospace" }}>
                              {log.entityId}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          {log.companyName ? (
                            <span className="badge tone-neutral">{log.companyName}</span>
                          ) : (
                            <span style={{ color: "#a5b1b7" }}>Global</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#6a7b87", fontSize: 11, fontFamily: "monospace" }}>
                          {JSON.stringify(log.detail)}
                        </td>
                      </tr>
                    ))}
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