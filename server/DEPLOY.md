# Deploy MiraFood API on Contabo VPS

This replaces the old **Flask** app in `mobile/backend/` (port 5050) with the **Node** API in `server/` (port 3011).

```
Phone / Web (HTTPS)
        ↓
nginx :443  (vitaway.nsengi.space or mirafood.vitaway.org)
        ↓
Docker API :3011  →  Postgres + Redis
```

## 1. Remove the old Flask backend on the VPS

```bash
ssh root@YOUR_VPS_IP

# Stop legacy service
sudo systemctl stop vitaway-api
sudo systemctl disable vitaway-api

# Optional: archive old code
mv ~/food-ai-mobile/backend ~/food-ai-mobile/backend.old.$(date +%Y%m%d) 2>/dev/null || true
```

You can delete `mobile/backend/` from the repo locally too — it is deprecated.

## 2. Upload the new server

From your Mac:

```bash
cd /Users/nsengi/Desktop/vitaway-food-ai

rsync -avz --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .env \
  server/ root@YOUR_VPS_IP:/opt/mirafood-api/server/
```

Or clone the full monorepo on the VPS:

```bash
ssh root@YOUR_VPS_IP
mkdir -p /opt/mirafood-api
cd /opt/mirafood-api
git clone YOUR_REPO_URL .
```

## 3. Configure production `.env`

On the VPS:

```bash
cd /opt/mirafood-api/server
cp .env.example .env
nano .env
```

Generate strong secrets on the VPS:

```bash
openssl rand -base64 32   # POSTGRES_PASSWORD
openssl rand -base64 32   # REDIS_PASSWORD
openssl rand -base64 48   # JWT_SECRET
```

**Minimum production values:**

```env
NODE_ENV=production
PORT=3011

# Required — deploy script rejects weak/missing passwords
POSTGRES_PASSWORD=...random 20+ chars...
REDIS_PASSWORD=...random 20+ chars...

# Set by docker-compose.prod.yml at runtime — do not point at localhost on VPS
# DATABASE_URL and REDIS_URL are injected by Docker; omit or leave as placeholders.

JWT_SECRET=...random 32+ chars...
JWT_EXPIRES_IN=7d

CORS_ORIGIN=https://mirafood.vitaway.org,https://vitaway.nsengi.space

OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_SITE_URL=https://vitaway.nsengi.space

APP_URL=https://mirafood.vitaway.org
MOBILE_APP_SCHEME=mirafood

SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=MiraFood <noreply@vitaway.org>

AUTO_RUN_MIGRATIONS=true
```

`docker-compose.prod.yml` reads `POSTGRES_PASSWORD` and `REDIS_PASSWORD` — **never** publishes Postgres/Redis to the host (unlike `0.0.0.0:5434` on your other VPS projects).

## Security model

| Service | Exposure | Protection |
|---------|----------|------------|
| Postgres | Docker internal network only | Strong `POSTGRES_PASSWORD`, no `ports:` mapping |
| Redis | Docker internal network only | `requirepass` + strong `REDIS_PASSWORD` |
| Node API | `127.0.0.1:3011` only | nginx HTTPS in front; not reachable from internet directly |
| `.env` | VPS filesystem | `chmod 600` enforced by deploy script |

After deploy, verify:

```bash
docker port mirafood-postgres   # should print nothing
docker port mirafood-redis      # should print nothing
docker port mirafood-api        # 127.0.0.1:3011 only
bash deploy/security-check.sh
```

**Optional (whole VPS):** If you want firewall-level protection for all projects, allow only `22`, `80`, `443` via UFW — but audit your other apps first (hexad `:5434`, trusthome `:5435`, etc. are currently public).

## 4. Run deploy (one command)

```bash
cd /opt/mirafood-api/server
sudo CERTBOT_EMAIL=you@email.com bash deploy/deploy.sh
```

This will:

1. Install Docker + nginx + certbot (if missing)
2. Stop the old `vitaway-api` systemd Flask service
3. Start Postgres, Redis, and the Node API via Docker
4. Configure nginx HTTPS with WebSocket support (`/ws/notifications`)
5. Verify `https://vitaway.nsengi.space/api/v1/health/ready`

## 5. Seed coach/admin (first time only)

```bash
cd /opt/mirafood-api/server
docker compose -f docker-compose.prod.yml exec api npm run seed
```

## 6. Update mobile app production URL

In EAS / TestFlight env or `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=https://vitaway.nsengi.space
```

(Or `https://mirafood.vitaway.org` when that DNS points to the same VPS.)

## Redeploy after code changes

```bash
cd /opt/mirafood-api/server
git pull   # if using git
docker compose -f docker-compose.prod.yml up -d --build
```

## Useful commands

| Task | Command |
|------|---------|
| API logs | `docker compose -f docker-compose.prod.yml logs -f api` |
| Restart stack | `docker compose -f docker-compose.prod.yml restart` |
| DB shell | `docker compose -f docker-compose.prod.yml exec postgres psql -U postgres mirafood` |
| Health | `curl https://vitaway.nsengi.space/api/v1/health/ready` |

## DNS note

If you move from `vitaway.nsengi.space` to `mirafood.vitaway.org`, point the A record to the same Contabo IP and re-run deploy with:

```bash
sudo DOMAIN=mirafood.vitaway.org CERTBOT_EMAIL=you@email.com bash deploy/deploy.sh
```

Update `CORS_ORIGIN` and mobile `EXPO_PUBLIC_API_URL` to match.
