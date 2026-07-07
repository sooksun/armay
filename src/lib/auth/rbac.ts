import type { UserRole } from "@/lib/auth/session";

/** Action → roles allowed. Write operations exclude VIEWER; approvals/user-admin are ADMIN-only. */
export const CAN: Record<string, UserRole[]> = {
  read: ["ADMIN", "STAFF", "VIEWER"],
  write: ["ADMIN", "STAFF"],
  delete: ["ADMIN"],
  approve: ["ADMIN"],
  manageUsers: ["ADMIN"],
};

export function can(action: keyof typeof CAN, role: UserRole): boolean {
  return CAN[action].includes(role);
}
