import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/services/audit.service";
import { hashPassword } from "@/lib/auth/password";
import { formatBEDate } from "@/lib/date";
import { ApiError } from "@/lib/api/response";
import type { Session } from "@/lib/auth/session";
import type { UserDTO } from "@/lib/api-types";
import type { UserCreateInput, UserUpdateInput } from "@/lib/validation/user.schema";

const DEFAULT_PASSWORD = "armay123!";

type UserRow = Awaited<ReturnType<typeof prisma.user.findMany>>[number];

function toDTO(u: UserRow): UserDTO {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    status: u.status,
    lastActive: formatBEDate(u.updatedAt),
  };
}

export async function listUsers(): Promise<UserDTO[]> {
  const users = await prisma.user.findMany({ orderBy: { id: "asc" } });
  return users.map(toDTO);
}

export async function createUser(input: UserCreateInput, session: Session): Promise<number> {
  const dup = await prisma.user.findUnique({ where: { email: input.email } });
  if (dup) throw new ApiError("DUPLICATE_EMAIL", "อีเมลนี้ถูกใช้แล้ว", 409);
  const created = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      role: input.role,
      status: input.status,
      passwordHash: await hashPassword(input.password ?? DEFAULT_PASSWORD),
    },
  });
  await writeAudit({ userId: session.userId, action: "CREATE", tableName: "users", recordId: created.id, newValue: { email: input.email, role: input.role } });
  return created.id;
}

export async function updateUser(id: number, input: UserUpdateInput, session: Session): Promise<number> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new ApiError("NOT_FOUND", "ไม่พบผู้ใช้งาน", 404);
  // demoting/deactivating the last ADMIN is blocked
  if (existing.role === "ADMIN" && (input.role && input.role !== "ADMIN")) {
    const admins = await prisma.user.count({ where: { role: "ADMIN", status: "ACTIVE" } });
    if (admins <= 1) throw new ApiError("LAST_ADMIN", "ต้องมีผู้ดูแลระบบ (ADMIN) อย่างน้อย 1 คน", 409);
  }
  await prisma.user.update({
    where: { id },
    data: {
      fullName: input.fullName,
      email: input.email,
      role: input.role,
      status: input.status,
      ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
    },
  });
  await writeAudit({ userId: session.userId, action: "UPDATE", tableName: "users", recordId: id, oldValue: { role: existing.role, status: existing.status }, newValue: { role: input.role, status: input.status } });
  return id;
}

export async function deleteUser(id: number, session: Session): Promise<boolean> {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new ApiError("NOT_FOUND", "ไม่พบผู้ใช้งาน", 404);
  if (target.role === "ADMIN") {
    const admins = await prisma.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) throw new ApiError("LAST_ADMIN", "ลบไม่ได้ — ต้องมีผู้ดูแลระบบ (ADMIN) อย่างน้อย 1 คน", 409);
  }
  await prisma.user.delete({ where: { id } });
  await writeAudit({ userId: session.userId, action: "DELETE", tableName: "users", recordId: id });
  return true;
}
