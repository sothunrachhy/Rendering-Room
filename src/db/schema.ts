import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["STUDENT", "LANDLORD", "ADMIN"]);
export const verificationStatus = pgEnum("verification_status", [
  "UNVERIFIED",
  "PENDING",
  "VERIFIED",
  "REJECTED",
]);
export const roomType = pgEnum("room_type", ["SINGLE", "SHARED", "STUDIO", "APARTMENT"]);
export const genderPolicy = pgEnum("gender_policy", ["ANY", "FEMALE", "MALE"]);
export const roomStatus = pgEnum("room_status", ["AVAILABLE", "RENTED"]);
export const requestStatus = pgEnum("request_status", [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "CANCELLED",
]);
export const reportReason = pgEnum("report_reason", [
  "FAKE",
  "WRONG_PRICE",
  "ALREADY_RENTED",
  "UNSAFE",
  "SCAM",
  "OTHER",
]);
export const reportStatus = pgEnum("report_status", ["OPEN", "RESOLVED", "DISMISSED"]);

// Photos and ID documents are stored in Postgres, so the app needs no separate
// file storage and works the same locally and on Vercel.
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull().default("STUDENT"),
    // Only meaningful for landlords: their rooms appear in search once VERIFIED
    verification: verificationStatus("verification").notNull().default("UNVERIFIED"),
    // Admin's reason when a verification is rejected, shown to the landlord
    verificationNote: text("verification_note"),
    // Language for Telegram alerts: set at sign-up and whenever Telegram is connected
    locale: text("locale").notNull().default("en"),
    // Telegram chat that receives alerts, set when the user opens the bot link
    telegramChatId: text("telegram_chat_id"),
    // One-time code inside the "Connect Telegram" link
    telegramLinkToken: text("telegram_link_token").unique(),
    // Sessions issued before this moment are no longer valid ("log out everywhere")
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
    // Set when the user opens the link in the welcome email. Students need it
    // before they can send viewing requests, so landlords only hear from real people.
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("users_role_verification_idx").on(t.role, t.verification)],
);

// One-time links in the "confirm your email" message. Like reset tokens, only a
// SHA-256 hash is stored.
export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("email_verification_tokens_user_id_idx").on(t.userId)],
);

// Failed logins and sign-ups, for rate limiting. Kept in the database (not memory)
// because a deployment runs several server instances. `key` is "email:<address>" or
// "ip:<address>"; rows older than the longest window are deleted as they're checked.
export const authAttempts = pgTable(
  "auth_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_attempts_key_created_idx").on(t.key, t.createdAt)],
);

// A landlord's ID photo for verification. Kept apart from `users` so the image is
// never loaded by accident, and only admins can read it.
export const idDocuments = pgTable("id_documents", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  data: bytea("data").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

// One-time links for "Forgot password?". Only a SHA-256 hash of the token is stored,
// so someone who can read the database still can't use it to reset an account.
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("password_reset_tokens_user_id_idx").on(t.userId)],
);

export const campuses = pgTable("campuses", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Short code used in URLs, e.g. "rupp"
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameKm: text("name_km").notNull(),
  shortName: text("short_name").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
});

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    landlordId: uuid("landlord_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    address: text("address").notNull(),
    district: text("district").notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    // All money in US cents, like the rest of the app, so there are no float errors
    rentCents: integer("rent_cents").notNull(),
    depositCents: integer("deposit_cents").notNull().default(0),
    // Fixed monthly extras such as rubbish collection or internet
    otherFeesCents: integer("other_fees_cents").notNull().default(0),
    otherFeesNote: text("other_fees_note"),
    // Utility prices per unit; null means "included in the rent"
    electricityCentsPerKwh: integer("electricity_cents_per_kwh"),
    waterCentsPerM3: integer("water_cents_per_m3"),
    type: roomType("type").notNull(),
    gender: genderPolicy("gender").notNull().default("ANY"),
    maxOccupants: integer("max_occupants").notNull().default(1),
    sizeSqm: integer("size_sqm"),
    // Keys from FACILITIES in src/lib/rooms.ts
    facilities: text("facilities")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    status: roomStatus("status").notNull().default("AVAILABLE"),
    // Set by an admin to take a listing out of search (moderation)
    hidden: boolean("hidden").notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index("rooms_landlord_id_idx").on(t.landlordId),
    index("rooms_search_idx").on(t.status, t.hidden, t.rentCents),
    index("rooms_location_idx").on(t.lat, t.lng),
    check("rooms_rent_positive", sql`${t.rentCents} > 0`),
    check("rooms_fees_not_negative", sql`${t.depositCents} >= 0 AND ${t.otherFeesCents} >= 0`),
    check("rooms_lat_range", sql`${t.lat} BETWEEN -90 AND 90`),
    check("rooms_lng_range", sql`${t.lng} BETWEEN -180 AND 180`),
    check("rooms_occupants_positive", sql`${t.maxOccupants} > 0`),
  ],
);

export const roomPhotos = pgTable(
  "room_photos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    // Lowest position is the cover photo
    position: integer("position").notNull().default(0),
    contentType: text("content_type").notNull(),
    data: bytea("data").notNull(),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("room_photos_room_id_idx").on(t.roomId, t.position)],
);

export const favourites = pgTable(
  "favourites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    createdAt: timestamps.createdAt,
  },
  (t) => [primaryKey({ columns: [t.userId, t.roomId] })],
);

export const viewingRequests = pgTable(
  "viewing_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    preferredAt: timestamp("preferred_at", { withTimezone: true }).notNull(),
    message: text("message"),
    status: requestStatus("status").notNull().default("PENDING"),
    landlordReply: text("landlord_reply"),
    ...timestamps,
  },
  (t) => [
    index("viewing_requests_room_id_idx").on(t.roomId),
    index("viewing_requests_student_id_idx").on(t.studentId),
  ],
);

// Only students whose viewing was accepted may review, one review per room.
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("reviews_room_student_key").on(t.roomId, t.studentId),
    check("reviews_rating_range", sql`${t.rating} BETWEEN 1 AND 5`),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: reportReason("reason").notNull(),
    details: text("details"),
    status: reportStatus("status").notNull().default("OPEN"),
    ...timestamps,
  },
  (t) => [index("reports_status_idx").on(t.status)],
);

export const usersRelations = relations(users, ({ many, one }) => ({
  rooms: many(rooms),
  idDocument: one(idDocuments),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  landlord: one(users, { fields: [rooms.landlordId], references: [users.id] }),
  photos: many(roomPhotos),
  reviews: many(reviews),
  viewingRequests: many(viewingRequests),
}));

export const roomPhotosRelations = relations(roomPhotos, ({ one }) => ({
  room: one(rooms, { fields: [roomPhotos.roomId], references: [rooms.id] }),
}));

export const idDocumentsRelations = relations(idDocuments, ({ one }) => ({
  user: one(users, { fields: [idDocuments.userId], references: [users.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  room: one(rooms, { fields: [reviews.roomId], references: [rooms.id] }),
  student: one(users, { fields: [reviews.studentId], references: [users.id] }),
}));

export const viewingRequestsRelations = relations(viewingRequests, ({ one }) => ({
  room: one(rooms, { fields: [viewingRequests.roomId], references: [rooms.id] }),
  student: one(users, { fields: [viewingRequests.studentId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Role = (typeof userRole.enumValues)[number];
export type Verification = (typeof verificationStatus.enumValues)[number];
export type Room = typeof rooms.$inferSelect;
export type Campus = typeof campuses.$inferSelect;
export type RequestStatus = (typeof requestStatus.enumValues)[number];
export type ReportReason = (typeof reportReason.enumValues)[number];
