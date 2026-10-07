import {
  computeBalancedPlateScore,
  estimateRangeFromMid,
  mealTypeSupportsBalancedPlate,
  resolveBalancedPlateForMeal,
} from "./balanced-plate";

describe("balanced-plate contracts", () => {
  it("scores the prototype best plate near Balanced", () => {
    // sambaza 100 pr, ugali 150 st, dodo 120 vf, avocado 50 vf
    const score = computeBalancedPlateScore([
      { estimatedWeightG: 100, plateGroup: "pr" },
      { estimatedWeightG: 150, plateGroup: "st" },
      { estimatedWeightG: 120, plateGroup: "vf" },
      { estimatedWeightG: 50, plateGroup: "vf" },
    ]);
    expect(score).not.toBeNull();
    expect(score!.score).toBeGreaterThanOrEqual(70);
    expect(score!.shares.vf).toBeCloseTo(170 / 420, 5);
    expect(score!.shares.pr).toBeCloseTo(100 / 420, 5);
    expect(score!.shares.st).toBeCloseTo(150 / 420, 5);
  });

  it("returns null when nothing is grouped", () => {
    expect(
      computeBalancedPlateScore([
        { estimatedWeightG: 200, plateGroup: "other" },
        { estimatedWeightG: 100, plateGroup: null },
      ]),
    ).toBeNull();
  });

  it("only scores lunch and dinner", () => {
    const items = [
      { estimatedWeightG: 200, plateGroup: "vf" as const },
      { estimatedWeightG: 100, plateGroup: "pr" as const },
      { estimatedWeightG: 100, plateGroup: "st" as const },
    ];
    expect(mealTypeSupportsBalancedPlate("breakfast")).toBe(false);
    expect(mealTypeSupportsBalancedPlate("Lunch")).toBe(true);
    expect(resolveBalancedPlateForMeal({ mealType: "snack", items })).toBeNull();
    expect(resolveBalancedPlateForMeal({ mealType: "dinner", items })).not.toBeNull();
  });

  it("builds photo ±15% estimate ranges", () => {
    const range = estimateRangeFromMid(1000, "photo");
    expect(range).toEqual({
      midKcal: 1000,
      lowKcal: 850,
      highKcal: 1150,
      pct: 0.15,
      source: "photo",
    });
  });

  it("treats barcode as exact", () => {
    const range = estimateRangeFromMid(420, "barcode");
    expect(range.pct).toBe(0);
    expect(range.lowKcal).toBe(420);
    expect(range.highKcal).toBe(420);
  });

  it("tips when starch is too high", () => {
    // vf≥40% and pr≥18% so tip priority reaches the starch branch
    const score = computeBalancedPlateScore([
      { estimatedWeightG: 240, plateGroup: "vf" },
      { estimatedWeightG: 120, plateGroup: "pr" },
      { estimatedWeightG: 240, plateGroup: "st" },
    ]);
    expect(score?.tip).toMatch(/ugali|quarter/i);
    expect(score?.label).not.toBe("Balanced");
  });
});
