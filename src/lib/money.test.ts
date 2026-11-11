import { describe, expect, it } from "vitest";
import { centsToInput, formatPrice, parseAmountToCents } from "./money";

describe("formatPrice", () => {
  it("drops .00 from whole dollars only", () => {
    expect(formatPrice(12000)).toBe("$120");
    expect(formatPrice(25)).toBe("$0.25");
    expect(formatPrice(150050)).toBe("$1,500.50");
  });

  it("puts the symbol after the number in Khmer", () => {
    expect(formatPrice(12000, "km")).toBe("120$");
  });
});

describe("parseAmountToCents", () => {
  it.each([
    ["12", 1200],
    ["12.5", 1250],
    ["12.50", 1250],
    ["0.01", 1],
    ["1,234.56", 123456],
    ["  7.10 ", 710],
  ])("parses %j as %i cents", (input, expected) => {
    expect(parseAmountToCents(input)).toBe(expected);
  });

  it("avoids floating point errors", () => {
    // 0.1 + 0.2 !== 0.3 in floats; string parsing never goes through floats
    expect(parseAmountToCents("0.29")).toBe(29);
    expect(parseAmountToCents("1.15")).toBe(115);
    expect(parseAmountToCents("19.99")).toBe(1999);
  });

  it.each(["", "abc", "12.345", "-5", "1e3", ".5", "12.", "1.2.3"])("rejects %j", (input) => {
    expect(parseAmountToCents(input)).toBeNull();
  });
});

describe("centsToInput", () => {
  it.each([
    [1250, "12.50"],
    [5, "0.05"],
    [100, "1.00"],
    [123456, "1234.56"],
  ])("formats %i as %s", (cents, expected) => {
    expect(centsToInput(cents)).toBe(expected);
  });

  it("round-trips with parseAmountToCents", () => {
    for (const cents of [1, 99, 100, 1999, 123456789]) {
      expect(parseAmountToCents(centsToInput(cents))).toBe(cents);
    }
  });
});
