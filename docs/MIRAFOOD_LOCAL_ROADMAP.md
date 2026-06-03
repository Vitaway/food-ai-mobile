# MiraFood — Local-first roadmap (pre-AI / pre-backend / pre-coach)

**MiraFood** — nutrition mobile app while we wait for:

- Hosted AI meal analysis
- Backend API
- Coach web dashboard

**Goal:** Ship a credible on-device product and keep the codebase ready to plug in real services later.

**How to use this doc:** Work top to bottom within each tier. Check boxes as items ship. One feature per PR/session when possible.

---

## Current baseline (already in repo)

| Area | Status | Key paths |
|------|--------|-----------|
| Onboarding → BMR/TDEE/macros/water | Done | `src/app/onboarding/`, `src/utils/nutrition.ts` |
| Log flow (camera/gallery/text) | Done | `src/app/(tabs)/log.tsx`, `src/components/log/*` |
| Mock analysis → save meal | Done | `src/services/local/mockMealAnalysisService.ts` |
| Service contracts | Started | `src/services/contracts/*`, `src/services/index.ts` |
| Home dashboard (partial) | In progress | `src/app/(tabs)/index.tsx`, `src/hooks/useDashboard.ts` |
| Insights 7d/30d | Done | `src/app/(tabs)/analytics.tsx`, `src/services/local/analytics.ts` |
| Profile + security (passcode/biometrics) | Done | `src/app/profile/*`, `src/context/AppLockContext.tsx` |
| Pipeline simulation | Done | `MealsContext`, `src/constants/mealStatus.ts` |

**Meal statuses (already typed):** `pending` → `analyzing` → `in_review` → `approved` | `rejected`  
See `MealSubmissionStatus` in `src/types/index.ts`.

---

## Mindset for this phase

Position the app as:

> **MiraFood — personal nutrition diary + planner** with **simulated** analysis, not the full Vitaway closed loop yet.

Honest scope: profile → log → dashboard → insights → habits, **all on-device**.

When backend/AI/coach land: swap **data source** and **analysis implementation**, not navigation or state shapes.

---

## Tier 1 — Highest value (do first)

### 1. Realistic mock pipeline (no backend)

Today meals often jump straight to `approved`. Wire the full journey by default.

- [x] On save: start as `pending`, run `simulatePipeline(mealId)` (or equivalent in `MealsContext`)
- [x] Timed transitions: `pending` → `analyzing` → `in_review` → `approved` (configurable delays in `mealStatus.ts`)
- [x] Home: show status on last meal / timeline (`MealTimeline`, `LastMealCard`)
- [x] In-app notifications per status (`useAppNotifications`, mark read)
- [x] Meal detail: read-only while not `approved`; editable after `approved`
- [x] Optional: random `rejected` in dev (`__DEV__`, ~8% at `in_review`)
- [x] Resume pipeline on app launch for stuck active meals

**Files to touch:** `src/context/MealsContext.tsx`, `src/app/(tabs)/log.tsx`, `src/components/home/*`, `src/app/notifications/index.tsx`

**Done when:** A new log visibly progresses through states without manual refresh hacks.

---

### 2. Daily command center (spec §5.3 alignment)

- [x] **Last meal card** — thumbnail, name, status badge, tap to detail
- [x] **Calorie ring** + macro progress bars unified on home (`DailyCommandCenter`)
- [x] **Streak** surfaced on home (`StreakBadge` in command center)
- [x] **Week strip** on home + link to full calendar (`/profile/health`)
- [x] Day selection updates dashboard for that date (`useDashboard(selectedDate)`)

**Files to touch:** `src/app/(tabs)/index.tsx`, `src/components/home/DashboardCards.tsx`, `CalorieRing.tsx`, `MealTimeline.tsx`, `src/hooks/useDashboard.ts`

**Done when:** Home answers “how am I doing today?” in one glance.

---

### 3. Post-log editing (local only, spec §5.2)

- [x] Meal detail screen (stack route `src/app/meal/[id].tsx`) — view + pipeline states
- [x] Edit item label, portion/weight, delete item (`EditableMealItems`)
- [x] Recalculate `totalNutrition` client-side (`src/utils/mealNutrition.ts`)
- [x] Optional notes on meal (`MealSubmission.note` in edit mode)
- [x] Delete whole meal

**Files to touch:** new meal route, `localMealsRepository`, `MealsContext`

**Done when:** User can fix mock AI mistakes without re-logging.

---

### 4. Rules-based recommendations (no ML)

- [x] After save: contextual message (e.g. “~80% of daily carbs used”) — pre-submit on log results (`LogResultsStep`)
- [x] Insights: simple patterns (“most calories at dinner this week”) — `buildCoachInsights` on analytics
- [x] Static meal-swap suggestions filtered by `goal` + `dietaryPreferences` (`src/data/mealSwapSuggestions.ts`)

**Files to touch:** `src/services/local/recommendations.ts`, `src/data/mealSwapSuggestions.ts`, log results step, analytics

**Done when:** User gets actionable copy after meals and in Insights without calling an API.

---

### 5. In-app nudges (not push yet)

- [x] Evaluate rules on app open / focus: missed meal window, low water by midday, streak at risk (`buildLocalNudges`, `useFocusEffect`)
- [x] Populate `src/app/notifications/index.tsx` from local state (nudges + meal pipeline)
- [x] Settings: quiet hours + category toggles (AsyncStorage, `NotificationSettingsPanel`)
- [x] Mark read / dismiss

**Defer:** FCM/APNs, server-scheduled push.

**Done when:** Notifications screen shows real, dismissible items driven by local rules.

---

## Tier 2 — Prepare for backend (do alongside Tier 1)

### 6. Harden service layer

- [x] No direct AsyncStorage from screens — only `services.*` + contexts (`notificationsRepository`, repos)
- [x] **Fake API adapter** matching future poll flow: `submit` → `GET status` → `GET results` with delays, backed by local storage
- [x] Env/feature flag: `EXPO_PUBLIC_USE_MOCK_API` vs pure local repos (`src/constants/features.ts`)

**Files to touch:** `src/services/index.ts`, `fakeApiMealAnalysisService.ts`, `fakeApiMealSubmissionService.ts`

**Done when:** Log screen calls one interface; swapping to HTTP is a DI change.

---

### 7. Data model parity (spec §12)

Extend types/storage (nullable until backend exists):

- [x] `fraudCheckResult`, `mealClassification`, `modelVersion`, `autoApproved` on `MealSubmission`
- [x] `CoachReview` stub when `status === 'in_review'`
- [x] Profile: `targetWeightKg`, `goalPace`, `mealsPerDay`, optional `allergies[]`

**Files to touch:** `src/types/index.ts`, `localProfileRepository`, onboarding steps

**Done when:** Sample meal JSON matches expected API shape in a fixture file (`src/data/fixtures/sampleMealSubmission.json`).

---

### 8. Onboarding gaps (spec §3.1)

- [x] Target weight + pace step(s)
- [x] Meals-per-day preference
- [x] Allergies (optional multi-select)

**Files to touch:** `src/app/onboarding/index.tsx`, `MetricStepper`, `ProfileContext`

**Done when:** New users complete extended profile; targets still computed locally.

---

## Tier 3 — Analytics & engagement

### 9. Weekly / monthly reports

- [ ] In-app report screen (week/month toggle)
- [ ] Days on/off calorie target, avg health score, top foods
- [ ] “Focus for next week” (rule-based bullet list)
- [ ] Optional: share sheet / export text summary

**Files to touch:** new `src/app/reports/` or profile sub-route, extend `analytics.ts`

---

### 10. Light gamification

- [ ] Badge definitions (first log, 7-day streak, protein 5/7 days, etc.)
- [ ] Unlock modal / profile section
- [ ] Skip leaderboard and social challenges until Phase 4

---

### 11. Activity & sleep (manual)

- [ ] Simple log forms (duration, quality)
- [ ] Fold lightly into health score or insights copy

**Defer:** HealthKit / Google Fit / wearable sync.

---

## Tier 4 — Defer or stub only

| Item | Why wait | Optional stub |
|------|----------|----------------|
| Real fraud detection | Model + server | Reject tiny/blank images locally |
| Coach web dashboard | Separate app | Figma / Notion spec only |
| Fine-tuning pipeline | Needs coach labels | — |
| Wearable sync | Native + backend | — |
| Auto-approve by confidence | Real model scores | Always mock approve after delay |
| Production auth | Backend | Local profile id only |
| Push notifications (remote) | FCM + backend | In-app only (Tier 1.5) |

---

## Suggested implementation order (6 weeks)

| Week | Focus |
|------|--------|
| 1–2 | **§1** Pipeline statuses + **§2** Home command center + notifications (in-app) |
| 2–3 | **§3** Meal editing + **§4** Rules-based tips |
| 3–4 | **§9** Weekly report + **§10** Badges/streak polish |
| 4–5 | **§6–8** Fake API layer + model fields + onboarding extras |
| 5–6 | QA, a11y, performance, TestFlight / internal beta |

**Parallel (no code):** Coach dashboard wireframes in Figma — queue, meal detail, approve/edit/reject.

---

## Definition of “done” before AI/backend

We can ship a beta that honestly offers:

- [ ] Complete **health profile** and **personal targets**
- [ ] **Log meals** (photo/text) with a **realistic review journey** (simulated)
- [ ] **Daily dashboard**, **calendar**, **insights**, **water**, **streaks**
- [ ] **Helpful tips** (rules, not ML)
- [ ] **Structured data** and **service boundaries** for API/coach plug-in

That is not full v2.0 spec coverage — it is the right foundation.

---

## Do not over-invest now

Avoid polishing UI that depends on **real** segmentation masks, coach annotation layers, or live multi-device sync. Those will change when real AI JSON and coach tools exist.

**Do build:** states, navigation, editing, reports, service contracts.

---

## Implementation log

Record PRs or dates here as we finish each item.

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Mock pipeline | ✅ | Jun 2026 |
| 2 | Home command center | ✅ | Jun 2026 |
| 3 | Meal editing | ✅ | Jun 2026 |
| 4 | Rules-based recommendations | ⬜ | |
| 5 | In-app nudges | ⬜ | |
| 6 | Service layer / fake API | ⬜ | Contracts exist |
| 7 | Data model parity | ⬜ | |
| 8 | Onboarding gaps | ⬜ | |
| 9 | Weekly/monthly reports | ⬜ | |
| 10 | Gamification | ⬜ | |
| 11 | Activity/sleep manual | ⬜ | |

---

## Next session

**Next: Tier 1 §4 — rules-based recommendations** (post-meal tips, insights patterns).

When ready, say “implement §4” and we’ll work through the checklist in order.
