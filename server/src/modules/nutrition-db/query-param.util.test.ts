import { parseCsvQueryParam } from "./query-param.util";

describe("parseCsvQueryParam", () => {
  it("returns undefined for empty input", () => {
    expect(parseCsvQueryParam(undefined)).toBeUndefined();
    expect(parseCsvQueryParam(null)).toBeUndefined();
    expect(parseCsvQueryParam("")).toBeUndefined();
    expect(parseCsvQueryParam("   ")).toBeUndefined();
  });

  it("parses a single CSV value used by FoodDbPicker excludeRecipes", () => {
    expect(parseCsvQueryParam("recipe")).toEqual(["recipe"]);
  });

  it("parses comma-separated values", () => {
    expect(parseCsvQueryParam("recipe,custom_local")).toEqual(["recipe", "custom_local"]);
    expect(parseCsvQueryParam(" recipe , tfct ")).toEqual(["recipe", "tfct"]);
  });

  it("also accepts a JSON array string", () => {
    expect(parseCsvQueryParam('["recipe"]')).toEqual(["recipe"]);
    expect(parseCsvQueryParam('["recipe","tfct"]')).toEqual(["recipe", "tfct"]);
  });
});
