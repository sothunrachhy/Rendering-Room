// Attaches the demo photos in scripts/sample-photos/ to the seeded rooms, so the
// sample listings (and the phone preview on the home page) show real interiors.
// Only rooms that have no photos yet get them, so it's safe to run more than once
// and never touches photos a landlord uploaded.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { count, eq } from "drizzle-orm";
import { roomPhotos, rooms } from "@/db/schema";
import { db } from "@/db";

// Seeded room title -> its photo files, cover first
const PHOTOS: Record<string, string[]> = {
  "Room A · Quiet single room in Toul Kork": ["room-a-1", "room-a-2"],
  "Room B · Bright room 5 minutes from RUPP": ["room-b-1", "room-b-2"],
  "Female-only shared room near Boeung Kak": ["female-shared-1", "female-shared-2"],
  "Studio with balcony and water heater": ["studio-1", "studio-2"],
  "Cheap single room off Russian Federation Boulevard": ["cheap-single-1"],
  "Male-only shared room for two": ["male-shared-1"],
  "Two-bedroom apartment for a group of friends": ["apartment-1", "apartment-2", "apartment-3"],
  "Air-conditioned room close to ITC": ["near-itc-1"],
  "Single room near NUM": ["near-num-1"],
  // Earlier sample titles (renamed after QA F-06), so older databases still get photos
  "Cheap single room near the Russian market road": ["cheap-single-1"],
  "Room near NUM and Wat Phnom": ["near-num-1"],
};

const FOLDER = path.join(process.cwd(), "scripts", "sample-photos");

/** Returns how many rooms got photos. */
export async function addSamplePhotos(): Promise<number> {
  let updated = 0;

  for (const [title, files] of Object.entries(PHOTOS)) {
    const matches = await db
      .select({ id: rooms.id, photos: count(roomPhotos.id) })
      .from(rooms)
      .leftJoin(roomPhotos, eq(roomPhotos.roomId, rooms.id))
      .where(eq(rooms.title, title))
      .groupBy(rooms.id);

    for (const room of matches.filter((r) => r.photos === 0)) {
      const values = await Promise.all(
        files.map(async (file, position) => ({
          roomId: room.id,
          position,
          contentType: "image/jpeg",
          data: await readFile(path.join(FOLDER, `${file}.jpg`)),
        })),
      );
      await db.insert(roomPhotos).values(values);
      updated++;
    }
  }

  return updated;
}
