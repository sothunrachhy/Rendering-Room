import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { idDocuments } from "@/db/schema";
import { getUserOrNull } from "@/server/auth";
import { db } from "@/db";

// A landlord's ID photo. Admins only, and never cached anywhere.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/admin/id-documents/[userId]">,
) {
  const user = await getUserOrNull();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { userId } = await ctx.params;
  if (!z.uuid().safeParse(userId).success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const document = await db.query.idDocuments.findFirst({
    where: eq(idDocuments.userId, userId),
    columns: { contentType: true, data: true },
  });
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new Response(new Uint8Array(document.data), {
    headers: {
      "Content-Type": document.contentType,
      "Content-Length": String(document.data.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
