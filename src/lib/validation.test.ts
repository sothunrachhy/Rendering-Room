import { describe, expect, it } from "vitest";
import { toPhnomPenhInput } from "./time";
import {
  changePasswordSchema,
  registerSchema,
  reviewSchema,
  roomSchema,
  viewingRequestSchema,
} from "./validation";

const roomId = "0b8c6f1e-3d7a-4c1b-9a2e-5f6d7e8c9b0a";

describe("registerSchema", () => {
  const base = { name: " Dara ", email: "  Dara@Example.COM ", phone: "", role: "STUDENT" };

  it("normalizes email and treats an empty phone as none", () => {
    expect(registerSchema.parse({ ...base, password: "long-enough" })).toEqual({
      name: "Dara",
      email: "dara@example.com",
      phone: null,
      password: "long-enough",
      role: "STUDENT",
    });
  });

  it("accepts Cambodian phone numbers in common formats", () => {
    for (const phone of ["012 345 678", "+855 12 345 678", "097-123-4567"]) {
      expect(registerSchema.safeParse({ ...base, phone, password: "long-enough" }).success).toBe(
        true,
      );
    }
    expect(
      registerSchema.safeParse({ ...base, phone: "12345", password: "long-enough" }).success,
    ).toBe(false);
  });

  it("says an empty email is required, not invalid", () => {
    const result = registerSchema.safeParse({ ...base, email: "  ", password: "long-enough" });
    expect(result.error?.issues.map((i) => i.message)).toContain("validation.emailRequired");
    expect(result.error?.issues.map((i) => i.message)).not.toContain("validation.email");
  });

  it("rejects easily guessed passwords", () => {
    const result = registerSchema.safeParse({ ...base, password: "12345678" });
    expect(result.error?.issues.map((i) => i.message)).toContain("validation.passwordWeak");
  });

  it("rejects markup in names but welcomes Khmer", () => {
    const html = registerSchema.safeParse({
      ...base,
      name: "<img src=x onerror=alert(1)>",
      password: "long-enough",
    });
    expect(html.success).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, name: "សុខ ដារា", password: "long-enough" }).success,
    ).toBe(true);
    expect(
      registerSchema.safeParse({ ...base, name: "Dara O'Neil-Lim", password: "long-enough" })
        .success,
    ).toBe(true);
  });

  it("only allows students and landlords to sign up", () => {
    expect(
      registerSchema.safeParse({ ...base, role: "ADMIN", password: "long-enough" }).success,
    ).toBe(false);
  });

  it("rejects a password made only of whitespace, but keeps meaningful spaces", () => {
    expect(registerSchema.safeParse({ ...base, password: "        " }).success).toBe(false);
    expect(registerSchema.parse({ ...base, password: " pass phrase " }).password).toBe(
      " pass phrase ",
    );
  });
});

describe("roomSchema", () => {
  const valid = {
    title: "Bright room near RUPP",
    description: "Quiet street, 5 minutes to campus.",
    address: "#12, Street 315",
    district: "Toul Kork",
    lat: "11.5712",
    lng: "104.8921",
    rentCents: "120",
    depositCents: "",
    otherFeesCents: "5",
    otherFeesNote: "",
    electricityCentsPerKwh: "0.25",
    waterCentsPerM3: "",
    type: "SINGLE",
    gender: "FEMALE",
    maxOccupants: "2",
    sizeSqm: "",
    facilities: ["wifi", "cctv"],
  };

  it("turns money into cents and empty fields into defaults", () => {
    expect(roomSchema.parse(valid)).toMatchObject({
      rentCents: 12000,
      depositCents: 0,
      otherFeesCents: 500,
      otherFeesNote: null,
      electricityCentsPerKwh: 25,
      waterCentsPerM3: null,
      maxOccupants: 2,
      sizeSqm: null,
      lat: 11.5712,
    });
  });

  it("requires rent above zero", () => {
    expect(roomSchema.safeParse({ ...valid, rentCents: "0" }).success).toBe(false);
    expect(roomSchema.safeParse({ ...valid, rentCents: "" }).success).toBe(false);
  });

  it("requires a location in Phnom Penh", () => {
    expect(roomSchema.safeParse({ ...valid, lat: "" }).success).toBe(false);
    // Siem Reap
    expect(roomSchema.safeParse({ ...valid, lat: "13.36", lng: "103.86" }).success).toBe(false);
  });

  it("rejects unknown facilities and districts", () => {
    expect(roomSchema.safeParse({ ...valid, facilities: ["pool"] }).success).toBe(false);
    expect(roomSchema.safeParse({ ...valid, district: "Paris" }).success).toBe(false);
  });
});

describe("viewingRequestSchema", () => {
  const inHours = (hours: number) => toPhnomPenhInput(new Date(Date.now() + hours * 3600_000));

  it("accepts a time in the near future", () => {
    const result = viewingRequestSchema.safeParse({
      roomId,
      preferredAt: inHours(24),
      message: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects the past and the far future", () => {
    expect(
      viewingRequestSchema.safeParse({ roomId, preferredAt: inHours(-2), message: "" }).success,
    ).toBe(false);
    expect(
      viewingRequestSchema.safeParse({ roomId, preferredAt: inHours(24 * 90), message: "" })
        .success,
    ).toBe(false);
  });
});

describe("reviewSchema", () => {
  it("accepts 1 to 5 stars only", () => {
    expect(reviewSchema.safeParse({ roomId, rating: "5", comment: "" }).success).toBe(true);
    expect(reviewSchema.safeParse({ roomId, rating: "0", comment: "" }).success).toBe(false);
    expect(reviewSchema.safeParse({ roomId, rating: "4.5", comment: "" }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("requires the confirmation to match", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "old-password",
      newPassword: "new-password",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("requires the new password to differ from the current one", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "same-password",
      newPassword: "same-password",
      confirmPassword: "same-password",
    });
    expect(result.success).toBe(false);
  });
});
