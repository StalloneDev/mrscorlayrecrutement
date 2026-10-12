const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

(async () => {
  // Récupérer le dernier candidat créé
  const { rows } = await pool.query(`
    SELECT c.id, c.first_name, c.last_name, c.email, c.campaign_id, cp.title as campaign_title
    FROM candidates c
    LEFT JOIN campaigns cp ON c.campaign_id = cp.id
    ORDER BY c.created_at DESC
    LIMIT 1
  `);

  if (rows.length === 0) {
    console.log('Aucun candidat trouvé en base.');
    await pool.end();
    return;
  }

  const candidate = rows[0];
  const secret = process.env.SESSION_SECRET || 'mrs_corlay_fallback_secret_recruitment_2026';

  // Générer token sécurisé
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHmac('sha256', secret).update(rawToken).digest('hex');

  const expires = new Date();
  expires.setDate(expires.getDate() + 14);

  // Supprimer ancienne invitation
  await pool.query('DELETE FROM invitations WHERE candidate_id = $1', [candidate.id]);

  // Créer nouvelle invitation
  await pool.query(
    'INSERT INTO invitations (candidate_id, campaign_id, token_hash, status, expires_at) VALUES ($1, $2, $3, $4, $5)',
    [candidate.id, candidate.campaign_id, tokenHash, 'sent', expires]
  );

  // Mettre à jour le statut du candidat
  await pool.query(
    'UPDATE candidates SET status = $1, invited_at = NOW() WHERE id = $2',
    ['invited', candidate.id]
  );

  const url = `http://localhost:3000/invitation/${rawToken}`;

  console.log('---RESULT_START---');
  console.log(JSON.stringify({
    candidateName: `${candidate.first_name} ${candidate.last_name}`,
    lastName: candidate.last_name,
    email: candidate.email,
    campaignTitle: candidate.campaign_title,
    token: rawToken,
    url: url
  }));
  console.log('---RESULT_END---');

  await pool.end();
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
