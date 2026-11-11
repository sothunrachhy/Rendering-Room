import type { Locale } from "@/i18n/config";

// Map tiles by page language (QA U-04). The standard OpenStreetMap style labels Phnom
// Penh streets in Khmer only; the OpenStreetMap France style adds Latin-script names
// ("Street 592", "Toul Kork"), so English pages get readable street names. Both are
// free, community-run servers: fine for a pilot, but a busy site should use its own
// or a paid tile service.
export const MAP_TILES: Record<Locale, { url: string; attribution: string }> = {
  km: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  en: {
    url: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, tiles by <a href="https://www.openstreetmap.fr">OpenStreetMap France</a>',
  },
};
