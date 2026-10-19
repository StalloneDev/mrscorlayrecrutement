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
  const offer = await getJobOfferById(id);

  if (!offer) {
    return (
      <div className="app-frame">
        <Sidebar />
        <main className="main-frame" style={{ padding: 40 }}>
          <h2>Offre d&apos;emploi introuvable</h2>
          <Link href="/job-offers" className="btn btn-secondary" style={{ marginTop: 12 }}>
            <ArrowLeft size={16} /> Retour aux offres
          </Link>
        </main>
      </div>
    );
  }

  const applications = await getApplicationsByOfferAction(id);

  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Candidatures & Présélection IA" />
        <div className="content-area">
          <ApplicantsClient offer={offer} initialApplications={applications} />
        </div>
      </main>
    </div>
  );
}
