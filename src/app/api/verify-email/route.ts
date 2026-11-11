import { type NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { consumeVerificationToken, verifiedPath } from "@/server/email-verification";

// The link in the "confirm your email" message: /api/verify-email?token=…&lang=km
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lang = searchParams.get("lang");
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const token = searchParams.get("token") ?? "";

  const ok = token.length > 0 && token.length <= 200 && (await consumeVerificationToken(token));
  return NextResponse.redirect(new URL(verifiedPath(locale, ok), request.url));
}
