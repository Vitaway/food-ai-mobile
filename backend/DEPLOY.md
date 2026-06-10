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

From your Mac (project root):

```bash
rsync -av --exclude '.venv' --exclude '__pycache__' backend/ root@YOUR_VPS_IP:/opt/vitaway-api/
```

Or clone the repo on the VPS and use only the `backend/` folder.

## 3. Run the deploy script on the VPS

```bash
ssh root@YOUR_VPS_IP
cd /opt/vitaway-api
sudo bash deploy/deploy.sh
```

## 4. Configure secrets

```bash
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
{"ok": true, "provider": "openrouter", "model": "openai/gpt-4o-mini", ...}
```

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
