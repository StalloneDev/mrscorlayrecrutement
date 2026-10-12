import Link from "next/link";
import { Brand } from "@/components/Brand";
import {
  ArrowRight,
  ShieldCheck,
  Users,
  FileText,
  CheckCheck,
  BriefcaseBusiness,
  ArrowUpRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--paper)" }}>
      {/* Navigation */}
      <nav style={{ height: 68, padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,253,250,0.95)", borderBottom: "1px solid #e6e7e1", flexShrink: 0 }}>
        <Brand />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/dashboard" className="btn btn-primary" style={{ minHeight: 38, padding: "0 18px", fontSize: 13 }}>
            Espace RH MRS & CORLAY <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* Hero section centrée sans scroll */}
      <section
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 5%",
          maxWidth: 1240,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 40,
            alignItems: "center",
            width: "100%",
          }}
        >
          <div>
            <div className="section-kicker" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#E06810" }} />
              Plateforme d'évaluation & Recrutement
            </div>
            <h1 style={{ fontSize: "clamp(30px, 4vw, 52px)", lineHeight: 1.1, fontWeight: 800, color: "#263448", margin: "0 0 16px" }}>
              Le bon talent, <br />
              <em style={{ color: "#E06810", fontStyle: "normal" }}>au bon endroit.</em>
            </h1>
            <p style={{ fontSize: "clamp(14px, 1.3vw, 16px)", color: "#647486", lineHeight: 1.5, maxWidth: 480, margin: "0 0 24px" }}>
              Une solution digitale et sécurisée pour organiser des épreuves en ligne, évaluer les compétences et présélectionner en toute transparence les candidats pour MRS et CORLAY.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Link href="/dashboard" className="btn btn-primary" style={{ padding: "0 20px", minHeight: 42, fontSize: 13 }}>
                Accéder au Tableau de Bord <ArrowRight size={15} />
              </Link>
              <Link href="/campaigns" className="btn btn-secondary" style={{ padding: "0 20px", minHeight: 42, fontSize: 13 }}>
                Consulter les Campagnes
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 28, fontSize: 12, color: "#778490", flexWrap: "wrap" }}>
              <ShieldCheck size={16} style={{ color: "#E06810", flexShrink: 0 }} />
              <span>Chronométrage serveur</span>
              <span>•</span>
              <span>Sauvegarde en temps réel</span>
              <span>•</span>
              <span>Isolation MRS / CORLAY</span>
            </div>
          </div>

          {/* Hero Card */}
          <div style={{ background: "#263b4b", borderRadius: "14px 14px 14px 40px", padding: "28px 32px", color: "white", boxShadow: "0 16px 40px rgba(38,59,75,0.15)" }}>
            <div style={{ borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 12, marginBottom: 18 }}>
              <span className="mono" style={{ fontSize: 10, color: "#96aab0" }}>PROCESSUS CERTIFIÉ</span>
              <h2 style={{ fontSize: 18, margin: "4px 0 0", color: "#f0f3f1" }}>De l'invitation au classement</h2>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "#E06810", color: "#fff", display: "grid", placeItems: "center", fontWeight: "bold", fontSize: 12, flexShrink: 0 }}>
                  1
                </div>
                <div>
                  <strong style={{ fontSize: 13 }}>Invitation personnalisée</strong>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#acbbc1" }}>Jeton chiffré unique par candidat, sans mot de passe requis.</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.12)", color: "#fff", display: "grid", placeItems: "center", fontWeight: "bold", fontSize: 12, flexShrink: 0 }}>
                  2
                </div>
                <div>
                  <strong style={{ fontSize: 13 }}>Épreuve chronométrée côté serveur</strong>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#acbbc1" }}>Sauvegarde progressive, résilience aux coupures, clôture automatique.</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.12)", color: "#fff", display: "grid", placeItems: "center", fontWeight: "bold", fontSize: 12, flexShrink: 0 }}>
                  3
                </div>
                <div>
                  <strong style={{ fontSize: 13 }}>Correction & Double classement</strong>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#acbbc1" }}>Notation selon barème, vue Top 5 et vue candidats admissibles au seuil.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer compact */}
      <footer style={{ height: 46, padding: "0 5%", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #e3e5e0", background: "var(--surface)", fontSize: 11, color: "#778490", flexShrink: 0 }}>
        <span>© {new Date().getFullYear()} MRS & CORLAY — Tous droits réservés.</span>
        <div style={{ display: "flex", gap: 16 }}>
          <span>Version 1.0</span>
          <span>Made By KJS</span>
        </div>
      </footer>
    </div>
  );
}
