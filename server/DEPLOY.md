# MiraFood API — VPS deploy (manual commands)

Same pattern as **daily-focus**: one `docker-compose.yml`, one `Dockerfile`, API on `127.0.0.1:3011`, nginx terminates TLS.

```
Phone / Web  →  nginx :443  →  127.0.0.1:3011  →  mirafood-api
                              Postgres + Redis (no public ports)
```

**Project isolation:** compose `name: mirafood` — does not clash with daily-focus (`name: server` on VPS).

---

## 1. Stop legacy Flask (one time)

```bash
sudo systemctl stop vitaway-api
sudo systemctl disable vitaway-api
```

---

## 2. Secrets in `.env`

```bash
cd ~/food-ai-mobile/server
cp .env.example .env
nano .env
```

Generate **hex** passwords (no `/`, `=`, `+`):

```bash
openssl rand -hex 24   # POSTGRES_PASSWORD
openssl rand -hex 24   # REDIS_PASSWORD
openssl rand -hex 32   # JWT_SECRET
```

**Required:**

```env
NODE_ENV=production
POSTGRES_PASSWORD=...
REDIS_PASSWORD=...
JWT_SECRET=...at-least-32-chars...

CORS_ORIGIN=https://mirafood.vitaway.org,https://vitaway.nsengi.space
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_SITE_URL=https://vitaway.nsengi.space
APP_URL=https://mirafood.vitaway.org

SMTP_USER=...
SMTP_PASS=...
```

**Do not set** `DATABASE_URL` or `REDIS_URL` — the app builds them from `POSTGRES_PASSWORD` / `REDIS_PASSWORD`.

```bash
chmod 600 .env
bash deploy/security-check.sh
```

---

## 3. Docker (build + start)

```bash
cd ~/food-ai-mobile/server
git pull

# Stop old stack (including orphan daily-focus containers under project "server")
docker compose down

# First deploy or after password change — wipe DB volumes:
# docker volume rm mirafood_mirafood_pg_data mirafood_mirafood_redis_data

docker compose build --no-cache
docker compose up -d
docker compose logs -f api
```

Wait for:

```
Database connected
MiraFood API listening on http://0.0.0.0:3011
```

Verify locally on VPS:

```bash
curl http://127.0.0.1:3011/api/v1/health/ready
docker port mirafood-api          # 127.0.0.1:3011
docker port mirafood-postgres     # 127.0.0.1:5433 only (loopback)
```

Seed (first time):

```bash
docker compose exec api npm run seed
```

---

## 4. nginx + SSL

### Fresh install (replace old Flask config)

```bash
cd ~/food-ai-mobile/server

# Backup old site
sudo cp /etc/nginx/sites-available/vitaway.nsengi.space \
  /etc/nginx/sites-available/vitaway.nsengi.space.bak.$(date +%Y%m%d) 2>/dev/null || true

# Install new config (proxies :3011, legacy /health + /plates/detect)
sudo cp deploy/nginx/vitaway.nsengi.space.conf \
  /etc/nginx/sites-available/vitaway.nsengi.space
sudo ln -sf /etc/nginx/sites-available/vitaway.nsengi.space \
  /etc/nginx/sites-enabled/vitaway.nsengi.space
```

### SSL certificate

If cert already exists, skip to reload. If starting fresh:

```bash
# Temporary HTTP-only for certbot (comment out ssl server block first, or use):
sudo certbot --nginx -d vitaway.nsengi.space --non-interactive --agree-tos -m you@email.com

sudo nginx -t
sudo systemctl reload nginx
```

### Verify HTTPS

```bash
curl https://vitaway.nsengi.space/api/v1/health/ready
curl https://vitaway.nsengi.space/health
```

---

## 5. Redeploy after code changes

```bash
cd ~/food-ai-mobile/server
git pull
docker compose build
docker compose up -d
docker compose logs --tail=30 api
```

---

## 6. Useful commands

| Task | Command |
|------|---------|
| Logs | `docker compose logs -f api` |
| Restart API | `docker compose restart api` |
| Stop stack | `docker compose down` |
| DB shell | `docker compose exec postgres psql -U postgres mirafood` |
| Security check | `bash deploy/security-check.sh` |

---

## 7. daily-focus overlap (same VPS)

Both apps used Docker project name `server` when compose lived in a folder called `server`. **Fixed** by `name: mirafood` in this compose file.

On daily-focus, add to `docker-compose.yml`:

```yaml
name: daily-focus
```

Then redeploy each app from its own directory. Do **not** run `docker compose down --remove-orphans` in one project unless you mean to remove the other app's containers.

---

## 8. Mobile / web URLs

| App | URL |
|-----|-----|
| Mobile API | `https://vitaway.nsengi.space` |
| Web dashboard | `https://mirafood.vitaway.org` |

```env
EXPO_PUBLIC_API_URL=https://vitaway.nsengi.space
EXPO_PUBLIC_WEB_URL=https://mirafood.vitaway.org
```

Web production build: `VITE_API_BASE_URL=https://vitaway.nsengi.space/api/v1`

---

## Local dev (Mac)

```bash
cd server
cp .env.example .env
# Set POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET (hex)

docker compose up -d postgres redis
npm run dev
```

API: `http://127.0.0.1:3011` — or run full stack with `docker compose up -d --build`.
