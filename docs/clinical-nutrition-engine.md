# MiraFood clinical nutrition engine

Source of truth for patient onboarding, coach assessment, and nutrition target calculation.

## Responsibility split

- **Patient onboarding:** intent and basics only — body measurements, goal, activity, meals, preferences, allergies.
- **Coach assessment:** verifies calculation inputs and records pregnancy/lactation, diagnosed conditions, restrictions, lifestyle, and notes.
- **Server NCE:** owns BMR, TDEE, calorie, macro, water targets, formula metadata, and safety flags.

Mobile/web clients may display provisional calculations, but they cannot author clinical target values.

## Target states

- `unavailable`: required body/goal/activity inputs are missing.
- `provisional`: patient onboarding is complete, but a coach has not confirmed the clinical assessment (or pediatric reference review is required).
- `confirmed`: the coach confirmed the assessment and the server generated the targets.

Patient-only targets use maintenance TDEE. Goal deficits/surpluses apply only after coach confirmation.

## NCE rules (`2026-07-clinical-v1`)

- Healthy adult: Mifflin–St Jeor × activity multiplier.
- Weight loss: slow/moderate/aggressive = −500/−625/−750 kcal after confirmation.
- Muscle gain: slow/moderate/aggressive = +300/+400/+500 kcal after confirmation.
- Pregnancy: Mifflin TDEE using pre-pregnancy weight; T1 +0, singleton T2 +340, T3 +452, twins T2–T3 +685.
- Lactation: Mifflin TDEE using current weight +500 kcal.
- Pediatric (under 18): Schofield weight-based equation. Targets remain provisional until a validated pediatric activity reference is approved.
- Pregnancy, lactation, and pediatric calculations never receive an automatic weight-loss deficit without an explicit coach override.
- BMI over 40 and listed clinical conditions create safety flags visible to the coach.

## APIs

- `GET /api/v1/coach/clients/:id/clinical-assessment`
- `PATCH /api/v1/coach/clients/:id/clinical-assessment` — save draft and produce provisional preview
- `POST /api/v1/coach/clients/:id/clinical-assessment/confirm`
- `GET /api/v1/admin/clinical-assessments` — workflow queue

## Other calculation safeguards

- Hydration is stored as date-scoped events in `consumer_water_logs`.
- Serving profiles are normalized to grams **per one display unit** before reaching meal editors.
- Macro and micronutrient values scale together when portions change.
- Health score nutrient adequacy exposes data coverage; missing micronutrients no longer silently inflate the score.
- Dietary variety uses distinct detected foods when available, rather than meal names only.

## Verification

Server tests cover:

- Adult Mifflin–St Jeor
- Provisional maintenance behavior
- Goal pace ranges
- Pregnancy and lactation additions
- Protected-population deficit blocking
- Pediatric Schofield behavior
- High-risk safety flags
- Micronutrient data coverage
- Macro/micronutrient portion scaling
