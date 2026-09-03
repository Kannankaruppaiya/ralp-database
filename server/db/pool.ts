import 'server-only';
import { Pool, type PoolClient } from 'pg';

/**
 * One shared connection pool per process. Cached on globalThis so Next.js hot
 * reloads in development do not open a new pool on every change.
 */
const globalForPool = globalThis as unknown as { __ralpPool?: Pool };

export const pool =
  globalForPool.__ralpPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== 'production') globalForPool.__ralpPool = pool;

/**
 * Runs `fn` inside a transaction with the acting user's id published to the
 * session, so the database's row level security (which reads `auth.uid()` from
 * `app.user_id`) scopes every query to that user. Pass `null` for an
 * unauthenticated request. This is the Option-B enforcement layer from the
 * migration plan: the API is the only path to the DB, and RLS is the second wall.
 */
export async function withUser<T>(
  userId: string | null,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    // set_config(..., true) = local to this transaction only.
    await client.query('select set_config($1, $2, true)', ['app.user_id', userId ?? '']);
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}
