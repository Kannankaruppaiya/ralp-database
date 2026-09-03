import { describe, it, beforeAll, expect } from 'vitest';
import { spawn } from 'node:child_process';

/**
 * Exercises patient sign-in against a real PostgreSQL, because the behaviour
 * that matters — matching, the duplicate refusal, and the account that gets
 * created — is all database state.
 *
 * Skipped unless TEST_DATABASE_URL points at a throwaway database:
 *   cd infra && docker compose --env-file .env up -d
 *   TEST_DATABASE_URL=postgres://ralp:ralp_dev_password@localhost:5432/ralp npm run test
 */
const RUN = !!process.env.TEST_DATABASE_URL;
const STAMP = String(Date.now()).slice(-8);
const nhs = (n: number) => String(Number(`10${STAMP}`) + n).slice(-10);

function runMigrations(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/migrate.mjs'], {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`migrate.mjs exited with ${code}`))
    );
  });
}

describe.skipIf(!RUN)('signInPatient', () => {
  let signInPatient: typeof import('@/server/auth/patient-login').signInPatient;
  let verifyPassword: typeof import('@/server/auth/password').verifyPassword;
  let pool: typeof import('@/server/db/pool').pool;

  const solo = {
    firstName: `Alistair${STAMP}`,
    surname: `Kingsmill${STAMP}`,
    dateOfBirth: '1958-04-18',
  };
  const twin = {
    firstName: `Rowan${STAMP}`,
    surname: `Blackwood${STAMP}`,
    dateOfBirth: '1951-07-25',
  };
  const gone = {
    firstName: `Desmond${STAMP}`,
    surname: `Falconer${STAMP}`,
    dateOfBirth: '1963-11-02',
  };

  async function addPatient(
    p: { firstName: string; surname: string; dateOfBirth: string },
    n: number,
    status = 'Active'
  ) {
    await pool.query(
      `insert into patients
         (first_name, surname, date_of_birth, nhs_number, hospital_number, primary_surgeon, status)
       values ($1, $2, $3, $4, $5, 'VK', $6)`,
      [p.firstName, p.surname, p.dateOfBirth, nhs(n), `RALP-${STAMP}-${n}`, status]
    );
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await runMigrations();

    // Imported only now: server/db/pool.ts reads DATABASE_URL when the module is
    // first evaluated, and static imports would run before this hook.
    ({ signInPatient } = await import('@/server/auth/patient-login'));
    ({ verifyPassword } = await import('@/server/auth/password'));
    ({ pool } = await import('@/server/db/pool'));

    await addPatient(solo, 1);
    await addPatient(twin, 2);
    await addPatient(twin, 3); // same name and birthday, a different person
    await addPatient(gone, 4, 'Deceased');
  });

  it('signs in the one patient who matches', async () => {
    const result = await signInPatient(solo);
    expect(result.ok).toBe(true);
  });

  it('links the session to that patient and gives it the Patient role', async () => {
    const result = await signInPatient(solo);
    if (!result.ok) throw new Error('expected a match');

    const { rows } = await pool.query(
      `select p.role, pat.first_name
         from profiles p join patients pat on pat.id = p.patient_id
        where p.id = $1`,
      [result.userId]
    );
    expect(rows[0].role).toBe('Patient');
    expect(rows[0].first_name).toBe(solo.firstName);
  });

  it('reuses the same account on a second sign-in', async () => {
    const first = await signInPatient(solo);
    const second = await signInPatient(solo);
    if (!first.ok || !second.ok) throw new Error('expected a match');
    expect(second.userId).toBe(first.userId);
  });

  it('matches names case-insensitively', async () => {
    const result = await signInPatient({ ...solo, firstName: solo.firstName.toUpperCase() });
    expect(result.ok).toBe(true);
  });

  it('refuses to guess when two patients share a name and a birthday', async () => {
    const result = await signInPatient(twin);
    expect(result).toEqual({ ok: false, reason: 'ambiguous' });
  });

  it('does not find a patient who is not there', async () => {
    const result = await signInPatient({ ...solo, surname: 'Nobody' });
    expect(result).toEqual({ ok: false, reason: 'not_found' });
  });

  it('does not sign in a deceased patient', async () => {
    const result = await signInPatient(gone);
    expect(result).toEqual({ ok: false, reason: 'not_found' });
  });

  it('creates an account that no password can open', async () => {
    const result = await signInPatient(solo);
    if (!result.ok) throw new Error('expected a match');

    const { rows } = await pool.query('select password_hash from users where id = $1', [
      result.userId,
    ]);
    expect(await verifyPassword('', rows[0].password_hash)).toBe(false);
    expect(await verifyPassword('disabled', rows[0].password_hash)).toBe(false);
  });
});
