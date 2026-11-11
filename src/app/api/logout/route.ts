import { NextResponse, type NextRequest } from "next/server";
import { deleteSession } from "@/server/session";

// Reached when a session cookie is valid but its account no longer exists (see
// getCurrentUser). Rendering can't modify cookies, so this handler clears it.
// The normal "Log out" button uses the `logout` Server Action instead.
export async function GET(request: NextRequest) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
