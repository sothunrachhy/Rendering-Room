import { expect, test } from "@playwright/test";
import { switchLanguage, WORKED_EXAMPLE_SEARCH } from "./helpers";

test.describe("Khmer browser", () => {
  test.use({ locale: "km-KH" }); // sends Accept-Language: km-KH

  test("gets the Khmer site, and the flag menu switches to English and back", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/km");
    await expect(page.locator("html")).toHaveAttribute("lang", "km");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("ជិតសាកលវិទ្យាល័យ");

    await switchLanguage(page, "English");
    await expect(page).toHaveURL("/en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("near your university");
    await page.goto("/");
    await expect(page).toHaveURL("/en"); // the choice is remembered

    await switchLanguage(page, "ខ្មែរ");
    await expect(page).toHaveURL("/km");
  });
});

test("search results in Khmer, with the price symbol after the number", async ({ page }) => {
  await page.goto(WORKED_EXAMPLE_SEARCH.replace("/en/", "/km/"));
  await expect(page.getByRole("heading", { name: "ស្វែងរកបន្ទប់", level: 1 })).toBeVisible();
  await expect(page.getByText(/រកឃើញបន្ទប់ \d+/)).toBeVisible();
  await expect(page.getByText("110$").first()).toBeVisible();
});

test("switching language keeps the current page and filters", async ({ page }) => {
  await page.goto(WORKED_EXAMPLE_SEARCH);
  await switchLanguage(page, "ខ្មែរ");
  await expect(page).toHaveURL(/\/km\/rooms\?campus=rupp&budget=120&distance=3$/);
});

test("Khmer pages render the same in the browser as on the server", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(WORKED_EXAMPLE_SEARCH.replace("/en/", "/km/"));
  await page.getByRole("link", { name: /^Room B/ }).click();
  await expect(page.getByText("ចំណាយសរុបប៉ាន់ស្មានក្នុងមួយខែ")).toBeVisible();
  expect(errors.filter((e) => /hydrat|did not match/i.test(e))).toEqual([]);
});
