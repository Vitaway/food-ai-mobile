# MiraFood API Server

Express + TypeScript API for the MiraFood coach dashboard and mobile app. Follows the same patterns as the Inzu `app-server` stack: `routing-controllers`, TypeORM, Postgres, Redis, JWT sessions, and `{ success, data }` responses.

## Quick start

```bash
cd server
cp .env.example .env
docker compose up -d
npm install
npm run seed
npm run dev
```

API base: `http://localhost:3010/api/v1`

### Default coach (after seed)

- Email: `coach@vitaway.com`
- Password: `Test@123`

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/v1/health` | No | Liveness + OpenRouter status |
| GET | `/api/v1/health/ready` | No | DB + Redis readiness |
| POST | `/api/v1/auth/login` | No | Returns JWT + user |
| POST | `/api/v1/auth/logout` | Yes | Revokes session |
| POST | `/api/v1/auth/me` | Yes | Current user |
| GET | `/api/v1/coach/profile` | Coach | Profile snapshot |
| PATCH | `/api/v1/coach/profile` | Coach | Update profile |
| GET | `/api/v1/coach/stats` | Coach | Dashboard stats |
| GET | `/api/v1/coach/queue` | Coach | Review queue |
| GET | `/api/v1/coach/clients` | Coach | Client list |
| GET | `/api/v1/coach/meals/:id` | Coach | Meal detail |
| POST | `/api/v1/coach/meals/:id/review` | Coach | Approve/reject |
| POST | `/api/v1/vision/plates/detect` | No | Plate/bowl vision (multipart) |

**Legacy (Flask-compatible during migration):**

- `GET /health`
- `POST /plates/detect` — returns raw detection JSON (no envelope), same as Flask

## Environment

See `.env.example`. Required for vision: `OPENROUTER_API_KEY` (regular `sk-or-…` inference key).

## Scripts

- `npm run dev` — watch mode
- `npm run build` / `npm start` — production
- `npm run seed` — coach user + profile
- `npm run migration:run` — apply migrations manually

## Stack

- Node 20+, Express 4, routing-controllers
- TypeORM + Postgres 16
- Redis 7 (optional readiness check)
- OpenRouter for plate vision
