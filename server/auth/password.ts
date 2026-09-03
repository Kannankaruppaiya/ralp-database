import 'server-only';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

/**
 * Password hashing with Node's built-in scrypt — a memory-hard KDF in the
 * standard library, so there is no native dependency to compile and the app
 * builds and runs identically on any host (a laptop, an Alpine container, an
 * EC2 box). Stored format: `scrypt$<saltHex>$<keyHex>`.
 */
const scryptAsync = promisify(scrypt);
const KEYLEN = 64;
const SALT_BYTES = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = (await scryptAsync(password, salt, KEYLEN)) as Buffer;
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;

  const key = Buffer.from(keyHex, 'hex');
  const candidate = (await scryptAsync(password, Buffer.from(saltHex, 'hex'), key.length)) as Buffer;
  // Lengths match by construction, but guard timingSafeEqual which throws on mismatch.
  return key.length === candidate.length && timingSafeEqual(key, candidate);
}
