# MiraFood plate detection API

Minimal Flask server that sends your meal photo + camera metadata to **OpenRouter** (vision model) and returns plate/bowl detection + estimated diameter.

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and set `OPENROUTER_API_KEY` from [openrouter.ai/keys](https://openrouter.ai/keys).

> Use a **vision-capable** model. Default: `openai/gpt-4o-mini`.  
> For tighter diameter estimates (~±1 cm), try `openai/gpt-4o` with `OPENROUTER_IMAGE_DETAIL=high`.  
> OpenRouter model IDs use a provider prefix, e.g. `openai/gpt-4o-mini`, `google/gemini-flash-1.5`.

The app sends rich camera metadata (EXIF, focal length, device, reference plate sizes).  
The prompt uses a 5-step estimation procedure with angle correction. Diameters are not rounded.

## Run

```bash
python server.py
```

Server listens on `http://0.0.0.0:5050`.

- Health: `GET /health`
- Detect: `POST /plates/detect` (multipart: `image` file + `metadata` JSON string)

## Mobile app

Production API: **https://vitaway.nsengi.space**

In the project root `.env`:

```
EXPO_PUBLIC_PLATE_API_URL=https://vitaway.nsengi.space
```

Local dev:

- **Simulator:** `http://127.0.0.1:5050`
- **Physical device:** `http://YOUR_COMPUTER_LAN_IP:5050`

Restart Expo after changing env vars (`npx expo start -c`).

## Production deploy (Contabo VPS)

See **[DEPLOY.md](./DEPLOY.md)** for nginx, gunicorn, systemd, and HTTPS setup.
