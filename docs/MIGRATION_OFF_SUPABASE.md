# Migration Plan — Removing Supabase (0% Dependency, Self-Hostable)

**Status:** Proposed — plan only, no code changed yet.
**Author requirement:** The client wants everything to run on *their own* server,
with all data held *only* by them. The application must have **0% dependency on
Supabase** and must be hostable on any infrastructure (bare metal, private cloud,
on-prem NHS data centre, Docker anywhere).

This document is the agreed plan we build from. It first inventories exactly what
ties us to Supabase today, then defines the target self-hosted architecture, then
lays out a phased migration with the order of work.

---

## 1. Why this is a real migration (not a config change)

Today the browser talks **directly** to Supabase. There is no backend of our own
in the request path:

```
  Browser (React)  ──►  supabase-js  ──►  https://<project>.supabase.co
                                              ├─ Auth   (login, sessions, JWT)
                                              ├─ PostgREST (auto REST over Postgres)
                                              └─ Postgres (our schema + logic)
```

Our own business logic already exists — but it lives *inside* Supabase's Postgres
(functions, triggers, RLS, views) and inside `lib/api-client.ts`. Supabase
provides four things we currently depend on and must replace:

1. **Auth** — identity, passwords, sessions, JWTs.
2. **PostgREST** — the auto-generated REST API the browser calls.
3. **Row Level Security (RLS)** — the security model that lets the browser be
   trusted, because `auth.uid()` filters every row.
4. **Managed Postgres + Storage** — the database host and the (schema-reserved)
   file store.

Target after migration:

```
  Browser (React)  ──►  Our API (Next.js Route Handlers, our server)
                              ├─ Own auth (JWT/session cookies, hashed passwords)
                              ├─ Own DB access (node-postgres / Drizzle)
                              └─ Own object storage (local disk or MinIO/S3)
                                        │
                                        ▼
                              Plain PostgreSQL (self-hosted)
```

Everything runs in containers the client owns. No `*.supabase.co` in any code
path.

---

## 2. Supabase dependency inventory (what we must remove)

Measured directly from the codebase. This is the exact surface area.

| # | Coupling point | Where | Replace with |
|---|----------------|-------|--------------|
| 1 | `@supabase/ssr`, `@supabase/supabase-js` packages | `package.json` | Remove both |
| 2 | Browser Supabase client (singleton) | `lib/supabase/client.ts` | Delete — browser calls our API instead |
| 3 | Server Supabase client (cookie-bound) | `lib/supabase/server.ts` | Delete — replaced by DB pool + session |
| 4 | **Auth**: `signInWithPassword`, `getUser`, `signOut`, `onAuthStateChange` | `lib/auth.ts`, `middleware.ts` | Own auth service (JWT + httpOnly cookie) |
| 5 | **All data access** via `.from().select()/insert()/update()/upsert()` | `lib/api-client.ts` (~30 calls) | Our API endpoints + SQL in the API layer |
| 6 | **RPC** calls: `write_audit`, `refresh_follow_up_status` | `lib/api-client.ts` | Server calls the same SQL functions directly |
| 7 | **RLS** policies using `auth.uid()` | `supabase/migrations/0003_rls.sql` (18 policies) | See §4.3 — keep RLS via session GUC, *or* app-layer authz |
| 8 | `auth.users` reference + `handle_new_user` trigger on `auth.users` | `0001_schema.sql:33`, `0002_functions.sql:214` | Own `users` table; provision profile in app code |
| 9 | Postgres roles `anon` / `authenticated` grants | `0004`, `0005` migrations | Own DB roles, or drop role-split and gate in API |
| 10 | Supabase **Storage** (`documents.storage_path`) | `0001_schema.sql:215` (schema only — **not wired in code yet**) | Local disk or MinIO (S3-compatible) |
| 11 | Env: `NEXT_PUBLIC_SUPABASE_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `PROJECT_REF` | `.env.*.example` | `DATABASE_URL`, `JWT_SECRET`, storage config |
| 12 | Migrations applied via Supabase CLI | `scripts/db-push.mjs` | Plain migration runner (`psql` / node-pg-migrate) |
| 13 | Type generation from Supabase | `scripts/db-types.mjs` | Drizzle introspection or hand-kept types |
| 14 | `.mcp.json` Supabase MCP server | `.mcp.json` | Remove (dev tooling only) |

**Good news from the audit:**
- **No Supabase Storage API is actually called** in code — only a schema column
  reserves it. File upload is unimplemented, so we build it fresh with no
  Supabase lock-in to unwind.
- **No Realtime, no Edge Functions** are used.
- The **Postgres schema, functions, triggers and views are ~95% portable
  standard SQL.** Only `auth.users` and `auth.uid()` are Supabase-isms. The
  clinical logic (grade-group calc, follow-up scheduling, audit triggers,
  outcome views) moves **unchanged**.

That last point is the key: **our own logic is already written.** We are not
rewriting the medicine — we are replacing the *host and the front door*.

---

## 3. Target architecture

### 3.1 Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Database | **PostgreSQL 16** (self-hosted, Docker) | Our SQL already targets Postgres — near-zero schema change |
| DB driver | **node-postgres (`pg`)** + thin query modules, or **Drizzle ORM** | Keeps our hand-written SQL functions/views usable; no heavy ORM rewrite |
| API | **Next.js Route Handlers** (`app/api/**`) | Same app, same deploy — no separate service to run; server-only secrets stay server-side |
| Auth | **Own JWT + httpOnly session cookie**; `argon2`/`bcrypt` password hashing; `jose` for JWT | Full control, no external identity provider |
| Object storage | **MinIO** (S3-compatible, self-hosted) or local volume | Documents stay on client infrastructure |
| Deploy | **Docker Compose**: `web` + `postgres` + `minio` | One command, host anywhere |

Rationale for **Next.js Route Handlers** over a separate Node/Express backend:
the app is already Next.js, so route handlers give us a real server-side API on
the client's own server with the least new moving parts. A standalone backend is
possible later if they ever split frontend/backend, but it is not needed to meet
"runs on our server, 0% Supabase."

### 3.2 Request flow after migration

```
Browser  ─fetch('/api/patients')─►  Route Handler (our server)
                                       1. read session cookie → verify JWT
                                       2. load caller's profile/role
                                       3. authorize (role + row scope)
                                       4. run SQL via pg pool
                                       5. return JSON
```

The browser never holds a DB key and never filters data — the server does, which
is the same safety property RLS gave us, now enforced in our own code path.

### 3.3 How the security model (RLS) is preserved

RLS today trusts the browser *because* `auth.uid()` scopes every query. When the
browser stops talking to Postgres directly, we have two options:

- **Option A — App-layer authorization (recommended for step 1).** The API layer
  becomes the only path to the DB, and it enforces the same rules the policies
  encode (patient sees only their own record; clinician read/write; admin-only
  audit + export). Simpler, fully in our code, easy to test.
- **Option B — Keep RLS in Postgres (defense in depth).** Rewrite policies to
  read `current_setting('app.user_id')` instead of `auth.uid()`, and have the API
  issue `SET LOCAL app.user_id = $me` at the start of every transaction. Keeps a
  second wall even if an API bug slips through.

**Recommendation:** ship Option A first (it is the blocker for going live off
Supabase), then layer Option B back on for the clinical/GDPR posture, since the
policies already exist and only need `auth.uid()` → `current_setting()` swapped.

---

## 4. Phased migration plan

Each phase is independently reviewable. The app keeps working on Supabase until
Phase 5 flips the switch, so we never have a long broken period.

### Phase 0 — Groundwork (no behaviour change)
- Stand up local **Postgres 16** + **MinIO** via `docker-compose.yml`.
- Add `DATABASE_URL`, `JWT_SECRET`, storage envs to `.env.*.example`.
- Add `pg` (or `drizzle`), `jose`, `argon2` deps.
- Port `supabase/migrations/*.sql` into a plain migration runner. Change only:
  - `profiles.id references auth.users` → own `users` table (§4.1).
  - drop/replace the `auth.users` trigger.
- **Verify:** schema, functions, triggers, views all create cleanly on vanilla
  Postgres and the seed scripts load.

### Phase 1 — Own auth
- New `users` table (email, `password_hash`, status). `profiles` now references it.
- `/api/auth/login`, `/logout`, `/session`: verify password (argon2), issue JWT in
  an httpOnly, Secure, SameSite cookie.
- Rewrite `middleware.ts` to verify our JWT (no `supabase.auth.getUser()`).
- Rewrite `lib/auth.ts` (`signIn`, `signOut`, `useSession`) to call `/api/auth/*`.
- Migrate existing Supabase Auth users → `users` (one-off script; force password
  reset, since Supabase password hashes don't export).
- **Verify:** login/logout, role gating on `/admin`, patient-portal scoping.

### Phase 2 — The data API
- Build `app/api/**` route handlers mirroring every method in `lib/api-client.ts`:
  patients (list/get/create/update), clinical sections upsert, follow-ups,
  PROMs, exports (pseudonymised/identifiable), outcomes, documents, ingestion,
  audit.
- Move the logic currently in `api-client.ts` (search sanitising, `upsertSection`
  insert-vs-update, stage filtering, mappers) to the server side. The RPC calls
  become direct SQL function calls over the same pool.
- **Verify:** each endpoint returns byte-for-byte what the Supabase path returned
  (contract tests against current behaviour before cut-over).

### Phase 3 — Rewire the client
- Replace `lib/api-client.ts` internals: every `supabase().from(...)` becomes a
  typed `fetch('/api/...')`. **Public method signatures stay identical**, so
  features/components need **no change** — this is the whole point of the
  existing `db.*` facade.
- Delete `lib/supabase/client.ts`, `lib/supabase/server.ts`.
- **Verify:** full app walkthrough on the new API, Supabase packages unused.

### Phase 4 — Documents / storage
- Implement upload + download against MinIO/local disk, writing `storage_path`.
- (This is net-new; nothing to port.)

### Phase 5 — Cut over & remove Supabase
- Restore RLS as Option B (optional but recommended), or confirm Option A covers
  every policy.
- Remove `@supabase/*` from `package.json`; delete `.mcp.json` Supabase entry;
  retire `NEXT_PUBLIC_SUPABASE_*` envs.
- Replace `scripts/db-push.mjs` / `db-types.mjs` with the plain runner.
- Update `docs/ENVIRONMENTS.md` (no more "three Supabase projects").
- **Verify:** `grep -ri supabase` returns only historical migration comments;
  `docker compose up` brings the whole system up on a clean host.

#### 4.1 The one schema change that matters
```
-- before (Supabase)
create table profiles (
  id uuid primary key references auth.users on delete cascade, ...

-- after (self-hosted)
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create table profiles (
  id uuid primary key references users on delete cascade, ...
```
Every `auth.uid()` in functions/policies becomes `current_setting('app.user_id')::uuid`
(Option B) or is enforced in the API (Option A). Nothing else in the schema moves.

---

## 5. What changes vs. what stays

**Stays (our logic, reused as-is):**
- The entire clinical schema (patients, baseline, operations, histology,
  follow-ups, PROMs, documents, ingestion, audit).
- All Postgres functions: grade-group, follow-up scheduling, audit writer,
  status re-aging, pseudonymisation.
- All triggers (auto-schedule, PROM→follow-up close, audit-on-change).
- All views (recovery curve, surgeon benchmark, registry summary, exports).
- Every React component and feature module (they only ever call `db.*`).

**Changes:**
- `lib/api-client.ts` — internals swap from Supabase client to `fetch('/api/...')`.
- `lib/auth.ts`, `middleware.ts` — own auth.

**New:**
- `app/api/**` route handlers; auth endpoints; `pg`/Drizzle layer; MinIO storage;
  `docker-compose.yml`; migration runner.

**Deleted:**
- `lib/supabase/*`, `@supabase/*` deps, Supabase env + scripts + MCP entry.

---

## 6. Risks & things to watch

- **Auth cut-over.** Supabase password hashes cannot be exported. Existing users
  need a forced password reset (or a re-invite email flow). Plan comms for this.
- **RLS gap during Phase 2–3.** While the API is the only DB path but Option-B RLS
  isn't restored yet, the API layer *is* the security boundary — it must be
  reviewed as carefully as the policies were. This is why Option B is recommended
  soon after.
- **Behaviour drift.** PostgREST has exact filter/count/embed semantics. Contract
  tests in Phase 2 (compare old vs new responses) prevent silent changes.
- **Clinical/GDPR sign-off.** Caldicott/audit posture (see ADR-002) must be
  re-validated on the self-hosted stack before real patient data moves.
- **Backups become our job.** Supabase did automated backups; self-hosting means
  we own `pg_dump`/PITR scheduling and storage backups.

---

## 7. Rough effort

| Phase | Work | Indicative size |
|-------|------|-----------------|
| 0 | Docker + Postgres port + migration runner | Small–Medium |
| 1 | Own auth (endpoints, middleware, migrate users) | Medium |
| 2 | Data API (mirror every `db.*` method) | **Largest** |
| 3 | Rewire client (facade already isolates it) | Medium |
| 4 | Documents storage | Small |
| 5 | Cut over, remove Supabase, docs | Small |

Because the `db.*` facade already hides Supabase from every feature, Phase 3 is
far cheaper than it would be in a codebase that scattered `supabase()` calls
across components. The earlier design pays off directly here.

---

## 8. Decision needed before we write code

1. **API shape** — Next.js Route Handlers in this repo (recommended), or a
   separate standalone backend service?
2. **DB access** — raw `pg` + our SQL (recommended, keeps existing functions), or
   introduce Drizzle/Prisma?
3. **Authorization** — App-layer only (Option A) to start, then add Postgres RLS
   back (Option B)? Recommended: yes to both, in that order.
4. **Storage** — MinIO (S3-compatible, portable) or plain local volume?

Once these four are confirmed, Phase 0 can start immediately.
