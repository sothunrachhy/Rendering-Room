// Room search and ranking algorithm (presentation slides 15–16). Pure functions,
// so they're easy to unit test and could be reused by a future mobile client.

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export type Point = { lat: number; lng: number };

/**
 * Step 1 · Haversine distance in kilometres.
 *   a = sin²(Δφ/2) + cos φ1 · cos φ2 · sin²(Δλ/2)
 *   d = 2R · atan2(√a, √(1 − a))
 * Straight-line distance: the real trip by road is usually longer.
 */
export function haversineKm(from: Point, to: Point): number {
  const dPhi = toRadians(to.lat - from.lat);
  const dLambda = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLambda / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * A latitude/longitude box that contains every point within `km` of `center`.
 * Lets the database discard far-away rooms with a cheap index lookup before the
 * exact Haversine check runs.
 */
export function boundingBox(center: Point, km: number) {
  const latDelta = (km / EARTH_RADIUS_KM) * (180 / Math.PI);
  const lngDelta = latDelta / Math.cos(toRadians(center.lat));
  return {
    minLat: center.lat - latDelta,
    maxLat: center.lat + latDelta,
    minLng: center.lng - lngDelta,
    maxLng: center.lng + lngDelta,
  };
}

/** Weights from the methodology: a starting point, to be tuned with survey results. */
export const DEFAULT_WEIGHTS = { distance: 0.5, price: 0.3, rating: 0.2 } as const;

export type Weights = { distance: number; price: number; rating: number };

/**
 * Rating used while a room has no reviews. Without it, every new listing would
 * score 0 on the rating term and sink to the bottom (the cold-start problem).
 */
export const NEUTRAL_RATING = 3;

export type ScoreInput = {
  distanceKm: number;
  maxDistanceKm: number;
  price: number;
  budget: number;
  /** Average rating 1–5, or null when the room has no reviews yet */
  rating: number | null;
};

/**
 * Step 2 · Score = 0.5 × (1 − d / d_max) + 0.3 × (1 − price / budget) + 0.2 × (rating / 5)
 * Each term is clamped to 0–1, so the score is always between 0 and 1. Higher is better.
 */
export function scoreRoom(input: ScoreInput, weights: Weights = DEFAULT_WEIGHTS): number {
  const nearness =
    input.maxDistanceKm > 0 ? clamp01(1 - input.distanceKm / input.maxDistanceKm) : 0;
  const cheapness = input.budget > 0 ? clamp01(1 - input.price / input.budget) : 0;
  const quality = clamp01((input.rating ?? NEUTRAL_RATING) / 5);
  return weights.distance * nearness + weights.price * cheapness + weights.rating * quality;
}

export const SORT_OPTIONS = ["score", "price", "distance", "rating"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export type RankableRoom = Point & { rentCents: number; avgRating: number | null };
export type Ranked<T> = T & { distanceKm: number; score: number };

/**
 * The flowchart's loop: for each room compute d with Haversine, skip it when
 * d > max distance, otherwise score it. Then sort, best first.
 */
export function rankRooms<T extends RankableRoom>(
  rooms: T[],
  options: {
    campus: Point;
    maxDistanceKm: number;
    budgetCents: number;
    sort?: SortOption;
    weights?: Weights;
  },
): Ranked<T>[] {
  const ranked: Ranked<T>[] = [];

  for (const room of rooms) {
    const distanceKm = haversineKm(options.campus, room);
    if (distanceKm > options.maxDistanceKm) continue; // "No": skip room, check next one

    const score = scoreRoom(
      {
        distanceKm,
        maxDistanceKm: options.maxDistanceKm,
        price: room.rentCents,
        budget: options.budgetCents,
        rating: room.avgRating,
      },
      options.weights,
    );
    ranked.push({ ...room, distanceKm, score });
  }

  const byScore = (a: Ranked<T>, b: Ranked<T>) => b.score - a.score;
  const sorters: Record<SortOption, (a: Ranked<T>, b: Ranked<T>) => number> = {
    score: byScore,
    price: (a, b) => a.rentCents - b.rentCents || byScore(a, b),
    distance: (a, b) => a.distanceKm - b.distanceKm || byScore(a, b),
    rating: (a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0) || byScore(a, b),
  };
  return ranked.sort(sorters[options.sort ?? "score"]);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
