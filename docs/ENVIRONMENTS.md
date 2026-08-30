# Environments — dev / staging / production

Three isolated Supabase projects, one per tier. They share migrations and never
share data: no synthetic patient can reach production, and no real patient can
reach a tier someone might reset.

| Tier | Supabase project | Branch | Data | Who uses it |
| :--- | :--- | :--- | :--- | :--- |
| development | local stack (`npx supabase start`) | `dev` | Synthetic, resettable | Engineers |
| staging | `ralp-staging` — `vrdbghwpeztjuffglzha`, eu-west-2 | `staging` | **Real entered data only — no synthetic records** | Client demos, UAT |
| production | **not yet created** — see below | `main` | Real patient records | Clinical users |

### Current state

Development runs against the local Supabase stack rather than a cloud project.
That is the better default anyway: instant reset, no network round trip, no
cost, and no chance of a test fixture reaching a shared database.

```bash
npx supabase start
```

Production has no project yet. The organisation is on the free plan, which
allows two active projects, and both slots are in use (`ReachPilot`,
`ralp-staging`). Until `ralp-prod` exists, the migration path is
dev (local) -> staging (cloud), and `npm run db:push:prod` will fail because
`.env.production` has no project ref.

Non-production tiers render a coloured banner across the top of every page, so
a test record can never be mistaken for a clinical one.

### Provisioning production (runbook)

Every step below is turnkey **except step 1**, which is an account-owner
decision because it changes billing. Do them in order.

1. **Make a project slot with backups.** A registry of real patient records
   must launch with daily backups **and** point-in-time recovery, and on
   Supabase both require the **Pro** plan. Either upgrade the organisation to
   Pro (keeps all three projects), or free a slot by pausing a project you can
   spare — but a free-tier `ralp-prod` has no PITR and should not hold real
   records, so Pro is the intended path. Create the project as `ralp-prod` in
   **eu-west-2** (patient data stays in the UK), then enable daily backups and
   PITR in Project Settings, and **verify a restore actually works** before
   going further.

2. **Fill in `.env.production`** from Project Settings -> API (never commit it):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_PROJECT_REF` +
   `SUPABASE_DB_PASSWORD` for the migration script.

3. **Apply every migration** (0001–0010, including the export-gating and
   Storage-policy migrations added in this review):

   ```bash
   npm run db:push:prod        # requires the --yes already baked into the script
   ```

   0010 creates the private `clinical-documents` Storage bucket and its
   policies, so there is no separate manual bucket step.

4. **Set the same env vars in the host** (hosting dashboard, not the repo) for
   the `main` branch, and deploy. The build throws on a missing Supabase URL/key
   in production, so a misconfigured deploy fails loudly.

5. **Promote the first administrator** in the Supabase SQL editor — see
   [First user](#first-user) below (once per environment).

6. **Confirm the hardening is live**: the Claude/production security headers
   respond (`curl -sI` the deployed URL), and the Supabase advisors report no
   new RLS or Storage findings.

---

## One-time setup

`ralp-staging` already exists in the account's own Supabase organisation
(region `eu-west-2` — patient data stays in the UK), with migrations 0001-0005
applied. `.env.staging` is filled in apart from the service role key. For a new
tier, or to re-create one:

```bash
cp .env.development.example .env.development
```

Fill in from Supabase → Project Settings → API:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — publishable key, safe in the browser
- `SUPABASE_SERVICE_ROLE_KEY` — **server only**, bypasses row level security
- `SUPABASE_PROJECT_REF` and `SUPABASE_DB_PASSWORD` — used by the migration script

Repeat for `.env.staging` and `.env.production`. None of these files are
tracked; only the `.example` files are.

---

## Applying migrations

Migrations live in `supabase/migrations/` and run in filename order. Same files,
every tier — that is what keeps the three schemas identical.

```bash
npx supabase db reset          # development — replays every migration locally
```

```bash
npm run db:push:staging
```

```bash
npm run db:push:prod           # once a production project exists
```

Production requires an explicit `--yes` (already baked into the npm script), so
it cannot be triggered by tab-completing the wrong command.

**Order matters:** dev → verify → staging → client sign-off → production.

---

## Seeding test data

```bash
node scripts/seed-cohort.mjs development 200
```

Needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.development`.

**Development only.** The script refuses every other tier. Staging is kept free
of synthetic patients: it is what the client sees, and an invented record is
indistinguishable from a real one the moment someone screenshots it. Anything
in staging should have been entered through the application by a person.

Seeding inserts patients, baseline, operation and histology rows. The follow-up
schedule is **not** seeded — the database generates all 7 milestones from the
operation date via trigger, which is also what happens in production.

---

## Running

```bash
npm run dev
```

```bash
npm run dev:staging
```

```bash
npm run build && npm start
```

Each script loads its own `.env.<tier>` file, so the tier is never ambiguous.

---

## Deployment

Point the host at the branch and give it that tier's environment variables:

| Branch | Deploys to | Env vars from |
| :--- | :--- | :--- |
| `dev` | dev preview | `.env.development` values |
| `staging` | staging URL | `.env.staging` values |
| `main` | production | `.env.production` values |

Set them in the hosting provider's dashboard, not in the repository. The build
throws on a missing Supabase URL or key when the tier is production, so a
misconfigured deploy fails loudly instead of shipping an app pointed at nothing.

---

## First user

`auth.users` inserts fire a trigger that creates the matching `profiles` row,
defaulting to `Surgical Registrar`. The first administrator has to be promoted
manually, once per environment, in the Supabase SQL editor:

```sql
update profiles set role = 'Data Manager', full_name = 'Your Name'
where email = 'you@nhs.net';
```

Patient logins additionally need `patient_id` set to the record they may read:

```sql
update profiles set role = 'Patient', patient_id = '<patient uuid>'
where email = 'patient@example.com';
```

Without that link, a patient login sees no record — deliberately. Row level
security resolves patient access through this column alone.
