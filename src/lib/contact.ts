// Ways to reach a landlord from their phone number (stored as typed at sign-up, e.g.
// "012345678" or "+85512345678"; see the phone rule in validation.ts).

/** The number in international form, "+85512345678", or null if it isn't Cambodian. */
export function internationalPhone(phone: string): string | null {
  const match = /^(?:\+?855|0)(\d{8,9})$/.exec(phone.replace(/[\s-]/g, ""));
  return match ? `+855${match[1]}` : null;
}

/** A Telegram chat with the owner of this number (Telegram's t.me/+phone links). */
export function telegramLink(phone: string): string | null {
  const international = internationalPhone(phone);
  return international ? `https://t.me/${international}` : null;
}
