import { SignJWT, jwtVerify } from 'jose';

/**
 * Signs and verifies the session token. HS256 with a shared secret from
 * `JWT_SECRET`; `jose` is pure JS with no Node built-ins, so this module is
 * shared by the Node route handlers and the Edge middleware (hence no
 * `server-only` guard here). The token carries the user id (`sub`) and role.
 * The role is a convenience for the middleware's coarse route gate only — every
 * data path still re-checks against the database via RLS, never the token.
 */
const ISSUER = 'ralp';
const TTL = '12h';

export interface SessionClaims {
  userId: string;
  role: string;
}

function secret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(value);
}

export async function signSession(userId: string, role: string): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setExpirationTime(TTL)
    .sign(secret());
}

/** Returns the claims, or null if the token is missing, invalid, or expired. */
export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER });
    if (!payload.sub) return null;
    return { userId: payload.sub, role: typeof payload.role === 'string' ? payload.role : '' };
  } catch {
    return null;
  }
}
