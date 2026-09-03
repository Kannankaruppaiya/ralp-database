# Environments — dev / staging / production

Three tiers, each a **self-hosted PostgreSQL database** the client owns (a local
Docker container in development; a database on their own server or cloud VM in
staging and production). Tiers share migrations and never share data: no
synthetic patient can reach production, and no real patient can reach a tier
someone might reset.

| Tier | Database | Data | Who uses it |
| :--- | :--- | :--- | :--- |
| development | Local Docker Postgres (`infra/docker-compose.yml`) | Synthetic, resettable | Engineers |
| staging | Postgres on the client's staging host | **Real entered data only — no synthetic records** | Client demos, UAT |
| production | Postgres on the client's production host / VM | Real patient records | Clinical users |

Each tier is selected purely by its `DATABASE_URL`; there is no external
project to provision. Non-production tiers render a coloured banner across the
top of every page, so a test record can never be mistaken for a clinical one.

---

## Configuration

Every tier is one `.env.<tier>` file. Copy the example and fill it in — none of
the real files are tracked, only the `.example` ones.

```bash
cp .env.development.example .env.development
```

Key variables:

- `DATABASE_URL` — the Postgres connection string. **Server-only**; never
  prefix with `NEXT_PUBLIC_`.
- `JWT_SECRET` — signs session tokens. Generate with `openssl rand -base64 48`;
  must be a long random value in production.
- `STORAGE_DRIVER` / `STORAGE_LOCAL_DIR` — where uploaded documents are stored.

---

## Local database (development)

Bring up Postgres with the bundled Docker stack, then apply migrations:

```bash
cd infra && cp .env.example .env && docker compose --env-file .env up -d && cd ..
npm run db:migrate
```

`npm run db:migrate` applies every file in `db/migrations/` in order, tracked in
the `schema_migrations` table (forward-only — never edit an applied migration,
add a new numbered one). `npm run db:migrate:dry` previews without applying.

The same `db/migrations/` run against every tier — that is what keeps the three
schemas identical. For staging/production, point `DATABASE_URL` at that host and
run the same migrate command.

**Order matters:** dev → verify → staging → client sign-off → production.

---

## Seeding test data

```bash
npm run db:seed 200        # 200 synthetic patients into the dev database
```

**Development only.** The script refuses every other tier, and connects using
`DATABASE_URL`. Staging is kept free of synthetic patients: it is what the
client sees, and an invented record is indistinguishable from a real one the
moment someone screenshots it.

Seeding inserts patients, baseline, operation and histology rows. The follow-up
schedule is **not** seeded — the database generates all 7 milestones from the
operation date via trigger, exactly as in production.

---

## Running

```bash
npm run dev            # development
npm run dev:staging    # staging
npm run build && npm start   # production build
```

Each script loads its own `.env.<tier>` file, so the tier is never ambiguous.

---

## Deployment

The app plus its database ship as one Docker Compose stack that runs on any host
the client controls — on-prem, or a cloud VM such as an AWS EC2 instance. See
[MIGRATION_OFF_SUPABASE.md](./MIGRATION_OFF_SUPABASE.md) §9 for the deploy paths
(EC2 + Docker now; ECS/RDS/S3 later). Set each tier's environment variables on
the host, never in the repository.

---

## First user

Provisioning creates a `users` row (with a hashed password) and its matching
`profiles` row together — there is no self-service signup. Create the first
administrator once per environment:

```bash
DATABASE_URL=... node scripts/create-user.mjs \
  --email you@nhs.net --password 'change-me' --name 'Your Name' --role 'Data Manager'
```

A surgeon account additionally takes `--surgeon VK`. A patient login takes
`--role Patient --patient <patient uuid>` — the record they may read. Without
that link a patient login sees no record, deliberately: row level security
resolves patient access through the `patient_id` column alone.
