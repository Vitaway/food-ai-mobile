# MiraFood API Server

Express + TypeScript API for the MiraFood coach dashboard and mobile app. Follows the same patterns as the Inzu `app-server` stack: `routing-controllers`, TypeORM, Postgres, Redis, JWT sessions, and `{ success, data }` responses.

## Quick start (local)

```bash
cd server
cp .env.example .env
# Set POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET (openssl rand -hex 24)

docker compose up -d postgres redis   # DB on 127.0.0.1:5433 / :6380
npm install
npm run seed
npm run dev                             # API on http://localhost:3011
```

Or run the full stack in Docker: `docker compose up -d --build`

**VPS production:** see [DEPLOY.md](./DEPLOY.md) — all commands + nginx config to paste.

API base: `http://localhost:3011/api/v1`

### Default accounts (after seed)

Password for all seed users: `Test@123` (override via `SEED_*_PASSWORD` env vars).

| Role | Email | Dashboard |
|------|-------|-----------|
| admin | `admin@vitaway.org` | `/admin` |
| coach | `coach@vitaway.org` | `/coach` |
| consumer | `patient@vitaway.org` | `/app` |
| nutrition_coach | `nutrition@vitaway.org` | `/coach` |
| organization_admin | `orgadmin@vitaway.org` | `/admin` |
| data_entry_staff | `dataentry@vitaway.org` | staff APIs |

`npm run seed:users` refreshes passwords/roles without wiping meals.

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | No | **Legacy** — same as `/api/v1/health` (Flask compat) |
| POST | `/plates/detect` | No | **Legacy** — same as `/api/v1/vision/plates/detect` |
| GET | `/api/v1/health` | No | Liveness + OpenRouter status |
| GET | `/api/v1/health/ready` | No | DB + Redis readiness |
| POST | `/api/v1/auth/register` | No | Create consumer account + patient ID |
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
| GET | `/api/v1/consumer/profile` | Consumer | Profile + patient ID |
| PATCH | `/api/v1/consumer/profile` | Consumer | Update health profile |
| GET | `/api/v1/consumer/dashboard` | Consumer | Today's dashboard |
| GET | `/api/v1/consumer/meals` | Consumer | Meal history |
| POST | `/api/v1/consumer/meals` | Consumer | Submit meal for coach review |
| POST | `/api/v1/vision/plates/detect` | No | Plate/bowl vision (multipart) |
| POST | `/api/v1/vision/meals/analyze` | Consumer | AI meal analysis from photo |
| POST | `/api/v1/vision/meals/analyze-text` | Consumer | AI meal analysis from description |
| POST | `/api/v1/auth/forgot-password` | No | Email a 6-digit password reset OTP |
| POST | `/api/v1/auth/verify-reset-code` | No | Validate OTP before setting password |
| POST | `/api/v1/auth/reset-password` | No | Set new password with email + OTP |

## Environment

See `.env.example`. Required for vision: `OPENROUTER_API_KEY` (regular `sk-or-…` inference key).

## Scripts

- `npm run dev` — watch mode
- `npm run build` / `npm start` — production
- `npm run seed` / `seed:users` — upsert dashboard users + nutrition foods (**keeps** meals/patients)
- `npm run seed:dev -- --wipe-demo` — local only; clears meals + consumer profiles (blocked in production)
- `npm run import:tfct` — import TFCT food composition into nutrition DB (foods only)
- `npm run migration:run` — apply migrations manually

## Stack

- Node 20+, Express 4, routing-controllers
- TypeORM + Postgres 16
- Redis 7 (optional readiness check)
- OpenRouter for plate vision
