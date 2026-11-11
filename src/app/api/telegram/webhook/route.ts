import { timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { users } from "@/db/schema";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";
import { createTranslator } from "@/i18n/translator";
import { db } from "@/db";
import { sendTelegram } from "@/server/telegram";

// Telegram calls this for every message sent to the bot (set it up with setWebhook,
// see the README). Only "/start <token>", sent by the Connect Telegram link, matters.

const updateSchema = z.object({
  message: z
    .object({
      text: z.string().optional(),
      chat: z.object({ id: z.number() }),
      from: z.object({ language_code: z.string().optional() }).optional(),
    })
    .optional(),
});

/** Telegram sends the secret chosen in setWebhook; anything else is a forgery. */
function hasValidSecret(request: Request): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const received = request.headers.get("x-telegram-bot-api-secret-token");
  if (!expected || !received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!hasValidSecret(request)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const update = updateSchema.safeParse(await request.json().catch(() => null));
  const message = update.success ? update.data.message : undefined;
  // Always answer 200, otherwise Telegram keeps retrying the same update
  if (!message?.text) return NextResponse.json({ ok: true });

  const match = /^\/start\s+([a-f0-9]{32})$/.exec(message.text.trim());
  if (!match) return NextResponse.json({ ok: true });

  const chatId = String(message.chat.id);
  const [user] = await db
    .update(users)
    .set({ telegramChatId: chatId, telegramLinkToken: null })
    .where(eq(users.telegramLinkToken, match[1]))
    .returning({ name: users.name, locale: users.locale });

  const languageCode = user?.locale ?? message.from?.language_code;
  const locale = isLocale(languageCode) ? languageCode : DEFAULT_LOCALE;
  const t = createTranslator(dictionaries[locale], locale);
  await sendTelegram(
    chatId,
    user ? t("notify.connected", { name: user.name }) : t("notify.linkInvalid"),
  );

  return NextResponse.json({ ok: true });
}
