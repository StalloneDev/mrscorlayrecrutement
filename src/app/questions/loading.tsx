import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function QuestionsLoading() {
  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Chargement..." />
        <div className="content-area">
          <div className="page-heading">
            <div>
              <div className="skeleton" style={{ height: 12, width: 140, marginBottom: 8 }} />
              <div className="skeleton skeleton-title" style={{ width: 260 }} />
              <div className="skeleton skeleton-text" style={{ width: 320 }} />
            </div>
            <div className="skeleton" style={{ width: 180, height: 42, borderRadius: 8 }} />
          </div>

          <div className="skeleton-card" style={{ marginBottom: 28 }}>
            <div className="skeleton skeleton-title" style={{ width: 240, marginBottom: 16 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton" style={{ height: 58, borderRadius: 8 }} />
              ))}
            </div>
          </div>

          <div className="panel" style={{ padding: 24 }}>
            <div className="skeleton" style={{ width: 180, height: 16, marginBottom: 20 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 72, borderRadius: 8 }} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}