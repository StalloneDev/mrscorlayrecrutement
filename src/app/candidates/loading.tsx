import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function CandidatesLoading() {
  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Chargement..." />
        <div className="content-area">
          <div className="page-heading">
            <div>
              <div className="skeleton" style={{ height: 12, width: 150, marginBottom: 8 }} />
              <div className="skeleton skeleton-title" style={{ width: 220 }} />
              <div className="skeleton skeleton-text" style={{ width: 300 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="skeleton" style={{ width: 200, height: 40, borderRadius: 8 }} />
              <div className="skeleton" style={{ width: 140, height: 40, borderRadius: 8 }} />
            </div>
          </div>

          <div className="panel" style={{ padding: 24 }}>
            <div className="skeleton" style={{ width: 160, height: 16, marginBottom: 20 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton" style={{ height: 50, borderRadius: 6 }} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}