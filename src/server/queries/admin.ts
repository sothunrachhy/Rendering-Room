import "server-only";
import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { idDocuments, reports, rooms, users, viewingRequests } from "@/db/schema";
import { db } from "@/db";

export async function getAdminStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [userCounts, roomCounts, [openReports], requestCounts] = await Promise.all([
    db
      .select({ role: users.role, verification: users.verification, count: count() })
      .from(users)
      .groupBy(users.role, users.verification),
    db
      .select({ status: rooms.status, count: count() })
      .from(rooms)
      .where(eq(rooms.hidden, false))
      .groupBy(rooms.status),
    db.select({ count: count() }).from(reports).where(eq(reports.status, "OPEN")),
    db
      .select({ status: viewingRequests.status, count: count() })
      .from(viewingRequests)
      .where(gte(viewingRequests.createdAt, weekAgo))
      .groupBy(viewingRequests.status),
  ]);

  const sum = <T extends { count: number }>(rows: T[], keep: (row: T) => boolean) =>
    rows.filter(keep).reduce((total, row) => total + row.count, 0);

  const requestsThisWeek = sum(requestCounts, () => true);
  const answered = sum(requestCounts, (r) => r.status === "ACCEPTED" || r.status === "DECLINED");
  const accepted = sum(requestCounts, (r) => r.status === "ACCEPTED");

  return {
    students: sum(userCounts, (r) => r.role === "STUDENT"),
    landlords: sum(userCounts, (r) => r.role === "LANDLORD"),
    pendingLandlords: sum(userCounts, (r) => r.role === "LANDLORD" && r.verification === "PENDING"),
    availableRooms: sum(roomCounts, (r) => r.status === "AVAILABLE"),
    rentedRooms: sum(roomCounts, (r) => r.status === "RENTED"),
    openReports: openReports.count,
    requestsThisWeek,
    // Share of answered requests that were accepted; null until there are any
    acceptanceRate: answered > 0 ? accepted / answered : null,
  };
}

/** Landlords waiting for verification, oldest first so nobody waits forever. */
export async function getPendingLandlords() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      createdAt: users.createdAt,
      uploadedAt: idDocuments.uploadedAt,
      roomCount: sql<number>`(select count(*)::int from ${rooms} where ${rooms.landlordId} = ${users.id})`,
    })
    .from(users)
    .innerJoin(idDocuments, eq(idDocuments.userId, users.id))
    .where(and(eq(users.role, "LANDLORD"), eq(users.verification, "PENDING")))
    .orderBy(asc(idDocuments.uploadedAt));
}

export type PendingLandlord = Awaited<ReturnType<typeof getPendingLandlords>>[number];

export async function getAllListings() {
  return db
    .select({
      id: rooms.id,
      title: rooms.title,
      district: rooms.district,
      rentCents: rooms.rentCents,
      status: rooms.status,
      hidden: rooms.hidden,
      landlordName: users.name,
      landlordVerification: users.verification,
      openReports: sql<number>`(
        select count(*)::int from ${reports}
        where ${reports.roomId} = ${rooms.id} and ${reports.status} = 'OPEN'
      )`,
    })
    .from(rooms)
    .innerJoin(users, eq(users.id, rooms.landlordId))
    .orderBy(desc(rooms.createdAt));
}

export type AdminListing = Awaited<ReturnType<typeof getAllListings>>[number];

export async function getOpenReports() {
  return db
    .select({
      id: reports.id,
      reason: reports.reason,
      details: reports.details,
      createdAt: reports.createdAt,
      roomId: rooms.id,
      roomTitle: rooms.title,
      roomHidden: rooms.hidden,
      reporterName: users.name,
    })
    .from(reports)
    .innerJoin(rooms, eq(rooms.id, reports.roomId))
    .innerJoin(users, eq(users.id, reports.reporterId))
    .where(eq(reports.status, "OPEN"))
    .orderBy(asc(reports.createdAt));
}

export type OpenReport = Awaited<ReturnType<typeof getOpenReports>>[number];
