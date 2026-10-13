import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";
import { getStaffUsers, getCompaniesList } from "@/actions/settings";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const users = await getStaffUsers();
  const companies = await getCompaniesList();

  return (
    <div className="app-frame">
      <Sidebar />
      <main className="main-frame">
        <Navbar title="Paramètres & Équipe" />
        <div className="content-area">
          <div className="page-heading">
            <div>
              <div className="section-kicker">CONFIGURATION SYSTÈME</div>
              <h1>Paramètres de la plateforme</h1>
              <p>Gérez les comptes d'accès de l'équipe RH et les entités du groupe MRS &amp; CORLAY.</p>
            </div>
          </div>

          <SettingsClient users={users} companies={companies} />
        </div>
      </main>
    </div>
  );
}
