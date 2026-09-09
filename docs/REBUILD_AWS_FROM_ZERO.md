# Rebuilding the AWS test box from zero

This runbook exists because the AWS testing instance was deliberately deleted to
stop it billing. It describes how to bring an equivalent box back.

It is a **companion to `DEPLOYMENT.md`, not a replacement.** `DEPLOYMENT.md`
§1 tells you how to install and run the application; this document tells you how
to get an AWS instance underneath it, and records the exact shape of the box
that was torn down so the replacement matches it.

> **Read this first.** The rebuild is straightforward — roughly two hours of
> mostly-waiting — with exactly one trap in it: TLS and the hostname. That is
> §6, and it is the only part worth reading carefully before you start.

---

## 1. What was on the box when it was deleted

Captured live over SSM on **2026-09-09**, immediately before deletion. This is
the target the rebuild is aiming at.

| | Value |
| :--- | :--- |
| Instance | `i-0d9c1d1d03a4dd389`, name `ralp-app`, `t3.small`, `eu-west-2` |
| OS | Amazon Linux 2023 |
| Root disk | 40 GB gp3, 16 GB used |
| Elastic IP | `51.202.0.221` |
| Hostname | `v2.51-202-0-221.nip.io` (HTTPS, Let's Encrypt) |
| App | `ralp-web-v2` — `node:22-alpine`, bind mount `/opt/ralp/web-v2` → `/app`, `next start -p 3000` |
| Database | `ralp-postgres` — `postgres:16-alpine`, volume `ralp_pgdata_v2` |
| Proxy | `supabase-caddy` — `caddy:2`, owned 80/443 |
| Also running | the full 13-container Supabase stack, **already scheduled for retirement** |

### 1.1 What the database actually held

```
users=3   profiles=3   patients=1   baseline_cancer=1   audit_log=16
system_settings=5   schema_migrations=16
operations=0  documents=0  prom_submissions=0  histology=0  follow_ups=0
```

**Nothing of value was lost.** By the project's own data-residency rule
(`ENVIRONMENTS.md`) the AWS box carries synthetic test data only — real patient
records never leave the client's own server. One synthetic patient and three
staff logins are recreated in minutes by §5.

### 1.2 What the rebuild deliberately does *not* restore

The old box was originally a self-hosted **Supabase** stack that the application
was later migrated off. Those 13 containers were still running at deletion, only
because retiring them was blocked on the Caddy/TLS dependency described in
`DEPLOYMENT.md` §5.1.

**Do not recreate them.** The application has zero Supabase dependency. The
rebuild below stands up four things — Docker, Postgres, the app, and a proxy —
and the deletion has conveniently removed the blocker that made the Supabase
retirement awkward. This is the clean stack the project was heading towards
anyway.

---

## 2. Cost, so the decision can be re-made later

Stopping the instance stops only the compute hours. These continue regardless of
instance state, which is why deletion — not stopping — was needed:

| Resource | Idle cost (list price) |
| :--- | :--- |
| 40 GB gp3 root volume | ~$3.3 / month |
| Elastic IP (IPv4 charge applies even when attached) | ~$3.6 / month |
| Snapshots, 40 GB each | ~$1–2 / month |
| `t3.small` compute, when running | ~$15 / month |

A stopped-but-not-deleted box therefore costs roughly **$8/month** doing
nothing. Deleting takes that to zero at the price of the rebuild below.

---

## 3. Create the instance

```bash
# Amazon Linux 2023, eu-west-2. Pick your own key pair and security group.
aws ec2 run-instances \
  --region eu-west-2 \
  --image-id resolve:ssm:/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
  --instance-type t3.small \
  --block-device-mappings 'DeviceName=/dev/xvda,Ebs={VolumeSize=40,VolumeType=gp3}' \
  --iam-instance-profile Name=<profile-with-AmazonSSMManagedInstanceCore> \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ralp-app}]'
```

Two things are easy to forget and both cost you an hour later:

- **The SSM instance profile.** Without `AmazonSSMManagedInstanceCore` attached
  you cannot run `aws ssm send-command` or `aws ssm start-session`, and every
  deployment step in this project goes through SSM. Attach it at launch.
- **The security group.** Inbound 80 and 443 from anywhere (Caddy needs :80 for
  ACME, not just :443). Port 3000 does **not** need to be open — the proxy
  reaches the app over the Docker network. Port 22 was closed on the old box and
  did not need to be open; SSM Session Manager replaces SSH.

Then allocate and attach an Elastic IP — see §6 first, because the address you
get decides your hostname.

---

## 4. Install the host prerequisites

```bash
aws ssm start-session --target <new-instance-id> --region eu-west-2
```

```bash
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user     # log out and back in once

# Docker Compose v2 as a CLI plugin
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
```

Node is **not** installed on the host. The old box ran the app inside a
`node:22-alpine` container against a bind-mounted source tree, and the rebuild
keeps that arrangement — see §5.3.

---

## 5. Bring the application up

### 5.1 Code and database

```bash
sudo mkdir -p /opt/ralp && sudo chown ec2-user:ec2-user /opt/ralp
cd /opt/ralp
git clone <this repo> web-v2 && cd web-v2

cp infra/.env.example infra/.env
#   POSTGRES_PASSWORD=$(openssl rand -base64 24)
#   DATABASE_URL=postgres://ralp:<that password>@ralp-postgres:5432/ralp
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d
```

Note the host in `DATABASE_URL`: `ralp-postgres`, the container name, not
`localhost`. The app runs in a container on the same Docker network, so it
resolves the database by container name. `DEPLOYMENT.md` §1.3 shows `localhost`
because it assumes the app runs on the host — this box does not.

### 5.2 Environment file

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Fill in — **generate fresh values, do not try to recover the old ones**:

```
NEXT_PUBLIC_APP_ENV="production"
DATABASE_URL="postgres://ralp:<password>@ralp-postgres:5432/ralp"
JWT_SECRET="$(openssl rand -base64 48)"
STORAGE_DRIVER="local"
STORAGE_LOCAL_DIR="/var/lib/ralp/storage"
```

A regenerated `JWT_SECRET` invalidates every existing session cookie. On a fresh
box there are none, so this costs nothing.

`NEXT_PUBLIC_*` values are baked into the client bundle at build time, so
`.env.production` must be correct **before** the build in §5.3, not after. A
build made with the development environment ships local endpoints inside the
JavaScript served to users, and no amount of correct server configuration undoes
it afterwards.

### 5.3 Build and run

```bash
docker network create ralp_net    # the old box reused supabase_default; make our own

docker run --rm -v /opt/ralp/web-v2:/app -w /app node:22-alpine \
  sh -c 'npm ci && npm run build:prod'

docker run -d --name ralp-postgres --network ralp_net ...   # already up from 5.1
docker network connect ralp_net ralp-postgres

sudo mkdir -p /opt/ralp/storage

docker run -d --name ralp-web-v2 \
  --network ralp_net \
  --restart unless-stopped \
  -v /opt/ralp/web-v2:/app \
  -v /opt/ralp/storage:/var/lib/ralp/storage \
  -w /app \
  --env-file /opt/ralp/web-v2/.env.production \
  -e NODE_ENV=production -e PORT=3000 \
  node:22-alpine ./node_modules/.bin/next start -p 3000
```

### 5.4 Schema, admin, and test data

```bash
docker exec ralp-web-v2 npm run db:migrate

docker exec ralp-web-v2 node scripts/create-user.mjs \
  --email you@nhs.net --password '<pick one>' \
  --name 'Your Name' --role 'Data Manager'

docker exec ralp-web-v2 npm run db:seed 200      # synthetic only — never real data
```

Rotate the admin password over an interactive `aws ssm start-session` rather
than `send-command`, so the value never lands in the SSM command log. The old
box kept its bootstrap secrets in `/opt/ralp/secrets/` (`admin-password`, `jwt`,
`pgpass`, mode 0600, root-owned) — a reasonable convention to repeat.

---

## 6. TLS and the hostname — the part that bites

The old box served `v2.51-202-0-221.nip.io`. That hostname is not a
configuration choice; **nip.io encodes the IP address in the name**.
`51-202-0-221.nip.io` resolves to `51.202.0.221` and to nothing else.

So:

- **If you released the Elastic IP when you deleted the box**, the new instance
  gets a different address, the old hostname is dead, and every reference to it
  must change: the Caddyfile, `.env.production`, any bookmark, any client-facing
  link. Budget for that.
- **If you kept the Elastic IP** (~$3.6/month while the box does not exist), you
  can attach it to the new instance and the old hostname keeps working
  unchanged. Whether that was worth $3.6/month is the trade you made at deletion
  time.

Either way the Let's Encrypt certificate is gone — it lived in the
`supabase_caddy_data` Docker volume, which the deletion destroyed. Caddy issues
a fresh one automatically on first start, provided port 80 is reachable.

### 6.1 A standalone proxy, owned by the app

The old box's Caddy belonged to the Supabase compose project, which is exactly
the entanglement `DEPLOYMENT.md` §5.1 warns about. Do not repeat it. Give the
proxy its own compose file:

`/opt/ralp/proxy/docker-compose.yml`
```yaml
services:
  caddy:
    image: caddy:2
    container_name: ralp-caddy
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    networks: [ralp_net]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
volumes:
  caddy_data:
  caddy_config:
networks:
  ralp_net:
    external: true
```

`/opt/ralp/proxy/Caddyfile` — the whole file, replacing the three-site config
the old box carried:
```
v2.<new-ip-with-dashes>.nip.io {
    reverse_proxy ralp-web-v2:3000
    header -server
}
```

```bash
cd /opt/ralp/proxy && docker compose up -d
docker compose logs -f caddy      # watch the certificate be issued
```

Certificate issuance fails silently-ish if port 80 is closed in the security
group, or if DNS does not yet point at this box. Check the Caddy log before
assuming the app is broken. Let's Encrypt rate-limits repeated failures for the
same name, so fix the cause rather than restarting in a loop.

---

## 7. Verify before calling it done

```bash
docker ps --format '{{.Names}}\t{{.Status}}'      # expect 3: web-v2, postgres, caddy
curl -sS -o /dev/null -w '%{http_code}\n' https://v2.<ip>.nip.io/     # 200
docker exec ralp-postgres psql -U ralp -d ralp -tAc \
  'select count(*) from schema_migrations'                            # 16 or more
```

Then sign in through the browser as the admin created in §5.4, and confirm the
environment banner reads production rather than development.

Finally, grep the built output for development endpoints before trusting it:

```bash
docker exec ralp-web-v2 grep -rl '127.0.0.1:54321\|localhost:3000' .next/static || echo clean
```

---

## 8. If you would rather not rebuild by hand next time

Everything above is deterministic and could be a launch template plus a
user-data script. It was not worth automating for a single test box that gets
rebuilt roughly never — but if this document gets used a third time, that is the
signal to automate it instead of following it again.

---

## Appendix — the old Caddyfile, for reference

Recorded before deletion. Kept only so the routing intent is not lost; the
Supabase and `ralp-web` sites are deliberately **not** part of the rebuild.

```
{$PROXY_DOMAIN} {
    @supabase_api path /auth/v1/* /rest/v1/* /graphql/v1 /realtime/v1/* /storage/v1/* /functions/v1/* /mcp /sso/*
    handle @supabase_api { reverse_proxy api-gw:8000 }
    handle {
        basic_auth { {$PROXY_AUTH_USERNAME} {$PROXY_AUTH_PASSWORD} }
        reverse_proxy studio:3000
    }
    header -server
}

app.51-202-0-221.nip.io {          # old Supabase-era app — retired
    reverse_proxy ralp-web:3000
    header -server
}

v2.51-202-0-221.nip.io {           # the Supabase-free app — the one that matters
    reverse_proxy ralp-web-v2:3000
    header -server
}
```
