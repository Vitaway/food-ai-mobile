# MiraFood dashboard rebuild — tracking

Source of truth for aligning Coach + Admin dashboards with the boss demo  
(`mirafood_all_dashboards_demo (4).html`), while keeping **our** MiraFood UI  
(blue spruce sidebar, Sniglet/Cabin Sketch, existing tokens).

Update checkboxes as work lands. Do not treat unchecked Phase 2+ items as current sprint scope.

---

## Locked decisions (2026-07-17)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Scope | **Phase 1 only:** rebuild **Coach + Admin**. Other 5 partner dashboards later. |
| 2 | Buttons | **Normal flat buttons** on all dashboards (Coach + Admin). **Keep** neo-brutalist buttons on the **marketing site**. **Keep left sidebar** in main **blue spruce** (do not switch to cream/navy demo chrome). |
| 3 | Module entitlements | **Yes — real system** in Admin (Tracking, Coaching, Clinical, Claims, Corporate Reporting, etc.), not a fake placeholder forever. |
| 4 | Review queue | **Table of meals** → click row → existing meal review page. No card grid for the queue. |
| 5 | Layout language | Demo structure (KPI strip + **tables in panels** + status pills + filter chips), but **our** colors/typography/shell. |

---

## Design rules (always)

1. **Tables first** — lists of meals, clients, users, foods, claims-like data = `<table>` / shared `DataTable`, not card grids.
2. **Cards only when needed** — KPI strip, rare callouts, or true interactive single-item surfaces (e.g. chat composer). Prefer one panel wrapping a table.
3. **Normal buttons in dashboards** — flat rounded (`primary` / `outline` / `ghost` / `danger`), no offset-shadow neo-brutalist face. Marketing can keep `brutal-btn`.
4. **Sidebar stays blue** — `DashboardSidebarLayout` navy/blue spruce; content area light.
5. **Sentence case** titles — Cabin Sketch / display headings without forced ALL CAPS.
6. **Privacy** — continue patient-file-style labels where coaches view consumers; don’t expose unnecessary PII in tables.
7. **Confirm before mutating** — approve/reject, role changes, deactivate, archive, caseload changes, and similar updates must use `ConfirmModal` / `useConfirmDialog` so users don’t apply changes by accident.

---

## Demo vs current app (gap snapshot)

### Coach (demo sections)

| Demo section | Our route / page today | Gap |
|--------------|------------------------|-----|
| Overview | `/coach` `OverviewPage` | Charts/cards heavy; align KPI + table panels |
| Review Queue | `/coach/queue` `QueuePage` | **Cards → table**; SLA / filter chips |
| Review History | `/coach/history` `PastReviewsPage` | Prefer table layout |
| Clients | `/coach/clients` `ClientsPage` | Prefer table; drill-down OK |
| Nutrition DB | `/coach/nutrition` `NutritionDbPage` | Already table-ish; polish |
| Reports | `/coach/reports` `ReportsPage` | Align export + summary tables |
| Messages | `/coach/messages` `MessagesPage` | Chat UI stays; list can be denser |
| Team | `/coach/team` `TeamPage` | Table of coaches |
| Meal review detail | `/coach/queue/:id` | Keep rich review UI; use mini-tables for ingredients |
| Client detail | `/coach/clients/:id` | Prefer tables for meal history |

### Admin (demo sections)

| Demo section | Our route / page today | Gap |
|--------------|------------------------|-----|
| Users & Roles | `/admin/users` + `/admin/coaches` (split) | Unify toward **Users & Roles** table + role drill-down |
| Food Database | `/admin/food` `FoodDbPage` | Table polish; approval workflow |
| **Module Entitlements** | `/admin/modules` `ModulesPage` | Done — catalog + org entitlements API + Admin UI |
| Audit Log | `/admin/system` (partial) | Dedicated audit table matching demo spirit |
| Overview / Payments / Reports / Referrals | Exist | Keep; restyle to tables + normal buttons; may stay as extra Admin nav beyond strict demo |

---

## Phase 1 — build plan (ordered)

Check off as completed. Prefer small PRs per step.

### Step 0 — Shared foundations

- [x] **Dashboard button variant** — add non-brutal button styles used inside `.dashboard-shell` (or `Button` prop / CSS override) so marketing keeps brutal buttons
- [x] **Shared `DataTable`** component (headers, rows, clickable row, empty state, status pill cell)
- [x] **KPI strip** component (label, number, optional delta/caption) — compact, not card-bloat
- [x] **Panel** wrapper (title + optional action + children) for table sections
- [x] **StatusPill** / filter chip primitives aligned with existing Badge
- [x] **Blue spruce sidebar** for Coach + Admin shells

### Step 1 — Coach: queue + history (highest impact)

- [x] Convert **Review Queue** from cards → **table** (patient code/label, meal type, date, confidence, SLA, status, waiting)
- [x] Filter chips: All / SLA breached / Complex / Allergies / etc. (match what API supports; stub filters if needed)
- [x] Row click → `/coach/queue/:id`
- [x] **Review History** as table (patient, meal, date, outcome)
- [x] Swap dashboard CTAs to normal buttons on these pages

### Step 2 — Coach: clients, team, overview, nutrition, reports

- [x] Clients list → table; client detail meal history → table
- [x] Team → table (name, role, reviews, approval rate, active clients)
- [x] Overview → KPI strip + table panels (incoming intakes / recent decisions) instead of card clutter
- [x] Nutrition DB / Reports → confirm table-first + normal buttons
- [x] Messages: leave chat thread UX; inbox list denser/table-like if easy

### Step 3 — Coach: meal review polish

- [x] Ingredient AI / coach edits as **mini-tables** (demo style)
- [x] Patient snapshot + recent meals as compact panels/tables
- [x] Keep approve / edit / second-opinion actions as **normal** buttons

### Step 4 — Admin: Users & Roles + Food DB + Audit

- [x] Align Admin nav labels toward demo where sensible (`Users & Roles`, Food DB, Module Entitlements, Audit)
- [x] Accounts / users table (name, role, org, status) with coach drill-down (assigned patients table)
- [x] Food DB table actions with normal buttons
- [x] Audit log as full table (time, actor, action, subject) — extend API if thin
- [x] Confirmation modals on role change, coach activate/deactivate, food approve/reject

### Step 5 — Admin: Module Entitlements (real)

- [x] **Data model** — modules catalog + per-organization enabled modules (`organization_module_entitlements`)
- [x] **API** — list catalog/entitlements, get/set/ensure for an org (admin-only); audit on change
- [x] **Admin UI** — `/admin/modules` table of accounts × modules; edit modal + confirm before save
- [x] Seed defaults — orgs with no rows resolve to Tracking + Coaching; “Add account” persists those defaults
- [ ] Wire enforcement later where product needs it (can land after UI if gated behind admin-only config)
- [x] Confirm before saving entitlement changes

### Step 6 — Sweep & QA

- [x] Grep dashboard pages for `brutal-btn` / offset-shadow button usage — removed via `.dashboard-shell` CSS overrides (shared `Button` stays brutal for marketing)
- [x] Marketing still uses brutal buttons
- [x] Sidebar still blue spruce (`bg-blue-spruce-600`)
- [x] Mobile/tablet: tables scroll horizontally (`DataTable` / ingredient mini-tables use `overflow-x-auto`)
- [ ] Smoke: coach queue → review → approve; admin users; entitlements save (manual in browser)

---

## Phase 2+ — later (out of Phase 1 scope)

Do **not** start these until Phase 1 is done unless product reprioritizes.

| Dashboard | Sections (demo) | Notes |
|-----------|-----------------|-------|
| Corporate Wellness | Overview, Engagement, Programs, Reports & Export | Needs `organization_admin` / corporate role UX |
| Insurer (Eden Care) | Overview, Claims, Outcomes, Export | New role + claims APIs |
| Clinician | My Patients, Outcome Reports | Referring clinician, view-only |
| Front Desk | Schedule, Check-in, New Intake | Scheduling + intake wizard |
| Solid Africa / Kitchen | Order queue, Delivery, Fulfillment, Patient Intake | Dietary flags only (privacy) |

**When starting Phase 2:** new `UserRole`s, shells, APIs, and table-first pages following the same design rules.

---

## Explicitly out of scope (this track)

- Redesigning the **marketing site** visual system
- Changing sidebar from **blue spruce** to demo cream
- Replacing Cabin Sketch / Sniglet with demo Poppins/Inter site-wide
- Building all 7 dashboards in one go
- Mobile app redesign (unless a dashboard API change requires it)

---

## Progress log

| Date | Note |
|------|------|
| 2026-07-17 | Decisions locked (1A, 2A + sidebar blue, entitlements yes, queue = table). Tracking doc created. |
| 2026-07-17 | Step 0 + Step 1 done: flat dashboard buttons, blue sidebar, DataTable/KPI/Panel/pills, Review Queue + History as tables. |
| 2026-07-17 | Step 2 done: Clients, Client detail meals, Team, Overview, Reports, Nutrition DB panel — table-first. |
| 2026-07-17 | Step 3 done: Meal review mini-tables, patient snapshot panel, recent meals table, outline/primary actions. |
| 2026-07-17 | Step 4 + confirmations: Admin Users/Coaches/Food/Audit as tables; ConfirmModal on meal review, caseload, roles, coach active, food approve/reject, nutrition archive/save. |

---

## Reference files

| Area | Paths |
|------|--------|
| Demo | Local: `mirafood_all_dashboards_demo (4).html` |
| Coach shell | `web/src/components/layout/AppShell.tsx` |
| Admin shell | `web/src/features/admin/components/AdminShell.tsx` |
| Shared shell | `web/src/components/layout/DashboardSidebarLayout.tsx` |
| Buttons | `web/src/components/ui/Button.tsx`, `web/src/index.css` (`.brutal-btn*`) |
| Coach pages | `web/src/pages/coach/*` |
| Admin pages | `web/src/pages/admin/*` |
| Roles | `server/src/middlewares/auth.middleware.ts` (`UserRole`) |

---

## How to use this file

1. Before starting work, mark the **Step** you’re on.
2. Check boxes as PRs merge.
3. Add a line to **Progress log** when something ships or scope changes.
4. If product changes a locked decision, update the **Locked decisions** table and note it in the log.
