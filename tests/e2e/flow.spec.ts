import { expect, type Page, test } from "@playwright/test";
import { confirmEmail, logIn, registerNewUser } from "./helpers";

// The whole life of a listing, across three people: a landlord posts a room and gets
// verified, a student asks to see it and reviews it, and an admin acts on a report.
test.describe.configure({ mode: "serial" });

// A tiny valid PNG, used as the room photo and the ID photo
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

/** "YYYY-MM-DDTHH:mm" in Phnom Penh time, `days` from now at 10:00. */
function phnomPenhInput(days: number): string {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000);
  return `${date.toISOString().slice(0, 10)}T10:00`;
}

const title = `E2E room ${Date.now()}`;
let roomUrl = "";
let landlordPage: Page;
let studentPage: Page;

test.beforeAll(async ({ browser }) => {
  landlordPage = await (await browser.newContext()).newPage();
  studentPage = await (await browser.newContext()).newPage();
});

test.afterAll(async () => {
  await landlordPage.context().close();
  await studentPage.context().close();
});

test("a new landlord posts a room with a photo", async () => {
  const page = landlordPage;
  await registerNewUser(page, { name: "Landlord Test", role: "LANDLORD" });
  await page.getByRole("link", { name: "Post a room" }).first().click();

  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill("A tidy test room near RUPP.");
  await page.getByLabel("Address").fill("#1, Street 1");
  await page.getByLabel("District").click();
  await page.getByRole("option", { name: "Toul Kork" }).click();
  await page.getByLabel("Rent per month ($)").fill("90");
  await page.getByLabel("Electricity ($ per kWh)").fill("0.25");

  // Forgetting the map pin is caught
  await page.getByRole("button", { name: "Post room" }).click();
  await expect(page.getByText("Click the map to place the room").last()).toBeVisible();

  const map = page.locator(".leaflet-container");
  await expect(map).toBeVisible();
  await map.click(); // the map opens centred on RUPP
  await page.getByRole("button", { name: "Post room" }).click();
  await expect(page).toHaveURL(/\/en\/listings\/[0-9a-f-]{36}\?created=1$/);

  await page.locator('input[type="file"]').setInputFiles({
    name: "room.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await expect(page.getByText("Photo added")).toBeVisible();
  await expect(page.getByText("Cover", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "View listing" }).click();
  await expect(page).toHaveURL(/\/en\/rooms\/[0-9a-f-]{36}$/);
  roomUrl = new URL(page.url()).pathname;
  await expect(page.getByText("This room isn't available right now.")).toBeVisible();
});

test("the room stays hidden from students until an admin verifies the landlord", async ({
  page,
}) => {
  // Not verified yet: students get a 404
  await page.goto(roomUrl);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();

  // The landlord uploads an ID photo
  await landlordPage.goto("/en/settings");
  // The upload starts from a React change handler, so wait until the page is interactive
  await landlordPage.waitForLoadState("networkidle");
  await landlordPage.locator("#id-document").setInputFiles({
    name: "id.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await expect(landlordPage.getByText("ID uploaded. An admin will check it soon.")).toBeVisible();
  await expect(landlordPage.getByText("Being checked")).toBeVisible();

  // The admin approves it
  await logIn(page, "admin");
  await page.goto("/en/admin/landlords");
  const card = page.locator("li", { hasText: "Landlord Test" }).last();
  await card.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Landlord Test is verified")).toBeVisible();

  // Now everyone can find it
  await page.context().clearCookies();
  await page.goto(roomUrl);
  await expect(page.getByRole("heading", { name: title, level: 1 })).toBeVisible();
  await page.goto("/en/rooms?campus=rupp&budget=100&distance=1");
  await expect(page.getByRole("link", { name: title })).toBeVisible();
});

test("a student saves the room and asks to view it", async () => {
  const page = studentPage;
  const { email } = await registerNewUser(page, { name: "Student Test" });
  await page.goto(roomUrl);
  await page.waitForLoadState("networkidle"); // buttons work once React has loaded

  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
  // The button flips instantly; wait for the server to confirm before leaving the page
  await expect(page.getByText("Room saved")).toBeVisible();
  await page.goto("/en/saved");
  await expect(page.getByRole("link", { name: title })).toBeVisible();

  // No viewing requests from unconfirmed email addresses
  await page.goto(roomUrl);
  await expect(page.getByText(/Confirm your email address/).first()).toBeVisible();
  await expect(page.getByLabel("Preferred date and time")).toHaveCount(0);
  await confirmEmail(page, email);

  await page.goto(roomUrl);
  await page.getByLabel("Preferred date and time").fill(phnomPenhInput(3));
  await page.getByLabel("Message").fill("Can I come after class?");
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByText("Request sent. The landlord will reply soon.")).toBeVisible();
  await expect(page.getByText(/Waiting for the landlord/)).toBeVisible();
  // Reviews unlock only after an accepted viewing
  await expect(page.getByText("You can review this room after the landlord accepts")).toBeVisible();
});

test("the landlord accepts, and the student sees the phone number and can review", async () => {
  await landlordPage.goto("/en/requests");
  const request = landlordPage.locator("li", { hasText: "Student Test" });
  await expect(request).toContainText("Can I come after class?");
  await request.getByLabel("Reply to the student").fill("See you at the gate!");
  await request.getByRole("button", { name: "Accept" }).click();
  await expect(landlordPage.getByText("Viewing accepted")).toBeVisible();

  const page = studentPage;
  await page.goto("/en/requests");
  const mine = page.locator("li", { hasText: title });
  await expect(mine).toContainText("Accepted");
  await expect(mine).toContainText("See you at the gate!");
  await expect(mine.getByRole("link", { name: /Call 012345678/ })).toBeVisible();

  await page.goto(roomUrl);
  // Click the fourth star, like a person would (the radio input itself is visually hidden)
  await page.locator("label", { has: page.getByRole("radio", { name: "4 stars" }) }).click();
  await expect(page.getByRole("radio", { name: "4 stars" })).toBeChecked();
  await page.getByLabel("Comment").fill("Exactly like the photos.");
  await page.getByRole("button", { name: "Post review" }).click();
  await expect(page.getByText("Review saved")).toBeVisible();
  await expect(page.locator("#reviews li", { hasText: "Exactly like the photos." })).toBeVisible();
  await expect(page.getByText("4.0 out of 5")).toBeVisible();
});

test("a report reaches the admin, who hides the room", async ({ page }) => {
  await studentPage.goto(roomUrl);
  await studentPage.getByRole("button", { name: "Report this listing" }).click();
  await studentPage.getByLabel("Reason").click();
  await studentPage.getByRole("option", { name: "Wrong price" }).click();
  await studentPage.getByLabel("Details").fill("The rent at the visit was higher.");
  await studentPage.getByRole("button", { name: "Send report" }).click();
  await expect(studentPage.getByText("Thank you. An admin will check this listing.")).toBeVisible();

  await logIn(page, "admin");
  await page.goto("/en/admin/reports");
  const report = page.locator("li", { hasText: title });
  await expect(report).toContainText("The rent at the visit was higher.");
  await report.getByRole("button", { name: "Hide room" }).click();
  await expect(page.getByText("Listing hidden")).toBeVisible();
  await report.getByRole("button", { name: "Resolve" }).click();
  await expect(page.getByText("Report resolved")).toBeVisible();

  // Gone for students, still visible (marked hidden) for its landlord
  await studentPage.goto(roomUrl);
  await expect(studentPage.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await landlordPage.goto("/en/listings");
  await expect(landlordPage.locator("li", { hasText: title })).toContainText("Hidden by an admin");
});
