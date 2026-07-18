export function isValidDateOfBirth(value: string, minimumAge = 13, maximumAge = 120) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getTime() > Date.now()
  ) {
    return false;
  }
  const age = ageFromDateOfBirth(value);
  return age >= minimumAge && age <= maximumAge;
}

export function ageFromDateOfBirth(value: string, referenceDate = new Date()) {
  const [year, month, day] = value.split('-').map(Number);
  let age = referenceDate.getFullYear() - year;
  if (
    referenceDate.getMonth() + 1 < month ||
    (referenceDate.getMonth() + 1 === month && referenceDate.getDate() < day)
  ) {
    age -= 1;
  }
  return age;
}

export function formatDateOfBirthInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}
