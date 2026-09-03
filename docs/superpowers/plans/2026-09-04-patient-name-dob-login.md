# Patient Name + DOB Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a patient sign in with first name, surname and date of birth alone, so that a patient can reach the portal as soon as a clinician has registered them.

**Architecture:** A new route `POST /api/auth/patient-login` matches the three fields against the `patients` table, refuses to guess when more than one patient matches, and lazily creates the `users` + `profiles` rows that the existing session and row-level-security machinery already expect. Nothing downstream of `startSession` changes. A small in-process throttle guards the route, because the credential is not a secret.

**Tech Stack:** Next.js 15 route handlers (Node runtime), `pg` via `server/db/pool`, `zod` for body validation, `jose` JWT session cookie (unchanged), Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-04-patient-name-dob-login-design.md`. Read it before starting.
- Zero Supabase. Plain `pg` through `server/db/pool` only.
- Every file under `server/**` starts with `import 'server-only';`.
- Route handlers that touch `node:crypto` or `pg` must export `export const runtime = 'nodejs';`.
- Never reveal which of the three fields was wrong, and never reveal whether a person is in the registry. One generic 401 message: `Invalid email or password.`-style genericness, worded for patients.
- Never sign a patient in when more than one record matches. Return 409.
- The lazy-created account must never be usable on `/api/auth/login`.
- Only `Deceased` patients are refused. `Discharged` and `Under Surveillance` may sign in.
- Unit tests run with `npm run test`. Integration tests are skipped unless `TEST_DATABASE_URL` is set; follow the pattern in `tests/integration/patients.service.test.ts`.
- Commit messages end with `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

## File Structure

| File | Responsibility |
| :--- | :--- |
| `server/auth/throttle.ts` (create) | A reusable counter: how many failures for a key inside a window. Knows nothing about patients or HTTP. |
| `server/auth/patient-login.ts` (create) | Match a patient by name and date of birth; ensure their account row exists; return the profile id. Knows nothing about HTTP or cookies. |
| `app/api/auth/patient-login/route.ts` (create) | HTTP only: validate the body, derive the client IP, apply the throttle, call `signInPatient`, start the session, map results to status codes. |
| `lib/auth.ts` (modify) | Add the client-side `signInPatient` helper beside the existing `signIn`. |
| `app/(patient)/patient-login/page.tsx` (modify) | Swap the email and password inputs for First Name, Surname and Date of Birth. |
| `tests/unit/throttle.test.ts` (create) | The throttle's counting and expiry. |
| `tests/integration/patient-login.test.ts` (create) | The matching, the duplicate refusal, and that the created account cannot be used with a password. |

---

### Task 1: The throttle

**Files:**
- Create: `server/auth/throttle.ts`
- Test: `tests/unit/throttle.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `createThrottle({ limit, windowMs }): Throttle` where `Throttle` is `{ blocked(key: string): boolean; fail(key: string): void; clear(key: string): void }`, and the shared instance `patientLoginThrottle`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/throttle.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createThrottle } from '@/server/auth/throttle';

describe('createThrottle', () => {
  afterEach(() => vi.useRealTimers());

  it('allows attempts below the limit', () => {
    const t = createThrottle({ limit: 3, windowMs: 1000 });
    t.fail('a');
    t.fail('a');
    expect(t.blocked('a')).toBe(false);
  });

  it('blocks once the limit is reached', () => {
    const t = createThrottle({ limit: 3, windowMs: 1000 });
    t.fail('a');
    t.fail('a');
    t.fail('a');
    expect(t.blocked('a')).toBe(true);
  });

  it('counts each key separately', () => {
    const t = createThrottle({ limit: 1, windowMs: 1000 });
    t.fail('a');
    expect(t.blocked('a')).toBe(true);
    expect(t.blocked('b')).toBe(false);
  });

  it('forgets failures once the window has passed', () => {
    vi.useFakeTimers();
    const t = createThrottle({ limit: 1, windowMs: 1000 });
    t.fail('a');
    expect(t.blocked('a')).toBe(true);
    vi.advanceTimersByTime(1001);
    expect(t.blocked('a')).toBe(false);
  });

  it('clears a key on success', () => {
    const t = createThrottle({ limit: 1, windowMs: 1000 });
    t.fail('a');
    t.clear('a');
    expect(t.blocked('a')).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/throttle.test.ts`
Expected: FAIL — cannot resolve `@/server/auth/throttle`.

- [ ] **Step 3: Write the implementation**

Create `server/auth/throttle.ts`:

```ts
import 'server-only';

/**
 * Counts failures per key inside a sliding window. Used to slow down guessing
 * against the patient sign-in, where the credential (name and date of birth) is
 * not a secret and so brute force is the realistic attack.
 *
 * ponytail: in-process map, so the count is per app instance. Move it to a
 * table if this application is ever run as more than one instance.
 */
export interface Throttle {
  blocked(key: string): boolean;
  fail(key: string): void;
  clear(key: string): void;
}

export function createThrottle({ limit, windowMs }: { limit: number; windowMs: number }): Throttle {
  const hits = new Map<string, number[]>();

  function recent(key: string): number[] {
    const cutoff = Date.now() - windowMs;
    const kept = (hits.get(key) ?? []).filter((at) => at > cutoff);
    if (kept.length) hits.set(key, kept);
    else hits.delete(key);
    return kept;
  }

  return {
    blocked: (key) => recent(key).length >= limit,
    fail: (key) => {
      const kept = recent(key);
      kept.push(Date.now());
      hits.set(key, kept);
    },
    clear: (key) => {
      hits.delete(key);
    },
  };
}

/** Ten failures per client address per fifteen minutes. */
export const patientLoginThrottle = createThrottle({ limit: 10, windowMs: 15 * 60_000 });
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/throttle.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add server/auth/throttle.ts tests/unit/throttle.test.ts
git commit -m "feat: add a per-key failure throttle for credential-free sign-in

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: Matching a patient and lazily creating their account

**Files:**
- Create: `server/auth/patient-login.ts`
- Test: `tests/integration/patient-login.test.ts`

**Interfaces:**
- Consumes: `withUser` from `@/server/db/pool`.
- Produces:

```ts
export type PatientLoginResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'not_found' | 'ambiguous' };

export async function signInPatient(input: {
  firstName: string;
  surname: string;
  dateOfBirth: string; // 'YYYY-MM-DD'
}): Promise<PatientLoginResult>;
```

`userId` is the `profiles.id` (which equals `users.id`) that `startSession` and `loadProfile` expect.

- [ ] **Step 1: Write the failing test**

Create `tests/integration/patient-login.test.ts`:

```ts
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

  const solo = { firstName: `Alistair${STAMP}`, surname: `Kingsmill${STAMP}`, dateOfBirth: '1958-04-18' };
  const twin = { firstName: `Rowan${STAMP}`, surname: `Blackwood${STAMP}`, dateOfBirth: '1951-07-25' };
  const gone = { firstName: `Desmond${STAMP}`, surname: `Falconer${STAMP}`, dateOfBirth: '1963-11-02' };

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

    const { rows } = await pool.query('select password_hash from users where id = $1', [result.userId]);
    expect(await verifyPassword('', rows[0].password_hash)).toBe(false);
    expect(await verifyPassword('disabled', rows[0].password_hash)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Start the database first if it is not already up:

```bash
cd infra && docker compose --env-file .env up -d && cd ..
```

Run: `TEST_DATABASE_URL=postgres://ralp:ralp_dev_password@localhost:5432/ralp npx vitest run tests/integration/patient-login.test.ts`
Expected: FAIL — cannot resolve `@/server/auth/patient-login`.

- [ ] **Step 3: Write the implementation**

Create `server/auth/patient-login.ts`:

```ts
import 'server-only';
import { withUser } from '@/server/db/pool';

/**
 * Signing in as a patient. The credential is the three mandatory fields the
 * registration form already collects, so a patient can reach the portal as soon
 * as a clinician has created their record — there is no separate provisioning
 * step and no backfill for patients who already exist.
 *
 * The account rows are created on first sign-in rather than at registration, so
 * one code path serves both. Once they exist, everything downstream — the
 * session cookie, loadProfile, row level security — is unchanged.
 */
export type PatientLoginResult =
  | { ok: true; userId: string }
  | { ok: false; reason: 'not_found' | 'ambiguous' };

export interface PatientLoginInput {
  firstName: string;
  surname: string;
  /** 'YYYY-MM-DD' */
  dateOfBirth: string;
}

export async function signInPatient(input: PatientLoginInput): Promise<PatientLoginResult> {
  return withUser(null, async (client) => {
    // Deceased patients are refused. Discharged and Under Surveillance are not:
    // the follow-up schedule runs to 36 months and they may still owe PROMs.
    const { rows: matches } = await client.query(
      `select id, first_name, surname, email
         from patients
        where lower(first_name) = lower($1)
          and lower(surname)    = lower($2)
          and date_of_birth     = $3
          and status <> 'Deceased'
        limit 2`,
      [input.firstName.trim(), input.surname.trim(), input.dateOfBirth]
    );

    if (matches.length === 0) return { ok: false, reason: 'not_found' };
    // Two people can share a name and a birthday. Choosing one of them would
    // open the wrong person's oncology record, so refuse and send them to the
    // clinic instead.
    if (matches.length > 1) return { ok: false, reason: 'ambiguous' };

    const patient = matches[0];

    const { rows: existing } = await client.query(
      'select id from profiles where patient_id = $1 and role = $2',
      [patient.id, 'Patient']
    );
    if (existing[0]) return { ok: true, userId: existing[0].id };

    // users.email is NOT NULL UNIQUE; not every patient record carries one.
    const email = (patient.email as string | null) ?? `patient+${patient.id}@ralp.local`;
    // Not a scrypt$ hash, so verifyPassword rejects it for any input and this
    // account can never be used on the email-and-password route.
    const { rows: created } = await client.query(
      'insert into users (email, password_hash) values (lower($1), $2) returning id',
      [email, 'disabled']
    );
    const userId = created[0].id as string;

    await client.query(
      `insert into profiles (id, full_name, email, role, patient_id)
       values ($1, $2, lower($3), 'Patient', $4)`,
      [userId, `${patient.first_name} ${patient.surname}`, email, patient.id]
    );

    return { ok: true, userId };
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `TEST_DATABASE_URL=postgres://ralp:ralp_dev_password@localhost:5432/ralp npx vitest run tests/integration/patient-login.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Run the whole suite to check nothing regressed**

Run: `npm run test`
Expected: PASS, with the integration tests skipped.

- [ ] **Step 6: Commit**

```bash
git add server/auth/patient-login.ts tests/integration/patient-login.test.ts
git commit -m "feat: match a patient by name and date of birth and provision their account

The account rows are created on first sign-in rather than at registration, so
one code path serves patients who already exist as well as new ones. Two
patients sharing a name and a birthday are refused rather than guessed at.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: The route

**Files:**
- Create: `app/api/auth/patient-login/route.ts`

**Interfaces:**
- Consumes: `signInPatient` and `PatientLoginResult` from Task 2, `patientLoginThrottle` from Task 1, `startSession` from `@/server/auth/session`, `loadProfile` from `@/server/auth/profile`.
- Produces: `POST /api/auth/patient-login` returning `{ user: ServerUserSession }` on success.

- [ ] **Step 1: Write the route**

Create `app/api/auth/patient-login/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { signInPatient } from '@/server/auth/patient-login';
import { patientLoginThrottle } from '@/server/auth/throttle';
import { startSession } from '@/server/auth/session';
import { loadProfile } from '@/server/auth/profile';

// pg and the session cookie require the Node.js runtime, not Edge.
export const runtime = 'nodejs';

const Body = z.object({
  firstName: z.string().trim().min(1),
  surname: z.string().trim().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// One message for every failed sign-in, so the response never reveals which
// field was wrong nor whether a person is in the registry at all.
const GENERIC = 'We could not find your record. Please check your details or contact the clinic.';

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: Request) {
  const key = clientKey(request);
  if (patientLoginThrottle.blocked(key)) {
    return NextResponse.json(
      { error: 'Too many attempts. Please wait fifteen minutes and try again.' },
      { status: 429 }
    );
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    patientLoginThrottle.fail(key);
    return NextResponse.json({ error: GENERIC }, { status: 400 });
  }

  const result = await signInPatient(parsed.data);

  if (!result.ok && result.reason === 'ambiguous') {
    // Not a failed guess — a real person whose record we will not choose for
    // them. It does not count against the throttle.
    return NextResponse.json(
      {
        error:
          'More than one record matches those details. Please contact the clinic so we can identify you safely.',
      },
      { status: 409 }
    );
  }

  if (!result.ok) {
    patientLoginThrottle.fail(key);
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const profile = await loadProfile(result.userId);
  if (!profile) {
    patientLoginThrottle.fail(key);
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  patientLoginThrottle.clear(key);
  await startSession(result.userId, profile.role);
  return NextResponse.json({ user: profile });
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/auth/patient-login/route.ts
git commit -m "feat: add the patient sign-in route

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: The client helper and the form

**Files:**
- Modify: `lib/auth.ts`
- Modify: `app/(patient)/patient-login/page.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/patient-login` from Task 3.
- Produces: `signInPatient(firstName: string, surname: string, dateOfBirth: string): Promise<UserSession>` exported from `lib/auth.ts`.

- [ ] **Step 1: Add the client helper**

In `lib/auth.ts`, directly after the existing `signIn` function, add:

```ts
/**
 * The patient portal's own sign-in: the three mandatory fields their record
 * already carries, so a patient can sign in as soon as a clinician has
 * registered them. No password, by product decision — see
 * docs/superpowers/specs/2026-09-04-patient-name-dob-login-design.md.
 */
export async function signInPatient(
  firstName: string,
  surname: string,
  dateOfBirth: string
): Promise<UserSession> {
  const res = await fetch('/api/auth/patient-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, surname, dateOfBirth }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error ?? 'Sign in failed.');

  const session = body.user as UserSession;
  setSession(session);
  await db.audit('LOGIN', undefined, `${session.name} signed in as ${session.role}`);
  return session;
}
```

- [ ] **Step 2: Point the page at it**

In `app/(patient)/patient-login/page.tsx`:

Change the import to bring in the new helper:

```ts
import { signInPatient, signOut } from '@/lib/auth';
```

Replace the two credential fields of state:

```ts
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
```

with:

```ts
const [firstName, setFirstName] = useState('');
const [surname, setSurname] = useState('');
const [dateOfBirth, setDateOfBirth] = useState('');
```

and change the one call inside `handleSignIn`:

```ts
const user = await signInPatient(firstName, surname, dateOfBirth);
```

- [ ] **Step 3: Replace the inputs**

In the same file, replace the "Registered Email Address" and "Password" `FormField` blocks with three fields, keeping the surrounding markup, icons and classes exactly as they already are:

```tsx
<FormField>
  <FormLabel htmlFor="firstName">First Name</FormLabel>
  <Input
    id="firstName"
    autoComplete="given-name"
    placeholder="Arthur"
    value={firstName}
    onChange={(e) => setFirstName(e.target.value)}
    required
  />
</FormField>

<FormField>
  <FormLabel htmlFor="surname">Surname</FormLabel>
  <Input
    id="surname"
    autoComplete="family-name"
    placeholder="Pendleton"
    value={surname}
    onChange={(e) => setSurname(e.target.value)}
    required
  />
</FormField>

<FormField>
  <FormLabel htmlFor="dateOfBirth">Date of Birth</FormLabel>
  <Input
    id="dateOfBirth"
    type="date"
    autoComplete="bday"
    value={dateOfBirth}
    onChange={(e) => setDateOfBirth(e.target.value)}
    required
  />
</FormField>
```

`<input type="date">` yields exactly the `YYYY-MM-DD` the route expects, which is why no parsing is needed anywhere.

Update the sign-in description text above the fields from "Sign in with your registered email and password to view your confidential recovery record." to "Sign in with your name and date of birth to view your confidential recovery record."

Leave the "SMS Magic Code" tab and its `handleSendOtp` exactly as they are.

- [ ] **Step 4: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

- [ ] **Step 5: Check it in a browser**

```bash
npm run dev
```

Register a patient at `/patients/new` as a clinician, sign out, then sign in at `/patient-login` with that patient's first name, surname and date of birth. Expect the recovery dashboard at `/home`. Then try a surname that does not exist and expect the generic message, not a field-specific one.

- [ ] **Step 6: Commit**

```bash
git add lib/auth.ts "app/(patient)/patient-login/page.tsx"
git commit -m "feat: sign patients in with their name and date of birth

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: Deploy to the AWS test box

**Files:** none — this is the existing deployment path.

- [ ] **Step 1: Merge to main**

```bash
git checkout main && git pull && git merge --no-ff feat/patient-name-dob-login && git push
```

- [ ] **Step 2: Deploy**

Follow the same path used for the last deployment: `git archive` of `origin/main` to S3, unpack into `/opt/ralp/web-v2-next` on `i-0d9c1d1d03a4dd389` (eu-west-2) carrying `.env.production` and hardlinking `node_modules`, `npm run build:prod` in a `node:22-alpine` container, then stop `ralp-web-v2`, swap the directory, and start it. No migration is needed for this change. Keep the previous directory as the rollback.

- [ ] **Step 3: Verify**

```bash
curl -sk -o /dev/null -w '%{http_code}\n' https://v2.51-202-0-221.nip.io/patient-login
```

Then sign in as a real registered test patient through the browser.
