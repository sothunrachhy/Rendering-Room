import { describe, expect, it } from "vitest";
import { labelledPins, placePins } from "./pin-layout";

const pin = (id: string, x: number, y: number) => ({ id, x, y, width: 40, height: 22 });

describe("labelledPins", () => {
  it("labels pins that are far apart", () => {
    expect(labelledPins([pin("a", 0, 0), pin("b", 100, 0)])).toEqual(new Set(["a", "b"]));
  });

  it("keeps the first (best ranked) label when two overlap", () => {
    expect(labelledPins([pin("best", 0, 0), pin("other", 10, 5)])).toEqual(new Set(["best"]));
  });

  it("never covers a reserved area such as the campus marker", () => {
    const campus = { x: 0, y: 0, width: 32, height: 32 };
    expect(labelledPins([pin("a", 5, 5), pin("b", 200, 0)], [campus])).toEqual(new Set(["b"]));
  });
});

describe("placePins", () => {
  const pin = (id: string, x: number, y: number) => ({ id, x, y, width: 50, height: 22 });

  it("keeps a label on its point when there is room", () => {
    expect(placePins([pin("a", 100, 100)]).get("a")).toEqual({ dx: 0, dy: 0 });
  });

  it("moves a colliding label next to its point instead of dropping it", () => {
    const placed = placePins([pin("a", 100, 100), pin("b", 110, 100)]);
    expect(placed.get("a")).toEqual({ dx: 0, dy: 0 });
    // b would sit on a: it goes above its point
    expect(placed.get("b")).toEqual({ dx: 0, dy: -28 });
  });

  it("falls back to a dot when every spot around the point is taken", () => {
    const crowd = [0, 1, 2, 3, 4, 5].map((i) => pin(`p${i}`, 100 + i, 100));
    const placed = placePins(crowd);
    expect(placed.size).toBeLessThan(crowd.length);
    expect(placed.has("p0")).toBe(true);
  });
});
