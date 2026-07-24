import { formatMrn } from "./patient-id";

describe("formatMrn", () => {
  it("builds MRN-YYMM#### from date and sequence", () => {
    expect(formatMrn(new Date(2026, 6, 18), 183)).toBe("MRN-26070183");
    expect(formatMrn(new Date(2026, 0, 1), 1)).toBe("MRN-26010001");
    expect(formatMrn(new Date(2025, 11, 31), 42)).toBe("MRN-25120042");
  });

  it("pads short sequences to 4 digits and grows past 9999", () => {
    expect(formatMrn(new Date(2026, 6, 1), 7)).toBe("MRN-26070007");
    expect(formatMrn(new Date(2026, 6, 1), 10000)).toBe("MRN-260710000");
  });
});
