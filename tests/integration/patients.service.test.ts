import { describe, it, beforeAll, expect } from 'vitest';
import { spawn } from 'node:child_process';

/**
 * Exercises the real service layer against a real PostgreSQL, so the parts that
 * only exist in the database — the ISUP grade-group trigger and the 7-milestone
 * follow-up schedule — are proven, not mocked.
 *
 * Skipped unless TEST_DATABASE_URL points at a throwaway database:
 *   cd infra && docker compose --env-file .env up -d
 *   TEST_DATABASE_URL=postgres://ralp:ralp_dev_password@localhost:5432/ralp npm run test
 */
const RUN = !!process.env.TEST_DATABASE_URL;

// Unique per run. The registry is append-only by design — the audit trail holds
// a row for every patient created and blocks deleting one (ADR-002) — so the
// suite adds a record rather than reusing and clearing a fixed identifier.
const NHS_DIGITS = String(Date.now()).slice(-10);
const NHS_FORMATTED = `${NHS_DIGITS.slice(0, 3)} ${NHS_DIGITS.slice(3, 6)} ${NHS_DIGITS.slice(6)}`;

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

describe.skipIf(!RUN)('patients.service', () => {
  let patients: typeof import('@/server/services/patients.service');
  let userId: string;
  let patientId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    await runMigrations();

    // Imported only now: server/db/pool.ts reads DATABASE_URL when the module
    // is first evaluated, and static imports would run before this hook.
    const { provisionUser } = await import('@/server/auth/provision');
    patients = await import('@/server/services/patients.service');

    userId = await provisionUser({
      email: `vitest-${Date.now()}@example.test`,
      password: 'S3cret!',
      fullName: 'Vitest Clinician',
      role: 'Consultant Surgeon',
      surgeonCode: 'VK',
    });
  }, 60_000);

  it('creates a patient and formats the stored NHS number', async () => {
    const created = await patients.createPatient(userId, {
      firstName: 'Vitest',
      surname: 'Patient',
      dateOfBirth: '1958-03-21',
      nhsNumber: NHS_FORMATTED,
      hospitalNumber: `HOS-VITEST-${Date.now()}`,
      primarySurgeon: 'VK',
    });

    expect(created.id).toBeTruthy();
    // Stored as 10 bare digits, read back in 3-3-4 groups.
    expect(created.nhsNumber).toBe(NHS_FORMATTED);
    expect(created.nhsNumber).toMatch(/^\d{3} \d{3} \d{4}$/);
    patientId = created.id;
  });

  it('reads the patient back by id', async () => {
    const found = await patients.getPatientById(userId, patientId);
    expect(found?.id).toBe(patientId);
  });

  it('derives the ISUP grade group from the Gleason grade', async () => {
    await patients.updateBaseline(userId, patientId, {
      psa: 6.5,
      gleasonGrade: '3+4',
      clinicalStage: '2A',
    });

    const found = await patients.getPatientById(userId, patientId);
    expect(found?.baseline?.gradeGroup).toBe(2);
  });

  it('schedules the seven follow-up milestones from the operation date', async () => {
    await patients.updateOperation(userId, patientId, {
      surgeon: 'VK',
      operationDate: '2026-01-15',
      bladderNeck: 'sparing',
      nerveSparing: 'Bilateral',
    });

    const found = await patients.getPatientById(userId, patientId);
    expect(found?.followUps).toHaveLength(7);
  });
});
