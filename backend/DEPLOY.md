# Deploy Vitaway API to Contabo VPS

Production URL: **https://vitaway.nsengi.space**

The Flask app runs behind **nginx** (HTTPS) and **gunicorn** (port 5050 on localhost).

## 1. DNS

Add an **A record** at your DNS provider:

| Name | Type | Value |
|------|------|-------|
| `vitaway` | A | Your Contabo VPS public IP |

Wait for propagation, then verify:

```bash
dig +short vitaway.nsengi.space
```

## 2. Copy backend to the VPS

**Option A — `/opt/vitaway-api` (deploy script default)**

```bash
rsync -av --exclude '.venv' --exclude '__pycache__' backend/ root@YOUR_VPS_IP:/opt/vitaway-api/
```

**Option B — home directory (e.g. `~/food-ai-mobile/backend`)**

Clone or rsync into that path. The `.env` you edit must match the path in the systemd service (see step 3).

## 3. Run deploy on the VPS

From your backend folder (in-place — uses that directory and its `.env`):

```bash
cd ~/food-ai-mobile/backend
sudo bash deploy/deploy.sh
```

Or deploy to `/opt/vitaway-api` instead:

```bash
sudo APP_DIR=/opt/vitaway-api bash deploy/deploy.sh
```

The script installs dependencies, writes a systemd unit for the chosen `APP_DIR`, and configures nginx.

## 4. Configure secrets

Edit the `.env` in the **same directory** as `WorkingDirectory` in the service file:

```bash
# If using ~/food-ai-mobile/backend:
nano ~/food-ai-mobile/backend/.env

# If using /opt/vitaway-api:
sudo nano /opt/vitaway-api/.env
```

Required:

```env
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_SITE_URL=https://vitaway.nsengi.space
PORT=5050
```

Then restart:

```bash
sudo systemctl restart vitaway-api
```

## 5. HTTPS (Let's Encrypt)

After DNS resolves to the VPS:

```bash
sudo certbot --nginx -d vitaway.nsengi.space
```

Certbot updates nginx for HTTPS automatically.

## 6. Verify

```bash
curl https://vitaway.nsengi.space/health
```

Expected:

```json
{"ok": true, "apiKeyStatus": "configured", "provider": "openrouter", "model": "openai/gpt-4o-mini", ...}
```

If you see `"apiKeyStatus": "missing"` or `"placeholder"`, the key is not set correctly on the VPS.

### App shows "request failed" but health works over HTTP

Test both:

```bash
curl http://vitaway.nsengi.space/health
curl -k https://vitaway.nsengi.space/health
```

If **HTTP returns JSON** but **HTTPS returns** `Cannot GET /health` with `X-Powered-By: Express`, nginx is sending HTTPS to the wrong app (often a Node site on the same VPS). The mobile app uses `https://`, so plate detection fails.

Fix on the VPS:

```bash
cd ~/food-ai-mobile/backend
sudo bash deploy/fix-https.sh
```

Or manually ensure only one nginx site owns `vitaway.nsengi.space` on port 443 and it `proxy_pass`es to `http://127.0.0.1:5050`.

### OpenRouter 401 "User not found" in the app

This means the **server** API key is wrong, not the phone app. Common causes:

1. **Placeholder key** still in `/opt/vitaway-api/.env`
2. **Provisioning/management key** instead of a regular inference key — create a normal key at [openrouter.ai/keys](https://openrouter.ai/keys)
3. **Expired or revoked key** — generate a new one
4. **Quotes in `.env`** — use `OPENROUTER_API_KEY=sk-or-v1-...` with no quotes

Fix on the VPS:

```bash
sudo nano /opt/vitaway-api/.env
sudo systemctl restart vitaway-api
curl https://vitaway.nsengi.space/health
```

`apiKeyStatus` must be `"configured"` and `ok` must be `true`.

## 7. Mobile app

In the project root `.env`:

```env
EXPO_PUBLIC_PLATE_API_URL=https://vitaway.nsengi.space
```

Restart Expo (`npx expo start -c`). For EAS builds, the production profile in `eas.json` already includes this URL.

## Operations

| Task | Command |
|------|---------|
| Logs | `sudo journalctl -u vitaway-api -f` |
| Restart API | `sudo systemctl restart vitaway-api` |
| Status | `sudo systemctl status vitaway-api` |
| Redeploy code | `rsync` backend again, then `sudo systemctl restart vitaway-api` |

## Firewall

Allow HTTP/HTTPS on the VPS:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/plates/detect` | Multipart: `image` + `metadata` (JSON string) |
