// Brings the database's campuses in line with campus-list.ts: adds the ones it doesn't
// have yet and deletes the ones listed in REMOVED_CAMPUSES. Safe on a live database:
// other campuses (matched by slug), rooms and users are left exactly as they are.
//
//   npm run db:campuses
import "dotenv/config";
import { inArray } from "drizzle-orm";
import { campuses } from "@/db/schema";
import { db } from "@/db";
import { CAMPUSES, REMOVED_CAMPUSES } from "./campus-list";

async function main() {
  const added = await db
    .insert(campuses)
    .values(CAMPUSES)
    .onConflictDoNothing({ target: campuses.slug })
    .returning({ shortName: campuses.shortName });

  const removed = await db
    .delete(campuses)
    .where(inArray(campuses.slug, REMOVED_CAMPUSES))
    .returning({ shortName: campuses.shortName });
  if (removed.length > 0) {
    console.log(
      `Removed ${removed.length} campuses (${removed.map((c) => c.shortName).join(", ")}).`,
    );
  }

  const total = await db.$count(campuses);
  console.log(
    added.length === 0
      ? `Nothing to add: all ${CAMPUSES.length} campuses are already there.`
      : `Added ${added.length} campuses (${added.map((c) => c.shortName).join(", ")}). ${total} in total.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
