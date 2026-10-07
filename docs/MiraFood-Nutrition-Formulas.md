# Calories, macros & targets
How MiraFood calculates nutrition goals and scores meals

This guide explains, in plain language, the formulas MiraFood uses when a patient onboards, when a coach confirms an assessment, and when the diary or dashboard scores the day.

All rules below come from the current server nutrition calculation engine (`NCE_VERSION` = `2026-07-clinical-v1`). Mobile/web may show provisional previews during onboarding; **stored clinical targets always come from the server**.

---

## 1. What the patient enters

| Field | Used for |
|--------|----------|
| Date of birth → age | BMR age term; pediatric vs adult path |
| Sex | Mifflin / Schofield sex constants |
| Height (cm), weight (kg) | BMR, BMI, protein, water |
| Activity level | TDEE multiplier (adults / pregnancy / lactation) |
| Goal (+ optional pace) | Calorie surplus/deficit **after coach confirmation** |
| Meals per day | Consistency part of the health score |
| Preferences / allergies | Not used in calorie or macro math |

### Coach assessment (overrides)

When present, coach-verified values override patient basics:

- Verified age/sex/height/weight  
- Pregnancy / trimester / number of babies / pre-pregnancy weight  
- Lactation  
- Conditions, fluid restriction  
- Goal pace; optional `coachAllowsProtectedWeightLoss`

### Target status

| Status | Meaning |
|--------|---------|
| Unavailable | Missing age / height / weight / activity / goal |
| Provisional | Patient complete, or clinical flags still open |
| Confirmed | Coach confirmed assessment and no blocking flags |

**Rule:** Goal deficits/surpluses apply only when status is **confirmed**. Until then, calorie target = maintenance TDEE.

---

## 2. BMI

```
BMI = weight_kg / (height_cm / 100)²
```

Stored rounded to **1 decimal**.

Flag: BMI **over 40** → `bmi_over_40_coach_review` (engine still uses actual weight in Mifflin–St Jeor).

---

## 3. BMR (basal metabolic rate)

### Adults (age 18+) — Mifflin–St Jeor

```
base = 10 × weight_kg + 6.25 × height_cm − 5 × age
```

| Sex | BMR |
|-----|-----|
| Male | base + 5 |
| Female | base − 161 |
| Other / prefer not to say / unset | Average of male and female |

Rounded to a whole number.

### Pediatrics (under 18) — Schofield (weight-based)

| Age | Boys | Girls |
|-----|------|-------|
| Under 3 | 59.512 × W − 30.4 | 58.317 × W − 31.05 |
| 3–9 | 22.706 × W + 504.3 | 20.315 × W + 485.9 |
| 10–17 | 17.686 × W + 658.2 | 13.384 × W + 692.6 |

Unknown sex → average of boy and girl.  
Pediatric **TDEE = BMR** (no activity multiplier until a validated pediatric reference is approved).

---

## 4. Activity multipliers

| Activity level | Multiplier |
|----------------|------------|
| Sedentary | 1.2 |
| Lightly active | 1.375 |
| Moderately active | 1.55 |
| Very active | 1.725 |
| Extremely active | 1.9 |

---

## 5. TDEE by population

### Healthy adult

```
TDEE = BMR × activity_multiplier
```

### Pregnancy

- BMR from Mifflin using **pre-pregnancy weight** when available (else current weight + warning).  
- Then:

```
TDEE = BMR × activity_multiplier + pregnancy_addition
```

| Case | Addition (kcal) |
|------|-----------------|
| Trimester 1 (or missing) | 0 |
| Singleton trimester 2 | +340 |
| Singleton trimester 3 | +452 |
| Twins, trimester 2 or 3 | +685 |

### Lactation

```
TDEE = BMR × activity_multiplier + 500
```

(BMR uses **current** weight.)

### Pediatric

```
TDEE = BMR (Schofield)
```

Rounded to a whole number.

---

## 6. Goal calorie adjustment

Applied **only if** coach assessment is confirmed:

### Weight loss

| Pace | Adjustment |
|------|------------|
| Slow (default) | −500 kcal |
| Moderate | −625 kcal |
| Aggressive | −750 kcal |

### Muscle gain

| Pace | Adjustment |
|------|------------|
| Slow (default) | +300 kcal |
| Moderate | +400 kcal |
| Aggressive | +500 kcal |

### Maintain / improve diet quality

Adjustment = 0.

### Protected populations

Pregnancy, lactation, and pediatric **never** get an automatic deficit unless the coach sets `coachAllowsProtectedWeightLoss`. Otherwise deficit is forced to 0 and flagged `automatic_weight_loss_blocked`.

### Calorie target

```
calorieTarget = max(0, round(TDEE + adjustment))
```

---

## 7. Macro targets

Using calorie target **C** and weight **W** (kg):

| Macro | Formula |
|-------|---------|
| Protein (g) | round(2.0 × W) if gain muscle; else round(1.6 × W) |
| Fat (g) | round((0.28 × C) / 9) ≈ 28% of calories |
| Carbs (g) | max(0, round((C − 4×protein − 9×fat) / 4)) |
| Fiber (g/day) | 38 male; 25 female / other / unset |

Energy check: C ≈ 4×protein + 4×carbs + 9×fat (carbs absorb rounding).

---

## 8. Water target

```
waterTargetMl = round(weight_kg × 35)
```

(~35 ml per kg). Flagged for clinical review if fluid restriction / kidney / heart disease; never overrides a prescribed restriction automatically.

---

## 9. Meal / portion nutrition

| Case | Rule |
|------|------|
| Scale by weight | ratio = new_g / max(old_g, 1); multiply each nutrient |
| From per-100 g | nutrient(w) = nutrient_per_100g × (w / 100) |
| Meal totals | Sum of ingredient calories / P / C / F / fiber (+ micros when present) |

**What counts on the diary:** only **coach-approved** meals for that calendar day.

---

## 10. Daily health score

Each component is 0–100.

### Ratio score (calories, macros, nutrients)

```
r = actual / target
if r ≤ 1 → score = 100 × r
if r > 1 → score = 100 − 35 × (r − 1), then clamp
```

### Weights

| Component | Weight | Notes |
|-----------|--------|--------|
| Nutrient adequacy | 30% | Fiber always; iron / vitamin C / calcium / vitamin D / potassium when present |
| Macros | 25% | Average of protein, carbs, fat ratio scores |
| Calories | 20% | Consumed vs calorie target |
| Consistency | 15% | Approved meals today ÷ meals-per-day goal |
| Variety | 10% | Distinct foods (target 5) |

Missing micronutrients cannot look like perfect adequacy (coverage factor applied).

---

## 11. Simple decision trees

### Which calorie path?

```
if age < 18 → Schofield BMR; TDEE = BMR; protected
else if pregnant → Mifflin (pre-pregnancy wt) × activity + trimester addition; protected
else if lactating → Mifflin (current wt) × activity + 500; protected
else → Mifflin × activity
```

### Apply goal adjustment?

```
if assessment not confirmed → adjustment = 0
else compute pace table
if adjustment < 0 and protected and not coach override → adjustment = 0
calorieTarget = max(0, round(TDEE + adjustment))
```

### Target status confirmed?

```
confirmed only if assessment confirmed
  AND no pediatric_review_required
  AND no missing pre-pregnancy weight / trimester
  AND sex confirmed for equation
  AND no individualized-target conditions blocking automation
else provisional
```

---

## 12. Client preview vs server (important)

| | Mobile onboarding preview | Server NCE (stored) |
|--|---------------------------|---------------------|
| Goal adjustment | Applied immediately (−500 / +300 defaults) | Only after coach **confirm** |
| Calorie floor | max(1200, TDEE + adj) | max(0, TDEE + adj) |
| Pregnancy / lactation / Schofield | Not in mobile util | Full NCE paths |
| Pace (slow/mod/aggressive) | Not in mobile util | Full NCE table |

Treat onboarding numbers as **estimates** until coach confirmation.

---

## 13. Example (confirmed healthy adult male)

Input: 30 y, male, 180 cm, 80 kg, moderately active, maintain, confirmed.

```
BMR     = 10(80) + 6.25(180) − 5(30) + 5 = 1780
TDEE    = 1780 × 1.55 = 2759
C       = 2759
Protein = round(1.6 × 80) = 128 g
Fat     = round(2759 × 0.28 / 9) = 86 g
Carbs   = round((2759 − 128×4 − 86×9) / 4) = 362 g
Fiber   = 38 g
Water   = round(80 × 35) = 2800 ml
BMI     = 24.7
```

(Matches `nutrition-calculation-engine.test.ts`.)

---

## 14. Where this lives in code

| What | File |
|------|------|
| BMR / TDEE / macros / water / flags | `server/src/modules/consumers/nutrition-calculation-engine.ts` |
| Merge coach + patient → calculate | `server/src/modules/consumers/profile-targets.util.ts` |
| Dashboard consumed + health score | `server/src/modules/consumers/dashboard.util.ts` |
| Micronutrient adequacy | `server/src/modules/consumers/nutrient-score.util.ts` |
| Portion scale / meal sum | `server/src/modules/meals/nutrition.util.ts` |
| Onboarding preview only | `mobile/src/utils/nutrition.ts` |
| Clinical policy overview | `docs/clinical-nutrition-engine.md` |

---

## Disclaimer

These formulas support educational coaching and logging. MiraFood is **not** a medical device and does not replace individualized clinical nutrition care. Protected populations and high-risk conditions require coach review before targets are treated as confirmed.

---

*Internal product reference | From current app code | NCE `2026-07-clinical-v1`*
