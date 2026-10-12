const { Pool } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const secret = process.env.SESSION_SECRET || 'mrs_corlay_fallback_secret_recruitment_2026';
  
  // Générer un token
  const rawToken = crypto.randomBytes(32).toString('hex');
  // Calculer avec HMAC (exactement comme hashInvitationToken)
  const tokenHash = crypto.createHmac('sha256', secret).update(rawToken).digest('hex');

  const expires = new Date();
  expires.setDate(expires.getDate() + 14);

  // Supprimer ancienne invitation
  await pool.query('DELETE FROM invitations WHERE candidate_id = $1', ['f199ca99-9e9c-476d-9740-e6890c624e58']);

  // Insérer avec le hash HMAC
  await pool.query(
    'INSERT INTO invitations (candidate_id, campaign_id, token_hash, status, expires_at) VALUES ($1, $2, $3, $4, $5)',
    ['f199ca99-9e9c-476d-9740-e6890c624e58', 'e4ae20c8-bff7-4fef-86e8-e35856e2733d', tokenHash, 'sent', expires]
  );

  await pool.query(
    'UPDATE candidates SET status = $1, invited_at = NOW() WHERE id = $2',
    ['invited', 'f199ca99-9e9c-476d-9740-e6890c624e58']
  );

  console.log('\n=============================================');
  console.log('✅ Invitation générée avec le hash HMAC !');
  console.log('Token    :', rawToken);
  console.log('Lien URL :', `http://localhost:3000/invitation/${rawToken}`);
  console.log('=============================================\n');

  await pool.end();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
