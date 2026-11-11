import { expect, test } from "@playwright/test";
import { registerNewUser, logIn } from "./helpers";

test("profile, password change and account deletion", async ({ page }) => {
  const { email, password } = await registerNewUser(page, { name: "Dara Test" });
  await page.goto("/en/settings");

  await page.getByLabel("Full name").fill("Dara B. Test");
  await page.getByLabel("Phone").fill("not a phone");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Enter a phone number, like 012 345 678")).toBeVisible();
  await page.getByLabel("Phone").fill("+855 12 999 888");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved")).toBeVisible();

  // Telegram isn't configured in tests: the card says so instead of offering a broken link
  await expect(page.getByText("Telegram alerts aren't set up on this server yet.")).toBeVisible();

  // Wrong current password, then a real change
  await page.getByLabel("Current password").fill("not-my-password");
  await page.getByLabel("New password", { exact: true }).fill("brand-new-password");
  await page.getByLabel("Confirm new password").fill("brand-new-password");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Current password is incorrect")).toBeVisible();

  await page.getByLabel("Current password").fill(password);
  await page.getByLabel("New password", { exact: true }).fill("brand-new-password");
  await page.getByLabel("Confirm new password").fill("brand-new-password");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password changed")).toBeVisible();

  // Delete the account; the credentials stop working
  await page.getByRole("button", { name: "Delete account" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByRole("button", { name: "Delete forever" })).toBeDisabled();
  await dialog.getByLabel("Type DELETE to confirm").fill("DELETE");
  await dialog.getByRole("button", { name: "Delete forever" }).click();
  await expect(page).toHaveURL("/en");

  await page.goto("/en/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("brand-new-password");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Invalid email or password")).toBeVisible();
});

test("theme choice is remembered across reloads", async ({ page }) => {
  // The toggle is in every page's header; one click switches light ↔ dark
  await page.goto("/en/rooms");
  const toggle = page.getByRole("button", { name: "Dark mode" });
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await toggle.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  // Same choice on the signed-in pages
  await logIn(page, "dara");
  await page.goto("/en/saved");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Dark mode" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});
