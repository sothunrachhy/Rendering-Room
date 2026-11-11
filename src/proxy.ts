import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { rooms, users } from "@/db/schema";
import {
  isLocale,
  type Locale,
  LOCALE_COOKIE,
  localePath,
  negotiateLocale,
  splitLocale,
} from "@/i18n/config";
import { db } from "@/db";
import { readSession, SESSION_COOKIE, type SessionClaims } from "@/server/jwt";

// Search and room pages are public; these need an account
const PROTECTED_PREFIXES = ["/saved", "/requests", "/listings", "/admin", "/settings"];
// Pages for signed-out visitors; signed-in users go straight to the search page
const SIGNED_OUT_PAGES = ["/login", "/register"];
const ONE_YEAR = 60 * 60 * 24 * 365;

type Role = NonNullable<SessionClaims["role"]>;

// Pages that belong to some roles only. The pages check again against the database;
// this just answers early for everyone else.
const ROLE_PREFIXES: [prefix: string, roles: Role[]][] = [
  ["/admin", ["ADMIN"]],
  ["/listings", ["LANDLORD"]],
  ["/saved", ["STUDENT"]],
  ["/requests", ["STUDENT", "LANDLORD"]],
];

function roleMayOpen(role: Role, path: string): boolean {
  const match = ROLE_PREFIXES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
  return !match || match[1].includes(role);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Whether a room page exists for this visitor: a real room that is public (not hidden,
 * verified landlord), or one they own, or any room for an admin. Same rule as the page.
 */
async function roomIsViewable(roomId: string, session: SessionClaims | null): Promise<boolean> {
  if (!UUID.test(roomId)) return false;
  const [room] = await db
    .select({
      hidden: rooms.hidden,
      landlordId: rooms.landlordId,
      verification: users.verification,
    })
    .from(rooms)
    .innerJoin(users, eq(users.id, rooms.landlordId))
    .where(eq(rooms.id, roomId));
  if (!room) return false;
  if (!room.hidden && room.verification === "VERIFIED") return true;
  return session?.userId === room.landlordId || session?.role === "ADMIN";
}

/** The branded 404 page with a real 404 status (src/app/[lang]/[...missing]). */
function notFoundResponse(request: NextRequest, locale: Locale) {
  return NextResponse.rewrite(new URL(localePath(locale, "/not-found"), request.url), {
    status: 404,
  });
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { locale, path } = splitLocale(pathname);

  // 1. Every page lives under /en or /km. Add the visitor's language if it's missing:
  //    their last choice (cookie), else their browser language, else English.
  if (!locale) {
    const saved = request.cookies.get(LOCALE_COOKIE)?.value;
    const preferred = isLocale(saved)
      ? saved
      : negotiateLocale(request.headers.get("accept-language"));
    const url = request.nextUrl.clone();
    url.pathname = localePath(preferred, pathname);
    return NextResponse.redirect(url);
  }

  // 2. Optimistic auth check: only verifies the cookie signature, no database call,
  //    so it's fast enough for every navigation. Pages and Server Actions still
  //    verify the session through the Data Access Layer (src/server/auth.ts).
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const userId = session?.userId ?? null;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (isProtected && !userId) {
    const loginUrl = new URL(localePath(locale, "/login"), request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (SIGNED_OUT_PAGES.includes(path) && userId) {
    return NextResponse.redirect(new URL(localePath(locale, "/rooms"), request.url));
  }

  // Answer "not found" here, before the page starts streaming, so the response gets a
  // real 404 status (once streaming starts it's stuck at 200) and other roles' pages
  // don't reveal their titles.
  if (session?.role && !roleMayOpen(session.role, path)) return notFoundResponse(request, locale);
  const roomId = /^\/rooms\/([^/]+)$/.exec(path)?.[1];
  if (roomId && !(await roomIsViewable(roomId, session))) return notFoundResponse(request, locale);

  // 3. Remember the language, so Server Actions (which can't see the URL) and the
  //    next visit to "/" use it too.
  const response = NextResponse.next();
  if (request.cookies.get(LOCALE_COOKIE)?.value !== locale) {
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: ONE_YEAR, sameSite: "lax" });
  }
  return response;
}

export const config = {
  // Skip API routes (the logout handler included), Next.js internals and static files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)"],
};
