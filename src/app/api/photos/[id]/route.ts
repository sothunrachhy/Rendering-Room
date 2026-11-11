import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { roomPhotos, rooms, users } from "@/db/schema";
import { getOptionalUser } from "@/server/auth";
import { db } from "@/db";
import { isPubliclyVisible, photoAccess } from "@/server/policies";

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

// A room photo. A listed room's photos are public like the room; a hidden room's, or
// an unverified landlord's, only its landlord and admins may see (QA-02), and everyone
// else gets a 404, as if the photo didn't exist.
export async function GET(_request: Request, ctx: RouteContext<"/api/photos/[id]">) {
  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) return notFound();

  const [photo] = await db
    .select({
      contentType: roomPhotos.contentType,
      data: roomPhotos.data,
      hidden: rooms.hidden,
      landlordId: rooms.landlordId,
      landlordVerification: users.verification,
    })
    .from(roomPhotos)
    .innerJoin(rooms, eq(rooms.id, roomPhotos.roomId))
    .innerJoin(users, eq(users.id, rooms.landlordId))
    .where(eq(roomPhotos.id, id));
  if (!photo) return notFound();

  // Only read the session when the room isn't public: most requests skip it
  const viewer = isPubliclyVisible(photo) ? null : await getOptionalUser();
  const access = photoAccess(photo, viewer);
  if (access === "denied") return notFound();

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.contentType,
      "Content-Length": String(photo.data.length),
      // A photo's bytes never change (a new upload gets a new id), but its room can be
      // hidden later: public copies are cached for a day, not forever. Private ones
      // (owner or admin) are never stored, by the browser or anything in between.
      "Cache-Control":
        access === "public"
          ? "public, max-age=86400, stale-while-revalidate=604800"
          : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
