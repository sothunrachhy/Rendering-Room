// Rejects passwords that are long enough but trivial to guess. A short blocklist of
// the most-used passwords plus a few patterns; not a full strength meter.

const COMMON = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "87654321",
  "password",
  "password1",
  "password12",
  "password123",
  "passw0rd",
  "qwerty123",
  "qwertyuiop",
  "11111111",
  "00000000",
  "abcd1234",
  "abc12345",
  "iloveyou",
  "admin123",
  "admin1234",
  "letmein1",
  "welcome1",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "asdfghjkl",
  "zxcvbnm1",
  "1q2w3e4r",
  "1qaz2wsx",
  "roomfinder",
  "cambodia",
  "phnompenh",
]);

export function isWeakPassword(password: string): boolean {
  const value = password.trim().toLowerCase();
  if (COMMON.has(value)) return true;
  if (/^(.)\1+$/.test(value)) return true; // "aaaaaaaa"
  if (/^\d+$/.test(value)) return true; // only digits, like a phone number or birthday
  return false;
}
