import { Activity } from "lucide-react";

export function Navbar({ title = "Espace RH" }: { title?: string }) {
  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#647486" }}>
        <span>Plateforme</span>
        <span>/</span>
        <strong style={{ color: "#263448" }}>{title}</strong>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#267357" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#429678" }} />
          <span>Cetre d'administration</span>
        </div>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#d8e9dc", color: "#234b4a", display: "grid", placeItems: "center", fontWeight: "bold", fontSize: 11 }}>
          RH
        </div>
      </div>
    </header>
  );
}
