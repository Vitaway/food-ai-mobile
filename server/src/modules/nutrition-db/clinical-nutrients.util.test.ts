import {
  atwaterEnergyCheck,
  nutrientCompleteness,
  displayApprovalStatus,
} from "./clinical-nutrients.util";

describe("clinical-nutrients.util", () => {
  it("flags Atwater mismatch like the prototype cassava example", () => {
    const check = atwaterEnergyCheck({
      energyKcal: 37,
      proteinG: 6.9,
      carbG: 4.2,
      fatG: 1.1,
    });
    expect(check).not.toBeNull();
    expect(check!.calculated).toBeCloseTo(54.3, 0);
    expect(check!.deltaPct).toBeGreaterThan(40);
  });

  it("counts filled vs unknown nutrients", () => {
    const c = nutrientCompleteness(
      { energy_kcal: 37, protein_g: 6.9, sodium_mg: 9 },
      ["sugar_g", "fasat_g"],
    );
    expect(c.filled).toBe(3);
    expect(c.unknown).toBe(2);
    expect(c.total).toBe(15);
  });

  it("maps approval to display chips", () => {
    expect(displayApprovalStatus("draft", false)).toBe("Draft");
    expect(displayApprovalStatus("pending", false)).toBe("Pending");
    expect(displayApprovalStatus("approved", true)).toBe("Verified");
    expect(displayApprovalStatus("approved", false)).toBe("Archived");
  });
});
