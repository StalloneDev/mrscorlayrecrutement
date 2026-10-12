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
            Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, veuillez contacter directement l&apos;équipe RH de MRS &amp; CORLAY.
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
          maxWidth: 600,
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        {/* En-tête officiel */}
        <div
          style={{
            background: "linear-gradient(135deg, #E06810 0%, #B44E09 100%)",
            padding: "32px 30px 26px",
            textAlign: "center",
            color: "#ffffff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <Brand inverse size="lg" />
          </div>
          <div
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.2)",
              color: "#ffffff",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              marginBottom: 10,
            }}
          >
            {data.companyName.toUpperCase()} · CONCOURS &amp; ÉVALUATION
          </div>
          <h1 style={{ margin: "4px 0 6px", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
            {data.campaignTitle}
          </h1>
          {data.campaignDescription && (
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.5 }}>
              {data.campaignDescription}
            </p>
          )}
        </div>

        {/* Corps de la carte */}
        <div style={{ padding: "28px 30px" }}>
          {/* Badge candidat */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
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
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#E06810",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {data.candidateFirstName[0]}{data.candidateLastName[0]}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>
                Bonjour, {data.candidateFirstName} {data.candidateLastName}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{data.candidateEmail}</div>
            </div>
          </div>

          {/* Grille informations clés */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div
              style={{
                background: "#ffffff",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                padding: "14px",
                textAlign: "center",
              }}
            >
              <Clock size={22} style={{ color: "#E06810", margin: "0 auto 6px" }} />
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                Durée impartie
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                {data.durationMinutes} minutes
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                padding: "14px",
                textAlign: "center",
              }}
            >
              <HelpCircle size={22} style={{ color: "#E06810", margin: "0 auto 6px" }} />
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                Constitution
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                {data.questionCount} question{data.questionCount > 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Consignes importantes */}
          <div
            style={{
              background: "#fffaf0",
              border: "1px solid #fed7aa",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 24,
              fontSize: 12,
              color: "#7c2d12",
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, marginBottom: 6 }}>
              <AlertTriangle size={15} color="#ea580c" />
              <span>Consignes obligatoires avant de débuter :</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Le chronomètre s&apos;active immédiatement dès la validation du formulaire ci-dessous.</li>
              <li>Vos réponses sont <strong>sauvegardées automatiquement</strong> à chaque frappe.</li>
              <li>À la fin du temps réglementaire, vos réponses sont clôturées et transmises automatiquement.</li>
            </ul>
          </div>

          {/* Formulaire de confirmation */}
          <VerificationForm token={token} />
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
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 18, marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
          <UserCheck size={16} color="#E06810" />
          <span>Confirmation d&apos;identité du candidat</span>
        </div>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#64748b" }}>
          Renseignez vos identifiants pour débloquer l&apos;épreuve et démarrer le chronomètre.
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
          height: 46,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: "linear-gradient(135deg, #E06810 0%, #B44E09 100%)",
          color: "#ffffff",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(224, 104, 16, 0.35)",
        }}
      >
        <span>Confirmer &amp; Commencer l&apos;épreuve</span>
        <ArrowRight size={16} />
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          color: "#94a3b8",
          fontSize: 11,
          marginTop: 4,
        }}
      >
        <ShieldCheck size={14} color="#E06810" />
        <span>Session surveillée et sécurisée par MRS &amp; CORLAY</span>
      </div>
    </form>
  );
}