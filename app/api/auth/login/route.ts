import { NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/server/db/pool';
import { verifyPassword } from '@/server/auth/password';
import { startSession } from '@/server/auth/session';
import { loadProfile } from '@/server/auth/profile';

// node:crypto (scrypt) requires the Node.js runtime, not Edge.
export const runtime = 'nodejs';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();

  const { rows } = await pool.query(
    'select id, password_hash, status from users where lower(email) = $1',
    [email]
  );
  const user = rows[0];

  // One generic message and the same work whether the account exists or not, so
  // the response does not reveal which emails are registered.
  const ok = user && user.status === 'active' && (await verifyPassword(parsed.data.password, user.password_hash));
  if (!ok) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const profile = await loadProfile(user.id);
  if (!profile) {
    return NextResponse.json({ error: 'No profile is provisioned for this account.' }, { status: 403 });
  }

  await startSession(user.id);
  return NextResponse.json({ user: profile });
}
