import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { getJobOffers } from "@/actions/job-offers";
import { JobOffersClient } from "./JobOffersClient";

export const dynamic = "force-dynamic";

export default async function JobOffersPage() {
  const offers = await getJobOffers();

  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Offres d'emploi & Recrutement" />
        <div className="content-area">
          <JobOffersClient initialOffers={offers} />
        </div>
      </main>
    </div>
  );
}
