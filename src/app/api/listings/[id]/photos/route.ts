import { and, count, eq, max } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { roomPhotos, rooms } from "@/db/schema";
import { getRequestI18n } from "@/i18n/request";
import { getUserOrNull } from "@/server/auth";
import { db } from "@/db";
import { MAX_PHOTO_BYTES, MAX_PHOTOS_PER_ROOM } from "@/lib/rooms";
import { readImageUpload } from "@/server/uploads";

// POST /api/listings/:id/photos with one photo in the "photo" field. The browser
// shrinks photos before uploading, so each request stays small.
export async function POST(request: Request, ctx: RouteContext<"/api/listings/[id]/photos">) {
  const user = await getUserOrNull();
  const { t } = await getRequestI18n();
  if (!user || user.role !== "LANDLORD") {
    return NextResponse.json({ error: t("messages.notAllowed") }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: t("messages.roomNotFound") }, { status: 404 });
  }
  const room = await db.query.rooms.findFirst({
    where: and(eq(rooms.id, id), eq(rooms.landlordId, user.id)),
    columns: { id: true },
  });
  if (!room) return NextResponse.json({ error: t("messages.roomNotFound") }, { status: 404 });

  const upload = await readImageUpload(request, "photo", MAX_PHOTO_BYTES);
  if (upload === "too-large") {
    return NextResponse.json({ error: t("messages.photoTooLarge") }, { status: 413 });
  }
  if (upload === "not-image") {
    return NextResponse.json({ error: t("messages.notAnImage") }, { status: 400 });
  }

  const inserted = await db.transaction(async (tx) => {
    // Lock the room row so two uploads at once can't both pass the limit check
    await tx.select({ id: rooms.id }).from(rooms).where(eq(rooms.id, room.id)).for("update");
    const [existing] = await tx
      .select({ count: count(), last: max(roomPhotos.position) })
      .from(roomPhotos)
      .where(eq(roomPhotos.roomId, room.id));
    if (existing.count >= MAX_PHOTOS_PER_ROOM) return null;

    const [photo] = await tx
      .insert(roomPhotos)
      .values({
        roomId: room.id,
        position: (existing.last ?? -1) + 1,
        contentType: upload.contentType,
        data: upload.data,
      })
      .returning({ id: roomPhotos.id });
    return photo;
  });

  if (!inserted) {
    return NextResponse.json(
      { error: t("messages.tooManyPhotos", { max: MAX_PHOTOS_PER_ROOM }) },
      { status: 409 },
    );
  }
  return NextResponse.json({ id: inserted.id }, { status: 201 });
}
