import { getJobOfferByToken } from "@/actions/job-offers";
import { Brand } from "@/components/Brand";
import { ApplyForm } from "./ApplyForm";
import { Briefcase, MapPin, Calendar, Clock, AlertTriangle, Building2 } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

export const dynamic = "force-dynamic";

export default async function ApplyPage({ params }: Props) {
  const { token } = await params;
  const offer = await getJobOfferByToken(token);

  if (!offer) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1f2d3d 0%, #26394b 50%, #1a2530 100%)",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#ffffff",
            borderRadius: 16,
            padding: "40px 32px",
            textAlign: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <Brand size="lg" />
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#fef2f2",
              color: "#991b1b",
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={14} />
            <span>Offre introuvable ou lien expiré</span>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 10px" }}>
            Cette offre n&apos;est plus disponible
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: "0 0 24px" }}>
            Le lien de candidature demandé est invalide ou a été clôturé par le département des Ressources Humaines de MRS &amp; CORLAY.
          </p>
        </div>
      </div>
    );
  }

  const isClosed = offer.status === "closed" || (offer.closingDate && new Date(offer.closingDate) < new Date());

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1f2d3d 0%, #26394b 50%, #1a2530 100%)",
        padding: "36px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* En-tête Branded */}
        <div
          style={{
            background: "linear-gradient(135deg, #E06810 0%, #B44E09 100%)",
            padding: "36px 32px 28px",
            color: "#ffffff",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
            <Brand inverse size="lg" />
          </div>

          <div
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.2)",
              color: "#ffffff",
              padding: "4px 14px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            {offer.companyLabel.toUpperCase()} · RECRUTEMENT OFFICIEL
          </div>

          <h1 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {offer.title}
          </h1>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 18,
              fontSize: 13,
              color: "rgba(255,255,255,0.92)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Briefcase size={15} /> {offer.contractType}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <MapPin size={15} /> {offer.location}
            </span>
            {offer.closingDate && (
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <Calendar size={15} /> Date limite : {new Date(offer.closingDate).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>
        </div>

        {/* Détails du poste */}
        <div style={{ padding: "32px 32px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
              📋 Description du poste &amp; Missions
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.7, whiteSpace: "pre-line" }}>
              {offer.description}
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>
              🎯 Profil recherché &amp; Compétences requises
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.7, whiteSpace: "pre-line" }}>
              {offer.requirements}
            </p>
          </div>
        </div>

        {/* Formulaire ou Message Clôturé */}
        <div style={{ padding: "32px" }}>
          {isClosed ? (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 12,
                padding: "24px",
                textAlign: "center",
                color: "#991b1b",
              }}
            >
              <AlertTriangle size={24} style={{ margin: "0 auto 8px" }} />
              <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>
                Candidatures clôturées
              </h4>
              <p style={{ margin: 0, fontSize: 13 }}>
                Les dépôts de candidatures pour ce poste sont désormais fermés. Nous vous invitons à consulter nos prochaines publications.
              </p>
            </div>
          ) : (
            <ApplyForm token={token} jobTitle={offer.title} companyLabel={offer.companyLabel} />
          )}
        </div>
      </div>
    </div>
  );
}
