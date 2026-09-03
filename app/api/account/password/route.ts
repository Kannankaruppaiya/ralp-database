import { currentUserId } from '@/server/auth/session';
import { withUser } from '@/server/db/pool';
import { hashPassword } from '@/server/auth/password';
import { writeAudit } from '@/server/services/audit.service';

export const runtime = 'nodejs';

const MIN_PASSWORD = 12;

export async function POST(request: Request) {
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: 'Sign in to continue.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const newPassword = body?.newPassword;

  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD) {
    return Response.json(
      { error: `Your password must be at least ${MIN_PASSWORD} characters.` },
      { status: 422 }
    );
  }

  const passwordHash = await hashPassword(newPassword);

  // Setting the password and clearing the must-change flag happen together in
  // one transaction: a half-applied change would either leave the clinician
  // locked at /change-password with a password that already works, or clear the
  // gate without a new password behind it.
  await withUser(userId, async (client) => {
    await client.query('update users set password_hash = $1 where id = $2', [passwordHash, userId]);
    await client.query('update profiles set must_change_password = false where id = $1', [userId]);
  });

  await writeAudit(userId, 'PASSWORD_CHANGED', undefined, 'Password changed by the account holder');

  return Response.json({ ok: true });
}
