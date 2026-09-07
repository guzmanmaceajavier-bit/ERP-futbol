import { Pool } from 'pg';

let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

export function isDemoMode() {
  const url = process.env.DATABASE_URL || '';
  return !url || url.includes('usuario:password') || false // fix: no tratar Neon como demo;
}

export async function query(text, params) {
  if (isDemoMode()) {
    throw new Error('MODO_LOCAL');
  }
  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export default { getPool, query };

