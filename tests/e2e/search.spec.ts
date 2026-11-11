import { expect, test } from "@playwright/test";
import { WORKED_EXAMPLE_SEARCH } from "./helpers";

test("ranks rooms exactly like the worked example on the slides", async ({ page }) => {
  await page.goto(WORKED_EXAMPLE_SEARCH);

  const cards = page.locator("main article");
  const titles = await cards.locator("h3").allTextContents();
  const roomA = titles.findIndex((t) => t.startsWith("Room A"));
  const roomB = titles.findIndex((t) => t.startsWith("Room B"));
  expect(roomA).toBeGreaterThanOrEqual(0);
  expect(roomB).toBeLessThan(roomA); // B (0.60) ranks above A (0.58)

  await expect(cards.nth(roomB)).toContainText("60% match");
  await expect(cards.nth(roomB)).toContainText("500 m from RUPP");
  await expect(cards.nth(roomA)).toContainText("58% match");
  await expect(cards.nth(roomA)).toContainText("1.2 km from RUPP");
});

test("hides rented rooms, over-budget rooms and unverified landlords", async ({ page }) => {
  await page.goto(WORKED_EXAMPLE_SEARCH);
  const main = page.locator("main");
  await expect(main.locator("article").first()).toBeVisible();
  await expect(main).not.toContainText("Rented: corner room"); // rented
  await expect(main).not.toContainText("New room waiting for verification"); // unverified landlord
  await expect(main).not.toContainText("Studio with balcony"); // $180 > $120
});

test("filters by who can rent and by facilities, from the URL form", async ({ page }) => {
  await page.goto("/en/rooms?campus=rupp&budget=300&distance=5");
  await page.getByText("Filters", { exact: true }).click();
  // Filters in the panel apply as soon as they change (no second Search button)
  await page.getByLabel("Who can rent").click();
  await page.getByRole("option", { name: "Open to women" }).click();
  await expect(page).toHaveURL(/gender=FEMALE/);
  await page.getByLabel("Security guard").check();
  await expect(page).toHaveURL(/facilities=securityGuard/);
  await expect(page).toHaveURL(/gender=FEMALE/);
  const results = page.locator("main article h3");
  await expect(
    results.filter({ hasText: "Female-only shared room near Boeung Kak" }),
  ).toBeVisible();
  await expect(results.filter({ hasText: "Male-only shared room for two" })).toHaveCount(0);
  await expect(results.filter({ hasText: /^Room A/ })).toHaveCount(0); // no guard
});

test("a room page shows the full monthly cost, distance and reviews", async ({ page }) => {
  await page.goto(WORKED_EXAMPLE_SEARCH);
  await page.getByRole("link", { name: /^Room B/ }).click();
  await expect(page.getByRole("heading", { name: /^Room B/, level: 1 })).toBeVisible();

  // $110 rent + 80 kWh × $0.25 + 4 m³ × $0.50 + $3 rubbish = $135
  await expect(page.getByText("Estimated monthly total")).toBeVisible();
  await expect(page.getByText("≈ $135", { exact: true })).toBeVisible();
  await expect(page.getByText("Deposit (paid once)")).toBeVisible();
  await expect(page.getByText("500 m from RUPP").first()).toBeVisible();
  await expect(page.getByText("Verified landlord")).toBeVisible();
  await expect(page.getByText("Very close to campus")).toBeVisible();
  // Phone stays private until a viewing is accepted
  await expect(page.getByText("012345678")).toHaveCount(0);
  // The map loads in the browser
  // (the search page's map stays mounted but hidden, for an instant Back)
  await expect(page.locator(".leaflet-container:visible")).toBeVisible();
});

test("the home page search goes to results", async ({ page }) => {
  await page.goto("/en");
  await page.waitForLoadState("networkidle");
  await page.getByRole("combobox", { name: "Budget / month" }).click();
  await page.getByRole("option", { name: "Up to $200" }).click();
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/rooms\?distance=3&campus=rupp&type=any&budget=200/);
  await expect(page.getByRole("heading", { name: /rooms? found/ })).toBeVisible();
});
