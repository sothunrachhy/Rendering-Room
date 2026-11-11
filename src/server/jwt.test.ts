import { describe, expect, it } from "vitest";
import { readSession, sessionPredatesPasswordChange, signSession } from "./jwt";

process.env.SESSION_SECRET = "test-secret-for-unit-tests-only-0123456789";

describe("session tokens", () => {
  it("round-trip the user id and issue time", async () => {
    const token = await signSession("user-1", new Date(Date.now() + 60_000));
    const session = await readSession(token);
    expect(session?.userId).toBe("user-1");
    expect(session?.issuedAt).toBeCloseTo(Date.now() / 1000, -1);
  });

  it("carry the role when given, and ignore unknown roles", async () => {
    const withRole = await signSession("user-1", new Date(Date.now() + 60_000), "LANDLORD");
    expect((await readSession(withRole))?.role).toBe("LANDLORD");
    const withoutRole = await signSession("user-1", new Date(Date.now() + 60_000));
    expect((await readSession(withoutRole))?.role).toBeUndefined();
  });

  it("reject tampered or expired tokens", async () => {
    const token = await signSession("user-1", new Date(Date.now() + 60_000));
    expect(await readSession(`${token}x`)).toBeNull();
    expect(await readSession(await signSession("user-1", new Date(Date.now() - 1000)))).toBeNull();
    expect(await readSession(undefined)).toBeNull();
  });
});

describe("sessionPredatesPasswordChange", () => {
  const changedAt = new Date("2026-11-03T10:00:00.750Z");
  const changedSeconds = Math.floor(changedAt.getTime() / 1000);

  it("rejects sessions from before the change", () => {
    expect(sessionPredatesPasswordChange(changedSeconds - 1, changedAt)).toBe(true);
  });

  it("keeps sessions from the same second or later (iat has whole seconds only)", () => {
    expect(sessionPredatesPasswordChange(changedSeconds, changedAt)).toBe(false);
    expect(sessionPredatesPasswordChange(changedSeconds + 60, changedAt)).toBe(false);
  });

  it("never rejects when the password was never changed", () => {
    expect(sessionPredatesPasswordChange(0, null)).toBe(false);
  });
});
