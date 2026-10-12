import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function CompositionLoading() {
  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Chargement..." />
        <div className="content-area">
          <div className="page-heading">
            <div>
              <div className="skeleton" style={{ height: 12, width: 140, marginBottom: 8 }} />
              <div className="skeleton skeleton-title" style={{ width: 280 }} />
              <div className="skeleton skeleton-text" style={{ width: 340 }} />
            </div>
          </div>

          <div style={{ width: "100%", display: "grid", gridTemplateColumns: "260px minmax(0, 1fr)", gap: 20, alignItems: "start" }}>
            {/* Colonne Gauche */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="panel" style={{ padding: 18 }}>
                <div className="skeleton" style={{ width: 140, height: 12, marginBottom: 14 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton" style={{ height: 68, borderRadius: 8 }} />
                  ))}
                </div>
              </div>

              <div className="panel" style={{ padding: 20 }}>
                <div className="skeleton" style={{ width: 160, height: 14, marginBottom: 16 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton" style={{ height: 20 }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Colonne Droite */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="panel" style={{ padding: "12px 18px", display: "flex", gap: 8 }}>
                <div className="skeleton" style={{ width: 140, height: 36, borderRadius: 8 }} />
                <div className="skeleton" style={{ width: 140, height: 36, borderRadius: 8 }} />
                <div className="skeleton" style={{ width: 140, height: 36, borderRadius: 8 }} />
              </div>

              <div className="panel" style={{ padding: 32 }}>
                <div className="skeleton skeleton-title" style={{ width: 300, marginBottom: 12 }} />
                <div className="skeleton skeleton-text" style={{ width: 200, marginBottom: 28 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[1, 2].map((i) => (
                    <div key={i} className="skeleton" style={{ height: 120, borderRadius: 10 }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}