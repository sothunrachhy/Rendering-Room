// npm run db:sample-photos
// Adds the demo photos to seeded rooms that don't have any yet (see sample-photos.ts).
import "dotenv/config";
import { addSamplePhotos } from "./sample-photos";

addSamplePhotos()
  .then((updated) => {
    console.log(`Added sample photos to ${updated} room(s).`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
