import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { LOCALES, localePath } from "@/i18n/config";
import { siteUrl } from "@/lib/app-url";
import { getPublicRoomIds } from "@/server/queries/rooms";

// Public pages, in both languages, with hreflang links between them.
const PAGES = ["/", "/rooms", "/about", "/privacy", "/terms", "/login", "/register"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Rooms change all the time: build the list on each request, not once at build time
  await connection();
  const base = siteUrl();
  const rooms = await getPublicRoomIds();

  const entry = (path: string, lastModified?: Date): MetadataRoute.Sitemap =>
    LOCALES.map((locale) => ({
      url: base + localePath(locale, path),
      ...(lastModified && { lastModified }),
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [l, base + localePath(l, path)])),
      },
    }));

  return [
    ...PAGES.flatMap((path) => entry(path)),
    ...rooms.flatMap((room) => entry(`/rooms/${room.id}`, room.updatedAt)),
  ];
}
