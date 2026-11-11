"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { after } from "next/server";
import { rooms, viewingRequests } from "@/db/schema";
import { getRequestI18n } from "@/i18n/request";
import { requireRole } from "@/server/auth";
import { db } from "@/db";
import { fieldErrors, type FormState, formValues } from "@/lib/form-state";
import { formatDateTime } from "@/lib/time";
import { replySchema } from "@/lib/validation";
import { notifyUser } from "@/server/notify";
import { acceptBlock } from "@/server/policies";

/** The landlord accepts or declines a viewing request, with an optional reply. */
export async function answerRequest(_prev: FormState, formData: FormData): Promise<FormState> {
  const landlord = await requireRole("LANDLORD");
  const { t } = await getRequestI18n();
  const values = formValues(formData, ["id", "decision", "reply"]);

  const parsed = replySchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error, t), values };

  const [request] = await db
    .select({
      id: viewingRequests.id,
      status: viewingRequests.status,
      studentId: viewingRequests.studentId,
      preferredAt: viewingRequests.preferredAt,
      roomTitle: rooms.title,
      roomHidden: rooms.hidden,
    })
    .from(viewingRequests)
    .innerJoin(rooms, eq(rooms.id, viewingRequests.roomId))
    .where(and(eq(viewingRequests.id, parsed.data.id), eq(rooms.landlordId, landlord.id)));
  if (!request) return { message: t("messages.requestNotFound"), values };

  // Accepting shares the landlord's phone and unlocks a review: not for a room an admin
  // has hidden, nor from an unverified landlord (QA-04). Declining is always fine.
  if (parsed.data.decision === "ACCEPTED") {
    const block = acceptBlock({ hidden: request.roomHidden }, landlord.verification);
    if (block === "roomHidden") return { message: t("messages.cannotAcceptHidden"), values };
    if (block === "landlordUnverified") {
      return { message: t("messages.cannotAcceptUnverified"), values };
    }
  }

  // Only a waiting request can be answered; the status check makes a double click harmless
  const updated = await db
    .update(viewingRequests)
    .set({ status: parsed.data.decision, landlordReply: parsed.data.reply })
    .where(and(eq(viewingRequests.id, request.id), eq(viewingRequests.status, "PENDING")))
    .returning({ id: viewingRequests.id });
  if (updated.length === 0) return { message: t("messages.requestNotPending"), values };

  const { decision, reply } = parsed.data;
  after(() =>
    notifyUser(request.studentId, (st, locale) => {
      const text =
        decision === "ACCEPTED"
          ? st("notify.requestAccepted", {
              room: request.roomTitle,
              date: formatDateTime(request.preferredAt, locale),
            })
          : st("notify.requestDeclined", { room: request.roomTitle });
      return reply ? `${text}\n${st("notify.reply", { reply })}` : text;
    }),
  );

  refresh();
  return {
    ok: true,
    message: t(decision === "ACCEPTED" ? "messages.requestAccepted" : "messages.requestDeclined"),
  };
}
