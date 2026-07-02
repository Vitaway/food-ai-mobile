# MiraFood plate detection API (deprecated)

> **Deprecated.** Plate detection and all API routes now live in the Node server at [`../../server/`](../../server/). Deploy that instead of this Flask app. Mobile clients call `POST /api/v1/vision/plates/detect` on the Express API.

Flask server that sends meal photos + camera metadata to **OpenRouter** and returns plate/bowl diameter detection.

## Local dev

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add OPENROUTER_API_KEY
python server.py
```

- Health: `GET http://127.0.0.1:5050/health`
- Detect: `POST http://127.0.0.1:5050/plates/detect`

## Production deploy (Contabo VPS + HTTPS)

**Read [DEPLOY.md](./DEPLOY.md)** — step-by-step guide.

Quick version:

```bash
ssh root@YOUR_VPS_IP
cd ~/food-ai-mobile/backend
nano .env                              # set OPENROUTER_API_KEY
sudo CERTBOT_EMAIL=you@email.com bash deploy/deploy.sh
curl https://vitaway.nsengi.space/health
```

## Mobile app

```env
EXPO_PUBLIC_PLATE_API_URL=https://vitaway.nsengi.space
```
