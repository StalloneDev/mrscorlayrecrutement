const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  const res = await pool.query(`SELECT conname, contype FROM pg_constraint WHERE conrelid = 'staff_users'::regclass;`);
  console.log('Constraints:', res.rows);
  const idx = await pool.query(`SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'staff_users';`);
  console.log('Indexes:', idx.rows);
  await pool.end();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
