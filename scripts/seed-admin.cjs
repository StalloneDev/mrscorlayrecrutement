#!/usr/bin/env node
/**
 * Seed un compte admin RH de démonstration avec 'pg'.
 * Usage : node scripts/seed-admin.cjs [email] [password]
 * Défaut : admin@mrs-groupe.fr / Admin2026!
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

const email = process.argv[2] || 'admin@mrs-groupe.fr';
const password = process.argv[3] || 'Admin2026!';
const displayName = 'Administrateur RH';
const role = 'admin';

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO staff_users (id, email, password_hash, display_name, role, created_at, updated_at)
     VALUES (
       gen_random_uuid(),
       $1,
       $2,
       $3,
       $4,
       NOW(), NOW()
     )
     ON CONFLICT (email) DO UPDATE
       SET password_hash = $2,
           display_name  = $3,
           role          = $4,
           updated_at    = NOW()`,
    [email, hash, displayName, role]
  );

  console.log('');
  console.log('✅  Compte admin créé / mis à jour avec succès !');
  console.log('   Email    :', email);
  console.log('   Password :', password);
  console.log('   Role     :', role);
  console.log('');
  console.log('👉 Rendez-vous sur /login pour vous connecter.');
  console.log('');

  await pool.end();
})().catch((err) => {
  console.error('❌ Erreur :', err.message);
  process.exit(1);
});
