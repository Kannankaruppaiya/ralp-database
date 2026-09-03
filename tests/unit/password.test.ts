import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/server/auth/password';

describe('scrypt password hashing', () => {
  it('verifies the password it hashed', async () => {
    const stored = await hashPassword('S3cret!');
    expect(await verifyPassword('S3cret!', stored)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const stored = await hashPassword('S3cret!');
    expect(await verifyPassword('wrong', stored)).toBe(false);
  });

  it('rejects a tampered hash', async () => {
    const stored = await hashPassword('S3cret!');
    const tampered = stored.slice(0, -4) + '0000';
    expect(await verifyPassword('S3cret!', tampered)).toBe(false);
  });
});
