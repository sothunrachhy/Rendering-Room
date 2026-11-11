import { expect, test } from "@playwright/test";
import { logIn, WORKED_EXAMPLE_SEARCH } from "./helpers";

// Regression tests for the findings in the RoomFinder QA report (6 Nov 2026).

test("#1 repeated wrong passwords lock the account for a while", async ({ page }) => {
  const email = `locked-${Date.now()}@example.com`;
  await page.goto("/en/login");
  await page.waitForLoadState("networkidle"); // type only once the form is interactive
  await page.getByLabel("Email").fill(email);
  for (let attempt = 1; attempt <= 5; attempt++) {
    await page.getByLabel("Password").fill(`wrong-password-${attempt}`);
    // Each attempt must finish before the next, or the clicks pile up while pending
    await Promise.all([
      page.waitForResponse((response) => response.request().method() === "POST"),
      page.getByRole("button", { name: "Log in" }).click(),
    ]);
    await expect(page.getByText("Invalid email or password")).toBeVisible();
  }
  await page.getByLabel("Password").fill("wrong-password-6");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText(/Too many attempts\. Try again in \d+ minutes?\./)).toBeVisible();
});

test("#2 #12 #13 sign-up rejects weak passwords and markup names, with clear messages", async ({
  page,
}) => {
  await page.goto("/en/register");
  await page.getByLabel("Full name").fill("<img src=x onerror=alert(1)>");
  await page.getByLabel("Password").fill("12345678");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Email is required")).toBeVisible();
  await expect(page.getByText(/Too easy to guess/)).toBeVisible();
  await expect(page.getByText(/Names can't contain symbols/)).toBeVisible();
});

test("#3 room pages have their own title and a share preview", async ({ page }) => {
  await page.goto(WORKED_EXAMPLE_SEARCH);
  const href = await page.getByRole("link", { name: /^Room B/ }).getAttribute("href");
  // A fresh load, as a link shared on Telegram would be
  await page.goto(href!);
  await expect(page).toHaveTitle("Room B · Bright room 5 minutes from RUPP · RoomFinder");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /^Room B/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    /\/api\/photos\//,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="km"]')).toHaveAttribute(
    "href",
    /\/km\/rooms\/[0-9a-f-]{36}$/,
  );
});

test("#4 #5 missing pages get a real 404 and the branded page in both languages", async ({
  page,
}) => {
  for (const path of [
    "/en/rooms/not-a-uuid",
    "/en/rooms/00000000-0000-4000-8000-000000000000",
    "/en/abc",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  }

  const khmer = await page.goto("/km/abc");
  expect(khmer?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "រកមិនឃើញទំព័រ" })).toBeVisible();
});

test("#4 other roles' pages are a real 404 and don't reveal their title", async ({ page }) => {
  await logIn(page, "dara");
  for (const path of ["/en/admin", "/en/admin/landlords", "/en/listings", "/en/listings/new"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
    await expect(page).not.toHaveTitle(/Admin|Verify landlords|My rooms|Post a room/);
  }
});

test("#6 cancelling a viewing request asks first", async ({ page }) => {
  await logIn(page, "dara"); // has a waiting request in the sample data
  await page.goto("/en/requests");
  await page.getByRole("button", { name: "Cancel request" }).first().click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("Cancel this viewing request?");
  await dialog.getByRole("button", { name: "Keep it" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Waiting").first()).toBeVisible();
});

test("#7 the phone hint matches the chosen role", async ({ page }) => {
  await page.goto("/en/register");
  await expect(page.getByText(/Shared with a landlord when you ask to view/)).toBeVisible();
  await page.getByText("Renting out rooms").click();
  await expect(page.getByText(/Shown to students only after you accept/)).toBeVisible();
});

test("#9 #14 cards show the cost with bills, and Khmer pages use Khmer units", async ({ page }) => {
  await page.goto(WORKED_EXAMPLE_SEARCH);
  const roomB = page.locator("main article", { hasText: "Room B" });
  await expect(roomB).toContainText("≈ $135 with bills");
  await expect(page.getByText(/rent up to \$120 a month\. Each room also shows/)).toBeVisible();

  await page.goto(WORKED_EXAMPLE_SEARCH.replace("/en/", "/km/"));
  await expect(page.locator("main article", { hasText: "Room B" })).toContainText("500 ម");
});

test("#15 the account menu reaches every page", async ({ page }) => {
  await logIn(page, "dara");
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("menuitem", { name: "Saved rooms" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Viewing requests" })).toBeVisible();
});

test("#16 #17 footer, legal pages, robots.txt and sitemap.xml", async ({ page, request }) => {
  await page.goto("/en");
  await page.getByRole("contentinfo").getByRole("link", { name: "Privacy" }).click();
  await expect(page.getByRole("heading", { name: "Privacy", level: 1 })).toBeVisible();
  await expect(page.getByText(/ID photos are seen only by RoomFinder admins/)).toBeVisible();

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/Sitemap: .*\/sitemap\.xml/);

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain("/km/rooms");
  expect(xml).toMatch(/hreflang="km"/);
});

// Second QA report (10 Nov 2026)

test("F-02 an out-of-range rent says so instead of being changed quietly", async ({ page }) => {
  await page.goto("/en/rooms");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Max rent per month").fill("5000");
  await page.getByRole("button", { name: "Search" }).first().click();
  await expect(page.getByText("Enter a rent from $10 to $2,000")).toBeVisible();
  await expect(page).not.toHaveURL(/budget=5000/);
});

test("F-03 invalid link values are named and the address bar is corrected", async ({ page }) => {
  await page.goto("/en/rooms?campus=xyz&budget=abc&distance=999");
  await expect(page.getByText(/Some values in this link weren't valid/)).toBeVisible();
  await expect(page).toHaveURL(/\/en\/rooms\?campus=rupp&budget=150&distance=12$/);
});

test("F-05 rooms with bills included say so", async ({ page }) => {
  await page.goto("/en/rooms?campus=rupp&budget=150&distance=3");
  const room = page.locator("main article", { hasText: "Female-only shared room" });
  await expect(room).toContainText("Bills included");
});

test("U-09 U-11 the 404 page has the site header; sign-up links the terms", async ({ page }) => {
  await page.goto("/en/nothing-here");
  await expect(page.getByRole("banner").getByRole("link", { name: "Browse rooms" })).toBeVisible();

  await page.goto("/en/register");
  await expect(page.getByRole("link", { name: "Terms of use" })).toHaveAttribute(
    "href",
    "/en/terms",
  );
});

test("A-02 A-03 role radios and dropdowns are named by their visible labels", async ({ page }) => {
  await page.goto("/en/register");
  await expect(page.getByRole("radio", { name: /Landlord/ })).toBeVisible();
  await page.goto("/en/rooms");
  await expect(page.getByRole("combobox", { name: "Max distance" })).toBeVisible();
});
