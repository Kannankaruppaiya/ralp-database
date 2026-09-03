import 'server-only';
import { randomBytes, createHash } from 'node:crypto';
import { pool, withUser } from '@/server/db/pool';
import { hashPassword } from './password';

/**
 * Self-service password reset, token side.
 *
 * A reset link carries a raw token that only ever exists in that one email; the
 * database stores its SHA-256 hash, so the table cannot be turned back into a
 * working link. Tokens are single-use (used_at) and short-lived (TTL below).
 */
const TOKEN_BYTES = 32;
const TTL_MINUTES = 60;

/** SHA-256 is right here: the token is 256 bits of entropy, not a guessable secret. */
function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Issues a reset token for the account with this email, or returns null when no
 * active account matches. The caller must respond the same way either way, so a
 * null here is not an error the clinician ever sees — it just means no email is
 * sent, which is what stops the form revealing which addresses are registered.
 */
export async function createResetToken(email: string): Promise<string | null> {
  const { rows } = await pool.query(
    "select id from users where lower(email) = lower($1) and status = 'active'",
    [email]
  );
  const user = rows[0];
  if (!user) return null;

  const rawToken = randomBytes(TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);

  await pool.query(
    'insert into password_reset_tokens (token_hash, user_id, expires_at) values ($1, $2, $3)',
    [hashToken(rawToken), user.id, expiresAt.toISOString()]
  );
  return rawToken;
}

/**
 * Consumes a reset token and sets the new password in one transaction. Returns
 * the user id on success, or null when the token is unknown, already used, or
 * expired — the route maps every null to one generic message so a caller cannot
 * tell which case they hit.
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string
): Promise<string | null> {
  const tokenHash = hashToken(rawToken);
  const passwordHash = await hashPassword(newPassword);

  return withUser(null, async (client) => {
    // Lock the row so two submissions of the same link cannot both succeed.
    const { rows } = await client.query(
      `select user_id from password_reset_tokens
         where token_hash = $1 and used_at is null and expires_at > now()
         for update`,
      [tokenHash]
    );
    const row = rows[0];
    if (!row) return null;

    await client.query('update users set password_hash = $1 where id = $2', [
      passwordHash,
      row.user_id,
    ]);
    await client.query(
      'update password_reset_tokens set used_at = now() where token_hash = $1',
      [tokenHash]
    );
    // Any other outstanding links for this account are void once the password
    // changes — a reset should not leave a second usable link behind.
    await client.query(
      'update password_reset_tokens set used_at = now() where user_id = $1 and used_at is null',
      [row.user_id]
    );
    return row.user_id as string;
  });
}
