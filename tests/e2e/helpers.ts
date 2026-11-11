import { readFile } from "node:fs/promises";
import { expect, type Page } from "@playwright/test";

// The end-to-end tests run against a database filled by `npm run db:seed`. They only
// read the seeded rooms and accounts; anything they change belongs to users they create.

export const SEED_PASSWORD = "password123";

/** Opens the flag menu in the header and picks a language ("English" or "ខ្មែរ"). */
export async function switchLanguage(page: Page, language: "English" | "ខ្មែរ") {
  // The menu only opens once the page has hydrated
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: /^(Language|ភាសា):/ }).click();
  await page.getByRole("menuitemradio", { name: language }).click();
}

/** Registers a brand-new user (unique email per call) and lands on their home page. */
export async function registerNewUser(
  page: Page,
  { name = "Test User", role = "STUDENT" }: { name?: string; role?: "STUDENT" | "LANDLORD" } = {},
) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = "correct-horse-42";

  await page.goto("/en/register");
  if (role === "LANDLORD") await page.getByText("Renting out rooms").click();
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/^Phone/).fill("012 345 678");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(role === "LANDLORD" ? /\/en\/listings$/ : /\/en\/rooms$/);

  return { email, password };
}

/**
 * The most recent link of one kind in emails sent to `to`. The test server writes
 * emails to the MAIL_OUTBOX file instead of sending them (see playwright.config.ts).
 */
export async function latestEmailLink(to: string, pattern: RegExp): Promise<string> {
  const links = async () => {
    const outbox = await readFile(process.env.MAIL_OUTBOX!, "utf8").catch(() => "");
    return outbox
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { to: string; text: string })
      .filter((email) => email.to === to)
      .map((email) => email.text.match(pattern)?.[0])
      .filter((link): link is string => Boolean(link));
  };
  // Emails go out just after the response, so give them a moment
  await expect.poll(async () => (await links()).length).toBeGreaterThan(0);
  return (await links()).at(-1)!;
}

/** Opens the link from the welcome email, as a new user would. */
export async function confirmEmail(page: Page, email: string) {
  const link = await latestEmailLink(email, /https?:\/\/\S+\/api\/verify-email\?\S+/);
  await page.goto(link);
  await expect(page.getByText("Email confirmed")).toBeVisible();
}

/** Logs in with a seeded account, e.g. logIn(page, "sokha"). */
export async function logIn(
  page: Page,
  who: "admin" | "sokha" | "vanna" | "chenda" | "dara" | "sophea",
) {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill(`${who}@roomfinder.local`);
  await page
    .getByLabel("Password")
    .fill(who === "admin" ? (process.env.SEED_ADMIN_PASSWORD ?? "admin12345") : SEED_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** The worked example from the slides: RUPP, $120 budget, 3 km. */
export const WORKED_EXAMPLE_SEARCH = "/en/rooms?campus=rupp&budget=120&distance=3";
