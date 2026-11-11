import { describe, expect, it } from "vitest";
import { acceptBlock, isPubliclyVisible, photoAccess, reportBlock } from "./policies";

const listed = { hidden: false, landlordId: "landlord", landlordVerification: "VERIFIED" as const };
const hidden = { ...listed, hidden: true };
const unverified = { ...listed, landlordVerification: "PENDING" as const };

describe("isPubliclyVisible", () => {
  it("needs a visible room and a verified landlord", () => {
    expect(isPubliclyVisible(listed)).toBe(true);
    expect(isPubliclyVisible(hidden)).toBe(false);
    expect(isPubliclyVisible(unverified)).toBe(false);
    expect(isPubliclyVisible({ ...listed, landlordVerification: "REJECTED" })).toBe(false);
  });
});

describe("photoAccess", () => {
  const student = { id: "student", role: "STUDENT" as const };
  const owner = { id: "landlord", role: "LANDLORD" as const };
  const otherLandlord = { id: "someone-else", role: "LANDLORD" as const };
  const admin = { id: "admin", role: "ADMIN" as const };

  it("serves a listed room's photos to anyone, cacheable", () => {
    expect(photoAccess(listed, null)).toBe("public");
    expect(photoAccess(listed, student)).toBe("public");
  });

  it("hides a hidden or unverified room's photos from the public", () => {
    for (const room of [hidden, unverified]) {
      expect(photoAccess(room, null)).toBe("denied");
      expect(photoAccess(room, student)).toBe("denied");
      expect(photoAccess(room, otherLandlord)).toBe("denied");
    }
  });

  it("still shows them to the owning landlord and admins, privately", () => {
    for (const room of [hidden, unverified]) {
      expect(photoAccess(room, owner)).toBe("private");
      expect(photoAccess(room, admin)).toBe("private");
    }
  });
});

describe("reportBlock", () => {
  it("allows a first report on someone else's listed room", () => {
    expect(reportBlock({ landlordId: "landlord" }, "student", false)).toBeNull();
  });

  it("refuses rooms that aren't listed, your own room, and repeat open reports", () => {
    expect(reportBlock(null, "student", false)).toBe("roomNotFound");
    expect(reportBlock({ landlordId: "landlord" }, "landlord", false)).toBe("ownRoom");
    expect(reportBlock({ landlordId: "landlord" }, "student", true)).toBe("alreadyReported");
  });
});

describe("acceptBlock", () => {
  it("lets a verified landlord accept on a visible room", () => {
    expect(acceptBlock({ hidden: false }, "VERIFIED")).toBeNull();
  });

  it("refuses on a hidden room or for an unverified landlord", () => {
    expect(acceptBlock({ hidden: true }, "VERIFIED")).toBe("roomHidden");
    expect(acceptBlock({ hidden: false }, "PENDING")).toBe("landlordUnverified");
    expect(acceptBlock({ hidden: false }, "REJECTED")).toBe("landlordUnverified");
  });
});
