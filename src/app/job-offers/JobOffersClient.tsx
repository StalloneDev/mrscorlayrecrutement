"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Users,
  Calendar,
  MapPin,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Sparkles,
  Share2,
} from "lucide-react";
import {
  createJobOfferAction,
  toggleJobOfferStatusAction,
  deleteJobOfferAction,
} from "@/actions/job-offers";

interface JobOffer {
  id: string;
  companyLabel: string;
  title: string;
  reference: string | null;
  location: string;
  contractType: string;
  description: string;
  requirements: string;
  closingDate: Date | null;
  publicToken: string;
  status: string;
  createdAt: Date;
  applicantsCount: number;
}

export function JobOffersClient({ initialOffers }: { initialOffers: JobOffer[] }) {
  const [offers, setOffers] = useState(initialOffers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Formulaire nouvelle offre
  const [title, setTitle] = useState("");
  const [companyLabel, setCompanyLabel] = useState("MRS/CORLAY");
  const [contractType, setContractType] = useState("CDI");
  const [location, setLocation] = useState("Abidjan, Côte d'Ivoire");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getPublicUrl = (token: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/apply/${token}`;
    }
    return `https://mrscorlayrecrutement.vercel.app/apply/${token}`;
  };

  const handleCopyLink = (token: string, id: string) => {
    const url = getPublicUrl(token);
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const created = await createJobOfferAction({
          title,
          companyLabel,
          contractType,
          location,
          description,
          requirements,
          closingDate: closingDate || null,
        });

        setOffers((prev) => [
          {
            ...created,
            reference: created.reference,
            closingDate: created.closingDate,
            createdAt: created.createdAt,
            applicantsCount: 0,
          },
          ...prev,
        ]);

        setIsModalOpen(false);
        setTitle("");
        setDescription("");
        setRequirements("");
        setClosingDate("");
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  };

  const handleToggleStatus = (id: string) => {
    startTransition(async () => {
      try {
        const res = await toggleJobOfferStatusAction(id);
        setOffers((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: res.status } : o))
        );
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erreur");
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Confirmez-vous la suppression de l'offre "${title}" ? Les candidatures associées seront également supprimées.`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteJobOfferAction(id);
        setOffers((prev) => prev.filter((o) => o.id !== id));
      } catch (err) {
        alert(err instanceof Error ? err.message : "Erreur");
      }
    });
  };

  return (
    <div>
      {/* En-tête */}
      <div className="page-heading">
        <div>
          <div className="section-kicker">APPELS À CANDIDATURE & SOURCING</div>
          <h1>Offres d&apos;emploi</h1>
          <p>
            Publiez vos offres, partagez les liens de candidature sur vos réseaux sociaux et filtrez automatiquement les meilleurs CVs grâce à l&apos;IA.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Plus size={16} /> Publier une offre
        </button>
      </div>

      {/* Grille / Liste des offres */}
      {offers.length === 0 ? (
        <div
          className="panel"
          style={{
            padding: "50px 20px",
            textAlign: "center",
            background: "#ffffff",
            borderRadius: 12,
            marginTop: 20,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#fff7ed",
              color: "#E06810",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
            }}
          >
            <Megaphone size={28} />
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#1e293b" }}>
            Aucune offre d&apos;emploi publiée
          </h3>
          <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 13, maxWidth: 440, marginLeft: "auto", marginRight: "auto" }}>
            Créez votre première annonce pour générer un lien de candidature public à diffuser sur LinkedIn, WhatsApp ou vos portails.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <Plus size={16} /> Créer ma première offre
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 16, marginTop: 20 }}>
          {offers.map((offer) => {
            const isCopied = copiedId === offer.id;
            const publicUrl = getPublicUrl(offer.publicToken);
            const isActive = offer.status === "active";

            return (
              <div
                key={offer.id}
                className="panel"
                style={{
                  padding: "20px 24px",
                  borderRadius: 12,
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                      <span
                        style={{
                          background:
                            offer.companyLabel === "MRS"
                              ? "#ecfdf5"
                              : offer.companyLabel === "CORLAY"
                              ? "#fff7ed"
                              : "linear-gradient(135deg, #fff7ed 0%, #ecfdf5 100%)",
                          color:
                            offer.companyLabel === "MRS"
                              ? "#065f46"
                              : offer.companyLabel === "CORLAY"
                              ? "#9a3412"
                              : "#c2410c",
                          border: "1px solid rgba(0,0,0,0.08)",
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {offer.companyLabel}
                      </span>

                      {offer.reference && (
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                          Réf. {offer.reference}
                        </span>
                      )}

                      <span
                        style={{
                          background: isActive ? "#dcfce7" : "#f1f5f9",
                          color: isActive ? "#166534" : "#64748b",
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {isActive ? "● Active" : "○ Clôturée"}
                      </span>
                    </div>

                    <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                      {offer.title}
                    </h2>

                    <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Briefcase size={14} color="#E06810" /> {offer.contractType}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <MapPin size={14} color="#E06810" /> {offer.location}
                      </span>
                      {offer.closingDate && (
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <Calendar size={14} color="#E06810" /> Clôture le {new Date(offer.closingDate).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bouton Voir candidatures */}
                  <Link
                    href={`/job-offers/${offer.id}/applicants`}
                    className="btn btn-primary"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 16px",
                      fontSize: 13,
                    }}
                  >
                    <Users size={15} />
                    <span>Voir les candidatures ({offer.applicantsCount})</span>
                  </Link>
                </div>

                {/* Barre de partage du lien public */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    borderRadius: 10,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 260, flex: 1 }}>
                    <Share2 size={16} color="#E06810" style={{ flexShrink: 0 }} />
                    <div style={{ fontSize: 12, color: "#334155" }}>
                      <span style={{ fontWeight: 600 }}>Lien public de candidature :</span>{" "}
                      <span style={{ color: "#E06810", wordBreak: "break-all" }}>{publicUrl}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(offer.publicToken, offer.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        background: isCopied ? "#ecfdf5" : "#ffffff",
                        color: isCopied ? "#059669" : "#334155",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isCopied ? "Lien copié !" : "Copier le lien"}</span>
                    </button>

                    <a
                      href={`/apply/${offer.publicToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        borderRadius: 6,
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#334155",
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      <ExternalLink size={14} />
                      <span>Tester le formulaire</span>
                    </a>
                  </div>
                </div>

                {/* Bas de carte : Actions de gestion */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>
                    Publiée le {new Date(offer.createdAt).toLocaleDateString("fr-FR")}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(offer.id)}
                      disabled={isPending}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: isActive ? "#d97706" : "#059669",
                        fontWeight: 600,
                      }}
                    >
                      {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      <span>{isActive ? "Clôturer les candidatures" : "Rouvrir l'offre"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(offer.id, offer.title)}
                      disabled={isPending}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: "#ef4444",
                      }}
                    >
                      <Trash2 size={14} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CRÉATION NOUVELLE OFFRE */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 680,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: 16,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #E06810 0%, #B44E09 100%)",
                    color: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Megaphone size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0f172a" }}>
                    Publier une nouvelle offre d&apos;emploi
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                    Un lien public sera généré pour recueillir et trier automatiquement les CVs.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: "24px" }}>
              {errorMsg && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 8,
                    color: "#991b1b",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Intitulé du poste *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex. Contrôleur de Gestion Senior"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 8,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Entité / Société *
                  </label>
                  <select
                    value={companyLabel}
                    onChange={(e) => setCompanyLabel(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 8,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 13,
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="MRS/CORLAY">MRS / CORLAY (Les deux)</option>
                    <option value="MRS">MRS Holdings</option>
                    <option value="CORLAY">CORLAY</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Type de contrat
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 8,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 13,
                      background: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Consultant">Consultant / Prestation</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Localisation
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Abidjan, Côte d'Ivoire"
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 8,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Date limite de dépôt
                  </label>
                  <input
                    type="date"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    style={{
                      width: "100%",
                      height: 40,
                      padding: "0 12px",
                      borderRadius: 8,
                      border: "1.5px solid #cbd5e1",
                      fontSize: 13,
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Description générale des missions
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Décrivez les principales missions et responsabilités associées à ce poste..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Sparkles size={15} color="#E06810" />
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>
                    Profil recherché &amp; Compétences requises (Clé pour le scoring IA des CVs) *
                  </label>
                </div>
                <p style={{ margin: "0 0 6px", fontSize: 11, color: "#64748b" }}>
                  Listez les mots-clés, diplômes, logiciels, langues et compétences obligatoires. L&apos;IA comparera automatiquement ces termes aux CVs soumis pour classer les candidats.
                </p>
                <textarea
                  rows={4}
                  required
                  placeholder="Ex : Bac+5 Finance, Comptabilité, Audit. Minimum 5 ans d'expérience. Maîtrise avancée d'Excel et SAP. Rigueur, analyse financière, esprit de synthèse, anglais professionnel..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1.5px solid #cbd5e1",
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={isPending}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isPending}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  <Plus size={16} />
                  <span>{isPending ? "Publication en cours..." : "Générer & Publier l'offre"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
