import type { Role } from "@/db/schema";

/** Where each kind of user lands after logging in (paths without the locale). */
export const HOME_PATHS: Record<Role, string> = {
  STUDENT: "/rooms",
  LANDLORD: "/listings",
  ADMIN: "/admin",
};
