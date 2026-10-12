import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function DashboardLoading() {
  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Chargement..." />
        <div className="content-area">
          <div className="page-heading">
            <div style={{ width: "100%", maxWidth: 360 }}>
              <div className="skeleton" style={{ height: 12, width: 120, marginBottom: 8 }} />
              <div className="skeleton skeleton-title" style={{ width: 220 }} />
              <div className="skeleton skeleton-text" style={{ width: "90%" }} />
            </div>
            <div className="skeleton" style={{ width: 180, height: 40, borderRadius: 8 }} />
          </div>

          {/* Squelette Cartes Métriques */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 28 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="panel" style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div className="skeleton" style={{ width: 90, height: 12 }} />
                  <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 8 }} />
                </div>
                <div className="skeleton" style={{ width: 50, height: 32, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: 110, height: 12 }} />
              </div>
            ))}
          </div>

          {/* Squelette Panneau Principal */}
          <div className="panel" style={{ padding: 26 }}>
            <div className="skeleton skeleton-title" style={{ width: 260, marginBottom: 20 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8 }} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}