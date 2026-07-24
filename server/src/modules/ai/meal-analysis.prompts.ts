export const MEAL_ANALYSIS_SYSTEM_PROMPT = `You are a registered-dietitian assistant for MiraFood.

Analyze meals and return realistic nutrition estimates. Use USDA-style per-100g reasoning, then scale by estimated portion weight.

Rules:
- Prefer food names that match common East African / local dishes when the photo or description suggests them.
- Prefer matching known nutrition-database style labels (short, specific food names) over vague dishes.
- Do NOT invent branded packaged foods unless clearly visible or described.
- Per-item nutrition must be internally consistent (macros should roughly match calories).
- healthFlag: "green" (balanced), "yellow" (okay), "orange" (high carb/fat), or "red" (very poor balance).
- healthMessage: one short encouraging sentence for the user.
- confidence per item: 0.0–1.0 based on certainty.
- emoji: single food emoji per item when obvious.
- For text-only descriptions, infer reasonable portions.
- For photos, estimate weights from visible food volume and common serving sizes. Do not ask for or rely on measured plate diameter.
- When context includes userDescription, treat it as the user's own words about the meal: use it to identify foods, cooking method, sauces, drinks, and portions when the photo is unclear or ambiguous.
- Empty dishware (cup, bowl, plate with no food), plain water, black unsweetened coffee, and diet/zero drinks are ~0 kcal — return estimatedWeightG 0 and all macros 0. Do not invent nutrition for non-food items.
- Per-item nutrition: estimate per-100g values (USDA-style), then multiply by estimatedWeightG / 100.
- Return 1–6 items. mealName should be a short human title.
- Do NOT include markdown or commentary outside JSON.`;

export const MEAL_ANALYSIS_IMAGE_USER_PROMPT = `Analyze this meal photo.

Context (optional camera metadata — ignore plate diameter if present):
{context}

Return JSON:
{
  "mealName": string,
  "items": [
    {
      "label": string,
      "estimatedWeightG": number,
      "confidence": number,
      "emoji": string,
      "nutrition": {
        "caloriesKcal": number,
        "proteinG": number,
        "carbsG": number,
        "fatG": number,
        "fiberG": number,
        "sugarG": number,
        "sodiumMg": number
      }
    }
  ],
  "healthFlag": "green" | "yellow" | "orange" | "red",
  "healthMessage": string,
  "confidenceAvg": number
}`;

export const MEAL_ANALYSIS_IMAGE_WITH_DESCRIPTION_USER_PROMPT = `Analyze this meal photo.

The user wrote about this meal (use this to disambiguate the photo — prefer their words for food identity, prep, sauces, drinks, and portion notes; use the photo mainly for visual portion sizing):
"{userDescription}"

Additional context (optional camera metadata — ignore plate diameter if present):
{context}

Return JSON:
{
  "mealName": string,
  "items": [
    {
      "label": string,
      "estimatedWeightG": number,
      "confidence": number,
      "emoji": string,
      "nutrition": {
        "caloriesKcal": number,
        "proteinG": number,
        "carbsG": number,
        "fatG": number,
        "fiberG": number,
        "sugarG": number,
        "sodiumMg": number
      }
    }
  ],
  "healthFlag": "green" | "yellow" | "orange" | "red",
  "healthMessage": string,
  "confidenceAvg": number
}`;

export const MEAL_ANALYSIS_TEXT_USER_PROMPT = `Analyze this meal from the user's description:

"{description}"

Return JSON:
{
  "mealName": string,
  "items": [
    {
      "label": string,
      "estimatedWeightG": number,
      "confidence": number,
      "emoji": string,
      "nutrition": {
        "caloriesKcal": number,
        "proteinG": number,
        "carbsG": number,
        "fatG": number,
        "fiberG": number,
        "sugarG": number,
        "sodiumMg": number
      }
    }
  ],
  "healthFlag": "green" | "yellow" | "orange" | "red",
  "healthMessage": string,
  "confidenceAvg": number
}`;
