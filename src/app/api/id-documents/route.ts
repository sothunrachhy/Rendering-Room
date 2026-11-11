import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { idDocuments, users } from "@/db/schema";
import { getRequestI18n } from "@/i18n/request";
import { getUserOrNull } from "@/server/auth";
import { db } from "@/db";
import { MAX_ID_DOCUMENT_BYTES } from "@/lib/rooms";
import { readImageUpload } from "@/server/uploads";

// POST /api/id-documents with the landlord's ID photo in the "document" field (the
// admin reads it back from /api/admin/id-documents/[userId]).
// Replaces any earlier photo and puts the account in the admin's queue.
export async function POST(request: Request) {
  const user = await getUserOrNull();
  const { t } = await getRequestI18n();
  if (!user || user.role !== "LANDLORD" || user.verification === "VERIFIED") {
    return NextResponse.json({ error: t("messages.notAllowed") }, { status: 403 });
  }

  const upload = await readImageUpload(request, "document", MAX_ID_DOCUMENT_BYTES);
  if (upload === "too-large") {
    return NextResponse.json({ error: t("messages.photoTooLarge") }, { status: 413 });
  }
  if (upload === "not-image") {
    return NextResponse.json({ error: t("messages.notAnImage") }, { status: 400 });
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(idDocuments)
      .values({ userId: user.id, ...upload })
      .onConflictDoUpdate({
        target: idDocuments.userId,
        set: { ...upload, uploadedAt: new Date() },
      });
    await tx
      .update(users)
      .set({ verification: "PENDING", verificationNote: null })
      .where(eq(users.id, user.id));
  });

  return NextResponse.json({ ok: true, message: t("messages.idUploaded") });
}
