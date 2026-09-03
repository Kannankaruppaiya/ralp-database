# Deployment — AWS (testing) now, the client's own server later

The application is self-hosted and vendor-neutral: the **same** code and the
**same** Docker Postgres run wherever you put them. Only one thing changes
between hosts — the `DATABASE_URL` (and the other `.env` values).

```
   NOW — testing                        LATER — production
   AWS EC2 instance                     Client's own server / VM
   ├─ Postgres (docker compose)         ├─ Postgres (docker compose or their DB)
   └─ app (npm start)                   └─ app (npm start)
        same repo, same build                same repo, same build
```

> **Data residency rule.** Put **only synthetic/test data** on the AWS testing
> box (`npm run db:seed`). **Real patient records live only on the client's own
> server** — that is a Caldicott / UK GDPR requirement, not a preference. See
> `ENVIRONMENTS.md`.

---

## 1. Testing on AWS (now)

A single EC2 instance is enough. Ubuntu 22.04/24.04, t3.small or larger.

### 1.1 One-time setup on the instance
```bash
# Docker (for Postgres) + Node 22 (for the app)
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin git
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs
sudo usermod -aG docker $USER   # log out/in once so docker runs without sudo
```

### 1.2 Get the code and start the database
```bash
git clone <this repo> ralp && cd ralp

# Postgres in Docker, data on a host volume this instance owns
cd infra && cp .env.example .env
#   edit .env — set a real POSTGRES_PASSWORD
docker compose --env-file .env up -d
cd ..
```

### 1.3 Configure and build the app
```bash
cp .env.production.example .env.production
# edit .env.production:
#   DATABASE_URL=postgres://ralp:<password>@localhost:5432/ralp
#   JWT_SECRET=$(openssl rand -base64 48)

npm ci
npm run db:migrate            # apply schema to the Postgres container
npm run build:prod
```

### 1.4 Provision the first admin and (optionally) seed test data
```bash
DATABASE_URL=postgres://ralp:<password>@localhost:5432/ralp \
  node scripts/create-user.mjs --email you@nhs.net --password '<pick one>' \
  --name 'Your Name' --role 'Data Manager'

npm run db:seed 200           # synthetic patients — TEST DATA ONLY
```

### 1.5 Run it
```bash
npm start                     # serves on :3000
```
For a long-running test box, keep it up with a process manager or a systemd
unit instead of a bare `npm start`:
```bash
sudo npm i -g pm2
pm2 start "npm start" --name ralp && pm2 save
```

### 1.6 Reaching it
- Open the EC2 security group for the app port (3000), or
- put Nginx / an AWS ALB in front for TLS (recommended even for testing).

---

## 2. Moving to the client's own server (later)

Nothing in the app changes. On the client's server, repeat §1.1–1.5 with that
server's own `DATABASE_URL`. To carry test-free structure across (never copy the
AWS test data into production), you only move the schema:

```bash
# schema is just the migrations — run them on the client's DB
DATABASE_URL=postgres://…@client-db:5432/ralp npm run db:migrate
```

If you ever need to move a **real** database between the client's own hosts:
```bash
pg_dump  "$OLD_DATABASE_URL" > ralp.sql
psql     "$NEW_DATABASE_URL" < ralp.sql
```

The client can also point `DATABASE_URL` at a managed Postgres in **their own**
cloud account (e.g. AWS RDS) instead of the Docker container — still their data,
their account, no code change.

---

## 3. Backups (the operator's responsibility now)

Self-hosting means backups are ours to schedule — there is no managed service
doing it. A nightly dump of the Postgres volume:
```bash
pg_dump "$DATABASE_URL" | gzip > /backups/ralp-$(date +%F).sql.gz
```
Keep production backups on the client's infrastructure, encrypted, with a
retention policy agreed with the client. Test-box backups are optional.

---

## 4. What changes between environments — the whole list

| Thing | Testing (AWS) | Production (client server) |
| :--- | :--- | :--- |
| Code / build | identical | identical |
| `DATABASE_URL` | AWS box's Postgres | client's Postgres |
| `JWT_SECRET` | test secret | strong secret, kept by client |
| Data | synthetic (`db:seed`) | real, entered by clinicians |
| TLS / domain | optional | required |
| Backups | optional | required, on client infra |

Everything in the left column that is not `DATABASE_URL`/secrets/data is byte-
for-byte the same as the right column. That is the point of the self-hosted
design: testing on AWS proves exactly what will run on the client's server.

---

## 5. Retiring the Supabase stack on the AWS box

The AWS test instance was originally brought up as a self-hosted **Supabase**
stack (13 containers) with the app in front of it. The Supabase-free build now
runs alongside it on the same host:

| | Old | New |
| :--- | :--- | :--- |
| App container | `ralp-web` | `ralp-web-v2` |
| Database | `supabase-db` (Postgres 17, GoTrue auth) | `ralp-postgres` (Postgres 16, own `users` table) |
| Auth | GoTrue / bcrypt | scrypt + `jose` JWT (`server/auth/*`) |
| Hostname | `app.51-202-0-221.nip.io` | `v2.51-202-0-221.nip.io` |
| Schema tracking | `supabase_migrations.schema_migrations` | `public.schema_migrations` (`scripts/migrate.mjs`) |

Neither database holds patient records, so there is nothing to migrate between
them — only the handful of staff logins, which must be re-created rather than
copied (GoTrue's bcrypt hashes are not readable by our scrypt verifier).

### 5.1 The one blocker — Caddy belongs to the Supabase stack

`supabase-caddy` terminates TLS on :443 and holds the Let's Encrypt
certificates. It is part of the Supabase compose project in
`/opt/ralp/supabase/docker`, so `docker compose down` on that project takes
**TLS down with it**. Replace the proxy *before* retiring anything else.

### 5.2 Order of operations

1. **Stand up a standalone proxy** — a `caddy:2` container owned by the app,
   not by the Supabase project, on its own compose file. Give it the app routes
   only, and mount a fresh data volume so it issues its own certificates:

   ```
   app.<domain> {
       reverse_proxy ralp-web-v2:3000
       header -server
   }
   ```

   Run it on a spare port first (`:8443`) and confirm it serves the app before
   it ever owns :443.

2. **Copy the certificates across** (optional, avoids a re-issue and the
   associated rate limit): the ACME data lives in the `supabase_caddy_data`
   volume under `/data/caddy`.

3. **Cut :443 over** — stop `supabase-caddy`, start the new proxy bound to
   `:80` and `:443`. Both ports must be free at that moment; :80 is needed for
   ACME renewals.

4. **Verify** `app.<domain>` serves the new app over HTTPS, then stop
   `ralp-web` (do not delete it — it is the rollback).

5. **Retire the Supabase containers** —
   `docker compose -f /opt/ralp/supabase/docker/docker-compose.yml down`.
   **Keep the volumes.** Only remove `supabase_db_data` once the new stack has
   run cleanly for an agreed period.

6. **Rollback at any point** is: restore
   `Caddyfile.bak-before-v2`, start `supabase-caddy` and `ralp-web`.

### 5.3 Rotating the bootstrap admin password

The first admin is created with a placeholder. Change it over an interactive
session so the value is never recorded in a command log:

```bash
aws ssm start-session --target <instance-id> --region <region>
```

then, on the host, hash it with the same scheme the app uses
(`scrypt$<saltHex>$<keyHex>`, 16-byte salt, 64-byte key) and update
`users.password_hash` for that email. Do this before any real patient data is
entered.
