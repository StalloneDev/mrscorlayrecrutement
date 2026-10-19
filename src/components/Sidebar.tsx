"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./Brand";
import {
  LayoutDashboard,
  BriefcaseBusiness,
  BookOpen,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  LogOut,
  Settings,
  Megaphone,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
    { href: "/job-offers", label: "Offres d'emploi", icon: Megaphone },
    { href: "/campaigns", label: "Campagnes", icon: BriefcaseBusiness },
    { href: "/composition", label: "Composition épreuves", icon: FileSpreadsheet },
    { href: "/candidates", label: "Candidats", icon: Users },
    { href: "/questions", label: "Banque de questions", icon: BookOpen },
    { href: "/audit", label: "Journal d'audit", icon: ShieldCheck },
    { href: "/settings", label: "Paramètres RH", icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Brand inverse />
      </div>

      <div style={{ margin: "16px 14px", padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: "#f4a261", color: "#6b2d0e", display: "grid", placeItems: "center", fontWeight: "bold", fontSize: 11 }}>
          MC
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: "bold", color: "#f0f3f1" }}>MRS &amp; CORLAY</div>
          <small style={{ fontSize: 10, color: "#a7b6bc" }}>Espace RH Partagé</small>
        </div>
      </div>

      <nav className="side-nav">
        <div className="nav-label">ESPACE DE TRAVAIL</div>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`side-link ${isActive ? "active" : ""}`}
            >
              <Icon size={17} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto", padding: "16px 14px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#9ed3b5", fontSize: 11 }}>
          <ShieldCheck size={16} />
          <span>Panel Administration</span>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              color: "#f4a261",
              fontSize: 12,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,100,30,0.2)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            <LogOut size={15} />
            <span>Déconnexion</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
