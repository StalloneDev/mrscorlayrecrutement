const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const candidateId = 'ecc63753-e529-405b-88ed-68fbea044170';
  const campaignId = 'e4ae20c8-bff7-4fef-86e8-e35856e2733d';
  const secret = process.env.SESSION_SECRET || 'mrs_corlay_fallback_secret_recruitment_2026';

  // Génération du token sécurisé et de son hash HMAC
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHmac('sha256', secret).update(rawToken).digest('hex');

  const expires = new Date();
  expires.setDate(expires.getDate() + 14); // 14 jours

  // Nettoyage au cas où
  await pool.query('DELETE FROM invitations WHERE candidate_id = $1', [candidateId]);

  // Insertion de la nouvelle invitation
  await pool.query(
    'INSERT INTO invitations (candidate_id, campaign_id, token_hash, status, expires_at) VALUES ($1, $2, $3, $4, $5)',
    [candidateId, campaignId, tokenHash, 'sent', expires]
  );

  // Mise à jour du statut candidat
  await pool.query(
    'UPDATE candidates SET status = $1, invited_at = NOW() WHERE id = $2',
    ['invited', candidateId]
  );

  const url = `http://localhost:3000/invitation/${rawToken}`;

  console.log('\n=============================================');
  console.log('✅ Invitation créée avec succès pour Dafinis ZEDAGA !');
  console.log('Nom      : Dafinis ZEDAGA');
  console.log('Email    : dzedaga@gmail.com');
  console.log('Poste    : Assistant Comptable');
  console.log('Token    :', rawToken);
  console.log('Lien URL :', url);
  console.log('=============================================\n');

  await pool.end();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
