import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { getJobOfferById } from "@/actions/job-offers";
import { getApplicationsByOfferAction } from "@/actions/job-applications";
import { ApplicantsClient } from "./ApplicantsClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ApplicantsPage({ params }: Props) {
  const { id } = await params;

  let offer = null;
  let applications: any[] = [];

  try {
    offer = await getJobOfferById(id);
    if (offer) {
      applications = (await getApplicationsByOfferAction(id)) || [];
    }
  } catch (err) {
    console.error("[ApplicantsPage] Erreur lors du chargement de l'offre :", err);
  }

  if (!offer) {
    return (
      <div className="app-frame">
        <Sidebar />
        <main className="main-frame" style={{ padding: 40 }}>
          <h2 style={{ fontSize: 20, color: "#0f172a", marginBottom: 8 }}>Offre d&apos;emploi introuvable</h2>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>
            L&apos;offre demandée n&apos;existe pas ou a été supprimée de la base de données.
          </p>
          <Link href="/job-offers" className="btn btn-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <ArrowLeft size={16} /> Retour aux offres
          </Link>
        </main>
      </div>
    );
  }

  // Sérialisation propre des dates et des types pour éviter toute anomalie de transfert RSC
  const serializedOffer = {
    ...offer,
    closingDate: offer.closingDate ? new Date(offer.closingDate).toISOString() : null,
    createdAt: offer.createdAt ? new Date(offer.createdAt).toISOString() : null,
    updatedAt: offer.updatedAt ? new Date(offer.updatedAt).toISOString() : null,
  };

  const serializedApplications = (applications || []).map((app) => ({
    ...app,
    aiKeywordsMatched: Array.isArray(app.aiKeywordsMatched)
      ? app.aiKeywordsMatched
      : typeof app.aiKeywordsMatched === "string"
      ? JSON.parse(app.aiKeywordsMatched || "[]")
      : [],
    submittedAt: app.submittedAt ? new Date(app.submittedAt).toISOString() : new Date().toISOString(),
    createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : null,
    updatedAt: app.updatedAt ? new Date(app.updatedAt).toISOString() : null,
  }));

  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Candidatures & Présélection IA" />
        <div className="content-area">
          <ApplicantsClient offer={serializedOffer as any} initialApplications={serializedApplications as any} />
        </div>
      </main>
    </div>
  );
}
