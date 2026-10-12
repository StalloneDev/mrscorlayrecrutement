import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment.");
}

// Global pool to prevent multiple connections in Next.js HMR
const globalForDb = globalThis as unknown as {
  conn: pg.Pool | undefined;
};

function createPool() {
  const p = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  // Évite qu'une socket fermée par Neon fasse planter le serveur Next.js
  p.on("error", (err) => {
    console.error("Postgres pool idle client error (reconnecting):", err.message);
  });

  return p;
}

export const pool = globalForDb.conn ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = pool;
}

export const db = drizzle(pool, { schema });
export * from "./schema";
