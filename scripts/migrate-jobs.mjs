import pg from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  await client.connect();
  console.log("Connecté à Neon pour la création des tables job_offers et job_applications...");

  await client.query(`
    CREATE TABLE IF NOT EXISTS job_offers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_label TEXT NOT NULL DEFAULT 'MRS/CORLAY',
      title TEXT NOT NULL,
      reference TEXT,
      location TEXT NOT NULL DEFAULT 'Abidjan, Côte d''Ivoire',
      contract_type TEXT NOT NULL DEFAULT 'CDI',
      description TEXT NOT NULL DEFAULT '',
      requirements TEXT NOT NULL DEFAULT '',
      closing_date TIMESTAMP WITH TIME ZONE,
      public_token TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS job_offers_status_idx ON job_offers(status);
    CREATE UNIQUE INDEX IF NOT EXISTS job_offers_token_idx ON job_offers(public_token);

    CREATE TABLE IF NOT EXISTS job_applications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      job_offer_id UUID NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      country TEXT,
      cv_url TEXT NOT NULL,
      cv_file_name TEXT,
      cover_letter_url TEXT,
      cover_letter_file_name TEXT,
      cover_letter_text TEXT,
      ai_score INTEGER,
      ai_keywords_matched JSONB NOT NULL DEFAULT '[]'::jsonb,
      ai_summary TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS job_applications_offer_idx ON job_applications(job_offer_id);
    CREATE INDEX IF NOT EXISTS job_applications_status_idx ON job_applications(status);
  `);

  console.log("Tables job_offers et job_applications créées avec succès !");
  await client.end();
}

migrate().catch((err) => {
  console.error("Erreur de migration :", err);
  process.exit(1);
});
