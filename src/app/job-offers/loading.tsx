import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function JobOffersLoading() {
  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Offres d'emploi" />
        <div className="content-area">
          <div className="page-heading">
            <div>
              <div className="skeleton" style={{ height: 12, width: 140, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 28, width: 220, marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 14, width: 340 }} />
            </div>
          </div>
          <div className="panel" style={{ padding: 24, marginTop: 24 }}>
            <div className="skeleton" style={{ height: 40, width: "100%", marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 40, width: "100%", marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 40, width: "100%" }} />
          </div>
        </div>
      </main>
    </div>
  );
}
