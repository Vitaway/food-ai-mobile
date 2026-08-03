import { CLINICAL_NUTRIENT_PANEL } from "./clinical-nutrients.util";

/** Mirrors mergeClinicalComposition in nutrition-db.service (kept local for unit test). */
function mergeClinicalComposition(
  existing: Record<string, number>,
  incoming: Record<string, number>,
  nutrientsUnknown?: string[],
): Record<string, number> {
  const clinicalKeys = CLINICAL_NUTRIENT_PANEL.map((n) => n.key) as string[];
  const next = { ...existing };
  for (const key of clinicalKeys) delete next[key];
  Object.assign(next, incoming);
  for (const key of nutrientsUnknown ?? []) delete next[key];
  return next;
}

describe("mergeClinicalComposition", () => {
  it("clears previous clinical values that were not re-sent", () => {
    const merged = mergeClinicalComposition(
      { energy_kcal: 37, sodium_mg: 9, phytate_mg: 12 },
      { energy_kcal: 40, protein_g: 6 },
      [],
    );
    expect(merged.energy_kcal).toBe(40);
    expect(merged.protein_g).toBe(6);
    expect(merged.sodium_mg).toBeUndefined();
    expect(merged.phytate_mg).toBe(12); // non-clinical key preserved
  });

  it("strips unknown keys even if still in incoming", () => {
    const merged = mergeClinicalComposition(
      {},
      { energy_kcal: 37, sodium_mg: 9 },
      ["sodium_mg"],
    );
    expect(merged.energy_kcal).toBe(37);
    expect(merged.sodium_mg).toBeUndefined();
  });
});
