/** Shared clinical-assessment cleanup — strip inapplicable pregnancy/condition fields. */

export type ClinicalAssessmentLike = Record<string, unknown>;

function conditionKey(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function ageFromDateOfBirth(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const birthDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

export function sanitizeClinicalAssessmentData(
  data: ClinicalAssessmentLike,
): ClinicalAssessmentLike {
  const next: ClinicalAssessmentLike = { ...data };
  const sex = next.verifiedSex;
  const age =
    ageFromDateOfBirth(next.verifiedDateOfBirth) ??
    (typeof next.verifiedAge === "number" ? next.verifiedAge : null);
  const isFemaleAdult = sex === "female" && (age == null || age >= 18);

  if (!isFemaleAdult) {
    next.pregnant = false;
    next.lactating = false;
    next.trimester = null;
    next.numberOfBabies = null;
    next.prePregnancyWeightKg = null;
  } else if (next.pregnant === true) {
    next.lactating = false;
  } else {
    next.trimester = null;
    next.numberOfBabies = null;
    next.prePregnancyWeightKg = null;
  }

  const conditions = Array.isArray(next.conditions)
    ? next.conditions.filter((c): c is string => typeof c === "string")
    : [];
  const details =
    typeof next.conditionDetails === "object" && next.conditionDetails !== null
      ? { ...(next.conditionDetails as Record<string, unknown>) }
      : {};
  const allowed = new Set(conditions.map(conditionKey));
  for (const key of Object.keys(details)) {
    if (!allowed.has(key)) delete details[key];
  }
  next.conditions = conditions;
  next.conditionDetails = details;

  if (!conditions.includes("Kidney Disease")) {
    next.fluidRestriction = false;
  }

  return next;
}
