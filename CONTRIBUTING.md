# Contributing

The "how we build" contract is [`docs/ENGINEERING_STANDARDS.md`](docs/ENGINEERING_STANDARDS.md) —
layering, naming, and maintenance rules live there. This file is the short
operational version: how to get the stack running, how to test it, and what a
change has to clear before it merges.

## Setup

Node 22 and Docker are the only prerequisites.

```bash
npm install

# PostgreSQL on your machine — the same compose file that runs in production
cd infra && cp .env.example .env && docker compose --env-file .env up -d && cd ..

# Apply every migration not yet recorded in schema_migrations
npm run db:migrate

# Provision the first login (there is no self-signup)
node scripts/create-user.mjs --email you@nhs.net --password 'choose-one' \
  --name 'Your Name' --role 'Data Manager'
```

## Run

```bash
npm run dev          # http://localhost:3000, uses .env.development
```

## Test

```bash
npm run test         # unit tests; integration tests skip without a database
npm run test:watch
```

Integration tests run against a real PostgreSQL and are skipped unless
`TEST_DATABASE_URL` is set. Point it at a throwaway database — the suite applies
migrations and writes rows:

```bash
export TEST_DATABASE_URL=postgres://ralp:ralp_dev_password@localhost:5432/ralp
npm run test
```

Never point `TEST_DATABASE_URL` at a tier holding real patient data.

## Migrations are forward-only

- **Never edit a migration that has been applied anywhere.** It will not re-run,
  so the change silently exists in your database and nowhere else. Add a new
  file instead.
- Name them `NNNN_snake_case.sql`, sequentially — `0011_add_something.sql`.
- Check what would run first with `npm run db:migrate:dry`.

## Lint & format

```bash
npm run typecheck
npm run lint
npm run format       # Prettier; formats the whole tree
```

## Commits & pull requests

- **Conventional commits** — `feat:`, `fix:`, `test:`, `ci:`, `chore:`, `docs:`,
  `refactor:`. One purpose per commit.
- Branch off `main`; keep pull requests small and single-purpose.
- CI (`.github/workflows/ci.yml`) runs `audit → typecheck → lint → build → test`
  on every push and pull request. **Nothing merges red.**
- A significant decision gets an ADR in `docs/decisions/` — same format as the
  existing ones.
- Secrets live in `.env` files only. `.env.example` files are the only ones
  tracked.
