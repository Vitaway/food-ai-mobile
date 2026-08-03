# MiraFood nutrition formulas

Reference for how patient profile targets, macros, water, meal nutrition, and health scores are calculated.

**Authoritative engine:** `server/src/modules/consumers/nutrition-calculation-engine.ts`  
**Version:** `2026-07-clinical-v1` (`NCE_VERSION`)  
**Related:** `profile-targets.util.ts`, `dashboard.util.ts`, `nutrient-score.util.ts`, `meals/nutrition.util.ts`

Mobile/web may show **provisional previews** during onboarding (`mobile/src/utils/nutrition.ts`). Stored clinical targets always come from the **server NCE**.

---

## 1. Patient profile inputs

### Collected on onboarding (patient)

| Field | Use |
|--------|-----|
| Date of birth → age | BMR age term; pediatric vs adult path |
| Sex | Mifflin / Schofield sex constants |
| Height (cm), weight (kg) | BMR, BMI, protein, water |
| Activity level | TDEE multiplier (adults / pregnancy / lactation) |
| Goal (+ optional pace) | Calorie surplus/deficit **after coach confirmation** |
| Meals per day | Consistency component of health score |
| Preferences / allergies | Not used in calorie/macro math |

### Coach assessment (overrides / clinical)

Coach-verified values override patient basics when present (`mergedCalculationProfile`):

- Verified DOB/age, sex, height, weight  
- Pregnancy / trimester / babies / pre-pregnancy weight  
- Lactation  
- Conditions, fluid restriction  
- Goal pace; optional `coachAllowsProtectedWeightLoss`

### Target status

| Status | Meaning |
|--------|---------|
| `unavailable` | Missing age / height / weight / activity / goal |
| `provisional` | Patient complete, or clinical flags still open |
| `confirmed` | Coach confirmed assessment and no blocking flags |

**Rule:** Goal deficits/surpluses (`goalAdjustmentKcal`) apply only when `assessmentStatus === "confirmed"`. Until then, calorie target = maintenance TDEE.

---

## 2. BMI

\[
\mathrm{BMI} = \frac{\mathrm{weight\_kg}}{(\mathrm{height\_cm}/100)^2}
\]

Stored rounded to **1 decimal** (`Math.round(bmi * 10) / 10`).

Flag: BMI **> 40** → `bmi_over_40_coach_review` (still uses actual weight in Mifflin–St Jeor).

---

## 3. BMR (basal metabolic rate)

### Adults (age ≥ 18); Mifflin–St Jeor

\[
\mathrm{base} = 10\,W + 6.25\,H - 5\,A
\]

| Sex | BMR | `equationUsed` |
|-----|-----|----------------|
| Male | \(\mathrm{base} + 5\) | `mifflin_st_jeor_male` |
| Female | \(\mathrm{base} - 161\) | `mifflin_st_jeor_female` |
| Other / prefer not to say / null | Average of male & female | `mifflin_st_jeor_sex_average` |

Where \(W\) = kg, \(H\) = cm, \(A\) = years.

Rounded: `Math.round(bmr)`.

### Pediatrics (age < 18); Schofield (weight-based)

| Age | Boys | Girls |
|-----|------|-------|
| < 3 | \(59.512\,W - 30.4\) | \(58.317\,W - 31.05\) |
| 3–9 | \(22.706\,W + 504.3\) | \(20.315\,W + 485.9\) |
| 10–17 | \(17.686\,W + 658.2\) | \(13.384\,W + 692.6\) |

Unknown sex → average of boy and girl equations.  
Pediatric **TDEE = BMR** (no activity multiplier until a validated pediatric reference is approved).

---

## 4. Activity multipliers (TDEE)

| Activity level | Multiplier |
|----------------|------------|
| `sedentary` | 1.2 |
| `lightly_active` | 1.375 |
| `moderately_active` | 1.55 |
| `very_active` | 1.725 |
| `extremely_active` | 1.9 |

---

## 5. TDEE by population

### Healthy adult

\[
\mathrm{TDEE} = \mathrm{BMR} \times \mathrm{activity\_multiplier}
\]

### Pregnancy

- BMR from Mifflin using **pre-pregnancy weight** when available (else current weight + warning).  
- Then:

\[
\mathrm{TDEE} = \mathrm{BMR} \times \mathrm{activity\_multiplier} + \mathrm{pregnancy\_addition}
\]

| Case | Addition (kcal) |
|------|-----------------|
| Trimester 1 (or missing) | 0 |
| Singleton trimester 2 | +340 |
| Singleton trimester 3 | +452 |
| Twins, trimester 2 or 3 | +685 |

### Lactation

\[
\mathrm{TDEE} = \mathrm{BMR} \times \mathrm{activity\_multiplier} + 500
\]

(BMR uses **current** weight.)

### Pediatric

\[
\mathrm{TDEE} = \mathrm{BMR}_{\mathrm{Schofield}}
\]

Rounded: `Math.round(tdee)`.

---

## 6. Goal calorie adjustment

Applied **only if** coach assessment is `confirmed`:

### Weight loss (`lose_weight`)

| Pace | Adjustment |
|------|------------|
| `slow` (default) | −500 kcal |
| `moderate` | −625 kcal |
| `aggressive` | −750 kcal |

### Muscle gain (`gain_muscle`)

| Pace | Adjustment |
|------|------------|
| `slow` (default) | +300 kcal |
| `moderate` | +400 kcal |
| `aggressive` | +500 kcal |

### Maintain / improve diet quality

\[
\mathrm{adjustment} = 0
\]

### Protected populations

Pregnancy, lactation, and pediatric **never** get an automatic deficit unless `coachAllowsProtectedWeightLoss` is true. Deficit is forced to `0` and flagged `automatic_weight_loss_blocked`.

### Calorie target

\[
\mathrm{calorieTarget} = \max(0,\ \mathrm{round}(\mathrm{TDEE} + \mathrm{adjustment}))
\]

Stored as `macroTargets.calories`.

---

## 7. Macro targets

Using calorie target \(C = \mathrm{calorieTarget}\) and weight \(W\) (kg):

### Protein

\[
\mathrm{protein\_g} =
\begin{cases}
\mathrm{round}(2.0 \times W) & \text{if goal = gain\_muscle} \\
\mathrm{round}(1.6 \times W) & \text{otherwise}
\end{cases}
\]

Energy: \(4\) kcal/g.

### Fat

\[
\mathrm{fat\_g} = \mathrm{round}\left(\frac{0.28 \times C}{9}\right)
\]

(~28% of calories from fat; \(9\) kcal/g.)

### Carbohydrate (remainder)

\[
\mathrm{carbs\_g} = \max\left(0,\ \mathrm{round}\left(\frac{C - 4\cdot\mathrm{protein\_g} - 9\cdot\mathrm{fat\_g}}{4}\right)\right)
\]

### Fiber

| Sex | Fiber (g/day) |
|-----|----------------|
| Male | 38 |
| Female / other / unset | 25 |

### Worked check (energy identity)

\[
C \approx 4\cdot P + 4\cdot \mathrm{carbs} + 9\cdot F
\]

(Carbs absorb rounding remainder.)

---

## 8. Water target

\[
\mathrm{waterTargetMl} = \mathrm{round}(W \times 35)
\]

(~35 ml per kg). Flagged for clinical review if fluid restriction / kidney / heart disease; never override a prescribed restriction automatically.

---

## 9. Meal / ingredient nutrition (portions)

### Scale by weight

If nutrition is known for weight \(w_0\), new weight \(w_1\):

\[
\mathrm{ratio} = \frac{w_1}{\max(w_0, 1)},\quad
\mathrm{nutrient}' = \mathrm{nutrient} \times \mathrm{ratio}
\]

Calories/sodium typically **integer-rounded**; macros to **2 decimal places**.

### From per-100 g composition

\[
\mathrm{factor} = \frac{w}{100},\quad
\mathrm{nutrient}(w) = \mathrm{nutrient}_{100\mathrm{g}} \times \mathrm{factor}
\]

### Meal totals

Sum of ingredient calories / P / C / F / fiber (and micronutrients when present).

### What counts on the diary / dashboard

Only **coach-approved** meals for the calendar day contribute to consumed macros, calories, and health score. Approved totals prefer coach `totalNutrition` / reviewed items when present.

---

## 10. Daily health score

Components are each clamped to **0–100**.

### Ratio score (calories & macros & nutrients)

\[
r = \frac{\mathrm{actual}}{\mathrm{target}}
\]

- If \(r \le 1\): score \(= 100\,r\)  
- If \(r > 1\): score \(= 100 - 35\,(r - 1)\) (overshoot penalty), then clamp  

### Nutrient adequacy (30% of total)

- Always scores **fiber** vs fiber target.  
- Also scores these micros **when present** on meal items:

| Key | Daily target |
|-----|----------------|
| `ironMg` | 18 |
| `vitaminCMg` | 90 |
| `calciumMg` | 1000 |
| `vitaminDIu` | 600 |
| `potassiumMg` | 3500 |

Average of available part scores → `measuredScore`.  
Coverage \(d = \mathrm{available}/6\) (fiber + 5 micros).

\[
\mathrm{nutrientScore} = \mathrm{measuredScore} \times (0.5 + 0.5\,d)
\]

(Missing micros cannot look like perfect adequacy.)

### Macro score (25%)

Average of protein, carbs, fat ratio scores vs targets.

### Calorie score (20%)

Ratio score of consumed vs calorie target.

### Consistency (15%)

\[
\mathrm{consistency} = \min\left(100,\ \frac{N_{\mathrm{approved\ meals\ today}}}{\max(1,\ \mathrm{mealsPerDay})} \times 100\right)
\]

### Variety (10%)

Distinct food labels today (else distinct meal names), target **5**:

\[
\mathrm{variety} = \min\left(100,\ \frac{\mathrm{distinct}}{5} \times 100\right)
\]

### Combined score

\[
\begin{aligned}
\mathrm{healthScore} =\ &\mathrm{round}(
  0.30\,\mathrm{nutrient}
  + 0.25\,\mathrm{macro}
  + 0.20\,\mathrm{calorie} \\
  &\quad + 0.15\,\mathrm{consistency}
  + 0.10\,\mathrm{variety}
)
\end{aligned}
\]

---

## 11. Client preview vs server (important)

| | Mobile onboarding preview | Server NCE (stored) |
|--|---------------------------|---------------------|
| Goal adjustment | Applied immediately (−500 / +300 defaults) | Only after coach **confirm** |
| Calorie floor | `max(1200, TDEE + adj)` | `max(0, TDEE + adj)` |
| Pregnancy / lactation / Schofield | Not in mobile util | Full NCE paths |
| Pace (slow/mod/aggressive) | Not in mobile util | Full NCE table |

UI copy should treat onboarding numbers as **estimates** until coach confirmation when clinical workflow is active.

---

## 12. Example (confirmed healthy adult male)

Input: 30 y, male, 180 cm, 80 kg, moderately active, maintain, confirmed.

\[
\begin{aligned}
\mathrm{BMR} &= 10(80) + 6.25(180) - 5(30) + 5 = 1780 \\
\mathrm{TDEE} &= 1780 \times 1.55 = 2759 \\
C &= 2759 \\
P &= \mathrm{round}(1.6 \times 80) = 128\ \mathrm{g} \\
F &= \mathrm{round}(2759 \times 0.28 / 9) = 86\ \mathrm{g} \\
\mathrm{carbs} &= \mathrm{round}((2759 - 128\cdot4 - 86\cdot9)/4) = 362\ \mathrm{g} \\
\mathrm{fiber} &= 38\ \mathrm{g} \\
\mathrm{water} &= \mathrm{round}(80 \times 35) = 2800\ \mathrm{ml} \\
\mathrm{BMI} &= 24.7
\end{aligned}
\]

(Matches `nutrition-calculation-engine.test.ts`.)

---

## 13. Code map

| Concern | File |
|---------|------|
| BMR / TDEE / macros / water / flags | `server/.../nutrition-calculation-engine.ts` |
| Merge coach + patient → calculate | `server/.../profile-targets.util.ts` |
| Dashboard consumed + health score | `server/.../dashboard.util.ts` |
| Micronutrient adequacy | `server/.../nutrient-score.util.ts` |
| Portion scale / meal sum | `server/.../meals/nutrition.util.ts` |
| Onboarding preview only | `mobile/src/utils/nutrition.ts` |
| High-level clinical policy | `docs/clinical-nutrition-engine.md` |

---

## Disclaimer

These formulas support educational coaching and logging. MiraFood is **not** a medical device and does not replace individualized clinical nutrition care. Protected populations and high-risk conditions require coach review before targets are treated as confirmed.
