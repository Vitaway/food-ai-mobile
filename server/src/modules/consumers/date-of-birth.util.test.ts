import { ageFromDateOfBirth, isValidDateOfBirth } from "./date-of-birth.util";

describe("date of birth", () => {
  it("calculates age based on whether the birthday has passed", () => {
    const reference = new Date("2026-07-18T12:00:00.000Z");
    expect(ageFromDateOfBirth("2000-07-18", reference)).toBe(26);
    expect(ageFromDateOfBirth("2000-07-19", reference)).toBe(25);
  });

  it("rejects impossible and future dates", () => {
    expect(isValidDateOfBirth("2020-02-30")).toBe(false);
    expect(isValidDateOfBirth("2999-01-01")).toBe(false);
    expect(isValidDateOfBirth("18/07/2000")).toBe(false);
  });
});
