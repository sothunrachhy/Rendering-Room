import { describe, expect, it } from "vitest";
import { internationalPhone, telegramLink } from "./contact";

describe("internationalPhone", () => {
  it("turns local and international Cambodian numbers into +855 form", () => {
    expect(internationalPhone("012345678")).toBe("+85512345678");
    expect(internationalPhone("012 345 678")).toBe("+85512345678");
    expect(internationalPhone("0961234567")).toBe("+855961234567");
    expect(internationalPhone("+85512345678")).toBe("+85512345678");
    expect(internationalPhone("85512345678")).toBe("+85512345678");
  });

  it("rejects anything else", () => {
    expect(internationalPhone("")).toBeNull();
    expect(internationalPhone("12345")).toBeNull();
    expect(internationalPhone("+6612345678")).toBeNull();
  });
});

describe("telegramLink", () => {
  it("opens a Telegram chat by phone number", () => {
    expect(telegramLink("012 345 678")).toBe("https://t.me/+85512345678");
    expect(telegramLink("not a phone")).toBeNull();
  });
});
