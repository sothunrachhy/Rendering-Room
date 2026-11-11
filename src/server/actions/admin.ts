"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { after } from "next/server";
import { reports, rooms, users } from "@/db/schema";
import { getRequestI18n } from "@/i18n/request";
import { requireRole } from "@/server/auth";
import { db } from "@/db";
import { fieldErrors, type FormState, formValues } from "@/lib/form-state";
import { idSchema, rejectLandlordSchema } from "@/lib/validation";
import type { ActionResult } from "@/server/actions/types";
import { notifyUser } from "@/server/notify";

export async function approveLandlord(userId: string): Promise<ActionResult> {
  await requireRole("ADMIN");
  const { t } = await getRequestI18n();
  const id = idSchema.safeParse(userId);
  if (!id.success) return { ok: false, message: t("messages.notAllowed") };

  const [landlord] = await db
    .update(users)
    .set({ verification: "VERIFIED", verificationNote: null })
    .where(and(eq(users.id, id.data), eq(users.role, "LANDLORD")))
    .returning({ id: users.id, name: users.name });
  if (!landlord) return { ok: false, message: t("messages.notAllowed") };

  after(() => notifyUser(landlord.id, (lt) => lt("notify.verified"), "/listings"));
  refresh();
  return { ok: true, message: t("messages.landlordApproved", { name: landlord.name }) };
}

export async function rejectLandlord(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole("ADMIN");
  const { t } = await getRequestI18n();
  const values = formValues(formData, ["userId", "note"]);

  const parsed = rejectLandlordSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error, t), values };

  const [landlord] = await db
    .update(users)
    .set({ verification: "REJECTED", verificationNote: parsed.data.note })
    .where(and(eq(users.id, parsed.data.userId), eq(users.role, "LANDLORD")))
    .returning({ id: users.id, name: users.name });
  if (!landlord) return { message: t("messages.notAllowed"), values };

  const note = parsed.data.note ?? "";
  after(() => notifyUser(landlord.id, (lt) => lt("notify.rejected", { note }), "/settings"));
  refresh();
  return { ok: true, message: t("messages.landlordRejected", { name: landlord.name }) };
}

export async function setRoomHidden(roomId: string, hidden: boolean): Promise<ActionResult> {
  await requireRole("ADMIN");
  const { t } = await getRequestI18n();
  const id = idSchema.safeParse(roomId);
  if (!id.success) return { ok: false, message: t("messages.roomNotFound") };

  const updated = await db
    .update(rooms)
    .set({ hidden })
    .where(eq(rooms.id, id.data))
    .returning({ id: rooms.id });
  if (updated.length === 0) return { ok: false, message: t("messages.roomNotFound") };

  refresh();
  return { ok: true, message: t(hidden ? "messages.roomHidden" : "messages.roomShown") };
}

export async function closeReport(
  reportId: string,
  status: "RESOLVED" | "DISMISSED",
): Promise<ActionResult> {
  await requireRole("ADMIN");
  const { t } = await getRequestI18n();
  const id = idSchema.safeParse(reportId);
  if (!id.success) return { ok: false, message: t("messages.notAllowed") };

  await db.update(reports).set({ status }).where(eq(reports.id, id.data));

  refresh();
  return {
    ok: true,
    message: t(status === "RESOLVED" ? "messages.reportResolved" : "messages.reportDismissed"),
  };
}
