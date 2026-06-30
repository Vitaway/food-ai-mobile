# MiraFood Coach Dashboard (Web)

Coaches dashboard for reviewing client meals — matches the MiraFood mobile design system.

## Stack

- **React 19** + **TypeScript**
- **Vite**
- **Tailwind CSS v4** (Nata Sans, navy/green/orange palette from mobile)
- **Zustand** — UI state (filters, review drafts)
- **TanStack React Query** — server state (queue, stats, review actions)

## Run locally

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

Uses mock coach API data until the real backend is wired.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Overview — stats + recent queue |
| `/queue` | Full review queue with filters |
| `/queue/:id` | Meal detail — approve / reject / edit ingredients |
| `/profile` | Coach profile — update details & password |

## Project structure

```
web/src/
  api/           mockCoachApi.ts (swap for real API)
  components/
    coach/       QueueCard, ClientPanel, MealReviewPanel
    layout/      AppShell
    ui/          Button, Card, Badge, MacroBar
  hooks/         useCoachQueries.ts (React Query)
  stores/        coachStore.ts (Zustand)
  pages/         Overview, Queue, MealReview
  types/         Shared with mobile meal pipeline types
```

## Connect to real API

Replace `src/api/mockCoachApi.ts` with fetch calls to your backend coach endpoints when ready.

```env
VITE_API_URL=https://vitaway.nsengi.space
```

## Build

```bash
npm run build
npm run preview
```
