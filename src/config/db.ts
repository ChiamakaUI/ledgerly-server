import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

let _pool: pg.Pool;

export function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: env().DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    _pool.on("error", (err) => {
      console.error("Unexpected database pool error:", err);
    });
  }
  return _pool;
}

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  if (duration > 1000) {
    console.warn(`Slow query (${duration}ms):`, text.slice(0, 100));
  }

  return result;
}

export async function getClient(): Promise<pg.PoolClient> {
  const pool = getPool();
  return pool.connect();
}

export async function transaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export function camelizeKeys<T = any>(obj: any): T {
  if (Array.isArray(obj)) return obj.map(camelizeKeys) as any;
  if (obj === null || typeof obj !== "object" || obj instanceof Date) return obj;

  const result: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = camelizeKeys(obj[key]);
  }
  return result;
}