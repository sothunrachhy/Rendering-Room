import "server-only";
import { desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { rooms, users, viewingRequests } from "@/db/schema";
import { db } from "@/db";

const students = alias(users, "students");
const landlords = alias(users, "landlords");

// Waiting requests first, then the most recent
const byStatusThenDate = [
  sql`case when ${viewingRequests.status} = 'PENDING' then 0 else 1 end`,
  desc(viewingRequests.preferredAt),
];

export async function getStudentRequests(studentId: string) {
  return db
    .select({
      id: viewingRequests.id,
      status: viewingRequests.status,
      preferredAt: viewingRequests.preferredAt,
      message: viewingRequests.message,
      landlordReply: viewingRequests.landlordReply,
      roomId: rooms.id,
      roomTitle: rooms.title,
      roomDistrict: rooms.district,
      landlordName: landlords.name,
      // The phone number is only shared once the landlord accepts
      landlordPhone: sql<
        string | null
      >`case when ${viewingRequests.status} = 'ACCEPTED' then ${landlords.phone} end`,
    })
    .from(viewingRequests)
    .innerJoin(rooms, eq(rooms.id, viewingRequests.roomId))
    .innerJoin(landlords, eq(landlords.id, rooms.landlordId))
    .where(eq(viewingRequests.studentId, studentId))
    .orderBy(...byStatusThenDate);
}

export type StudentRequest = Awaited<ReturnType<typeof getStudentRequests>>[number];

export async function getLandlordRequests(landlordId: string) {
  return db
    .select({
      id: viewingRequests.id,
      status: viewingRequests.status,
      preferredAt: viewingRequests.preferredAt,
      message: viewingRequests.message,
      landlordReply: viewingRequests.landlordReply,
      roomId: rooms.id,
      roomTitle: rooms.title,
      studentName: students.name,
      studentPhone: students.phone,
    })
    .from(viewingRequests)
    .innerJoin(rooms, eq(rooms.id, viewingRequests.roomId))
    .innerJoin(students, eq(students.id, viewingRequests.studentId))
    .where(eq(rooms.landlordId, landlordId))
    .orderBy(...byStatusThenDate);
}

export type LandlordRequest = Awaited<ReturnType<typeof getLandlordRequests>>[number];
