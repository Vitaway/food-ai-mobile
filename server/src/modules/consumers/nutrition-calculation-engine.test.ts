import { calculateNutritionTargets, type NutritionCalculationInput } from "./nutrition-calculation-engine";

const NOW = new Date("2026-07-18T00:00:00.000Z");

const adult: NutritionCalculationInput = {
  age: 30,
  sex: "male",
  heightCm: 180,
  weightKg: 80,
  activityLevel: "moderately_active",
  goal: "maintain",
  assessmentStatus: "confirmed",
};

describe("calculateNutritionTargets", () => {
  it("uses Mifflin-St Jeor and activity multiplier for a confirmed healthy adult", () => {
    const result = calculateNutritionTargets(adult, NOW);

    expect(result.bmr).toBe(1780);
    expect(result.tdee).toBe(2759);
    expect(result.calorieTarget).toBe(2759);
    expect(result.population).toBe("adult");
    expect(result.equationUsed).toBe("mifflin_st_jeor_male");
    expect(result.targetStatus).toBe("confirmed");
  });

  it("keeps patient-only targets at maintenance until the coach confirms", () => {
    const result = calculateNutritionTargets(
      { ...adult, goal: "lose_weight", goalPace: "aggressive", assessmentStatus: "incomplete" },
      NOW,
    );

    expect(result.goalAdjustmentKcal).toBe(0);
    expect(result.calorieTarget).toBe(result.tdee);
    expect(result.targetStatus).toBe("provisional");
  });

  it("maps confirmed weight-loss pace into the NCE deficit range", () => {
    const result = calculateNutritionTargets(
      { ...adult, goal: "lose_weight", goalPace: "aggressive" },
      NOW,
    );

    expect(result.goalAdjustmentKcal).toBe(-750);
    expect(result.calorieTarget).toBe(result.tdee - 750);
  });

  it("adds singleton trimester calories from pre-pregnancy weight", () => {
    const result = calculateNutritionTargets(
      {
        ...adult,
        sex: "female",
        pregnant: true,
        trimester: 2,
        numberOfBabies: 1,
        prePregnancyWeightKg: 65,
      },
      NOW,
    );

    // Female BMR: 1464; 1464 * 1.55 + 340 = 2609.2
    expect(result.bmr).toBe(1464);
    expect(result.tdee).toBe(2609);
    expect(result.population).toBe("pregnant_singleton");
  });

  it("blocks automatic pregnancy weight-loss deficits", () => {
    const result = calculateNutritionTargets(
      {
        ...adult,
        sex: "female",
        goal: "lose_weight",
        pregnant: true,
        trimester: 3,
        numberOfBabies: 1,
        prePregnancyWeightKg: 65,
      },
      NOW,
    );

    expect(result.goalAdjustmentKcal).toBe(0);
    expect(result.safetyFlags).toContain("automatic_weight_loss_blocked");
  });

  it("adds 500 kcal for lactation and blocks automatic loss", () => {
    const result = calculateNutritionTargets(
      { ...adult, sex: "female", goal: "lose_weight", lactating: true },
      NOW,
    );

    expect(result.tdee).toBe(Math.round(result.bmr * 1.55 + 500));
    expect(result.goalAdjustmentKcal).toBe(0);
    expect(result.population).toBe("lactating");
  });

  it("uses Schofield for pediatric users and remains provisional", () => {
    const result = calculateNutritionTargets(
      { ...adult, age: 14, sex: "female", weightKg: 50, goal: "lose_weight" },
      NOW,
    );

    expect(result.bmr).toBe(1362);
    expect(result.tdee).toBe(result.bmr);
    expect(result.goalAdjustmentKcal).toBe(0);
    expect(result.targetStatus).toBe("provisional");
    expect(result.safetyFlags).toContain("pediatric_review_required");
  });

  it("flags high-BMI and clinical-condition targets for confirmation", () => {
    const result = calculateNutritionTargets(
      {
        ...adult,
        weightKg: 150,
        heightCm: 170,
        conditions: ["Kidney Disease"],
        fluidRestriction: true,
      },
      NOW,
    );

    expect(result.bmi).toBeGreaterThan(40);
    expect(result.targetStatus).toBe("provisional");
    expect(result.safetyFlags).toEqual(
      expect.arrayContaining([
        "bmi_over_40_coach_review",
        "condition_kidney_disease",
        "hydration_requires_clinical_review",
      ]),
    );
  });
});
