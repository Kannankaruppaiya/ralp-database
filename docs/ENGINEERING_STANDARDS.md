# Engineering Standards — RALP Surgical Outcomes Database

**Status:** Agreed reference. This is the "how we build" contract for the
self-hosted, zero-Supabase codebase. Read alongside
[`MIGRATION_OFF_SUPABASE.md`](./MIGRATION_OFF_SUPABASE.md) (the "what we're
doing" plan).

Scope: the four things locked here are **guiding principles**, **codebase
structure**, **naming conventions**, and **maintenance practices**. New code —
and every step of the Supabase migration — follows this document.

---

## 1. Guiding principles

These are the standards the platform is held to. Each maps to a concrete choice
already made or planned.

### 1.1 Deploy-anywhere — The Twelve-Factor App
The core requirement is "runs on our own server, anywhere." That is exactly what
[12-Factor](https://12factor.net/) codifies. The factors we hold to:
- **One codebase, many deploys** (dev / staging / prod from one repo). ✅ already.
- **Config in the environment** — URLs, secrets, passwords in `.env`, never in
  code. Supabase keys → `DATABASE_URL`, `JWT_SECRET`, storage config.
- **Backing services are attached resources** — the database and file store are
  plug-ins swappable via config, not hard-wired (why storage sits behind an
  interface: local disk ↔ S3/MinIO with no code change).
- **Disposability** — processes start fast and stop cleanly (Docker).
- **Dev/prod parity** — the same Docker Compose everywhere.

### 1.2 Code structure — Separation of concerns, layered, SOLID
- **Layered, one-way dependencies:** presentation → API → services →
  repositories → database. A higher layer never reaches past the one below it;
  the UI never touches the database directly.
- **Single Responsibility** — one module, one job.
- **Dependency inversion** — high-level code depends on interfaces, not on a
  concrete vendor (this is what kept Supabase behind the `db.*` facade and makes
  the migration cheap).

### 1.3 Security — OWASP secure-by-design
When Supabase RLS is gone, we own the security model. Principles
([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Product_Design_Cheat_Sheet.html)):
- **Defense in depth** — more than one wall (app-layer authorization *and*
  Postgres RLS restored).
- **Least privilege** — every role gets the minimum access (a patient sees only
  their own record; only admins export).
- **Secure / deny-by-default** — deny unless explicitly allowed.
- **Zero trust of the client** — the browser is never trusted; the server
  verifies every request. Server-only code is physically unreachable from the
  browser.

### 1.4 Patient data — UK GDPR + Caldicott (legal, not optional)
This holds NHS patient data. Compliance is mandatory.
- **[UK GDPR — 7 principles](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/):**
  lawfulness/fairness/transparency, purpose limitation, data minimisation,
  accuracy, storage limitation, integrity & confidentiality, accountability.
- **[Caldicott — 8 principles](https://gov.uk/government/news/ndg-announces-new-caldicott-principle-and-guidance-on-caldicott-guardians)**
  (updated to 8 in 2020; Principle 8 = "no surprises" — tell patients how their
  data is used).
- Reflected in: the immutable **audit trail** (accountability), the
  **pseudonymised vs identifiable** export split (minimisation, purpose
  limitation), and **self-hosted data residency** (confidentiality — data stays
  on the client's own server). See `docs/decisions/ADR-002`.

### 1.5 Data — ACID, single source of truth, integrity
- **ACID transactions** — no partial writes to clinical data.
- **Single source of truth** — outcomes/benchmarks are computed in the database
  (views); the UI never recomputes them.
- **Constraints in the database** — `NOT NULL`, foreign keys, checks enforce data
  quality at the source, not only in the app.

---

## 2. Target codebase structure

Keep the existing frontend organisation; add the server side cleanly.

```
ralp-database/
├─ app/                        # PRESENTATION (routes) — existing
│  ├─ (auth)/ (admin)/ (clinician)/ (patient)/     ← unchanged
│  └─ api/                     # NEW — our API (the "front door")
│     ├─ auth/{login,logout,session}/route.ts
│     ├─ patients/route.ts  +  patients/[id]/route.ts
│     ├─ follow-ups/route.ts   proms/route.ts
│     ├─ outcomes/route.ts     exports/route.ts
│     └─ documents/  ingestion/  audit/  route.ts
│
├─ components/                 # UI — unchanged
├─ hooks/                      # React hooks — unchanged
├─ features/                   # client-side domain facade — unchanged shape
│
├─ server/                     # NEW — server-only code (unreachable from browser)
│  ├─ db/
│  │  ├─ pool.ts               # pg Pool (one connection pool)
│  │  ├─ tx.ts                 # transaction helper
│  │  └─ repositories/         # raw SQL lives ONLY here
│  │     ├─ patients.repo.ts   follow-ups.repo.ts  …
│  ├─ services/                # business logic (today inside api-client.ts)
│  │  ├─ patients.service.ts   exports.service.ts  …
│  ├─ auth/
│  │  ├─ password.ts (argon2)  jwt.ts (jose)  session.ts  authorize.ts
│  ├─ storage/
│  │  ├─ storage.ts (interface)  local.ts  s3.ts   ← swappable
│  └─ http/
│     ├─ handler.ts            # auth → authz → validate → service → map
│     └─ errors.ts
│
├─ lib/                        # cross-cutting, client+server safe (pure only)
│  ├─ api-client.ts            # now: typed fetch('/api/..') — signatures SAME
│  ├─ validators.ts  formatters.ts  date.ts  utils.ts
│  └─ supabase/  ❌ DELETED
│
├─ types/  config/            # shared types + static config — unchanged
│
├─ db/                         # was supabase/migrations
│  ├─ migrations/000x_*.sql    # ported, forward-only
│  └─ seed/
│
├─ infra/                      # NEW — deploy anywhere
│  ├─ Dockerfile  docker-compose.yml  .env.*.example
│
├─ tests/                      # NEW — unit / integration / e2e
├─ scripts/                    # migrate.mjs, seed
└─ middleware.ts               # our JWT verify
```

### The 5 golden rules
1. **Layering is one-way (downward only).** `app routes → api/ → services →
   repositories → Postgres`. Never import upward; the UI never touches the DB —
   always through the API.
2. **`server/` is a sacred boundary.** Nothing in `server/` may be imported by a
   client component; guard each file with `import 'server-only'`. This is what
   replaces RLS's trust boundary — server code cannot be reached from the browser.
3. **One job per layer.** Route handler = thin (auth → validate → call service →
   map errors). Service = business rules. Repository = SQL only.
4. **`api-client.ts` stays the single client-side data door.** Method signatures
   never change (`db.getPatients()` stays); only the internals swap from Supabase
   to `fetch('/api/...')`, so no component changes.
5. **Config in env; infra separate** (12-Factor). One Docker Compose runs
   anywhere.

---

## 3. Naming conventions

### 3.1 Files & folders
| Thing | Convention | Example |
|-------|-----------|---------|
| Folders | `kebab-case` | `follow-ups/`, `data-ingestion/` |
| Files (general) | `kebab-case` | `api-client.ts`, `use-patients.ts` |
| React component file | `kebab-case.tsx`, **export `PascalCase`** | `patient-card.tsx` → `export function PatientCard()` |
| Hooks | `use-` prefix | `use-follow-ups.ts` → `useFollowUps()` |
| Server files | kebab + role suffix | `patients.repo.ts`, `patients.service.ts` |
| Types file | kebab, singular | `follow-up.ts`, `patient.ts` |
| SQL migrations | `NNNN_snake_case.sql` | `0009_users_table.sql` |

**Rule:** file name is `kebab-case`; the exported React component or type inside
is `PascalCase`.

### 3.2 Code (TypeScript)
| Thing | Convention | Example |
|-------|-----------|---------|
| Variable / function | `camelCase` | `getPatients()`, `patientId` |
| Type / Interface / Class | `PascalCase` | `PatientFullRecord` |
| Constant (fixed) | `UPPER_SNAKE_CASE` | `ROLE_PERMISSIONS` |
| Boolean | `is/has/can` prefix | `isLoading`, `hasAccess` |
| DB table / column | `snake_case` | `follow_ups`, `patient_id` |

### 3.3 Next.js route folders
| Pattern | Meaning | Example |
|---------|---------|---------|
| `kebab-case/` | URL segment | `data-ingestion/` → `/data-ingestion` |
| `page.tsx` `layout.tsx` `route.ts` `loading.tsx` | fixed reserved names | — |
| `[param]` | dynamic segment | `[patientId]/` |
| `(group)` | route group (not in URL) | `(admin)/` |

### 3.4 REST API routes
Seven rules:
1. **Plural nouns** for resources (`/patients`), never verbs in the path.
2. **lowercase + hyphens** (`/follow-ups`).
3. **Verbs live in the HTTP method**, not the URL (`GET/POST/PATCH/DELETE`).
4. **Filter/sort/paginate via query params** (`?status=overdue&page=2`).
5. **Nest for relationships**, shallowly (max ~2 levels).
6. **No file extensions** in URLs.
7. **Version from the start** — `/api/v1/...`.

| Action | Method + Route | File |
|--------|---------------|------|
| List patients | `GET /api/patients?search=&surgeon=&page=` | `app/api/patients/route.ts` |
| Create patient | `POST /api/patients` | (same file) |
| One patient | `GET /api/patients/{id}` | `app/api/patients/[id]/route.ts` |
| Update patient | `PATCH /api/patients/{id}` | (same file) |
| Patient's follow-ups | `GET /api/patients/{id}/follow-ups` | `app/api/patients/[id]/follow-ups/route.ts` |
| Submit a PROM | `POST /api/patients/{id}/proms` | `app/api/patients/[id]/proms/route.ts` |
| Overdue follow-ups | `GET /api/follow-ups?status=overdue` | `app/api/follow-ups/route.ts` |
| Recovery curve | `GET /api/outcomes/recovery-curve` | `app/api/outcomes/recovery-curve/route.ts` |
| Pseudonymised export | `POST /api/exports/pseudonymised` | `app/api/exports/pseudonymised/route.ts` |
| Audit log | `GET /api/audit?limit=200` | `app/api/audit/route.ts` |

**One accepted exception — auth/action endpoints may use a verb** (they are
RPC-style, not resources): `POST /api/auth/login`, `POST /api/auth/logout`,
`GET /api/auth/session`, `POST /api/follow-ups/refresh-status`.

**Avoid:** `/getPatients`, `/api/patient_list`, `/api/patients/create`,
`/api/getPatientById?id=1`, `/api/Patients`.

---

## 4. Maintenance practices

Priority order — the top two are the biggest current gaps and must land before
the migration begins.

### 4.1 Automated tests (highest priority — none exist today)
Required before Phase 2 of the migration, so behaviour can be proven unchanged.
- **Unit** — mappers, validators, scheduling logic (Vitest).
- **Integration** — API route ↔ real Postgres (test container).
- **Contract** — record current Supabase responses, assert the new API returns
  the same (the safety net for cut-over).
- **E2E** — login, patient create, PROM submit (Playwright — already installed).

### 4.2 CI pipeline (none exists today)
`.github/workflows/ci.yml` runs on every push/PR: `typecheck → lint → test →
build`. Nothing merges red.

### 4.3 Lint & format
Explicit **ESLint** rules + **Prettier** + `.editorconfig`; enforced in CI.

### 4.4 Review & branch protection
Protect `main`: PR + review + green CI before merge. `CODEOWNERS`. Small,
single-purpose PRs. **Conventional commits** (`feat:`, `fix:`, `docs:` — already
in use).

### 4.5 Database migration discipline
- Never edit an applied migration — always add a new one.
- Forward-only, sequential (`0001`, `0002`, …). ✅ already the pattern.

### 4.6 Documentation
- Keep writing **ADRs** for significant decisions (the Supabase→self-host move
  itself is one). ✅ habit exists in `docs/decisions/`.
- `CONTRIBUTING.md` — setup, run, test, PR rules (to add).
- Keep README current.

### 4.7 Dependencies & secrets
- **Dependabot** for updates; `npm audit` in CI.
- Lockfile committed. ✅
- Secrets only in `.env`, never in code. ✅

---

## 5. What is already compliant vs. what to add

**Already good:** strict TypeScript, path aliases, feature-based structure, the
`db.*` facade, "why" comments, ADRs, env-per-tier, snake_case DB, conventional
commits.

**To add:** automated tests, CI, explicit ESLint/Prettier, `CONTRIBUTING.md`,
Dependabot, and the new `server/` + `app/api/` layers per §2.
