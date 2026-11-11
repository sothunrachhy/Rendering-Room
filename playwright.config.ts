import { defineConfig, devices } from "@playwright/test";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PORT = 3100;

// The test server writes emails (password reset links) to this file instead of
// sending them; tests read it through the same variable. Set on process.env so
// both the server and the test workers inherit it.
process.env.MAIL_OUTBOX ??= join(tmpdir(), "roomfinder-e2e-mail.jsonl");
process.env.APP_URL ??= `http://localhost:${PORT}`;
delete process.env.RESEND_API_KEY; // never send real email from tests
// The tests sign up dozens of accounts from one machine
process.env.SIGNUP_LIMIT_PER_HOUR ??= "1000";
// ...and fail logins on purpose; the per-account lock stays on (and is tested)
process.env.LOGIN_LIMIT_PER_IP ??= "1000";

// End-to-end tests run against a production build (`npm run build` first) and
// the local database from docker-compose.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 2 : 0,
  // Password hashing is deliberately slow, so give form submissions some headroom
  expect: { timeout: 15_000 },
  timeout: 60_000,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Run Next with the exact Node binary running Playwright (not via npm or a `node`
    // launcher shim), so stopping this process really stops the server on Windows
    command: `"${process.execPath}" node_modules/next/dist/bin/next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
