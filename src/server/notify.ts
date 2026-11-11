import "server-only";
import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { DEFAULT_LOCALE, isLocale, type Locale, localePath } from "@/i18n/config";
import { dictionaries } from "@/i18n/dictionaries";
import { createTranslator, type Translator } from "@/i18n/translator";
import { appUrl } from "@/lib/app-url";
import { db } from "@/db";
import { sendTelegram } from "@/server/telegram";

/**
 * Sends a Telegram alert to a user in their own language, with a link back to a page
 * of the app. Does nothing if they haven't connected Telegram. Call it inside
 * `after()` so the user's request doesn't wait for Telegram.
 */
export async function notifyUser(
  userId: string,
  message: (t: Translator, locale: Locale) => string,
  linkPath = "/requests",
): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { telegramChatId: true, locale: true },
  });
  if (!user?.telegramChatId) return;

  const locale = isLocale(user.locale) ? user.locale : DEFAULT_LOCALE;
  const t = createTranslator(dictionaries[locale], locale);
  let link = "";
  try {
    link = `\n\n${t("notify.open", { url: appUrl() + localePath(locale, linkPath) })}`;
  } catch {
    // APP_URL isn't set in production: send the alert without a link
  }
  await sendTelegram(user.telegramChatId, message(t, locale) + link);
}
