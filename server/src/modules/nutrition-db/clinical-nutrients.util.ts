/** Curated 15-nutrient panel aligned with the coach nutrition DB prototype (TFCT keys). */
export const CLINICAL_NUTRIENT_PANEL = [
  { key: "energy_kcal", label: "Energy", unit: "kcal", camel: "caloriesKcal" },
  { key: "protein_g", label: "Protein", unit: "g", camel: "proteinG" },
  { key: "carb_g", label: "Carbs", unit: "g", camel: "carbsG" },
  { key: "sugar_g", label: "Sugars", unit: "g", camel: "sugarG" },
  { key: "fat_g", label: "Fat", unit: "g", camel: "fatG" },
  { key: "fasat_g", label: "Saturated", unit: "g", camel: "saturatedFatG" },
  { key: "fiber_g", label: "Fibre", unit: "g", camel: "fiberG" },
  { key: "sodium_mg", label: "Sodium", unit: "mg", camel: "sodiumMg" },
  { key: "potassium_mg", label: "Potassium", unit: "mg", camel: "potassiumMg" },
  { key: "iron_mg", label: "Iron", unit: "mg", camel: "ironMg" },
  { key: "calcium_mg", label: "Calcium", unit: "mg", camel: "calciumMg" },
  { key: "zinc_mg", label: "Zinc", unit: "mg", camel: "zincMg" },
  { key: "vitamin_a_ug", label: "Vitamin A", unit: "mcg", camel: "vitaminAMcg" },
  { key: "vitamin_c_mg", label: "Vitamin C", unit: "mg", camel: "vitaminCMg" },
  { key: "folate_ug", label: "Folate", unit: "mcg", camel: "folateUg" },
] as const;

export type ClinicalNutrientKey = (typeof CLINICAL_NUTRIENT_PANEL)[number]["key"];

export const FOOD_ALLERGENS = ["Peanut", "Dairy", "Egg", "Fish", "Soy", "Gluten"] as const;

export const PREPARATION_STATES = [
  "Raw",
  "Raw, peeled",
  "Boiled",
  "Dry",
  "Flour",
  "Oil",
  "Baked",
  "Granulated",
  "Liquid",
] as const;

export type ApprovalStatus = "draft" | "pending" | "approved" | "rejected";

/** Atwater: 4P + 4C + 9F vs declared kcal. Returns percent delta (positive = calculated higher). */
export function atwaterEnergyCheck(opts: {
  energyKcal?: number | null;
  proteinG?: number | null;
  carbG?: number | null;
  fatG?: number | null;
}): { declared: number; calculated: number; deltaPct: number } | null {
  const { energyKcal, proteinG, carbG, fatG } = opts;
  if (
    energyKcal == null ||
    proteinG == null ||
    carbG == null ||
    fatG == null ||
    !Number.isFinite(energyKcal) ||
    energyKcal <= 0
  ) {
    return null;
  }
  const calculated = proteinG * 4 + carbG * 4 + fatG * 9;
  const deltaPct = ((calculated - energyKcal) / energyKcal) * 100;
  return { declared: energyKcal, calculated, deltaPct };
}

export function nutrientCompleteness(
  composition: Record<string, number | null | undefined> | null | undefined,
  nutrientsUnknown: string[] = [],
): { filled: number; total: number; unknown: number } {
  const unknown = new Set(nutrientsUnknown);
  let filled = 0;
  let unknownCount = 0;
  for (const { key } of CLINICAL_NUTRIENT_PANEL) {
    if (unknown.has(key)) {
      unknownCount += 1;
      continue;
    }
    const v = composition?.[key];
    if (v != null && Number.isFinite(Number(v))) filled += 1;
  }
  return { filled, total: CLINICAL_NUTRIENT_PANEL.length, unknown: unknownCount };
}

/** Read a clinical key from composition (snake or legacy camel). */
export function readClinicalNutrient(
  composition: Record<string, number> | null | undefined,
  key: ClinicalNutrientKey,
): number | null {
  if (!composition) return null;
  const panel = CLINICAL_NUTRIENT_PANEL.find((n) => n.key === key);
  const raw = composition[key] ?? (panel ? composition[panel.camel] : undefined);
  if (raw == null || !Number.isFinite(Number(raw))) return null;
  return Number(raw);
}

export function displayApprovalStatus(
  approvalStatus: string | null | undefined,
  isActive: boolean,
): "Draft" | "Pending" | "Verified" | "Rejected" | "Archived" {
  if (!isActive && approvalStatus === "approved") return "Archived";
  if (approvalStatus === "draft") return "Draft";
  if (approvalStatus === "pending") return "Pending";
  if (approvalStatus === "rejected") return "Rejected";
  if (approvalStatus === "approved") return "Verified";
  return "Draft";
}
