# Deploy Vitaway API (Contabo VPS + HTTPS)

**Goal:** `https://vitaway.nsengi.space` serves your Flask plate-detection API.

**Stack:**

```
Phone (HTTPS) → nginx :443 → gunicorn :5050 → Flask server.py → OpenRouter
```

**Your VPS path:** `~/food-ai-mobile/backend`  
**One deploy script does everything.** No `/opt`, no second fix script.

---

## Before you start

You need:

- Contabo VPS with root SSH access
- Domain `vitaway.nsengi.space` pointing to the VPS IP
- OpenRouter API key from [openrouter.ai/keys](https://openrouter.ai/keys) (regular key, not management/provisioning)

---

## Step 1 — DNS

At your DNS provider, add:

| Type | Name | Value |
|------|------|-------|
| A | `vitaway` | `84.247.176.58` (your VPS IP) |

Wait 5–30 minutes, then check from your Mac:

```bash
dig +short vitaway.nsengi.space
# must print your VPS IP
```

---

## Step 2 — Put code on the VPS

**Option A — already cloned (your setup):**

```bash
ssh root@84.247.176.58
cd ~/food-ai-mobile/backend
git pull
```

**Option B — fresh copy from your Mac:**

```bash
rsync -av --exclude '.venv' --exclude '__pycache__' --exclude '.env' \
  backend/ root@84.247.176.58:~/food-ai-mobile/backend/
```

---

## Step 3 — Create `.env` on the VPS

```bash
ssh root@84.247.176.58
cd ~/food-ai-mobile/backend
cp .env.example .env
nano .env
```

Paste this (use your real key, **no quotes**):

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxx
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_IMAGE_DETAIL=high
OPENROUTER_TEMPERATURE=0.05
OPENROUTER_APP_NAME=MiraFood
OPENROUTER_SITE_URL=https://vitaway.nsengi.space
PORT=5050
FLASK_DEBUG=false
```

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

## Step 4 — Run the deploy script (one command)

Still on the VPS:

```bash
cd ~/food-ai-mobile/backend
sudo CERTBOT_EMAIL=your@email.com bash deploy/deploy.sh
```

Replace `your@email.com` with your email (for Let's Encrypt expiry notices).

The script automatically:

1. Installs Python, nginx, certbot
2. Creates venv + installs requirements
3. Starts gunicorn on `127.0.0.1:5050` via systemd
4. Configures nginx HTTP (for certbot)
5. Gets SSL certificate from Let's Encrypt
6. Writes nginx HTTPS block → proxies to Flask
7. Verifies `https://vitaway.nsengi.space/health`

**Success output ends with `DEPLOY SUCCESS`.**

---

## Step 5 — Verify from your Mac

```bash
curl https://vitaway.nsengi.space/health
```

Must return JSON like:

```json
{
  "ok": true,
  "apiKeyStatus": "configured",
  "provider": "openrouter",
  "model": "openai/gpt-4o-mini"
}
```

**Not** `Cannot GET /health` (that means HTTPS still hits the wrong app).

Also test detect (optional):

```bash
curl -X POST https://vitaway.nsengi.space/plates/detect
# expect 400 "Missing image" — that's fine, API is reachable
```

---

## Step 6 — Point the mobile app

In your project root `.env`:

```env
EXPO_PUBLIC_PLATE_API_URL=https://vitaway.nsengi.space
```

Restart Expo: `npx expo start -c`  
TestFlight builds already use this URL via `eas.json`.

---

## Architecture (what went wrong before)

| Problem | Cause | Fix |
|---------|-------|-----|
| `apiKeyStatus: placeholder` | Key in wrong `.env` or not set | Edit `~/food-ai-mobile/backend/.env` on VPS |
| HTTP works, HTTPS fails | No `listen 443` for vitaway — another Node app caught SSL | Deploy script now writes explicit HTTPS block |
| App "request failed" | TestFlight uses `https://` | HTTPS must return Flask JSON |

---

## Redeploy after code changes

```bash
cd ~/food-ai-mobile/backend
git pull
sudo systemctl restart vitaway-api
```

Only re-run full deploy if nginx/systemd changed:

```bash
sudo bash deploy/deploy.sh
```

---

## Useful commands

| What | Command |
|------|---------|
| API status | `sudo systemctl status vitaway-api` |
| API logs | `sudo journalctl -u vitaway-api -f` |
| Restart API | `sudo systemctl restart vitaway-api` |
| Test locally on VPS | `curl http://127.0.0.1:5050/health` |
| Test HTTPS | `curl https://vitaway.nsengi.space/health` |
| nginx test | `sudo nginx -t` |
| Renew SSL (auto via cron) | `sudo certbot renew --dry-run` |

---

## Troubleshooting

### HTTPS still returns `Cannot GET /health`

Another nginx site is stealing port 443. On the VPS:

```bash
grep -rn 'listen.*443' /etc/nginx/sites-enabled/
```

Then re-run deploy:

```bash
cd ~/food-ai-mobile/backend
sudo bash deploy/deploy.sh
```

### `apiKeyStatus: placeholder`

```bash
nano ~/food-ai-mobile/backend/.env
sudo systemctl restart vitaway-api
```

### OpenRouter 401 in the app

Wrong or expired key. Create a new regular key at openrouter.ai/keys, update `.env`, restart.

### Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## API endpoints

| Method | Path | Body |
|--------|------|------|
| GET | `/health` | — |
| POST | `/plates/detect` | multipart: `image` (file) + `metadata` (JSON string) |
