"use server";

import { and, asc, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { roomPhotos, rooms } from "@/db/schema";
import { localePath } from "@/i18n/config";
import { getRequestI18n } from "@/i18n/request";
import { requireRole } from "@/server/auth";
import { db } from "@/db";
import { fieldErrors, type FormState, formValues } from "@/lib/form-state";
import { idSchema, roomSchema } from "@/lib/validation";
import type { ActionResult } from "@/server/actions/types";

const FIELDS = [
  "title",
  "description",
  "address",
  "district",
  "lat",
  "lng",
  "rentCents",
  "depositCents",
  "otherFeesCents",
  "otherFeesNote",
  "electricityCentsPerKwh",
  "waterCentsPerM3",
  "type",
  "gender",
  "maxOccupants",
  "sizeSqm",
] as const;

/** Creates a room, or updates one when the form carries an `id`. Landlords only. */
export async function saveRoom(_prev: FormState, formData: FormData): Promise<FormState> {
  const landlord = await requireRole("LANDLORD");
  const { locale, t } = await getRequestI18n();
  const values = formValues(formData, FIELDS);
  const facilities = formData.getAll("facilities").map(String);
  const id = formData.get("id");

  const parsed = roomSchema.safeParse({ ...values, facilities });
  if (!parsed.success) {
    return {
      fieldErrors: fieldErrors(parsed.error, t),
      // Checkbox state survives a failed submit as a comma-separated list
      values: { ...values, facilities: facilities.join(",") },
    };
  }

  if (id) {
    const roomId = idSchema.safeParse(id);
    if (!roomId.success) return { message: t("messages.roomNotFound"), values };

    // The landlord check is part of the update, so nobody can edit another's room
    const updated = await db
      .update(rooms)
      .set(parsed.data)
      .where(and(eq(rooms.id, roomId.data), eq(rooms.landlordId, landlord.id)))
      .returning({ id: rooms.id });
    if (updated.length === 0) return { message: t("messages.roomNotFound"), values };

    refresh();
    return { ok: true, message: t("messages.roomUpdated") };
  }

  const [room] = await db
    .insert(rooms)
    .values({ ...parsed.data, landlordId: landlord.id })
    .returning({ id: rooms.id });

  // Straight to the edit page, where photos can be added now that the room exists
  redirect(`${localePath(locale, `/listings/${room.id}`)}?created=1`);
}

export async function setRoomStatus(
  roomId: string,
  status: "AVAILABLE" | "RENTED",
): Promise<ActionResult> {
  const landlord = await requireRole("LANDLORD");
  const { t } = await getRequestI18n();
  const id = idSchema.safeParse(roomId);
  if (!id.success) return { ok: false, message: t("messages.roomNotFound") };

  const updated = await db
    .update(rooms)
    .set({ status })
    .where(and(eq(rooms.id, id.data), eq(rooms.landlordId, landlord.id)))
    .returning({ id: rooms.id });
  if (updated.length === 0) return { ok: false, message: t("messages.roomNotFound") };

  refresh();
  return {
    ok: true,
    message: t(status === "RENTED" ? "messages.markedRented" : "messages.markedAvailable"),
  };
}

export async function deleteRoom(roomId: string): Promise<ActionResult> {
  const landlord = await requireRole("LANDLORD");
  const { t } = await getRequestI18n();
  const id = idSchema.safeParse(roomId);
  if (!id.success) return { ok: false, message: t("messages.roomNotFound") };

  // Cascades to photos, favourites, viewing requests, reviews and reports
  const deleted = await db
    .delete(rooms)
    .where(and(eq(rooms.id, id.data), eq(rooms.landlordId, landlord.id)))
    .returning({ id: rooms.id });
  if (deleted.length === 0) return { ok: false, message: t("messages.roomNotFound") };

  refresh();
  return { ok: true, message: t("messages.roomDeleted") };
}

/** A photo, only if it belongs to one of this landlord's rooms. */
async function findOwnPhoto(photoId: string, landlordId: string) {
  const id = idSchema.safeParse(photoId);
  if (!id.success) return null;
  const [photo] = await db
    .select({ id: roomPhotos.id, roomId: roomPhotos.roomId })
    .from(roomPhotos)
    .innerJoin(rooms, eq(rooms.id, roomPhotos.roomId))
    .where(and(eq(roomPhotos.id, id.data), eq(rooms.landlordId, landlordId)));
  return photo ?? null;
}

export async function deletePhoto(photoId: string): Promise<ActionResult> {
  const landlord = await requireRole("LANDLORD");
  const { t } = await getRequestI18n();
  const photo = await findOwnPhoto(photoId, landlord.id);
  if (!photo) return { ok: false, message: t("messages.roomNotFound") };

  await db.delete(roomPhotos).where(eq(roomPhotos.id, photo.id));
  refresh();
  return { ok: true, message: t("messages.photoDeleted") };
}

/** Moves a photo to the front, so it becomes the cover in search results. */
export async function makeCoverPhoto(photoId: string): Promise<ActionResult> {
  const landlord = await requireRole("LANDLORD");
  const { t } = await getRequestI18n();
  const photo = await findOwnPhoto(photoId, landlord.id);
  if (!photo) return { ok: false, message: t("messages.roomNotFound") };

  // Renumber all the room's photos 0, 1, 2... with this one first and the rest in their
  // current order, instead of shifting the others up by one each time (QA-10)
  await db.transaction(async (tx) => {
    const current = await tx
      .select({ id: roomPhotos.id, position: roomPhotos.position })
      .from(roomPhotos)
      .where(eq(roomPhotos.roomId, photo.roomId))
      .orderBy(asc(roomPhotos.position), asc(roomPhotos.createdAt));
    const order = [photo.id, ...current.map((p) => p.id).filter((id) => id !== photo.id)];
    const positionOf = new Map(current.map((p) => [p.id, p.position]));
    for (const [index, id] of order.entries()) {
      if (positionOf.get(id) === index) continue;
      await tx.update(roomPhotos).set({ position: index }).where(eq(roomPhotos.id, id));
    }
  });

  refresh();
  return { ok: true, message: t("messages.coverChanged") };
}
