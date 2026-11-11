import { describe, expect, it } from "vitest";
import { boundingBox, haversineKm, rankRooms, scoreRoom } from "./ranking";

const RUPP = { lat: 11.5689, lng: 104.8906 };

/** A point `km` due north of `from` (on a meridian, distance is exact). */
function north(from: { lat: number; lng: number }, km: number) {
  return { lat: from.lat + (km / 6371) * (180 / Math.PI), lng: from.lng };
}

describe("haversineKm", () => {
  it("is zero for the same point", () => {
    expect(haversineKm(RUPP, RUPP)).toBe(0);
  });

  it("matches a known distance", () => {
    // Phnom Penh to Siem Reap is about 230 km in a straight line
    const siemReap = { lat: 13.3633, lng: 103.8564 };
    expect(haversineKm(RUPP, siemReap)).toBeGreaterThan(220);
    expect(haversineKm(RUPP, siemReap)).toBeLessThan(240);
  });

  it("is symmetric", () => {
    const other = { lat: 11.55, lng: 104.92 };
    expect(haversineKm(RUPP, other)).toBeCloseTo(haversineKm(other, RUPP), 10);
  });
});

describe("scoreRoom: the worked example from the slides", () => {
  // Max distance 3 km, budget $120
  it("Room A: 1.2 km, $80, rated 4.5 -> 0.58", () => {
    const score = scoreRoom({
      distanceKm: 1.2,
      maxDistanceKm: 3,
      price: 80,
      budget: 120,
      rating: 4.5,
    });
    expect(score).toBeCloseTo(0.58, 2);
  });

  it("Room B: 0.5 km, $110, rated 4.0 -> 0.60", () => {
    const score = scoreRoom({
      distanceKm: 0.5,
      maxDistanceKm: 3,
      price: 110,
      budget: 120,
      rating: 4,
    });
    expect(score).toBeCloseTo(0.6, 2);
  });

  it("gives unreviewed rooms a neutral rating instead of zero", () => {
    const base = { distanceKm: 1, maxDistanceKm: 3, price: 100, budget: 120 };
    expect(scoreRoom({ ...base, rating: null })).toBeCloseTo(scoreRoom({ ...base, rating: 3 }), 10);
  });

  it("stays between 0 and 1", () => {
    expect(scoreRoom({ distanceKm: 0, maxDistanceKm: 3, price: 0, budget: 120, rating: 5 })).toBe(
      1,
    );
    expect(
      scoreRoom({ distanceKm: 10, maxDistanceKm: 3, price: 500, budget: 120, rating: 1 }),
    ).toBeCloseTo(0.04, 10);
  });
});

describe("rankRooms", () => {
  const roomA = { id: "A", ...north(RUPP, 1.2), rentCents: 8000, avgRating: 4.5 };
  const roomB = { id: "B", ...north(RUPP, 0.5), rentCents: 11000, avgRating: 4 };
  const tooFar = { id: "far", ...north(RUPP, 3.5), rentCents: 5000, avgRating: 5 };
  const options = { campus: RUPP, maxDistanceKm: 3, budgetCents: 12000 };

  it("ranks Room B above Room A, as on the slide", () => {
    const ranked = rankRooms([roomA, roomB], options);
    expect(ranked.map((r) => r.id)).toEqual(["B", "A"]);
    expect(ranked[0].score).toBeCloseTo(0.6, 2);
    expect(ranked[1].score).toBeCloseTo(0.58, 2);
    expect(ranked[1].distanceKm).toBeCloseTo(1.2, 6);
  });

  it("skips rooms beyond the maximum distance", () => {
    expect(rankRooms([roomA, tooFar], options).map((r) => r.id)).toEqual(["A"]);
  });

  it("supports other sort orders", () => {
    expect(rankRooms([roomA, roomB], { ...options, sort: "price" }).map((r) => r.id)).toEqual([
      "A",
      "B",
    ]);
    expect(rankRooms([roomA, roomB], { ...options, sort: "distance" }).map((r) => r.id)).toEqual([
      "B",
      "A",
    ]);
    expect(rankRooms([roomA, roomB], { ...options, sort: "rating" }).map((r) => r.id)).toEqual([
      "A",
      "B",
    ]);
  });
});

describe("boundingBox", () => {
  it("contains every point within the radius", () => {
    const box = boundingBox(RUPP, 3);
    const edge = north(RUPP, 2.99);
    expect(edge.lat).toBeLessThan(box.maxLat);
    expect(box.minLng).toBeLessThan(RUPP.lng);
    expect(box.maxLng).toBeGreaterThan(RUPP.lng);
  });
});
