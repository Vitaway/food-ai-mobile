# MiraFood API — VPS deploy

Same as **daily-focus**: `docker-compose.yml` + `Dockerfile`, no deploy scripts.

```
HTTPS  →  nginx  →  127.0.0.1:3011  →  mirafood-api  →  postgres + redis
```

Compose project: `name: mirafood` (does not clash with daily-focus).

---

## 1. Stop legacy Flask (one time)

```bash
sudo systemctl stop vitaway-api
sudo systemctl disable vitaway-api
```

---

## 2. `.env` on the VPS

```bash
cd ~/food-ai-mobile/server
cp .env.example .env
nano .env
```

Generate passwords (**hex only** — no `/`, `=`, `+`):

```bash
openssl rand -hex 24   # POSTGRES_PASSWORD
openssl rand -hex 24   # REDIS_PASSWORD
openssl rand -hex 32   # JWT_SECRET
```

Paste into `.env`:

```env
NODE_ENV=production
POSTGRES_PASSWORD=paste-hex-here
REDIS_PASSWORD=paste-hex-here
JWT_SECRET=paste-hex-here

CORS_ORIGIN=https://mirafood.vitaway.org,https://vitaway.nsengi.space
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_SITE_URL=https://vitaway.nsengi.space
APP_URL=https://mirafood.vitaway.org

SMTP_USER=...
SMTP_PASS=...
AUTO_RUN_MIGRATIONS=true
```

**Do not add** `DATABASE_URL` or `REDIS_URL` — the app builds those from the passwords above.

```bash
chmod 600 .env
```

---

## 3. Docker

```bash
cd ~/food-ai-mobile/server
git pull

# Stop any old "server" project stack from this folder
docker compose -p server down 2>/dev/null || true
docker compose down

# First deploy or after password change:
# docker volume rm mirafood_mirafood_pg_data mirafood_mirafood_redis_data

docker compose build --no-cache
docker compose up -d
docker compose logs -f api
```

Good logs:

```
Database connected
MiraFood API listening on http://0.0.0.0:3011
```

```bash
curl http://127.0.0.1:3011/api/v1/health/ready
docker compose exec api npm run seed    # first time only
```

---

## 4. nginx — paste into sites-available

```bash
sudo nano /etc/nginx/sites-available/vitaway.nsengi.space
```

**Delete everything** in that file and paste this entire block:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name vitaway.nsengi.space;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name vitaway.nsengi.space;

    ssl_certificate /etc/letsencrypt/live/vitaway.nsengi.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vitaway.nsengi.space/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 25M;

    location = /health {
        proxy_pass http://127.0.0.1:3011/api/v1/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /plates/detect {
        proxy_pass http://127.0.0.1:3011/api/v1/vision/plates/detect;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3011;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;
    }

    location /ws/ {
        proxy_pass http://127.0.0.1:3011;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
    }

    location / {
        proxy_pass http://127.0.0.1:3011;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
sudo ln -sf /etc/nginx/sites-available/vitaway.nsengi.space /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

If `nginx -t` fails on `http2`, change `listen 443 ssl http2` to `listen 443 ssl` (both lines).

### SSL (only if cert missing)

```bash
sudo certbot --nginx -d vitaway.nsengi.space --non-interactive --agree-tos -m you@email.com
sudo nginx -t && sudo systemctl reload nginx
```

### Verify

```bash
curl https://vitaway.nsengi.space/api/v1/health/ready
curl https://vitaway.nsengi.space/health
```

---

## 5. Redeploy

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
| Restart | `docker compose restart api` |
| Stop | `docker compose down` |
| DB shell | `docker compose exec postgres psql -U postgres mirafood` |

---

## 7. Mobile / web

```env
EXPO_PUBLIC_API_URL=https://vitaway.nsengi.space
EXPO_PUBLIC_WEB_URL=https://mirafood.vitaway.org
VITE_API_BASE_URL=https://vitaway.nsengi.space/api/v1
```

---

## Local dev (Mac)

```bash
cd server
cp .env.example .env
docker compose up -d postgres redis
npm install && npm run dev
```
