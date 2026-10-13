"use client";

import { useState, useTransition } from "react";
import {
  createStaffUserAction,
  deleteStaffUserAction,
  createCompanyAction,
} from "@/actions/settings";
import {
  Users,
  Building2,
  Plus,
  Trash2,
  Shield,
  ShieldAlert,
  UserCheck,
  Check,
  AlertCircle,
} from "lucide-react";

interface StaffUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: Date | string;
}

interface Company {
  id: string;
  name: string;
  code: string;
  accentColor: string;
  createdAt: Date | string;
}

export function SettingsClient({
  users,
  companies,
}: {
  users: StaffUser[];
  companies: Company[];
}) {
  const [tab, setTab] = useState<"users" | "companies">("users");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states for new user
  const [showAddUser, setShowAddUser] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState("hr");

  // Form states for new company
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [compName, setCompName] = useState("");
  const [compCode, setCompCode] = useState("");
  const [compColor, setCompColor] = useState("#E06810");

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData();
    fd.append("email", userEmail);
    fd.append("displayName", userName);
    fd.append("password", userPassword);
    fd.append("role", userRole);

    startTransition(async () => {
      try {
        await createStaffUserAction(fd);
        setSuccess(`Utilisateur ${userName} créé avec succès !`);
        setUserEmail("");
        setUserName("");
        setUserPassword("");
        setShowAddUser(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur de création.";
        setError(msg);
      }
    });
  };

  const handleDeleteUser = (user: StaffUser) => {
    if (confirm(`Supprimer l'accès RH de ${user.displayName} (${user.email}) ?`)) {
      setError(null);
      setSuccess(null);
      startTransition(async () => {
        try {
          await deleteStaffUserAction(user.id);
          setSuccess(`Utilisateur ${user.displayName} supprimé.`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Erreur de suppression.";
          setError(msg);
        }
      });
    }
  };

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const fd = new FormData();
    fd.append("name", compName);
    fd.append("code", compCode);
    fd.append("accentColor", compColor);

    startTransition(async () => {
      try {
        await createCompanyAction(fd);
        setSuccess(`Entreprise ${compName} créée avec succès !`);
        setCompName("");
        setCompCode("");
        setShowAddCompany(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur de création.";
        setError(msg);
      }
    });
  };

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Navigation onglets */}
      <div
        style={{
          display: "flex",
          gap: 16,
          borderBottom: "1px solid #e2e8f0",
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          onClick={() => setTab("users")}
          style={{
            background: "none",
            border: "none",
            padding: "10px 6px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            color: tab === "users" ? "#E06810" : "#64748b",
            borderBottom: tab === "users" ? "2px solid #E06810" : "2px solid transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Users size={16} /> Équipe RH ({users.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("companies")}
          style={{
            background: "none",
            border: "none",
            padding: "10px 6px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            color: tab === "companies" ? "#E06810" : "#64748b",
            borderBottom: tab === "companies" ? "2px solid #E06810" : "2px solid transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Building2 size={16} /> Entités &amp; Sociétés ({companies.length})
        </button>
      </div>

      {/* Messages feedback */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fecaca",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "#ecfdf5",
            color: "#059669",
            border: "1px solid #a7f3d0",
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* ONGLET 1 : UTILISATEURS RH */}
      {tab === "users" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#1e293b" }}>
                Gestion des collaborateurs RH
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                Comptes autorisés à administrer les campagnes et évaluer les candidats
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddUser(!showAddUser)}
              className="btn btn-primary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={15} /> {showAddUser ? "Fermer le formulaire" : "Ajouter un collaborateur"}
            </button>
          </div>

          {/* Formulaire ajout utilisateur */}
          {showAddUser && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px", color: "#1e293b" }}>
                Créer un nouveau compte RH
              </h3>
              <form onSubmit={handleAddUser}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Nom complet *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Kouamé Koffi"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Adresse e-mail professionnelle *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="nom@mrsholdings.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Mot de passe initial *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Au moins 6 caractères"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Rôle d'accès
                    </label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                    >
                      <option value="hr">Ressources Humaines (Évaluateur)</option>
                      <option value="admin">Administrateur complet</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: 13 }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn btn-primary"
                    style={{ fontSize: 13 }}
                  >
                    {isPending ? "Création en cours..." : "Créer le compte"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tableau utilisateurs */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left", color: "#64748b" }}>
                  <th style={{ padding: "12px 18px" }}>UTILISATEUR</th>
                  <th style={{ padding: "12px 18px" }}>RÔLE</th>
                  <th style={{ padding: "12px 18px" }}>DATE D'AJOUT</th>
                  <th style={{ padding: "12px 18px", textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isPrimaryAdmin = u.email === "lodouiran@mrsholdings.com";
                  return (
                    <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 18px" }}>
                        <strong style={{ color: "#1e293b", display: "block" }}>{u.displayName}</strong>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{u.email}</span>
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            background: u.role === "admin" ? "#fff7ed" : "#eff6ff",
                            color: u.role === "admin" ? "#c2410c" : "#2563eb",
                            border: `1px solid ${u.role === "admin" ? "#fed7aa" : "#bfdbfe"}`,
                            padding: "3px 8px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {u.role === "admin" ? <Shield size={11} /> : <UserCheck size={11} />}
                          {u.role === "admin" ? "Administrateur" : "Ressources Humaines"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", color: "#94a3b8", fontSize: 12 }}>
                        {new Date(u.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        {isPrimaryAdmin ? (
                          <span style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>
                            Admin Principal
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            disabled={isPending}
                            title="Supprimer ce compte"
                            style={{
                              background: "#fef2f2",
                              border: "1px solid #fecaca",
                              borderRadius: 6,
                              padding: "5px 8px",
                              color: "#dc2626",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ONGLET 2 : ENTREPRISES */}
      {tab === "companies" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: "#1e293b" }}>
                Entités &amp; Sociétés du Groupe
              </h2>
              <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0" }}>
                Filiales et marques représentées sur la plateforme de recrutement
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddCompany(!showAddCompany)}
              className="btn btn-primary"
              style={{ fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={15} /> {showAddCompany ? "Fermer le formulaire" : "Ajouter une entité"}
            </button>
          </div>

          {/* Formulaire ajout entreprise */}
          {showAddCompany && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px", color: "#1e293b" }}>
                Ajouter une entité au groupe
              </h3>
              <form onSubmit={handleAddCompany}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Nom de la société *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: CORLAY CÔTE D'IVOIRE"
                      value={compName}
                      onChange={(e) => setCompName(e.target.value)}
                      style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Code unique *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: CORLAY-CI"
                      value={compCode}
                      onChange={(e) => setCompCode(e.target.value)}
                      style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#334155", marginBottom: 4 }}>
                      Couleur d'accent
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="color"
                        value={compColor}
                        onChange={(e) => setCompColor(e.target.value)}
                        style={{ width: 44, height: 38, border: "1px solid #cbd5e1", borderRadius: 8, cursor: "pointer", padding: 2 }}
                      />
                      <input
                        type="text"
                        value={compColor}
                        onChange={(e) => setCompColor(e.target.value)}
                        style={{ width: "100%", height: 38, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 13, boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setShowAddCompany(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: 13 }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn btn-primary"
                    style={{ fontSize: 13 }}
                  >
                    {isPending ? "Ajout..." : "Enregistrer la société"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Grille sociétés */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {companies.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 18,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: c.accentColor || "#E06810",
                    color: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {c.code.slice(0, 2)}
                </div>
                <div>
                  <h4 style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#1e293b" }}>
                    {c.name}
                  </h4>
                  <span style={{ fontSize: 12, color: "#64748b" }}>Code : {c.code}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
