import { getInvitationData, startAssessmentAction } from "@/actions/assessments";
import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { Clock, HelpCircle, AlertTriangle, ShieldCheck, ArrowRight, UserCheck } from "lucide-react";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitationPage({ params }: Props) {
  const { token } = await params;
  const data = await getInvitationData(token);

  if ("error" in data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1f2d3d 0%, #26394b 50%, #1a2530 100%)",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#ffffff",
            borderRadius: 16,
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            padding: "40px 32px",
            textAlign: "center",
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
              border: "1px solid #fecaca",
              borderRadius: 20,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={14} />
            <span>Lien invalide ou expiré</span>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 10px" }}>
            Ce lien n&apos;est plus disponible
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: "0 0 24px" }}>
            {data.error}
          </p>

          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, veuillez contacter directement l&apos;équipe RH de MRS HOLDINGS.
          </p>
        </div>
      </div>
    );
  }

  if (data.submittedAt) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1f2d3d 0%, #26394b 50%, #1a2530 100%)",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: "100%",
            background: "#ffffff",
            borderRadius: 16,
            boxShadow: "0 20px 40px rgba(0,0,0,0.35)",
            padding: "40px 32px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <Brand size="lg" />
          </div>

          <div
            style={{
              margin: "0 auto 16px",
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#ecfdf5",
              color: "#059669",
              border: "2px solid #a7f3d0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: "bold",
            }}
          >
            ✓
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 10px" }}>
            Épreuve déjà transmise
          </h2>
          <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: "0 0 16px" }}>
            Bonjour <strong>{data.candidateFirstName}</strong>, votre composition pour la campagne{" "}
            <strong>{data.campaignTitle}</strong> a déjà été soumise avec succès.
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            Les délibérations et résultats vous seront communiqués par le service RH.
          </p>
        </div>
      </div>
    );
  }

  if (data.attemptId && !data.submittedAt) {
    redirect(`/assessment/${data.attemptId}`);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1f2d3d 0%, #26394b 50%, #1a2530 100%)",
        padding: "30px 16px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* En-tête officiel - Pas de logo ici, sobre et solennel en bleu nuit */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
            padding: "36px 32px 30px",
            textAlign: "center",
            color: "#ffffff",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.15)",
              color: "#93c5fd",
              padding: "5px 14px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            MRS BENIN · ÉVALUATION TECHNIQUE EN LIGNE
          </div>
          <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em", textTransform: "uppercase" }}>
            Bienvenue sur notre plateforme de recrutement
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#e2e8f0", fontWeight: 500 }}>
            Poste : <strong>{data.campaignTitle}</strong>
          </p>
        </div>

        {/* Corps de la page */}
        <div style={{ padding: "32px 32px" }}>
          {/* Badge candidat */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: "14px 18px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "#1e3a8a",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              {data.candidateFirstName[0]}{data.candidateLastName[0]}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                Chère Candidate, Cher Candidat ({data.candidateFirstName} {data.candidateLastName})
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{data.candidateEmail}</div>
            </div>
          </div>

          {/* Message de bienvenue officiel */}
          <div style={{ fontSize: 13.5, color: "#334155", lineHeight: 1.65, marginBottom: 20 }}>
            <p style={{ margin: "0 0 12px" }}>
              Nous vous souhaitons la bienvenue sur la plateforme de recrutement de <strong>MRS BENIN</strong>, dans le cadre du processus de sélection pour le poste de <strong>{data.campaignTitle}</strong>.
            </p>
            <p style={{ margin: "0 0 12px" }}>
              Nous vous remercions de l’intérêt que vous portez à cette opportunité professionnelle et vous invitons à aborder cette évaluation avec sérieux, concentration et professionnalisme.
            </p>
            <p style={{ margin: 0 }}>
              Cette étape vise à apprécier vos compétences techniques, votre capacité d’analyse, votre rigueur organisationnelle ainsi que votre sens de l’éthique et de l’intégrité professionnelle.
            </p>
          </div>

          {/* Grille informations clés */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
            <div
              style={{
                background: "#f8fafc",
                border: "1.5px solid #cbd5e1",
                borderRadius: 10,
                padding: "14px",
                textAlign: "center",
              }}
            >
              <Clock size={22} style={{ color: "#1e3a8a", margin: "0 auto 6px" }} />
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                Durée du test
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                {data.durationMinutes >= 120 ? "2 heures" : `${data.durationMinutes} minutes`}
              </div>
            </div>

            <div
              style={{
                background: "#f8fafc",
                border: "1.5px solid #cbd5e1",
                borderRadius: 10,
                padding: "14px",
                textAlign: "center",
              }}
            >
              <HelpCircle size={22} style={{ color: "#1e3a8a", margin: "0 auto 6px" }} />
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                Structure de l&apos;épreuve
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                {data.questionCount} question{data.questionCount > 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Consignes importantes */}
          <div
            style={{
              background: "#eff6ff",
              border: "1.5px solid #bfdbfe",
              borderRadius: 10,
              padding: "18px 20px",
              marginBottom: 24,
              fontSize: 13,
              color: "#1e3a8a",
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, marginBottom: 8, color: "#172554", fontSize: 13.5 }}>
              <AlertTriangle size={17} color="#2563eb" />
              <span>CONSIGNES IMPORTANTES</span>
            </div>
            <p style={{ margin: "0 0 8px", fontWeight: 600 }}>Avant de commencer votre évaluation, nous vous invitons à :</p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li style={{ marginBottom: 4 }}>Lire attentivement toutes les instructions affichées sur la plateforme.</li>
              <li style={{ marginBottom: 4 }}>Vous assurer de disposer d’une connexion Internet stable et d’un environnement calme.</li>
              <li style={{ marginBottom: 4 }}>Répondre personnellement à toutes les questions, avec honnêteté et professionnalisme.</li>
              <li style={{ marginBottom: 4 }}>Respecter strictement le temps imparti ainsi que les règles de l’évaluation.</li>
              <li>Éviter toute assistance extérieure ou toute pratique susceptible de compromettre l’intégrité du processus.</li>
            </ul>
            <p style={{ margin: "10px 0 0", fontSize: 12, color: "#1e40af", fontStyle: "italic" }}>
              Nous vous rappelons que l’intégrité, la confidentialité, la rigueur et le respect des règles professionnelles constituent des valeurs essentielles dans le cadre de ce recrutement.
            </p>
          </div>

          {/* Formulaire de confirmation */}
          <VerificationForm token={token} />

          {/* Signature avec logo en bas */}
          <div
            style={{
              marginTop: 32,
              paddingTop: 24,
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
                Nous vous souhaitons une excellente évaluation et plein succès dans la suite du processus de sélection.
              </div>
              <div style={{ marginTop: 8, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>
                L’équipe Recrutement
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e3a8a" }}>
                MRS BENIN · MRS HOLDINGS
              </div>
            </div>

            <div style={{ flexShrink: 0, marginLeft: 20 }}>
              <Brand size="md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationForm({ token }: { token: string }) {
  async function handleStart(formData: FormData) {
    "use server";
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;

    const result = await startAssessmentAction(token, {
      firstName: "",
      lastName,
      email,
    });

    redirect(`/assessment/${result.attemptId}`);
  }

  return (
    <form action={handleStart} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14, marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
          <UserCheck size={16} color="#1e3a8a" />
          <span>Confirmation d&apos;identité pour démarrer le test</span>
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#64748b" }}>
          Confirmez vos identifiants pour accéder aux épreuves et enclencher le chronomètre.
        </p>
      </div>

      <div>
        <label
          htmlFor="lastName"
          style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 5 }}
        >
          Nom de famille *
        </label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          placeholder="Ex. KOUKPELOU"
          required
          autoComplete="family-name"
          style={{
            width: "100%",
            height: 42,
            padding: "0 14px",
            borderRadius: 8,
            border: "1.5px solid #cbd5e1",
            fontSize: 13,
            color: "#0f172a",
            background: "#ffffff",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="email"
          style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 5 }}
        >
          Adresse e-mail enregistrée *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="Ex. jenniferstallone8@gmail.com"
          required
          autoComplete="email"
          style={{
            width: "100%",
            height: 42,
            padding: "0 14px",
            borderRadius: 8,
            border: "1.5px solid #cbd5e1",
            fontSize: 13,
            color: "#0f172a",
            background: "#ffffff",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <button
        type="submit"
        style={{
          marginTop: 6,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: "linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)",
          color: "#ffffff",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(30, 58, 138, 0.35)",
        }}
      >
        <span>Confirmer &amp; Démarrer mon évaluation</span>
        <ArrowRight size={16} />
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          color: "#64748b",
          fontSize: 11.5,
          marginTop: 4,
        }}
      >
        <ShieldCheck size={14} color="#1e3a8a" />
        <span>Session surveillée et sécurisée · MRS HOLDINGS</span>
      </div>
    </form>
  );
}