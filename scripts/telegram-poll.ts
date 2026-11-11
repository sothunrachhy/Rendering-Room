// Local development only: Telegram can't reach a webhook on localhost, so this asks
// Telegram for new bot messages (long polling) and forwards each one to the app's
// webhook route, exactly as Telegram would in production.
//
//   npm run dev            (in one terminal)
//   npm run telegram:poll  (in another)
import "dotenv/config";

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");

if (!token || !secret) {
  console.error("Set TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET in .env first.");
  process.exit(1);
}

const api = (method: string) => `https://api.telegram.org/bot${token}/${method}`;

async function main() {
  // getUpdates doesn't work while a webhook is set (e.g. from a deployed copy)
  await fetch(api("deleteWebhook"));
  console.log(`Polling Telegram and forwarding to ${appUrl}/api/telegram/webhook (Ctrl+C to stop)`);

  let offset = 0;
  for (;;) {
    try {
      const response = await fetch(`${api("getUpdates")}?timeout=30&offset=${offset}`);
      const body = (await response.json()) as { ok: boolean; result?: { update_id: number }[] };
      for (const update of body.result ?? []) {
        offset = update.update_id + 1;
        const forwarded = await fetch(`${appUrl}/api/telegram/webhook`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Telegram-Bot-Api-Secret-Token": secret!,
          },
          body: JSON.stringify(update),
        });
        console.log(`update ${update.update_id} -> ${forwarded.status}`);
      }
    } catch (error) {
      console.error("Polling failed, retrying in 5 s:", (error as Error).message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

main();
