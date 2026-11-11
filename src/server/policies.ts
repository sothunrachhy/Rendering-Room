// Who may see or do what with a room. Pure functions on plain data (no database, no
// request), so the rules are unit-tested in policies.test.ts and the actions and route
// handlers that use them stay thin.
import type { Role, Verification } from "@/db/schema";

type RoomVisibility = {
  hidden: boolean;
  landlordId: string;
  landlordVerification: Verification;
};

type Viewer = { id: string; role: Role } | null;

/** Listed publicly: not hidden by an admin, and its landlord is verified. */
export function isPubliclyVisible(room: Omit<RoomVisibility, "landlordId">): boolean {
  return !room.hidden && room.landlordVerification === "VERIFIED";
}

/**
 * A room photo (QA-02): anyone may see a listed room's photos (cacheable); a hidden or
 * unverified room's photos only its landlord and admins (never cached); anyone else
 * gets a 404, as if it didn't exist.
 */
export function photoAccess(room: RoomVisibility, viewer: Viewer): "public" | "private" | "denied" {
  if (isPubliclyVisible(room)) return "public";
  if (viewer && (viewer.role === "ADMIN" || viewer.id === room.landlordId)) return "private";
  return "denied";
}

/**
 * Why a report can't be filed (QA-03), or null when it can. `room` is null when the room
 * isn't publicly visible (or doesn't exist).
 */
export function reportBlock(
  room: { landlordId: string } | null,
  reporterId: string,
  hasOpenReport: boolean,
): "roomNotFound" | "ownRoom" | "alreadyReported" | null {
  if (!room) return "roomNotFound";
  if (room.landlordId === reporterId) return "ownRoom";
  if (hasOpenReport) return "alreadyReported";
  return null;
}

/**
 * Why a landlord can't accept a viewing request (QA-04), or null when they can.
 * Accepting shares the landlord's phone number and unlocks a review, so it needs a
 * listed room: not hidden by an admin, from a verified landlord. Declining is always
 * allowed.
 */
export function acceptBlock(
  room: { hidden: boolean },
  landlordVerification: Verification,
): "roomHidden" | "landlordUnverified" | null {
  if (room.hidden) return "roomHidden";
  if (landlordVerification !== "VERIFIED") return "landlordUnverified";
  return null;
}
