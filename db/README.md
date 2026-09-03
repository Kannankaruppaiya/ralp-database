# `db/` — self-hosted database (no Supabase)

This directory replaces `supabase/migrations/` for the self-hosted stack. It runs
on any plain **PostgreSQL 16** — a Docker container, an on-prem server, or a
cloud VM. See [`../docs/MIGRATION_OFF_SUPABASE.md`](../docs/MIGRATION_OFF_SUPABASE.md)
for the full plan and [`../docs/ENGINEERING_STANDARDS.md`](../docs/ENGINEERING_STANDARDS.md)
for conventions.

## Layout
```
db/
├─ migrations/
│  ├─ 0000_bootstrap.sql   ← our compatibility layer for vanilla PostgreSQL
│  └─ 0001–0008_*.sql      ← the clinical schema/functions/RLS/views (ported)
└─ seed/                   ← seed data (added later)
```

`0001`–`0008` are ported **verbatim** from the original Supabase migrations — the
registry's schema, triggers, row level security and computed views are standard
PostgreSQL and needed no change. The only new file is `0000_bootstrap.sql`, which
recreates what Supabase used to supply implicitly (the `anon`/`authenticated`
roles, an `auth.users` stand-in, and `auth.uid()` reading a session variable
instead of a JWT). Phase 1 (own auth) replaces that bootstrap with a real `users`
table.

## Migration rules
- **Forward-only.** Never edit an applied migration — add a new numbered file.
- **Sequential**, zero-padded names (`0009_...`), applied in filename order.
- Each file runs in its own transaction; applied versions are tracked in the
  `schema_migrations` table.

## Run it

Bring up PostgreSQL and apply every migration:

```bash
# 1. start the database (from infra/)
cd infra && cp .env.example .env      # edit passwords
docker compose --env-file .env up -d

# 2. apply migrations (from repo root)
npm run db:migrate                    # reads DATABASE_URL from infra/.env
npm run db:migrate:dry                # preview pending, apply nothing
```

Or point the runner at any database directly:

```bash
DATABASE_URL=postgres://user:pass@host:5432/db node scripts/migrate.mjs
```

## Verified

On a clean PostgreSQL 16 cluster all 9 migrations apply, and an end-to-end smoke
test confirms the ported logic works without Supabase: new-user → profile
provisioning, `auth.uid()` via session variable, Gleason → ISUP grade-group
derivation, operation → 7-milestone follow-up scheduling, PROM → milestone
closure, audit-trail triggers, and the computed registry/outcome/export views.
