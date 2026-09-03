import 'server-only';
import { SignJWT, jwtVerify } from 'jose';

/**
 * Signs and verifies the session token. HS256 with a shared secret from
 * `JWT_SECRET`; `jose` is pure JS so this also runs in the Edge middleware
 * runtime. The token carries only the user id (`sub`) — the profile and role are
 * always re-read from the database, never trusted from the token.
 */
const ISSUER = 'ralp';
const TTL = '12h';

function secret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(value);
}

export async function signSession(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(TTL)
    .sign(secret());
}

/** Returns the user id, or null if the token is missing, invalid, or expired. */
export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
