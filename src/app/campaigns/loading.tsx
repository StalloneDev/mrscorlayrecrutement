import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function CampaignsLoading() {
  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Chargement..." />
        <div className="content-area">
          <div className="page-heading">
            <div>
              <div className="skeleton" style={{ height: 12, width: 140, marginBottom: 8 }} />
              <div className="skeleton skeleton-title" style={{ width: 240 }} />
              <div className="skeleton skeleton-text" style={{ width: 280 }} />
            </div>
            <div className="skeleton" style={{ width: 170, height: 42, borderRadius: 8 }} />
          </div>

          {/* Squelette Formulaire */}
          <div className="skeleton-card" style={{ marginBottom: 28 }}>
            <div className="skeleton skeleton-title" style={{ width: 200, marginBottom: 16 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton" style={{ height: 58, borderRadius: 8 }} />
              ))}
            </div>
          </div>

          {/* Squelette Liste Campagnes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="panel" style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 10 }} />
                  <div>
                    <div className="skeleton" style={{ width: 180, height: 16, marginBottom: 8 }} />
                    <div className="skeleton" style={{ width: 260, height: 12 }} />
                  </div>
                </div>
                <div className="skeleton" style={{ width: 90, height: 32, borderRadius: 6 }} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}