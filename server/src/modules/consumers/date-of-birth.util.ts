const DATE_OF_BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateOfBirth(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_OF_BIRTH_RE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day &&
    parsed.getTime() <= Date.now()
  );
}

export function ageFromDateOfBirth(dateOfBirth: string, referenceDate = new Date()): number {
  if (!isValidDateOfBirth(dateOfBirth)) {
    throw new Error("Invalid date of birth");
  }
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  let age = referenceDate.getUTCFullYear() - year;
  const birthdayHasPassed =
    referenceDate.getUTCMonth() + 1 > month ||
    (referenceDate.getUTCMonth() + 1 === month && referenceDate.getUTCDate() >= day);
  if (!birthdayHasPassed) age -= 1;
  return age;
}
