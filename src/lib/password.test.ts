import { describe, expect, it } from "vitest";
import { isWeakPassword } from "./password";
import { minutesUntilRetry } from "./rate-limit-window";

describe("isWeakPassword", () => {
  it.each([
    "12345678",
    "password",
    "Password123",
    "qwerty123",
    "aaaaaaaa",
    "0123456789",
    "  12345678  ",
  ])("rejects %j", (password) => {
    expect(isWeakPassword(password)).toBe(true);
  });

  it.each(["correct-horse-42", "dara loves tea", "Phnom2026!", "long-enough-pw"])(
    "accepts %j",
    (password) => {
      expect(isWeakPassword(password)).toBe(false);
    },
  );
});

describe("minutesUntilRetry", () => {
  const now = new Date("2026-11-06T10:00:00Z");

  it("counts down from the oldest attempt in the window", () => {
    // Oldest attempt 5 minutes ago, 15-minute window: 10 minutes left
    expect(minutesUntilRetry(new Date("2026-11-06T09:55:00Z"), 15 * 60_000, now)).toBe(10);
  });

  it("never says 0 minutes while still blocked", () => {
    expect(minutesUntilRetry(new Date("2026-11-06T09:45:30Z"), 15 * 60_000, now)).toBe(1);
  });
});
