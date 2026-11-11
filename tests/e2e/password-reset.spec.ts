import { expect, type Page, test } from "@playwright/test";
import { latestEmailLink, registerNewUser } from "./helpers";

/** The reset link from the latest reset email sent to `to` (not the welcome email). */
function latestResetLink(to: string): Promise<string> {
  return latestEmailLink(to, /https?:\/\/\S+reset-password\?token=\S+/);
}

async function requestReset(page: Page, email: string) {
  await page.goto("/en/login");
  await page.getByRole("link", { name: "Forgot password?" }).click();
  await expect(page).toHaveURL(/\/en\/forgot-password$/);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByRole("status")).toContainText(`If an account exists for ${email}`);
}

test("forgot password: email link sets a new password and logs out other devices", async ({
  browser,
}) => {
  // Device 1: registers and stays signed in
  const device1 = await browser.newContext();
  const phone = await device1.newPage();
  const { email, password } = await registerNewUser(phone);

  // Device 2: forgot the password
  const device2 = await browser.newContext();
  const page = await device2.newPage();
  await requestReset(page, email);

  const link = await latestResetLink(email);
  await page.goto(link);
  await page.getByLabel("New password", { exact: true }).fill("a-fresh-password-1");
  await page.getByLabel("Confirm new password").fill("a-fresh-password-1");
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(page).toHaveURL(/\/en$/); // signed in with the new password, on the home page

  // The link only works once
  await page.goto(link);
  await page.getByLabel("New password", { exact: true }).fill("another-password-2");
  await page.getByLabel("Confirm new password").fill("another-password-2");
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(
    page.getByText("This reset link is invalid, already used, or expired."),
  ).toBeVisible();

  // Device 1's old session no longer works
  await phone.goto("/en/saved");
  await expect(phone).toHaveURL(/\/en\/login/);

  // The old password is rejected, the new one works
  await phone.getByLabel("Email").fill(email);
  await phone.getByLabel("Password").fill(password);
  await phone.getByRole("button", { name: "Log in" }).click();
  await expect(phone.getByText("Invalid email or password")).toBeVisible();
  await phone.getByLabel("Password").fill("a-fresh-password-1");
  await phone.getByRole("button", { name: "Log in" }).click();
  // The expired session went through /logout, which starts over at the student's home
  await expect(phone).toHaveURL(/\/en\/rooms$/);

  await device1.close();
  await device2.close();
});

test("forgot password doesn't reveal whether an email has an account", async ({ page }) => {
  // Same message as for a real account
  await requestReset(page, `nobody-${Date.now()}@example.com`);
});

test("a made-up reset link is rejected", async ({ page }) => {
  await page.goto("/en/reset-password?token=not-a-real-token-1234567890");
  await page.getByLabel("New password", { exact: true }).fill("a-fresh-password-1");
  await page.getByLabel("Confirm new password").fill("a-fresh-password-1");
  await page.getByRole("button", { name: "Set new password" }).click();
  await expect(
    page.getByText("This reset link is invalid, already used, or expired."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Request a new link" })).toBeVisible();
});

test("changing the password in Settings logs out other devices but not this one", async ({
  browser,
}) => {
  const laptopContext = await browser.newContext();
  const laptop = await laptopContext.newPage();
  const { email, password } = await registerNewUser(laptop);

  const phoneContext = await browser.newContext();
  const phone = await phoneContext.newPage();
  await phone.goto("/en/login");
  await phone.getByLabel("Email").fill(email);
  await phone.getByLabel("Password").fill(password);
  await phone.getByRole("button", { name: "Log in" }).click();
  await expect(phone).toHaveURL(/\/en\/rooms$/);

  await laptop.goto("/en/settings");
  await laptop.getByLabel("Current password").fill(password);
  await laptop.getByLabel("New password", { exact: true }).fill("changed-password-9");
  await laptop.getByLabel("Confirm new password").fill("changed-password-9");
  await laptop.getByRole("button", { name: "Change password" }).click();
  await expect(laptop.getByText("Password changed")).toBeVisible();

  await laptop.goto("/en/saved");
  await expect(laptop).toHaveURL(/\/en\/saved$/); // still signed in here
  await phone.goto("/en/saved");
  await expect(phone).toHaveURL(/\/en\/login/); // logged out there

  await laptopContext.close();
  await phoneContext.close();
});
