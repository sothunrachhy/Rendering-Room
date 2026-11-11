import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateTime,
  nextQuarterHour,
  parsePhnomPenhDateTime,
  toPhnomPenhInput,
} from "./time";

describe("Phnom Penh time", () => {
  it("reads form input as UTC+7", () => {
    expect(parsePhnomPenhDateTime("2026-11-20T14:30")?.toISOString()).toBe(
      "2026-11-20T07:30:00.000Z",
    );
  });

  it("rejects malformed and impossible values", () => {
    expect(parsePhnomPenhDateTime("")).toBeNull();
    expect(parsePhnomPenhDateTime("2026-11-20")).toBeNull();
    expect(parsePhnomPenhDateTime("2026-02-30T10:00")).toBeNull();
    expect(parsePhnomPenhDateTime("2026-11-20T25:00")).toBeNull();
  });

  it("round-trips through the input format", () => {
    const date = new Date("2026-11-20T20:15:00Z"); // 03:15 the next day in Phnom Penh
    expect(toPhnomPenhInput(date)).toBe("2026-11-21T03:15");
    expect(parsePhnomPenhDateTime(toPhnomPenhInput(date))?.getTime()).toBe(date.getTime());
  });

  it("rounds up to the next quarter hour, so 15-minute steps land on :00 :15 :30 :45", () => {
    expect(toPhnomPenhInput(nextQuarterHour(new Date("2026-11-20T15:59:00Z")))).toBe(
      "2026-11-20T23:00",
    );
    expect(toPhnomPenhInput(nextQuarterHour(new Date("2026-11-20T16:00:00Z")))).toBe(
      "2026-11-20T23:15",
    );
  });

  it("formats in English and Khmer", () => {
    const date = new Date("2026-11-20T07:30:00Z");
    expect(formatDate(date, "en")).toBe("20 Nov 2026");
    expect(formatDate(date, "km")).toBe("20 វិច្ឆិកា 2026");
    expect(formatDateTime(date, "en")).toBe("20 Nov 2026, 14:30");
  });
});
