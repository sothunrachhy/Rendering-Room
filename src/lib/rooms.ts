// Room options, search filters and cost estimates. Plain data and functions, shared
// by Server Components, Client Components and Server Actions.
import type { Locale } from "@/i18n/config";
import { SORT_OPTIONS, type SortOption } from "@/lib/ranking";

export const FACILITIES = [
  "wifi",
  "aircon",
  "fan",
  "privateBathroom",
  "furnished",
  "parking",
  "securityGuard",
  "cctv",
  "kitchen",
  "laundry",
  "waterHeater",
  "balcony",
] as const;
export type Facility = (typeof FACILITIES)[number];

export const ROOM_TYPES = ["SINGLE", "SHARED", "STUDIO", "APARTMENT"] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export const GENDER_POLICIES = ["ANY", "FEMALE", "MALE"] as const;
export type GenderPolicy = (typeof GENDER_POLICIES)[number];

export const REPORT_REASONS = [
  "FAKE",
  "WRONG_PRICE",
  "ALREADY_RENTED",
  "UNSAFE",
  "SCAM",
  "OTHER",
] as const;

// Khan names, written the way landlords usually type them in English
export const DISTRICTS = [
  "Toul Kork",
  "Sen Sok",
  "Russey Keo",
  "Daun Penh",
  "7 Makara",
  "Chamkar Mon",
  "Boeung Keng Kang",
  "Mean Chey",
  "Por Senchey",
  "Chbar Ampov",
  "Chroy Changvar",
  "Dangkao",
] as const;

export const MAX_PHOTOS_PER_ROOM = 8;
/** After the browser shrinks a photo it should be well under this */
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const MAX_ID_DOCUMENT_BYTES = 4 * 1024 * 1024;

export const SEARCH_DEFAULTS = {
  campus: "rupp",
  budget: 150, // US dollars per month
  distance: 3, // km
  sort: "score" as SortOption,
};
export const DISTANCE_CHOICES = [1, 2, 3, 5, 8, 12] as const;
/** The largest distance the search offers; links asking for more use this (QA-08) */
export const MAX_DISTANCE = DISTANCE_CHOICES[DISTANCE_CHOICES.length - 1];
export const MIN_BUDGET = 10;
export const MAX_BUDGET = 2000;

export type SearchFilters = {
  campus: string;
  budget: number;
  distance: number;
  type: RoomType | null;
  gender: GenderPolicy | null;
  facilities: Facility[];
  sort: SortOption;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pick<T extends string>(options: readonly T[], value: string | undefined): T | null {
  return value && (options as readonly string[]).includes(value) ? (value as T) : null;
}

/** Reads the search page's URL. Anything invalid falls back to a sensible default. */
export function parseSearchFilters(params: RawParams): SearchFilters {
  const budget = Number(first(params.budget));
  const distance = Number(first(params.distance));
  const campus = first(params.campus);
  // "wifi,cctv" from our own links, or repeated ?facilities= from the filter form's checkboxes
  const facilityParam = [params.facilities].flat().filter(Boolean).join(",");

  return {
    campus: campus && /^[a-z0-9-]{1,40}$/.test(campus) ? campus : SEARCH_DEFAULTS.campus,
    budget:
      Number.isFinite(budget) && budget > 0
        ? Math.min(Math.max(Math.round(budget), MIN_BUDGET), MAX_BUDGET)
        : SEARCH_DEFAULTS.budget,
    distance:
      Number.isFinite(distance) && distance > 0
        ? Math.min(distance, MAX_DISTANCE)
        : SEARCH_DEFAULTS.distance,
    type: pick(ROOM_TYPES, first(params.type)),
    gender: pick(GENDER_POLICIES, first(params.gender)),
    facilities: [
      ...new Set(
        facilityParam.split(",").filter((f): f is Facility => pick(FACILITIES, f) !== null),
      ),
    ],
    sort: pick(SORT_OPTIONS, first(params.sort)) ?? SEARCH_DEFAULTS.sort,
  };
}

/**
 * True when the URL asked for something the search couldn't use as written (an unknown
 * campus, budget=abc, distance=999…), so the page can say what it used instead and
 * correct the address bar (QA F-03). `filters` = what the search actually used.
 */
export function searchWasAdjusted(params: RawParams, filters: SearchFilters): boolean {
  const given = (key: string): string | null | undefined => {
    const value = first(params[key]);
    if (value === undefined) return undefined;
    return value === "" || value === "any" ? null : value; // the form's "Any" choice
  };
  const differs = (key: string, used: string | null) => {
    const value = given(key);
    return value !== undefined && value !== used;
  };
  const askedFacilities = [params.facilities].flat().filter(Boolean).join(",").split(",");
  const facilitiesDiffer =
    params.facilities !== undefined &&
    askedFacilities.filter(Boolean).sort().join(",") !== [...filters.facilities].sort().join(",");

  return (
    differs("campus", filters.campus) ||
    differs("budget", String(filters.budget)) ||
    differs("distance", String(filters.distance)) ||
    differs("type", filters.type) ||
    differs("gender", filters.gender) ||
    differs("sort", filters.sort) ||
    facilitiesDiffer
  );
}

/** The reverse of parseSearchFilters, leaving out defaults so URLs stay short. */
export function searchQuery(filters: Partial<SearchFilters>): string {
  const params = new URLSearchParams();
  if (filters.campus) params.set("campus", filters.campus);
  if (filters.budget) params.set("budget", String(filters.budget));
  if (filters.distance) params.set("distance", String(filters.distance));
  if (filters.type) params.set("type", filters.type);
  if (filters.gender) params.set("gender", filters.gender);
  if (filters.facilities?.length) params.set("facilities", filters.facilities.join(","));
  if (filters.sort && filters.sort !== "score") params.set("sort", filters.sort);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Typical student use per month, for the cost estimate. Shown next to the estimate. */
export const TYPICAL_USAGE = { electricityKwh: 80, waterM3: 4 } as const;

export type CostBreakdown = {
  rent: number;
  electricity: number;
  water: number;
  other: number;
  total: number;
};

/** Estimated full monthly cost in cents, so students see the real price before visiting. */
export function estimateMonthlyCost(room: {
  rentCents: number;
  electricityCentsPerKwh: number | null;
  waterCentsPerM3: number | null;
  otherFeesCents: number;
}): CostBreakdown {
  const electricity = (room.electricityCentsPerKwh ?? 0) * TYPICAL_USAGE.electricityKwh;
  const water = (room.waterCentsPerM3 ?? 0) * TYPICAL_USAGE.waterM3;
  return {
    rent: room.rentCents,
    electricity,
    water,
    other: room.otherFeesCents,
    total: room.rentCents + electricity + water + room.otherFeesCents,
  };
}

/** "1.2 km" or "650 m" */
export function formatDistance(km: number, locale: Locale = "en"): string {
  // Khmer abbreviations: ម (metre) and គ.ម (kilometre), as in the distance dropdown
  const [m, kmUnit] = locale === "km" ? ["ម", "គ.ម"] : ["m", "km"];
  return km < 1 ? `${Math.round((km * 1000) / 10) * 10} ${m}` : `${km.toFixed(1)} ${kmUnit}`;
}

/** Looks at the first bytes, since the browser's content type can be faked. */
export function detectImageType(
  bytes: Uint8Array,
): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47)
    return "image/png";
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (text(0, 4) === "RIFF" && text(8, 12) === "WEBP") return "image/webp";
  return null;
}

/**
 * The language a landlord or student wrote in, from the script used: any Khmer letter
 * means Khmer. Lets pages mark text with the right `lang` (pronunciation, fonts) and
 * say when a listing on the Khmer site is in English (QA U-10).
 */
export function textLanguage(text: string): Locale {
  return /[ក-៿]/.test(text) ? "km" : "en";
}
