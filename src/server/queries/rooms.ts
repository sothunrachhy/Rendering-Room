import "server-only";
import { cache } from "react";
import { and, asc, desc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import {
  campuses,
  favourites,
  reviews,
  roomPhotos,
  rooms,
  users,
  viewingRequests,
} from "@/db/schema";
import { db } from "@/db";
import { boundingBox, rankRooms } from "@/lib/ranking";
import type { Facility, GenderPolicy, RoomType, SearchFilters } from "@/lib/rooms";

export type CampusOption = {
  id: string;
  slug: string;
  name: string;
  nameKm: string;
  shortName: string;
  lat: number;
  lng: number;
};

export async function getCampuses(): Promise<CampusOption[]> {
  return db
    .select({
      id: campuses.id,
      slug: campuses.slug,
      name: campuses.name,
      nameKm: campuses.nameKm,
      shortName: campuses.shortName,
      lat: campuses.lat,
      lng: campuses.lng,
    })
    .from(campuses)
    .orderBy(asc(campuses.shortName));
}

// Average rating and number of reviews per room, joined into list queries
const ratings = db
  .select({
    roomId: reviews.roomId,
    avgRating: sql<number>`avg(${reviews.rating})::float`.as("avg_rating"),
    reviewCount: sql<number>`count(*)::int`.as("review_count"),
  })
  .from(reviews)
  .groupBy(reviews.roomId)
  .as("ratings");

/** The first photo of a room, used as its cover. */
const coverPhotoId = sql<string | null>`(
  select ${roomPhotos.id} from ${roomPhotos}
  where ${roomPhotos.roomId} = ${rooms.id}
  order by ${roomPhotos.position}, ${roomPhotos.createdAt}
  limit 1
)`;

/** Rooms students may see: not hidden by an admin, from a verified landlord. */
const publiclyVisible = and(eq(rooms.hidden, false), eq(users.verification, "VERIFIED"));

const cardColumns = {
  id: rooms.id,
  title: rooms.title,
  district: rooms.district,
  lat: rooms.lat,
  lng: rooms.lng,
  rentCents: rooms.rentCents,
  electricityCentsPerKwh: rooms.electricityCentsPerKwh,
  waterCentsPerM3: rooms.waterCentsPerM3,
  otherFeesCents: rooms.otherFeesCents,
  type: rooms.type,
  gender: rooms.gender,
  facilities: rooms.facilities,
  status: rooms.status,
  avgRating: ratings.avgRating,
  reviewCount: sql<number>`coalesce(${ratings.reviewCount}, 0)`,
  coverPhotoId,
};

export type RoomCard = {
  id: string;
  title: string;
  district: string;
  lat: number;
  lng: number;
  rentCents: number;
  electricityCentsPerKwh: number | null;
  waterCentsPerM3: number | null;
  otherFeesCents: number;
  type: RoomType;
  gender: GenderPolicy;
  facilities: string[];
  status: "AVAILABLE" | "RENTED";
  avgRating: number | null;
  reviewCount: number;
  coverPhotoId: string | null;
};

export type RankedRoom = RoomCard & { distanceKm: number; score: number };

/**
 * The search from the flowchart: the database keeps available, verified rooms within
 * budget and roughly near the campus; rankRooms then does the exact Haversine check,
 * scores each room and sorts them.
 */
export async function searchRooms(
  filters: SearchFilters,
  campus: CampusOption,
): Promise<RankedRoom[]> {
  const budgetCents = filters.budget * 100;
  const box = boundingBox(campus, filters.distance);

  const conditions: (SQL | undefined)[] = [
    publiclyVisible,
    eq(rooms.status, "AVAILABLE"),
    lte(rooms.rentCents, budgetCents),
    gte(rooms.lat, box.minLat),
    lte(rooms.lat, box.maxLat),
    gte(rooms.lng, box.minLng),
    lte(rooms.lng, box.maxLng),
  ];
  if (filters.type) conditions.push(eq(rooms.type, filters.type));
  // A student looking for a female-only room still wants rooms open to anyone
  if (filters.gender) conditions.push(inArray(rooms.gender, [filters.gender, "ANY"]));
  if (filters.facilities.length > 0) {
    conditions.push(sql`${rooms.facilities} @> ${toTextArray(filters.facilities)}`);
  }

  const candidates = await db
    .select(cardColumns)
    .from(rooms)
    .innerJoin(users, eq(users.id, rooms.landlordId))
    .leftJoin(ratings, eq(ratings.roomId, rooms.id))
    .where(and(...conditions))
    .limit(500);

  return rankRooms(candidates, {
    campus,
    maxDistanceKm: filters.distance,
    budgetCents,
    sort: filters.sort,
  });
}

function toTextArray(values: readonly Facility[]): SQL {
  return sql`ARRAY[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )}]::text[]`;
}

// cache(): the room page and its metadata both ask for it, but it runs once a request
export const getRoomDetail = cache(async (roomId: string) => {
  const room = await db.query.rooms.findFirst({
    where: eq(rooms.id, roomId),
    with: {
      landlord: {
        columns: { id: true, name: true, phone: true, verification: true, createdAt: true },
      },
      photos: {
        columns: { id: true },
        orderBy: [asc(roomPhotos.position), asc(roomPhotos.createdAt)],
      },
    },
  });
  if (!room) return null;

  const roomReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      studentId: reviews.studentId,
      studentName: users.name,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.studentId))
    .where(eq(reviews.roomId, roomId))
    .orderBy(desc(reviews.createdAt));

  const avgRating =
    roomReviews.length > 0
      ? roomReviews.reduce((sum, review) => sum + review.rating, 0) / roomReviews.length
      : null;

  return { ...room, reviews: roomReviews, avgRating };
});

export type RoomDetail = NonNullable<Awaited<ReturnType<typeof getRoomDetail>>>;

/** What a signed-in student has done with a room: saved it, asked to view it. */
export async function getStudentRoomState(studentId: string, roomId: string) {
  const [saved, latestRequest, acceptedRequest] = await Promise.all([
    db.query.favourites.findFirst({
      where: and(eq(favourites.userId, studentId), eq(favourites.roomId, roomId)),
      columns: { roomId: true },
    }),
    db.query.viewingRequests.findFirst({
      where: and(eq(viewingRequests.studentId, studentId), eq(viewingRequests.roomId, roomId)),
      columns: { id: true, status: true, preferredAt: true },
      orderBy: desc(viewingRequests.createdAt),
    }),
    db.query.viewingRequests.findFirst({
      where: and(
        eq(viewingRequests.studentId, studentId),
        eq(viewingRequests.roomId, roomId),
        eq(viewingRequests.status, "ACCEPTED"),
      ),
      columns: { id: true },
    }),
  ]);

  return {
    saved: Boolean(saved),
    latestRequest: latestRequest ?? null,
    // Reviews and the landlord's phone number unlock once a viewing is accepted
    hasAcceptedViewing: Boolean(acceptedRequest),
  };
}

export async function getSavedRooms(studentId: string): Promise<RoomCard[]> {
  return db
    .select(cardColumns)
    .from(favourites)
    .innerJoin(rooms, eq(rooms.id, favourites.roomId))
    .innerJoin(users, eq(users.id, rooms.landlordId))
    .leftJoin(ratings, eq(ratings.roomId, rooms.id))
    .where(and(eq(favourites.userId, studentId), publiclyVisible))
    .orderBy(desc(favourites.createdAt));
}

/** Which of these rooms the student has saved (for the hearts on room cards). */
export async function getSavedRoomIds(studentId: string, roomIds: string[]): Promise<Set<string>> {
  if (roomIds.length === 0) return new Set();
  const rows = await db
    .select({ roomId: favourites.roomId })
    .from(favourites)
    .where(and(eq(favourites.userId, studentId), inArray(favourites.roomId, roomIds)));
  return new Set(rows.map((row) => row.roomId));
}

/** A landlord's own rooms, with what they need to manage them. */
export async function getLandlordRooms(landlordId: string) {
  return db
    .select({
      ...cardColumns,
      hidden: rooms.hidden,
      photoCount: sql<number>`(select count(*)::int from ${roomPhotos} where ${roomPhotos.roomId} = ${rooms.id})`,
      pendingRequests: sql<number>`(
        select count(*)::int from ${viewingRequests}
        where ${viewingRequests.roomId} = ${rooms.id} and ${viewingRequests.status} = 'PENDING'
      )`,
    })
    .from(rooms)
    .innerJoin(users, eq(users.id, rooms.landlordId))
    .leftJoin(ratings, eq(ratings.roomId, rooms.id))
    .where(eq(rooms.landlordId, landlordId))
    .orderBy(desc(rooms.updatedAt));
}

export type LandlordRoom = Awaited<ReturnType<typeof getLandlordRooms>>[number];

/** A room for the edit form, only if it belongs to this landlord. */
export async function getRoomForEdit(roomId: string, landlordId: string) {
  return db.query.rooms.findFirst({
    where: and(eq(rooms.id, roomId), eq(rooms.landlordId, landlordId)),
    with: {
      photos: {
        columns: { id: true, position: true },
        orderBy: [asc(roomPhotos.position), asc(roomPhotos.createdAt)],
      },
    },
  });
}

export type EditableRoom = NonNullable<Awaited<ReturnType<typeof getRoomForEdit>>>;

/** Every room anyone may open, for the sitemap. */
export async function getPublicRoomIds(): Promise<{ id: string; updatedAt: Date }[]> {
  return db
    .select({ id: rooms.id, updatedAt: rooms.updatedAt })
    .from(rooms)
    .innerJoin(users, eq(users.id, rooms.landlordId))
    .where(publiclyVisible)
    .orderBy(desc(rooms.updatedAt))
    .limit(10_000);
}
