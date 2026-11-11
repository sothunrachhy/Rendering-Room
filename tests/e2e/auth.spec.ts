import { expect, test } from "@playwright/test";
import { logIn, registerNewUser } from "./helpers";

test("signed-out visitors are sent to login, then back where they were going", async ({ page }) => {
  await page.goto("/en/saved");
  await expect(page).toHaveURL(/\/en\/login\?next=%2Fen%2Fsaved$/);

  await page.getByLabel("Email").fill("dara@roomfinder.local");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/en\/saved$/);
});

test("students land on search, landlords on their rooms, admins on the overview", async ({
  page,
}) => {
  await registerNewUser(page, { role: "STUDENT" });
  await expect(page.getByRole("heading", { name: "Find a room", level: 1 })).toBeVisible();

  await page.context().clearCookies();
  await registerNewUser(page, { role: "LANDLORD" });
  await expect(page.getByRole("heading", { name: "My rooms" })).toBeVisible();
  await expect(
    page.getByText("Your rooms are hidden from students until you verify"),
  ).toBeVisible();

  await page.context().clearCookies();
  await logIn(page, "admin");
  await expect(page).toHaveURL(/\/en\/admin$/);
});

test("pages for other roles don't exist for you", async ({ page }) => {
  await logIn(page, "dara");
  await page.goto("/en/admin");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.goto("/en/listings");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("register shows validation errors and rejects duplicate emails", async ({ page }) => {
  await page.goto("/en/register");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Name is required")).toBeVisible();
  await expect(page.getByText("Email is required")).toBeVisible();
  await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();

  await page.getByLabel("Full name").fill("Someone");
  await page.getByLabel("Email").fill("dara@roomfinder.local");
  await page.getByLabel(/^Phone/).fill("123");
  await page.getByLabel("Password").fill("long-enough-pw");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Enter a phone number, like 012 345 678")).toBeVisible();

  await page.getByLabel(/^Phone/).fill("");
  // The password is never sent back to the browser, so it has to be typed again
  await page.getByLabel("Password").fill("long-enough-pw");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("An account with this email already exists")).toBeVisible();
});

test("wrong password gives one message, and log out works", async ({ page }) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("dara@roomfinder.local");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Invalid email or password")).toBeVisible();

  await logIn(page, "dara");
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await page.goto("/en/saved");
  await expect(page).toHaveURL(/\/en\/login/);
});
