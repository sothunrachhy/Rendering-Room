import { z } from "zod";
import type { TranslationKey } from "@/i18n/translator";
import { MAX_AMOUNT_CENTS, parseAmountToCents } from "@/lib/money";
import { isWeakPassword } from "@/lib/password";
import { DISTRICTS, FACILITIES, GENDER_POLICIES, REPORT_REASONS, ROOM_TYPES } from "@/lib/rooms";
import { MAX_VIEWING_DAYS_AHEAD, parsePhnomPenhDateTime } from "@/lib/time";

// Shared validation rules for every Server Action. Error messages are translation
// keys (e.g. "validation.email"); the action translates them into the user's
// language before returning them to the form.

type ValidationKey = Extract<TranslationKey, `validation.${string}`>;
const msg = (key: ValidationKey) => key;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, msg("validation.emailRequired"))
  .pipe(z.email(msg("validation.email")));

// Not trimmed: a space can be a deliberate part of a password. But a password
// made only of whitespace is never acceptable.
const password = z
  .string()
  .min(8, msg("validation.passwordMin"))
  .max(72, msg("validation.passwordMax")) // bcrypt ignores bytes past 72
  .refine((value) => /\S/.test(value), { message: msg("validation.passwordBlank"), abort: true })
  .refine((value) => !isWeakPassword(value), msg("validation.passwordWeak"));

// Names appear in landlords' Telegram alerts and on reviews. Khmer and other scripts
// are welcome; markup characters and invisible control characters are not.
const name = z
  .string()
  .trim()
  .min(1, msg("validation.nameRequired"))
  .max(60, msg("validation.nameTooLong"))
  .refine(
    (value) => !/[<>{}[\]\\/=`\u0000-\u001f\u007f]/.test(value),
    msg("validation.nameInvalid"),
  );

/** Cambodian numbers like "012 345 678" or "+855 12 345 678". Empty means "no phone". */
const phone = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .refine((value) => value === "" || /^(\+?855|0)\d{8,9}$/.test(value), msg("validation.phone"))
  .transform((value) => value || null);

/** Optional free text: trimmed, empty becomes null. */
const optionalText = (max: number, key: ValidationKey = "validation.textTooLong") =>
  z
    .string()
    .trim()
    .max(max, msg(key))
    .transform((value) => value || null);

/** "120" or "0.25" (dollars) to integer cents. */
const money = (options: { allowZero: boolean }) =>
  z.string().transform((value, ctx) => {
    if (value.trim() === "") {
      if (options.allowZero) return 0;
      ctx.addIssue({ code: "custom", message: msg("validation.amountRequired") });
      return z.NEVER;
    }
    const cents = parseAmountToCents(value);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: msg("validation.amountFormat") });
      return z.NEVER;
    }
    if (cents > MAX_AMOUNT_CENTS) {
      ctx.addIssue({ code: "custom", message: msg("validation.amountTooLarge") });
      return z.NEVER;
    }
    if (cents === 0 && !options.allowZero) {
      ctx.addIssue({ code: "custom", message: msg("validation.amountPositive") });
      return z.NEVER;
    }
    return cents;
  });

/** A utility price: empty means "included in the rent" (null). */
const unitPrice = z.string().transform((value, ctx) => {
  if (value.trim() === "") return null;
  const cents = parseAmountToCents(value);
  if (cents === null || cents > 100_000) {
    ctx.addIssue({ code: "custom", message: msg("validation.amountFormat") });
    return z.NEVER;
  }
  return cents;
});

/** Whole numbers typed into a form, e.g. "2". Empty becomes null. */
const optionalInt = (min: number, max: number, key: ValidationKey) =>
  z.string().transform((value, ctx) => {
    if (value.trim() === "") return null;
    const number = Number(value);
    if (!Number.isInteger(number) || number < min || number > max) {
      ctx.addIssue({ code: "custom", message: msg(key) });
      return z.NEVER;
    }
    return number;
  });

// Greater Phnom Penh, with some margin. Catches a pin dropped in the wrong country.
const PHNOM_PENH_AREA = { minLat: 11.3, maxLat: 11.85, minLng: 104.6, maxLng: 105.2 };

const coordinate = z.string().transform((value, ctx) => {
  const number = Number(value);
  if (value.trim() === "" || !Number.isFinite(number)) {
    ctx.addIssue({ code: "custom", message: msg("validation.location") });
    return z.NEVER;
  }
  return number;
});

const id = z.uuid(msg("validation.invalidId"));

export const registerSchema = z.object({
  name,
  email,
  phone,
  password,
  role: z.enum(["STUDENT", "LANDLORD"], msg("validation.chooseRole")),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, msg("validation.passwordRequired")),
});

export const profileSchema = z.object({ name, phone });

export const roomSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, msg("validation.titleRequired"))
      .max(80, msg("validation.titleTooLong")),
    description: z
      .string()
      .trim()
      .min(1, msg("validation.descriptionRequired"))
      .max(3000, msg("validation.descriptionTooLong")),
    address: z
      .string()
      .trim()
      .min(1, msg("validation.addressRequired"))
      .max(200, msg("validation.textTooLong")),
    district: z.enum(DISTRICTS, msg("validation.chooseDistrict")),
    lat: coordinate,
    lng: coordinate,
    rentCents: money({ allowZero: false }),
    depositCents: money({ allowZero: true }),
    otherFeesCents: money({ allowZero: true }),
    otherFeesNote: optionalText(120),
    electricityCentsPerKwh: unitPrice,
    waterCentsPerM3: unitPrice,
    type: z.enum(ROOM_TYPES, msg("validation.chooseType")),
    gender: z.enum(GENDER_POLICIES, msg("validation.chooseGender")),
    maxOccupants: optionalInt(1, 20, "validation.occupants").pipe(
      z.number(msg("validation.occupants")),
    ),
    sizeSqm: optionalInt(1, 500, "validation.size"),
    facilities: z.array(z.enum(FACILITIES, msg("validation.facility"))),
  })
  .refine(
    ({ lat, lng }) =>
      lat >= PHNOM_PENH_AREA.minLat &&
      lat <= PHNOM_PENH_AREA.maxLat &&
      lng >= PHNOM_PENH_AREA.minLng &&
      lng <= PHNOM_PENH_AREA.maxLng,
    { message: msg("validation.locationOutside"), path: ["lat"] },
  );

export const viewingRequestSchema = z.object({
  roomId: id,
  preferredAt: z.string().transform((value, ctx) => {
    const date = parsePhnomPenhDateTime(value);
    if (!date) {
      ctx.addIssue({ code: "custom", message: msg("validation.preferredAt") });
      return z.NEVER;
    }
    if (date.getTime() <= Date.now()) {
      ctx.addIssue({ code: "custom", message: msg("validation.preferredAtPast") });
      return z.NEVER;
    }
    if (date.getTime() > Date.now() + MAX_VIEWING_DAYS_AHEAD * 24 * 60 * 60 * 1000) {
      ctx.addIssue({ code: "custom", message: msg("validation.preferredAtFar") });
      return z.NEVER;
    }
    return date;
  }),
  message: optionalText(500, "validation.messageTooLong"),
});

export const replySchema = z.object({
  id,
  decision: z.enum(["ACCEPTED", "DECLINED"]),
  reply: optionalText(300, "validation.messageTooLong"),
});

export const reviewSchema = z.object({
  roomId: id,
  rating: z.coerce
    .number(msg("validation.rating"))
    .int(msg("validation.rating"))
    .min(1, msg("validation.rating"))
    .max(5, msg("validation.rating")),
  comment: optionalText(1000, "validation.commentTooLong"),
});

export const reportSchema = z.object({
  roomId: id,
  reason: z.enum(REPORT_REASONS, msg("validation.chooseReason")),
  details: optionalText(500),
});

export const rejectLandlordSchema = z.object({
  userId: id,
  note: optionalText(200),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, msg("validation.currentPasswordRequired")),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: msg("validation.passwordsMismatch"),
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: msg("validation.passwordUnchanged"),
    path: ["newPassword"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().max(200),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: msg("validation.passwordsMismatch"),
    path: ["confirmPassword"],
  });

export { id as idSchema };
