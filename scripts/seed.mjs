import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function seed() {
  await client.connect();
  console.log("Connecté à Neon pour le seed...");

  // Insérer ou vérifier MRS et CORLAY
  await client.query(`
    INSERT INTO companies (name, code, accent_color)
    VALUES 
      ('MRS', 'MRS', '#176b62'),
      ('CORLAY', 'CORLAY', '#c47a35'),
      ('MRS/CORLAY', 'MRS_CORLAY', '#e06810')
    ON CONFLICT (code) DO NOTHING;
  `);

  const { rows: companies } = await client.query("SELECT id, name, code FROM companies");
  const mrs = companies.find(c => c.code === "MRS");
  const corlay = companies.find(c => c.code === "CORLAY");

  console.log("Sociétés prêtes :", companies.map(c => `${c.name} (${c.id})`));

  // Vérifier banque de questions
  const { rows: existingQ } = await client.query("SELECT id FROM questions LIMIT 1");
  if (existingQ.length === 0 && mrs) {
    console.log("Insertion de questions types...");
    const q1 = await client.query(`
      INSERT INTO questions (company_id, prompt, kind, points, required, category, competency, difficulty, max_characters, expected_answer)
      VALUES ($1, 'Présentez une méthode fiable pour vérifier une pièce comptable avant son enregistrement.', 'long_text', 10, true, 'Comptabilité', 'Rigueur', 'medium', 1500, 'Contrôle des mentions légales, vérification des montants HT/TTC, rapprochement avec bon de commande/réception.')
      RETURNING id;
    `, [mrs.id]);

    const q2 = await client.query(`
      INSERT INTO questions (company_id, prompt, kind, points, required, category, competency, difficulty, choices, expected_answer)
      VALUES ($1, 'Quel document confirme le règlement d''une facture fournisseur ?', 'single_choice', 5, true, 'Comptabilité', 'Comptabilité fournisseurs', 'easy', '["Le bon de commande", "La preuve de paiement / relevé", "Le devis"]'::jsonb, 'La preuve de paiement / relevé')
      RETURNING id;
    `, [mrs.id]);

    const q3 = await client.query(`
      INSERT INTO questions (company_id, prompt, kind, points, required, category, competency, difficulty, choices, expected_answer)
      VALUES ($1, 'Dans la chaîne logistique, que signifie le sigle FIFO ?', 'single_choice', 5, true, 'Logistique', 'Gestion de stocks', 'easy', '["First In, First Out", "Fast In, Fast Out", "Final Inventory Freight Order"]'::jsonb, 'First In, First Out')
      RETURNING id;
    `, [corlay ? corlay.id : mrs.id]);

    // Insérer campagne démo MRS
    const qIds = [q1.rows[0].id, q2.rows[0].id];
    await client.query(`
      INSERT INTO campaigns (company_id, title, reference, description, status, duration_minutes, passing_score, shortlist_size, question_ids)
      VALUES ($1, 'Assistant Comptable', 'MRS-2026-AC01', 'Campagne de recrutement pour le poste d''assistant comptable au siège.', 'published', 45, 60, 5, $2::jsonb)
      ON CONFLICT (company_id, reference) DO NOTHING;
    `, [mrs.id, JSON.stringify(qIds)]);
  }

  console.log("Seed terminé avec succès !");
  await client.end();
}

seed().catch(err => {
  console.error("Erreur de seed:", err);
  process.exit(1);
});
