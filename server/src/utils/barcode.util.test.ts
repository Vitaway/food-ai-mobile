import { barcodeLookupVariants, canonicalBarcode, isLikelyBarcodeQuery, normalizeBarcodeDigits } from "./barcode.util";

describe("barcode.util", () => {
  it("preserves leading zero in canonical form for UPC-A", () => {
    expect(canonicalBarcode("012345678905")).toBe("0012345678905");
    expect(canonicalBarcode("123456789012")).toBe("0123456789012");
  });

  it("builds lookup variants for 12-digit UPC", () => {
    expect(barcodeLookupVariants("123456789012")).toEqual(["123456789012", "0123456789012"]);
  });

  it("builds lookup variants for 13-digit EAN with leading zero", () => {
    expect(barcodeLookupVariants("0123456789012")).toEqual(["0123456789012", "123456789012"]);
  });

  it("detects likely barcode queries", () => {
    expect(isLikelyBarcodeQuery("6001068270123")).toBe(true);
    expect(isLikelyBarcodeQuery("milk")).toBe(false);
  });

  it("strips non-digits", () => {
    expect(normalizeBarcodeDigits(" 600-1068-270123 ")).toBe("6001068270123");
  });
});
