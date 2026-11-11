import "server-only";

// Telegram Bot API (https://core.telegram.org/bots/api). Without TELEGRAM_BOT_TOKEN,
// as in local development, messages are printed to the server console instead.

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_BOT_USERNAME);
}

/** Deep link that opens the bot and sends `/start <token>` when the user taps Start. */
export function telegramLink(token: string): string | null {
  const username = process.env.TELEGRAM_BOT_USERNAME;
  return username ? `https://t.me/${username}?start=${token}` : null;
}

/** Sends a message. Never throws: an alert failing must not break the user's action. */
export async function sendTelegram(chatId: string | null, text: string): Promise<void> {
  if (!chatId) return;
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.log(`\n[telegram] To chat ${chatId}:\n${text}\n`);
    return;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!response.ok) {
      console.error(`Telegram sendMessage failed: ${response.status} ${await response.text()}`);
    }
  } catch (error) {
    console.error("Telegram sendMessage failed", error);
  }
}
