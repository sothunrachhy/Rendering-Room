// Fills the database with campuses, demo accounts and sample rooms around RUPP.
//
//   npm run db:seed            only runs on an empty database
//   npm run db:seed -- --reset deletes ALL data first (never on a real deployment)
//
// Rooms A and B are the worked example from the presentation (slide 16): search
// RUPP with a $120 budget and 3 km, and B (0.60) ranks above A (0.58).
import "dotenv/config";
import bcrypt from "bcryptjs";
import { count, sql } from "drizzle-orm";
import {
  campuses,
  idDocuments,
  reports,
  reviews,
  rooms,
  users,
  viewingRequests,
} from "@/db/schema";
import { db } from "@/db";
import { CAMPUSES } from "./campus-list";
import { addSamplePhotos } from "./sample-photos";
import type { Facility } from "@/lib/rooms";

const RUPP = CAMPUSES[0];

/** The point `km` away from `from` in compass direction `bearing` (degrees). */
function offset(from: { lat: number; lng: number }, km: number, bearing: number) {
  const radians = (bearing * Math.PI) / 180;
  const dLat = (km / 6371) * (180 / Math.PI) * Math.cos(radians);
  const dLng =
    ((km / 6371) * (180 / Math.PI) * Math.sin(radians)) / Math.cos((from.lat * Math.PI) / 180);
  return { lat: from.lat + dLat, lng: from.lng + dLng };
}

// A tiny valid PNG, standing in for the pending landlord's ID photo
const PLACEHOLDER_ID = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

type SeedRoom = {
  key: string;
  landlord: "sokha" | "vanna" | "chenda";
  title: string;
  description: string;
  address: string;
  district: string;
  at: { lat: number; lng: number };
  rent: number;
  deposit: number;
  electricity: number | null;
  water: number | null;
  otherFees?: number;
  otherFeesNote?: string;
  type: "SINGLE" | "SHARED" | "STUDIO" | "APARTMENT";
  gender?: "ANY" | "FEMALE" | "MALE";
  maxOccupants?: number;
  sizeSqm?: number;
  facilities: Facility[];
  status?: "AVAILABLE" | "RENTED";
};

const ROOMS: SeedRoom[] = [
  {
    key: "A",
    landlord: "sokha",
    title: "Room A · Quiet single room in Toul Kork",
    description:
      "Clean single room on the second floor of a family house. Quiet street, ten minutes by bike to RUPP. Shared kitchen downstairs.",
    address: "#24, Street 516",
    district: "Toul Kork",
    at: offset(RUPP, 1.2, 0),
    rent: 80,
    deposit: 80,
    electricity: 0.25,
    water: 0.5,
    type: "SINGLE",
    sizeSqm: 14,
    facilities: ["wifi", "fan", "kitchen", "parking"],
  },
  {
    key: "B",
    landlord: "sokha",
    title: "Room B · Bright room 5 minutes from RUPP",
    description:
      "New building right behind the campus, with air conditioning and a private bathroom. Guard at night and CCTV at the gate.",
    address: "#8, Street 271",
    district: "Toul Kork",
    at: offset(RUPP, 0.5, 45),
    rent: 110,
    deposit: 110,
    electricity: 0.25,
    water: 0.5,
    otherFees: 3,
    otherFeesNote: "Rubbish collection",
    type: "SINGLE",
    sizeSqm: 18,
    facilities: ["wifi", "aircon", "privateBathroom", "securityGuard", "cctv", "parking"],
  },
  {
    key: "C",
    landlord: "vanna",
    title: "Female-only shared room near Boeung Kak",
    description:
      "Shared room for two female students in a dormitory-style house. Landlady lives on the ground floor. Curfew 10 pm.",
    address: "#56, Street 289",
    district: "Toul Kork",
    at: offset(RUPP, 1.6, 30),
    rent: 55,
    deposit: 50,
    electricity: null,
    water: null,
    type: "SHARED",
    gender: "FEMALE",
    maxOccupants: 2,
    sizeSqm: 20,
    facilities: ["wifi", "fan", "furnished", "laundry", "securityGuard"],
  },
  {
    key: "D",
    landlord: "vanna",
    title: "Studio with balcony and water heater",
    description:
      "Furnished studio with a small kitchen corner, balcony and water heater. Good for a student who wants privacy.",
    address: "#101, Street 315",
    district: "Toul Kork",
    at: offset(RUPP, 2.1, 70),
    rent: 180,
    deposit: 180,
    electricity: 0.3,
    water: 0.6,
    otherFees: 10,
    otherFeesNote: "Internet and parking",
    type: "STUDIO",
    sizeSqm: 28,
    facilities: [
      "wifi",
      "aircon",
      "privateBathroom",
      "furnished",
      "kitchen",
      "waterHeater",
      "balcony",
      "cctv",
    ],
  },
  {
    key: "E",
    landlord: "sokha",
    title: "Cheap single room off Russian Federation Boulevard",
    description:
      "Simple room with a fan. Bathroom shared by three rooms. Very close to the bus stop.",
    address: "#3, Street 182",
    district: "Toul Kork",
    at: offset(RUPP, 0.8, 160),
    rent: 60,
    deposit: 60,
    electricity: 0.25,
    water: 0.5,
    type: "SINGLE",
    sizeSqm: 10,
    facilities: ["fan", "parking"],
  },
  {
    key: "F",
    landlord: "vanna",
    title: "Male-only shared room for two",
    description: "Shared room for two male students, five minutes to RUPP and ITC.",
    address: "#77, Street 223",
    district: "Toul Kork",
    at: offset(RUPP, 0.9, 100),
    rent: 70,
    deposit: 70,
    electricity: 0.25,
    water: null,
    type: "SHARED",
    gender: "MALE",
    maxOccupants: 2,
    facilities: ["wifi", "fan", "parking", "laundry"],
  },
  {
    key: "G",
    landlord: "sokha",
    title: "Two-bedroom apartment for a group of friends",
    description:
      "Apartment with two bedrooms, living room and kitchen. Students often split it four ways.",
    address: "#12, Street 335",
    district: "Sen Sok",
    at: offset(RUPP, 2.7, 340),
    rent: 250,
    deposit: 500,
    electricity: 0.25,
    water: 0.5,
    type: "APARTMENT",
    maxOccupants: 4,
    sizeSqm: 60,
    facilities: ["wifi", "aircon", "furnished", "kitchen", "parking", "balcony", "waterHeater"],
  },
  {
    key: "H",
    landlord: "vanna",
    title: "Air-conditioned room close to ITC",
    description: "Air-conditioned single room with a desk and wardrobe, a short walk to ITC.",
    address: "#40, Street 598",
    district: "Toul Kork",
    at: offset(CAMPUSES[1], 0.6, 20),
    rent: 120,
    deposit: 120,
    electricity: 0.25,
    water: 0.5,
    type: "SINGLE",
    sizeSqm: 16,
    facilities: ["wifi", "aircon", "furnished", "privateBathroom"],
  },
  {
    key: "I",
    landlord: "sokha",
    title: "Single room near NUM",
    description: "Single room in the city centre, near NUM, markets and buses.",
    address: "#9, Street 98",
    district: "Daun Penh",
    at: offset(CAMPUSES[2], 0.7, 200),
    rent: 140,
    deposit: 140,
    electricity: 0.3,
    water: 0.5,
    type: "SINGLE",
    facilities: ["wifi", "aircon", "cctv", "securityGuard"],
  },
  {
    key: "J",
    landlord: "vanna",
    title: "Rented: corner room with big window",
    description: "Already rented until next semester.",
    address: "#15, Street 516",
    district: "Toul Kork",
    at: offset(RUPP, 1.1, 300),
    rent: 95,
    deposit: 95,
    electricity: 0.25,
    water: 0.5,
    type: "SINGLE",
    facilities: ["wifi", "fan"],
    status: "RENTED",
  },
  {
    key: "K",
    landlord: "chenda",
    title: "New room waiting for verification",
    description:
      "This landlord hasn't been verified yet, so students can't find this room until an admin approves the ID.",
    address: "#2, Street 289",
    district: "Toul Kork",
    at: offset(RUPP, 1.3, 15),
    rent: 75,
    deposit: 75,
    electricity: 0.25,
    water: 0.5,
    type: "SINGLE",
    facilities: ["wifi", "fan"],
  },
];

async function main() {
  const reset = process.argv.includes("--reset");
  const [existing] = await db.select({ count: count() }).from(users);

  if (existing.count > 0 && !reset) {
    console.log("The database already has users. Run `npm run db:seed -- --reset` to start over.");
    return;
  }
  if (reset) {
    if (process.env.NODE_ENV === "production") throw new Error("Refusing to reset in production");
    await db.execute(
      sql`TRUNCATE users, campuses, rooms, room_photos, favourites, viewing_requests, reviews, reports, id_documents, password_reset_tokens, email_verification_tokens, auth_attempts CASCADE`,
    );
    console.log("Deleted all data.");
  }

  await db.insert(campuses).values(CAMPUSES);

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  const [adminHash, demoHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash("password123", 12),
  ]);

  const people = await db
    .insert(users)
    .values([
      {
        name: "RoomFinder Admin",
        email: "admin@roomfinder.local",
        passwordHash: adminHash,
        emailVerifiedAt: new Date(),
        role: "ADMIN",
      },
      {
        name: "Sokha Chan",
        email: "sokha@roomfinder.local",
        phone: "012345678",
        passwordHash: demoHash,
        emailVerifiedAt: new Date(),
        role: "LANDLORD",
        verification: "VERIFIED",
      },
      {
        name: "Vanna Keo",
        email: "vanna@roomfinder.local",
        phone: "0977654321",
        passwordHash: demoHash,
        emailVerifiedAt: new Date(),
        role: "LANDLORD",
        verification: "VERIFIED",
        locale: "km",
      },
      {
        name: "Chenda Sok",
        email: "chenda@roomfinder.local",
        phone: "015222333",
        passwordHash: demoHash,
        emailVerifiedAt: new Date(),
        role: "LANDLORD",
        verification: "PENDING",
      },
      {
        name: "Dara Lim",
        email: "dara@roomfinder.local",
        phone: "088111222",
        passwordHash: demoHash,
        emailVerifiedAt: new Date(),
        role: "STUDENT",
      },
      {
        name: "Sophea Meas",
        email: "sophea@roomfinder.local",
        passwordHash: demoHash,
        emailVerifiedAt: new Date(),
        role: "STUDENT",
      },
    ])
    .returning({ id: users.id, email: users.email });
  const userId = (name: string) => people.find((p) => p.email === `${name}@roomfinder.local`)!.id;

  await db.insert(idDocuments).values({
    userId: userId("chenda"),
    contentType: "image/png",
    data: PLACEHOLDER_ID,
  });

  const cents = (dollars: number) => Math.round(dollars * 100);
  const inserted = await db
    .insert(rooms)
    .values(
      ROOMS.map((room) => ({
        landlordId: userId(room.landlord),
        title: room.title,
        description: room.description,
        address: room.address,
        district: room.district,
        lat: room.at.lat,
        lng: room.at.lng,
        rentCents: cents(room.rent),
        depositCents: cents(room.deposit),
        otherFeesCents: cents(room.otherFees ?? 0),
        otherFeesNote: room.otherFeesNote ?? null,
        electricityCentsPerKwh: room.electricity === null ? null : cents(room.electricity),
        waterCentsPerM3: room.water === null ? null : cents(room.water),
        type: room.type,
        gender: room.gender ?? "ANY",
        maxOccupants: room.maxOccupants ?? 1,
        sizeSqm: room.sizeSqm ?? null,
        facilities: room.facilities,
        status: room.status ?? "AVAILABLE",
      })),
    )
    .returning({ id: rooms.id, title: rooms.title });
  const roomId = (key: string) =>
    inserted.find((r) => r.title === ROOMS.find((x) => x.key === key)!.title)!.id;

  const daysFromNow = (days: number, hour = 10) => {
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    date.setUTCHours(hour - 7, 0, 0, 0); // hour in Phnom Penh time
    return date;
  };

  // Reviews need an accepted viewing first, just like in the app
  await db.insert(viewingRequests).values([
    {
      roomId: roomId("A"),
      studentId: userId("dara"),
      preferredAt: daysFromNow(-20),
      status: "ACCEPTED",
    },
    {
      roomId: roomId("A"),
      studentId: userId("sophea"),
      preferredAt: daysFromNow(-15),
      status: "ACCEPTED",
    },
    {
      roomId: roomId("B"),
      studentId: userId("dara"),
      preferredAt: daysFromNow(-10),
      status: "ACCEPTED",
    },
    {
      roomId: roomId("D"),
      studentId: userId("sophea"),
      preferredAt: daysFromNow(-8),
      status: "ACCEPTED",
    },
    {
      roomId: roomId("C"),
      studentId: userId("dara"),
      preferredAt: daysFromNow(2, 16),
      message:
        "Hello, I'm a first-year student from Takeo. Can I see the room on Saturday afternoon?",
    },
  ]);

  // Room A averages 4.5 and Room B 4.0, matching the worked example
  await db.insert(reviews).values([
    {
      roomId: roomId("A"),
      studentId: userId("dara"),
      rating: 5,
      comment: "Quiet and clean. The family is kind.",
    },
    {
      roomId: roomId("A"),
      studentId: userId("sophea"),
      rating: 4,
      comment: "Good price. A bit far to walk in the rain.",
    },
    {
      roomId: roomId("B"),
      studentId: userId("dara"),
      rating: 4,
      comment: "Very close to campus, but the street is noisy in the morning.",
    },
    {
      roomId: roomId("D"),
      studentId: userId("sophea"),
      rating: 5,
      comment: "Lovely studio, the landlord fixes things quickly.",
    },
  ]);

  await db.insert(reports).values({
    roomId: roomId("E"),
    reporterId: userId("sophea"),
    reason: "WRONG_PRICE",
    details: "The landlord asked for $70 at the visit, not $60.",
  });

  // Real interior photos (scripts/sample-photos), so listings don't look empty
  const withPhotos = await addSamplePhotos();

  console.log(`Seeded ${CAMPUSES.length} campuses, ${people.length} users and ${inserted.length} rooms (${withPhotos} with photos).

Log in with (password "password123" unless noted):
  admin@roomfinder.local   admin (password: ${process.env.SEED_ADMIN_PASSWORD ? "SEED_ADMIN_PASSWORD" : "admin12345"})
  sokha@roomfinder.local   verified landlord (Rooms A and B)
  vanna@roomfinder.local   verified landlord, Khmer alerts
  chenda@roomfinder.local  landlord waiting for verification
  dara@roomfinder.local    student
  sophea@roomfinder.local  student`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
