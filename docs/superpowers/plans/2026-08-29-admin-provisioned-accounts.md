# Admin-provisioned accounts — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an administrator provision, deactivate, and delete clinician accounts from the admin console, hold each new clinician at a change-password page until they set their own password, and reduce the landing page to administrator sign-in only.

**Architecture:** Four Next.js route handlers hold the Supabase service role key server-side and perform every privileged operation. A shared `requireAdmin()` gate carries authorisation for all three admin routes; it is the most security-sensitive unit in this change and is unit-tested directly. Two new `profiles` columns drive the forced password change and the deactivated state, and `middleware.ts` enforces both.

**Tech Stack:** Next.js 15.1.4 (App Router), React 19, TypeScript, `@supabase/ssr`, `@supabase/supabase-js`, Vitest.

## Global Constraints

- The service role key is read only inside `app/api/**` and `lib/supabase/admin.ts`. It is named `SUPABASE_SERVICE_ROLE_KEY` — never prefixed `NEXT_PUBLIC_`.
- Temporary passwords must be at least 12 characters.
- `user_role` enum values, exactly: `Consultant Surgeon`, `Surgical Registrar`, `Clinical Nurse Specialist`, `Data Manager`, `Patient`.
- `surgeon_code` enum values, exactly: `VK`, `RDM`, `CI`, `OAK`, `OTHER`.
- The admin role is `Data Manager`. No other role reaches `/admin`.
- No route ever returns a password in its response body.
- Migrations are numbered sequentially; `0008` is the highest that exists, so this change adds `0009`.
- Existing RLS policies on `profiles` (`own profile readable`, `admin reads profiles`, `admin writes profiles`) are not modified.

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/0009_account_lifecycle.sql` | Adds `must_change_password` and `deactivated_at` to `profiles` |
| `lib/supabase/admin.ts` | Service-role client factory, server-only |
| `lib/api/require-admin.ts` | Session + `Data Manager` gate shared by all admin routes |
| `app/api/admin/staff/route.ts` | `POST` — create a clinician account |
| `app/api/admin/staff/[id]/status/route.ts` | `POST` — deactivate and reactivate |
| `app/api/admin/staff/[id]/route.ts` | `DELETE` — remove an account |
| `app/api/account/password/route.ts` | `POST` — change own password, clear the flag |
| `app/change-password/page.tsx` | The page a flagged clinician is held on |
| `middleware.ts` | Redirects on `must_change_password` and `deactivated_at` |
| `app/(admin)/admin/users/page.tsx` | Wires the existing invite form and adds row actions |
| `app/page.tsx` | Landing page reduced to the admin door |
| `app/(auth)/login/page.tsx`, `app/(auth)/admin-login/page.tsx` | Autofill test buttons removed |
| `tests/require-admin.test.ts`, `tests/staff-route.test.ts`, `tests/staff-lifecycle.test.ts` | Authorisation tests |

---

### Task 1: Test infrastructure

The project has no test runner. Vitest is added here because Task 3 onward tests authorisation code, where a silent bug hands account creation to any signed-in user.

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/sanity.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` runs Vitest once; `npm run test:watch` watches. Tests live in `tests/` and may import app code with the `@/` alias.

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest@^3 vite-tsconfig-paths
```

- [ ] **Step 2: Create the config**

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Add the scripts**

In `package.json` `scripts`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

Leave `test:perf`, `test:load1000` and `test:frameworks` untouched — they are unrelated load-testing scripts.

- [ ] **Step 4: Write a sanity test**

`tests/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { APP_CONFIG } from '@/config/environment';

describe('test harness', () => {
  it('resolves the @/ alias into app code', () => {
    expect(typeof APP_CONFIG.name).toBe('string');
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts tests/sanity.test.ts
git commit -m "Add Vitest so authorisation code can be tested"
```

---

### Task 2: Migration for the two account-state columns

**Files:**
- Create: `supabase/migrations/0009_account_lifecycle.sql`

**Interfaces:**
- Produces: `profiles.must_change_password boolean not null default false` and `profiles.deactivated_at timestamptz null`.

- [ ] **Step 1: Write the migration**

`supabase/migrations/0009_account_lifecycle.sql`:

```sql
-- Accounts provisioned by an administrator start with a password the
-- administrator knows. The clinician is held at /change-password until they
-- have replaced it, so that audit_log attribution names someone who is the only
-- person able to have acted.
alter table profiles
  add column if not exists must_change_password boolean not null default false;

-- A clinician who leaves the department stops being able to sign in while
-- everything they recorded stays attributable. Null means active.
alter table profiles
  add column if not exists deactivated_at timestamptz;

comment on column profiles.must_change_password is
  'Set when an administrator provisions the account; cleared once the clinician sets their own password.';
comment on column profiles.deactivated_at is
  'Null while the account may sign in. Stamped when an administrator deactivates it.';
```

The defaults leave every existing row active and unflagged.

- [ ] **Step 2: Apply it to staging**

Run: `npm run db:push:staging`
Expected: `0009_account_lifecycle.sql` applied without error.

- [ ] **Step 3: Verify the columns exist**

Run this against staging:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='profiles'
  and column_name in ('must_change_password','deactivated_at');
```

Expected: two rows — `must_change_password boolean NO false`, `deactivated_at timestamp with time zone YES null`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0009_account_lifecycle.sql
git commit -m "Add account lifecycle columns to profiles"
```

---

### Task 3: The admin gate

**Files:**
- Create: `lib/supabase/admin.ts`
- Create: `lib/api/require-admin.ts`
- Test: `tests/require-admin.test.ts`

**Interfaces:**
- Consumes: `supabaseServer()` from `lib/supabase/server.ts`.
- Produces:
  - `supabaseAdmin(): SupabaseClient` — service-role client, no session persistence.
  - `type Actor = { id: string; name: string; role: string; gmcNumber: string | null }`
  - `requireAdmin(): Promise<{ ok: true; actor: Actor } | { ok: false; response: Response }>`

- [ ] **Step 1: Write the failing test**

`tests/require-admin.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getUser = vi.fn();
const maybeSingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  supabaseServer: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  }),
}));

const { requireAdmin } = await import('@/lib/api/require-admin');

describe('requireAdmin', () => {
  beforeEach(() => {
    getUser.mockReset();
    maybeSingle.mockReset();
  });

  it('rejects a request with no session', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    const result = await requireAdmin();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it('rejects a signed-in user who is not a Data Manager', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    maybeSingle.mockResolvedValue({
      data: { id: 'u1', full_name: 'Mr V. Kannan', role: 'Consultant Surgeon', gmc_number: '1234567' },
    });

    const result = await requireAdmin();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('admits a Data Manager and reports who they are', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'admin-1' } } });
    maybeSingle.mockResolvedValue({
      data: { id: 'admin-1', full_name: 'Demo Administrator', role: 'Data Manager', gmc_number: null },
    });

    const result = await requireAdmin();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.actor).toEqual({
        id: 'admin-1',
        name: 'Demo Administrator',
        role: 'Data Manager',
        gmcNumber: null,
      });
    }
  });

  it('rejects a session whose profile row is missing', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'ghost' } } });
    maybeSingle.mockResolvedValue({ data: null });

    const result = await requireAdmin();

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- tests/require-admin.test.ts`
Expected: FAIL — cannot resolve `@/lib/api/require-admin`.

- [ ] **Step 3: Write the service-role client**

`lib/supabase/admin.ts`:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client holding the service role key, which bypasses row level
 * security entirely. Import this only from route handlers under app/api —
 * anything that reaches a client bundle would publish the key.
 */
export function supabaseAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

- [ ] **Step 4: Write the gate**

`lib/api/require-admin.ts`:

```ts
import { supabaseServer } from '@/lib/supabase/server';

export type Actor = {
  id: string;
  name: string;
  role: string;
  gmcNumber: string | null;
};

export type AdminGate =
  | { ok: true; actor: Actor }
  | { ok: false; response: Response };

const deny = (status: number, error: string): AdminGate => ({
  ok: false,
  response: Response.json({ error }, { status }),
});

/**
 * Authorisation for every route under /api/admin.
 *
 * middleware.ts guards pages, not route handlers, so each route has to
 * establish for itself who is calling. The role is read from the caller's own
 * profile row rather than from anything in the request, because a caller can
 * shape a request body freely.
 */
export async function requireAdmin(): Promise<AdminGate> {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return deny(401, 'Sign in to continue.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, gmc_number')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || profile.role !== 'Data Manager') {
    return deny(403, 'Administrator access is required.');
  }

  return {
    ok: true,
    actor: {
      id: profile.id,
      name: profile.full_name,
      role: profile.role,
      gmcNumber: profile.gmc_number ?? null,
    },
  };
}
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `npm test -- tests/require-admin.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/admin.ts lib/api/require-admin.ts tests/require-admin.test.ts
git commit -m "Add the shared admin gate for API routes"
```

---

### Task 4: The provisioning route

**Files:**
- Create: `app/api/admin/staff/route.ts`
- Test: `tests/staff-route.test.ts`

**Interfaces:**
- Consumes: `requireAdmin()`, `supabaseAdmin()`.
- Produces: `POST /api/admin/staff` accepting
  `{ fullName: string; email: string; role: string; surgeonCode?: string; gmcNumber?: string; tempPassword: string }`
  and responding `201 { id, fullName, email, role }`.

- [ ] **Step 1: Write the failing test**

`tests/staff-route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const requireAdmin = vi.fn();
const createUser = vi.fn();
const upsert = vi.fn();
const insertAudit = vi.fn();

vi.mock('@/lib/api/require-admin', () => ({ requireAdmin }));
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => ({
    auth: { admin: { createUser } },
    from: (table: string) =>
      table === 'profiles' ? { upsert } : { insert: insertAudit },
  }),
}));

const { POST } = await import('@/app/api/admin/staff/route');

const admitted = {
  ok: true as const,
  actor: { id: 'admin-1', name: 'Demo Administrator', role: 'Data Manager', gmcNumber: null },
};

const body = (over: Record<string, unknown> = {}) =>
  new Request('http://test/api/admin/staff', {
    method: 'POST',
    body: JSON.stringify({
      fullName: 'Mr R. D. MacDonagh',
      email: 'rdm@nhs.net',
      role: 'Consultant Surgeon',
      surgeonCode: 'RDM',
      tempPassword: 'ChangeMe-2026!',
      ...over,
    }),
  });

describe('POST /api/admin/staff', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    createUser.mockReset();
    upsert.mockReset().mockResolvedValue({ error: null });
    insertAudit.mockReset().mockResolvedValue({ error: null });
  });

  it('passes the gate refusal straight through', async () => {
    requireAdmin.mockResolvedValue({ ok: false, response: Response.json({ error: 'no' }, { status: 403 }) });

    const res = await POST(body());

    expect(res.status).toBe(403);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('rejects a temporary password under 12 characters', async () => {
    requireAdmin.mockResolvedValue(admitted);

    const res = await POST(body({ tempPassword: 'short' }));

    expect(res.status).toBe(422);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('rejects a role outside the enum', async () => {
    requireAdmin.mockResolvedValue(admitted);

    const res = await POST(body({ role: 'Chief Wizard' }));

    expect(res.status).toBe(422);
    expect(createUser).not.toHaveBeenCalled();
  });

  it('reports an already-registered email as a conflict', async () => {
    requireAdmin.mockResolvedValue(admitted);
    createUser.mockResolvedValue({ data: null, error: { message: 'User already registered' } });

    const res = await POST(body());

    expect(res.status).toBe(409);
  });

  it('creates the account, flags it, and never echoes the password', async () => {
    requireAdmin.mockResolvedValue(admitted);
    createUser.mockResolvedValue({ data: { user: { id: 'new-1' } }, error: null });

    const res = await POST(body());
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(createUser).toHaveBeenCalledWith({
      email: 'rdm@nhs.net',
      password: 'ChangeMe-2026!',
      email_confirm: true,
    });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'new-1', must_change_password: true, surgeon_code: 'RDM' }),
      { onConflict: 'id' }
    );
    expect(insertAudit).toHaveBeenCalled();
    expect(JSON.stringify(json)).not.toContain('ChangeMe-2026!');
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- tests/staff-route.test.ts`
Expected: FAIL — cannot resolve `@/app/api/admin/staff/route`.

- [ ] **Step 3: Write the route**

`app/api/admin/staff/route.ts`:

```ts
import { requireAdmin } from '@/lib/api/require-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

const ROLES = [
  'Consultant Surgeon',
  'Surgical Registrar',
  'Clinical Nurse Specialist',
  'Data Manager',
  'Patient',
];
const SURGEON_CODES = ['VK', 'RDM', 'CI', 'OAK', 'OTHER'];
const MIN_PASSWORD = 12;

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: 'Send a JSON body.' }, { status: 422 });

  const { fullName, email, role, surgeonCode, gmcNumber, tempPassword } = body;

  if (typeof fullName !== 'string' || fullName.trim().length < 2) {
    return Response.json({ error: 'Enter the full name.' }, { status: 422 });
  }
  if (typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 422 });
  }
  if (!ROLES.includes(role)) {
    return Response.json({ error: 'Choose a valid role.' }, { status: 422 });
  }
  if (surgeonCode && !SURGEON_CODES.includes(surgeonCode)) {
    return Response.json({ error: 'Choose a valid surgeon code.' }, { status: 422 });
  }
  if (typeof tempPassword !== 'string' || tempPassword.length < MIN_PASSWORD) {
    return Response.json(
      { error: `The temporary password must be at least ${MIN_PASSWORD} characters.` },
      { status: 422 }
    );
  }

  const admin = supabaseAdmin();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (error || !data?.user) {
    const already = /already/i.test(error?.message ?? '');
    return Response.json(
      { error: already ? 'That email already has an account.' : (error?.message ?? 'Could not create the account.') },
      { status: already ? 409 : 502 }
    );
  }

  // The signup trigger writes this row today. Upserting means the route still
  // finishes if that trigger is ever changed, rather than leaving a login with
  // no profile — the state that makes signIn fail with "No profile is
  // provisioned for this account."
  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: data.user.id,
      full_name: fullName.trim(),
      email,
      role,
      surgeon_code: surgeonCode || null,
      gmc_number: gmcNumber || null,
      must_change_password: true,
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 502 });
  }

  await admin.from('audit_log').insert({
    actor_id: gate.actor.id,
    actor_name: gate.actor.name,
    actor_role: gate.actor.role,
    gmc_number: gate.actor.gmcNumber,
    action: 'STAFF_PROVISIONED',
    details: `Created ${role} account for ${fullName.trim()} (${email})`,
  });

  return Response.json(
    { id: data.user.id, fullName: fullName.trim(), email, role },
    { status: 201 }
  );
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- tests/staff-route.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Add the key to Vercel**

In the Vercel project, add `SUPABASE_SERVICE_ROLE_KEY` for Production and Preview. Take the value from Supabase → `ralp-staging` → Project Settings → API Keys → `service_role`. Do not add a `NEXT_PUBLIC_` copy.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/staff/route.ts tests/staff-route.test.ts
git commit -m "Add the staff provisioning route"
```

---

### Task 5: Wire the invite form

**Files:**
- Modify: `app/(admin)/admin/users/page.tsx` — `handleInviteUser` at line 70, and the invite dialog form

**Interfaces:**
- Consumes: `POST /api/admin/staff`.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Extend the record type and the dialog state**

Add the account-state field to the `UserRecord` type, and read it in the existing
row mapping so the shape is consistent everywhere a record is built. Task 7 uses
it; declaring it here keeps the record this task constructs type-correct:

```ts
deactivatedAt?: string | null;
```

In the `.then(...)` mapping that builds `staff`, add alongside the other fields:

```ts
deactivatedAt: r.deactivated_at ?? null,
```

Then change the `newUser` initialiser:

```tsx
const [newUser, setNewUser] = useState({
  name: '',
  email: '',
  role: 'Consultant Surgeon',
  surgeonCode: '',
  gmcNumber: '',
  tempPassword: '',
});
const [isSubmitting, setIsSubmitting] = useState(false);
```

- [ ] **Step 2: Add the fields to the form**

Inside the dialog `<form>`, after the surgeon code input:

```tsx
<div>
  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">GMC Number</label>
  <Input
    placeholder="e.g. 7412589"
    value={newUser.gmcNumber}
    onChange={(e) => setNewUser({ ...newUser, gmcNumber: e.target.value })}
    className="mt-1"
  />
</div>
<div>
  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
    Temporary Password
  </label>
  <Input
    type="text"
    placeholder="At least 12 characters"
    value={newUser.tempPassword}
    onChange={(e) => setNewUser({ ...newUser, tempPassword: e.target.value })}
    minLength={12}
    required
    className="mt-1"
  />
  <p className="mt-1 text-[11px] text-slate-500">
    Give this to the clinician directly. They must change it at first sign-in.
  </p>
</div>
```

- [ ] **Step 3: Replace the stub handler**

Replace `handleInviteUser` entirely:

```tsx
const handleInviteUser = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  try {
    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: newUser.name,
        email: newUser.email,
        role: newUser.role,
        surgeonCode: newUser.surgeonCode || undefined,
        gmcNumber: newUser.gmcNumber || undefined,
        tempPassword: newUser.tempPassword,
      }),
    });
    const payload = await res.json();

    if (!res.ok) {
      toast({ title: 'Could not create the account', description: payload.error, variant: 'destructive' });
      return;
    }

    setStaff((prev) => [
      ...prev,
      {
        id: payload.id,
        name: payload.fullName,
        email: payload.email,
        role: payload.role,
        surgeonCode: newUser.surgeonCode || '—',
        gmcNumber: newUser.gmcNumber || undefined,
        hospital: 'Oxford University Hospitals NHS FT',
        createdAt: new Date().toISOString(),
        deactivatedAt: null,
      },
    ]);
    setIsInviteOpen(false);
    setNewUser({ name: '', email: '', role: 'Consultant Surgeon', surgeonCode: '', gmcNumber: '', tempPassword: '' });
    toast({
      title: 'Account created',
      description: `${payload.fullName} must change the temporary password at first sign-in.`,
      variant: 'success',
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

- [ ] **Step 4: Disable the submit button while in flight**

On the dialog's submit `<Button>`, add `disabled={isSubmitting}`.

- [ ] **Step 5: Verify by hand**

Run `npm run dev:staging`, sign in at `/admin-login` as `demo@admin.com`, open `/admin/users`, and create an account with a 12+ character temporary password. Expected: the row appears, and the account exists in Supabase → Authentication → Users. Then try again with the same email. Expected: the toast reads "That email already has an account."

- [ ] **Step 6: Commit**

```bash
git add "app/(admin)/admin/users/page.tsx"
git commit -m "Wire the invite form to the provisioning route"
```

---

### Task 6: Forced password change

**Files:**
- Create: `app/api/account/password/route.ts`
- Create: `app/change-password/page.tsx`
- Modify: `middleware.ts`

**Interfaces:**
- Consumes: `supabaseServer()`, `supabaseAdmin()`.
- Produces: `POST /api/account/password` accepting `{ newPassword: string }`, responding `200 { ok: true }`.

- [ ] **Step 1: Write the route**

`app/api/account/password/route.ts`:

```ts
import { supabaseServer } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const MIN_PASSWORD = 12;

export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Sign in to continue.' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const newPassword = body?.newPassword;

  if (typeof newPassword !== 'string' || newPassword.length < MIN_PASSWORD) {
    return Response.json(
      { error: `Your password must be at least ${MIN_PASSWORD} characters.` },
      { status: 422 }
    );
  }

  // Setting the password and clearing the flag happen together, server-side.
  // Clearing it from the browser would need an RLS policy letting a user update
  // their own profile row, and that policy would also let them clear the flag
  // without ever changing the password.
  const admin = supabaseAdmin();

  const { error } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
  if (error) return Response.json({ error: error.message }, { status: 502 });

  const { error: flagError } = await admin
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', user.id);
  if (flagError) return Response.json({ error: flagError.message }, { status: 502 });

  return Response.json({ ok: true });
}
```

- [ ] **Step 2: Write the page**

`app/change-password/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: 'The two passwords do not match.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: password }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast({ title: 'Could not set the password', description: payload.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Password updated', variant: 'success' });
      router.push('/dashboard');
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Set your password</h1>
      <p className="mt-2 text-sm text-slate-500">
        Your account was created with a temporary password. Choose one only you know before
        continuing — the registry attributes every record to the person signed in.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-semibold">New password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={12}
            required
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-semibold">Confirm new password</label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={12}
            required
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? 'Saving…' : 'Set password and continue'}
        </Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Enforce it in middleware**

In `middleware.ts`, replace the existing admin-gate block with one profile read that serves all three checks:

```ts
  const path = request.nextUrl.pathname;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, must_change_password, deactivated_at')
      .eq('id', user.id)
      .maybeSingle();

    // A clinician deactivated mid-shift would otherwise keep working until
    // their access token expired.
    if (profile?.deactivated_at) {
      await supabase.auth.signOut();
      const login = request.nextUrl.clone();
      login.pathname = '/login';
      login.search = '';
      login.searchParams.set('deactivated', '1');
      return NextResponse.redirect(login);
    }

    if (profile?.must_change_password && path !== '/change-password') {
      const change = request.nextUrl.clone();
      change.pathname = '/change-password';
      change.search = '';
      return NextResponse.redirect(change);
    }

    // Governance console. Authentication alone is not enough: row level
    // security already hides the audit trail from non-admins, but without this
    // a consultant or registrar could still open /admin and run a full registry
    // export, which RLS permits them to read.
    if (path.startsWith('/admin') && profile?.role !== 'Data Manager') {
      const denied = request.nextUrl.clone();
      denied.pathname = '/dashboard';
      denied.searchParams.set('denied', 'admin');
      return NextResponse.redirect(denied);
    }
  }
```

Then add `/change-password` to `PUBLIC_PATHS`, so the unauthenticated redirect below does not fight the flagged redirect above:

```ts
const PUBLIC_PATHS = ['/', '/login', '/admin-login', '/patient-login', '/forgot-password', '/verify', '/change-password'];
```

- [ ] **Step 4: Verify by hand**

Provision a clinician from `/admin/users`, sign out, sign in as that clinician at `/login`. Expected: any page you try lands on `/change-password`. Set a new password. Expected: you land on `/dashboard`, and signing out and back in with the new password goes straight through.

- [ ] **Step 5: Commit**

```bash
git add app/api/account/password/route.ts app/change-password/page.tsx middleware.ts
git commit -m "Hold provisioned accounts at a change-password page"
```

---

### Task 7: Deactivate, reactivate, and delete

**Files:**
- Create: `app/api/admin/staff/[id]/status/route.ts`
- Create: `app/api/admin/staff/[id]/route.ts`
- Modify: `app/(admin)/admin/users/page.tsx`
- Test: `tests/staff-lifecycle.test.ts`

**Interfaces:**
- Consumes: `requireAdmin()`, `supabaseAdmin()`.
- Produces:
  - `POST /api/admin/staff/[id]/status` accepting `{ active: boolean }` → `200 { ok: true, deactivatedAt: string | null }`
  - `DELETE /api/admin/staff/[id]` → `200 { ok: true }`

`status` carries deactivate and reactivate together because they differ only by which value is written.

- [ ] **Step 1: Write the failing test**

`tests/staff-lifecycle.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const requireAdmin = vi.fn();
const updateUserById = vi.fn();
const deleteUser = vi.fn();
const update = vi.fn();
const insertAudit = vi.fn();

vi.mock('@/lib/api/require-admin', () => ({ requireAdmin }));
vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: () => ({
    auth: { admin: { updateUserById, deleteUser } },
    from: (table: string) =>
      table === 'profiles'
        ? { update, delete: () => ({ eq: () => Promise.resolve({ error: null }) }) }
        : { insert: insertAudit, update },
  }),
}));

const { POST } = await import('@/app/api/admin/staff/[id]/status/route');
const { DELETE } = await import('@/app/api/admin/staff/[id]/route');

const admitted = {
  ok: true as const,
  actor: { id: 'admin-1', name: 'Demo Administrator', role: 'Data Manager', gmcNumber: null },
};

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const statusReq = (active: boolean) =>
  new Request('http://test', { method: 'POST', body: JSON.stringify({ active }) });

describe('account lifecycle routes', () => {
  beforeEach(() => {
    requireAdmin.mockReset().mockResolvedValue(admitted);
    updateUserById.mockReset().mockResolvedValue({ error: null });
    deleteUser.mockReset().mockResolvedValue({ error: null });
    update.mockReset().mockReturnValue({ eq: () => Promise.resolve({ error: null }) });
    insertAudit.mockReset().mockResolvedValue({ error: null });
  });

  it('refuses to deactivate the caller', async () => {
    const res = await POST(statusReq(false), ctx('admin-1'));

    expect(res.status).toBe(409);
    expect(updateUserById).not.toHaveBeenCalled();
  });

  it('refuses to delete the caller', async () => {
    const res = await DELETE(new Request('http://test', { method: 'DELETE' }), ctx('admin-1'));

    expect(res.status).toBe(409);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('passes the gate refusal through on status', async () => {
    requireAdmin.mockResolvedValue({ ok: false, response: Response.json({ error: 'no' }, { status: 401 }) });

    const res = await POST(statusReq(false), ctx('someone'));

    expect(res.status).toBe(401);
  });

  it('bans the auth user when deactivating', async () => {
    const res = await POST(statusReq(false), ctx('clinician-9'));

    expect(res.status).toBe(200);
    expect(updateUserById).toHaveBeenCalledWith(
      'clinician-9',
      expect.objectContaining({ ban_duration: expect.any(String) })
    );
  });

  it('lifts the ban when reactivating', async () => {
    const res = await POST(statusReq(true), ctx('clinician-9'));

    expect(res.status).toBe(200);
    expect(updateUserById).toHaveBeenCalledWith('clinician-9', { ban_duration: 'none' });
  });

  it('deletes the auth user and records the deletion', async () => {
    const res = await DELETE(new Request('http://test', { method: 'DELETE' }), ctx('clinician-9'));

    expect(res.status).toBe(200);
    expect(deleteUser).toHaveBeenCalledWith('clinician-9');
    expect(insertAudit).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `npm test -- tests/staff-lifecycle.test.ts`
Expected: FAIL — the two route modules do not resolve.

- [ ] **Step 3: Write the status route**

`app/api/admin/staff/[id]/status/route.ts`:

```ts
import { requireAdmin } from '@/lib/api/require-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

/** Supabase expresses an indefinite ban as a very long duration. */
const FOREVER = '876000h';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await params;

  // An administrator who deactivates their own account locks everyone out of
  // the console, and no other door grants admin.
  if (id === gate.actor.id) {
    return Response.json({ error: 'You cannot deactivate your own account.' }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.active !== 'boolean') {
    return Response.json({ error: 'Send { active: boolean }.' }, { status: 422 });
  }

  const admin = supabaseAdmin();
  const deactivatedAt = body.active ? null : new Date().toISOString();

  const { error } = await admin.auth.admin.updateUserById(id, {
    ban_duration: body.active ? 'none' : FOREVER,
  });
  if (error) {
    const missing = /not found/i.test(error.message);
    return Response.json({ error: missing ? 'That account no longer exists.' : error.message }, {
      status: missing ? 404 : 502,
    });
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({ deactivated_at: deactivatedAt })
    .eq('id', id);
  if (profileError) return Response.json({ error: profileError.message }, { status: 502 });

  await admin.from('audit_log').insert({
    actor_id: gate.actor.id,
    actor_name: gate.actor.name,
    actor_role: gate.actor.role,
    gmc_number: gate.actor.gmcNumber,
    action: body.active ? 'STAFF_REACTIVATED' : 'STAFF_DEACTIVATED',
    details: `Account ${id} ${body.active ? 'reactivated' : 'deactivated'}`,
  });

  return Response.json({ ok: true, deactivatedAt });
}
```

- [ ] **Step 4: Write the delete route**

`app/api/admin/staff/[id]/route.ts`:

```ts
import { requireAdmin } from '@/lib/api/require-admin';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await params;

  if (id === gate.actor.id) {
    return Response.json({ error: 'You cannot delete your own account.' }, { status: 409 });
  }

  const admin = supabaseAdmin();

  // The audit trail survives this. audit_log snapshots actor_name, actor_role
  // and gmc_number when each entry is written; only actor_id points at a live
  // row, and it is nullable.
  await admin.from('audit_log').update({ actor_id: null }).eq('actor_id', id);

  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    const missing = /not found/i.test(error.message);
    return Response.json({ error: missing ? 'That account no longer exists.' : error.message }, {
      status: missing ? 404 : 502,
    });
  }

  await admin.from('profiles').delete().eq('id', id);

  await admin.from('audit_log').insert({
    actor_id: gate.actor.id,
    actor_name: gate.actor.name,
    actor_role: gate.actor.role,
    gmc_number: gate.actor.gmcNumber,
    action: 'STAFF_DELETED',
    details: `Deleted account ${id}`,
  });

  return Response.json({ ok: true });
}
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- tests/staff-lifecycle.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Add row actions to the console**

In `app/(admin)/admin/users/page.tsx` — `UserRecord.deactivatedAt` and its row mapping were added in Task 5, so this step only adds behaviour. Add these two handlers:

```tsx
const setActive = async (id: string, active: boolean) => {
  const res = await fetch(`/api/admin/staff/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active }),
  });
  const payload = await res.json();
  if (!res.ok) {
    toast({ title: 'Could not update the account', description: payload.error, variant: 'destructive' });
    return;
  }
  setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, deactivatedAt: payload.deactivatedAt } : s)));
  toast({ title: active ? 'Account reactivated' : 'Account deactivated', variant: 'success' });
};

const remove = async (id: string, name: string) => {
  if (!confirm(`Delete ${name}? This cannot be undone. Deactivating keeps their record instead.`)) return;
  const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
  const payload = await res.json();
  if (!res.ok) {
    toast({ title: 'Could not delete the account', description: payload.error, variant: 'destructive' });
    return;
  }
  setStaff((prev) => prev.filter((s) => s.id !== id));
  toast({ title: 'Account deleted', variant: 'success' });
};
```

Render, per row: a status badge reading `Active` when `deactivatedAt` is null and `Deactivated` otherwise; a button calling `setActive(s.id, !!s.deactivatedAt)` labelled `Reactivate` when deactivated and `Deactivate` when active; and a `Delete` button calling `remove(s.id, s.name)`. Deactivate is listed first.

- [ ] **Step 7: Verify by hand**

Provision a clinician, sign in as them in a second browser, then deactivate them from the console. Expected: their next page load lands on `/login?deactivated=1`. Reactivate and confirm they can sign in. Delete them and confirm `/admin/audit-log` still shows their name on the entries they created. Finally, try to deactivate your own row. Expected: "You cannot deactivate your own account."

- [ ] **Step 8: Commit**

```bash
git add "app/api/admin/staff" tests/staff-lifecycle.test.ts "app/(admin)/admin/users/page.tsx"
git commit -m "Add account deactivation, reactivation and deletion"
```

---

### Task 8: Reduce the entry surface

**Files:**
- Modify: `app/page.tsx` — nav links at lines 37 and 40, clinician card at 100-102, patient card at 143-145
- Modify: `app/(auth)/login/page.tsx` — the four autofill buttons
- Modify: `app/(auth)/admin-login/page.tsx` — `handleAutofillAdmin` and its buttons

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Reduce the landing page to the admin door**

In `app/page.tsx`, delete the `<Link href="/login">` and `<Link href="/patient-login">` elements in the header nav (lines 37 and 40) and the two call-to-action `<Link>` blocks inside the clinician card (around line 100) and the patient card (around line 143). Keep the descriptive cards themselves — they explain what the system does — and keep the `<Link href="/admin-login">` block around line 188.

Add a line under the admin call to action:

```tsx
<p className="mt-3 text-center text-[11px] text-slate-500">
  Clinician and patient accounts are provisioned by an administrator.
</p>
```

- [ ] **Step 2: Remove the clinician autofill buttons**

In `app/(auth)/login/page.tsx`, delete the "Quick Autofill Test Account" label and the four buttons (`Mr. V. Kannan (VK)`, `Mr. R. D. MacDonagh (RDM)`, `Dr. Sarah Jenkins (SJ)`, `Sister Claire Evans (CE)`), along with any handler only they call. They are development scaffolding, and on a client-facing deployment they publish the names of real accounts.

- [ ] **Step 3: Remove the admin autofill buttons**

In `app/(auth)/admin-login/page.tsx`, delete `handleAutofillAdmin` and the buttons that call it. Change the `adminEmail` initial state from `'admin.ralp@nhs.net'` to `''` so the field starts empty rather than naming a real account.

- [ ] **Step 4: Verify the build and the surface**

Run: `npm run typecheck && npm run build`
Expected: both succeed.

Then run `npm run dev:staging` and open `/`. Expected: one sign-in call to action, for administrators. `/login` and `/patient-login` still load when typed directly, with no autofill buttons.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx "app/(auth)/login/page.tsx" "app/(auth)/admin-login/page.tsx"
git commit -m "Reduce the landing page to administrator sign-in"
```

---

### Task 9: Full-suite check and deploy

**Files:** none

- [ ] **Step 1: Run everything**

Run: `npm test && npm run typecheck && npm run build`
Expected: all three succeed. 16 tests across four files.

- [ ] **Step 2: Confirm the service key never reaches a bundle**

Run:

```bash
grep -rn "SUPABASE_SERVICE_ROLE_KEY" app components hooks lib --include=*.ts --include=*.tsx
```

Expected: matches only in `lib/supabase/admin.ts` and files under `app/api/`.

- [ ] **Step 3: Push and confirm the deploy**

```bash
git push
```

Then open the deployed URL and repeat the manual checks from Tasks 5, 6, and 7 against it, having confirmed `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel for the environment being tested.
