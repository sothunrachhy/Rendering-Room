import { describe, expect, it } from "vitest";
import {
  detectImageType,
  estimateMonthlyCost,
  formatDistance,
  parseSearchFilters,
  SEARCH_DEFAULTS,
  searchQuery,
  searchWasAdjusted,
  textLanguage,
  MAX_DISTANCE,
} from "./rooms";

describe("parseSearchFilters", () => {
  it("uses defaults for an empty URL", () => {
    expect(parseSearchFilters({})).toEqual({
      ...SEARCH_DEFAULTS,
      type: null,
      gender: null,
      facilities: [],
    });
  });

  it("reads valid values", () => {
    expect(
      parseSearchFilters({
        campus: "itc",
        budget: "120",
        distance: "2",
        type: "STUDIO",
        gender: "FEMALE",
        facilities: "wifi,aircon,wifi",
        sort: "price",
      }),
    ).toEqual({
      campus: "itc",
      budget: 120,
      distance: 2,
      type: "STUDIO",
      gender: "FEMALE",
      facilities: ["wifi", "aircon"],
      sort: "price",
    });
  });

  it("ignores invalid values", () => {
    const filters = parseSearchFilters({
      campus: "../etc",
      budget: "-5",
      distance: "abc",
      type: "CASTLE",
      facilities: "wifi,pool",
      sort: "random",
    });
    expect(filters.campus).toBe("rupp");
    expect(filters.budget).toBe(150);
    expect(filters.distance).toBe(3);
    expect(filters.type).toBeNull();
    expect(filters.facilities).toEqual(["wifi"]);
    expect(filters.sort).toBe("score");
  });

  it("caps the distance at the largest choice offered (QA-08)", () => {
    expect(parseSearchFilters({ distance: "999" }).distance).toBe(MAX_DISTANCE);
    expect(MAX_DISTANCE).toBe(12);
    expect(parseSearchFilters({ distance: "8" }).distance).toBe(8);
  });

  it("round-trips through searchQuery", () => {
    const filters = parseSearchFilters({ campus: "num", budget: "90", facilities: "cctv" });
    const params = Object.fromEntries(new URLSearchParams(searchQuery(filters)));
    expect(parseSearchFilters(params)).toEqual(filters);
  });
});

describe("searchWasAdjusted", () => {
  const check = (params: Record<string, string>) =>
    searchWasAdjusted(params, parseSearchFilters(params));

  it("is false for a valid search, including the form's Any choices", () => {
    expect(check({ campus: "rupp", budget: "120", distance: "3", type: "any", gender: "" })).toBe(
      false,
    );
    expect(check({})).toBe(false);
  });

  it("is true when values were replaced", () => {
    expect(check({ budget: "abc" })).toBe(true);
    expect(check({ budget: "-50" })).toBe(true);
    expect(check({ budget: "5000" })).toBe(true);
    expect(check({ distance: "999" })).toBe(true);
    expect(check({ facilities: "wifi,pool" })).toBe(true);
  });

  it("is true for an unknown campus the page swapped for the default", () => {
    const params = { campus: "xyz" };
    expect(searchWasAdjusted(params, { ...parseSearchFilters(params), campus: "rupp" })).toBe(true);
  });
});

describe("estimateMonthlyCost", () => {
  it("adds typical utilities and fees to the rent", () => {
    // $0.25/kWh × 80 kWh = $20, $0.50/m³ × 4 m³ = $2, plus $5 fees
    expect(
      estimateMonthlyCost({
        rentCents: 10000,
        electricityCentsPerKwh: 25,
        waterCentsPerM3: 50,
        otherFeesCents: 500,
      }),
    ).toEqual({ rent: 10000, electricity: 2000, water: 200, other: 500, total: 12700 });
  });

  it("treats missing utility prices as included", () => {
    expect(
      estimateMonthlyCost({
        rentCents: 8000,
        electricityCentsPerKwh: null,
        waterCentsPerM3: null,
        otherFeesCents: 0,
      }).total,
    ).toBe(8000);
  });
});

describe("formatDistance", () => {
  it("uses metres under 1 km", () => {
    expect(formatDistance(0.654)).toBe("650 m");
    expect(formatDistance(1.234)).toBe("1.2 km");
  });

  it("uses Khmer units on Khmer pages", () => {
    expect(formatDistance(0.654, "km")).toBe("650 ម");
    expect(formatDistance(1.234, "km")).toBe("1.2 គ.ម");
  });
});

describe("detectImageType", () => {
  it("recognises JPEG, PNG and WebP by their first bytes", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d]))).toBe("image/png");
    const webp = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
    expect(detectImageType(webp)).toBe("image/webp");
  });

  it("rejects anything else", () => {
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("%PDF-1.7"))).toBeNull();
  });
});

describe("textLanguage", () => {
  it("spots Khmer script", () => {
    expect(textLanguage("បន្ទប់ជួលនៅជិត RUPP")).toBe("km");
    expect(textLanguage("Bright room near RUPP")).toBe("en");
  });
});
