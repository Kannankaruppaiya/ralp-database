# ADR-004: Migration Off Supabase to a Self-Hosted Stack

## Status
Accepted

## Date
2026-09-03

## Context
The registry was built on Supabase (hosted Postgres, PostgREST, GoTrue auth, Storage). The client's core requirement is that the platform runs on their own server, anywhere — a hospital VM, an on-prem box, or a cloud instance of their choosing. Three drivers made the hosted service untenable:
- **Data residency.** NHS patient data must sit on infrastructure the client controls, not in a vendor's multi-tenant project (UK GDPR integrity & confidentiality; Caldicott).
- **Vendor lock-in.** PostgREST filter grammar, GoTrue sessions, and the Storage SDK had leaked into the app's shape; anything short of removing them left a dependency the client could not host.
- **Deploy-anywhere.** 12-Factor dev/prod parity means one Docker Compose that runs identically on a laptop and on the client's server, with no managed service attached.

## Decision
Replace every Supabase component with a self-hosted equivalent, keeping the layering of `docs/ENGINEERING_STANDARDS.md` §2:
- **Database** — plain PostgreSQL 16 in Docker (`infra/docker-compose.yml`), schema applied forward-only by `scripts/migrate.mjs` from `db/migrations/*.sql`, tracked in `schema_migrations`. Row level security is kept as the second wall.
- **API** — Next.js Route Handlers under `app/api/**` over a `pg` pool, with `server/services/*` for business rules and `server/db/repositories/*` for SQL. `lib/api-client.ts` keeps its signatures, so no component changed.
- **Auth** — our own: scrypt password hashing (`server/auth/password.ts`), `jose` JWT session cookie, verified in `middleware.ts`. Provisioning is an explicit admin action (`server/auth/provision.ts`), not a signup trigger.
- **Storage** — documents behind a storage interface, local disk by default and S3/MinIO by config change alone.

## Consequences
- Zero vendor dependency: the stack runs on any host with Docker, and the client owns the data end to end.
- Backups, upgrades, and uptime are now our responsibility — `pg_dump` of the `ralp_pgdata` volume is the recovery plan, and it must be scheduled by whoever operates the deployment.
- The safety net Supabase provided implicitly (a managed, always-migrated database) is replaced by discipline we own: forward-only migrations and a CI pipeline (`.github/workflows/ci.yml`) that typechecks, lints, builds, and runs the test suite against a real Postgres on every push.
