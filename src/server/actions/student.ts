"use server";

import { and, eq, inArray } from "drizzle-orm";
import { refresh, revalidatePath } from "next/cache";
import { after } from "next/server";
import { favourites, reports, reviews, rooms, users, viewingRequests } from "@/db/schema";
import { localePath } from "@/i18n/config";
import { getRequestI18n } from "@/i18n/request";
import { requireRole, requireUser } from "@/server/auth";
import { db } from "@/db";
import { isForeignKeyViolation } from "@/db/errors";
import { fieldErrors, type FormState, formValues } from "@/lib/form-state";
import { formatDateTime } from "@/lib/time";
import { idSchema, reportSchema, reviewSchema, viewingRequestSchema } from "@/lib/validation";
import type { ActionResult } from "@/server/actions/types";
import { notifyUser } from "@/server/notify";
import { reportBlock } from "@/server/policies";

/** A room students can interact with: visible in search and from a verified landlord. */
async function findVisibleRoom(roomId: string) {
  const [room] = await db
    .select({
      id: rooms.id,
      title: rooms.title,
      status: rooms.status,
      landlordId: rooms.landlordId,
    })
    .from(rooms)
    .innerJoin(users, eq(users.id, rooms.landlordId))
    .where(and(eq(rooms.id, roomId), eq(rooms.hidden, false), eq(users.verification, "VERIFIED")));
  return room ?? null;
}

export async function toggleFavourite(roomId: string, save: boolean): Promise<ActionResult> {
  const student = await requireRole("STUDENT");
  const { locale, t } = await getRequestI18n();
  const id = idSchema.safeParse(roomId);
  if (!id.success) return { ok: false, message: t("messages.roomNotFound") };

  if (save) {
    if (!(await findVisibleRoom(id.data)))
      return { ok: false, message: t("messages.roomNotFound") };
    await db
      .insert(favourites)
      .values({ userId: student.id, roomId: id.data })
      .onConflictDoNothing();
  } else {
    await db
      .delete(favourites)
      .where(and(eq(favourites.userId, student.id), eq(favourites.roomId, id.data)));
  }

  // The browser may hold an earlier copy of Saved rooms: make the next visit fresh
  revalidatePath(localePath(locale, "/saved"));
  refresh();
  return { ok: true, message: t(save ? "messages.savedRoom" : "messages.unsavedRoom") };
}

export async function requestViewing(_prev: FormState, formData: FormData): Promise<FormState> {
  const student = await requireRole("STUDENT");
  const { locale, t } = await getRequestI18n();
  const values = formValues(formData, ["roomId", "preferredAt", "message"]);

  // Landlords only get requests (and alerts) from confirmed email addresses
  if (!student.emailVerified) return { message: t("messages.verifyEmailFirst"), values };

  const parsed = viewingRequestSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error, t), values };

  const room = await findVisibleRoom(parsed.data.roomId);
  if (!room) return { message: t("messages.roomNotFound"), values };
  if (room.status !== "AVAILABLE") return { message: t("messages.roomNotAvailable"), values };

  const pending = await db.query.viewingRequests.findFirst({
    where: and(
      eq(viewingRequests.roomId, room.id),
      eq(viewingRequests.studentId, student.id),
      eq(viewingRequests.status, "PENDING"),
    ),
    columns: { id: true },
  });
  if (pending) return { message: t("messages.requestPending"), values };

  await db.insert(viewingRequests).values({
    roomId: room.id,
    studentId: student.id,
    preferredAt: parsed.data.preferredAt,
    message: parsed.data.message,
  });

  after(() =>
    notifyUser(room.landlordId, (lt, locale) =>
      lt("notify.newRequest", {
        room: room.title,
        student: student.name,
        date: formatDateTime(parsed.data.preferredAt, locale),
      }),
    ),
  );

  revalidatePath(localePath(locale, "/requests"));
  refresh();
  return { ok: true, message: t("messages.requestSent") };
}

export async function cancelRequest(requestId: string): Promise<ActionResult> {
  const student = await requireRole("STUDENT");
  const { t } = await getRequestI18n();
  const id = idSchema.safeParse(requestId);
  if (!id.success) return { ok: false, message: t("messages.requestNotFound") };

  // Only waiting or accepted requests can be cancelled; answered history stays as is
  const [cancelled] = await db
    .update(viewingRequests)
    .set({ status: "CANCELLED" })
    .where(
      and(
        eq(viewingRequests.id, id.data),
        eq(viewingRequests.studentId, student.id),
        inArray(viewingRequests.status, ["PENDING", "ACCEPTED"]),
      ),
    )
    .returning({ roomId: viewingRequests.roomId });
  if (!cancelled) return { ok: false, message: t("messages.requestNotFound") };

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, cancelled.roomId),
    columns: { title: true, landlordId: true },
  });
  if (room) {
    after(() =>
      notifyUser(room.landlordId, (lt) =>
        lt("notify.requestCancelled", { room: room.title, student: student.name }),
      ),
    );
  }

  refresh();
  return { ok: true, message: t("messages.requestCancelled") };
}

export async function saveReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const student = await requireRole("STUDENT");
  const { t } = await getRequestI18n();
  const values = formValues(formData, ["roomId", "rating", "comment"]);

  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error, t), values };

  // "Honest reviews from real students": only after an accepted viewing
  const viewed = await db.query.viewingRequests.findFirst({
    where: and(
      eq(viewingRequests.roomId, parsed.data.roomId),
      eq(viewingRequests.studentId, student.id),
      eq(viewingRequests.status, "ACCEPTED"),
    ),
    columns: { id: true },
  });
  if (!viewed) return { message: t("messages.reviewNotAllowed"), values };

  // One review per student and room; posting again updates it
  await db
    .insert(reviews)
    .values({ ...parsed.data, studentId: student.id })
    .onConflictDoUpdate({
      target: [reviews.roomId, reviews.studentId],
      set: { rating: parsed.data.rating, comment: parsed.data.comment, updatedAt: new Date() },
    });

  refresh();
  return { ok: true, message: t("messages.reviewSaved") };
}

export async function reportRoom(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const { t } = await getRequestI18n();
  const values = formValues(formData, ["roomId", "reason", "details"]);

  const parsed = reportSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error, t), values };

  // Only listed rooms, never your own, and one open report per person and room (QA-03)
  const room = await findVisibleRoom(parsed.data.roomId);
  const openReport = room
    ? await db.query.reports.findFirst({
        where: and(
          eq(reports.roomId, room.id),
          eq(reports.reporterId, user.id),
          eq(reports.status, "OPEN"),
        ),
        columns: { id: true },
      })
    : undefined;
  const block = reportBlock(room, user.id, openReport !== undefined);
  if (block === "roomNotFound") return { message: t("messages.roomNotFound"), values };
  if (block === "ownRoom") return { message: t("messages.cannotReportOwnRoom"), values };
  // Already reported: nothing more to do, and the reporter needn't see an error
  if (block === "alreadyReported") return { ok: true, message: t("messages.reportAlreadySent") };

  try {
    await db.insert(reports).values({ ...parsed.data, reporterId: user.id });
  } catch (error) {
    // The room was deleted in the meantime
    if (isForeignKeyViolation(error)) return { message: t("messages.roomNotFound"), values };
    throw error;
  }

  return { ok: true, message: t("messages.reportSent") };
}
