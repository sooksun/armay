import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/codegen";
import { writeAudit } from "@/lib/services/audit.service";
import { formatDayMonth } from "@/lib/date";
import { PAYMENT_STATUS, PAYMENT_STATUS_BADGE } from "@/lib/labels";
import { ApiError } from "@/lib/api/response";
import type { Session } from "@/lib/auth/session";
import type { TenantDTO, RentalBrief } from "@/lib/api-types";
import type { TenantCreateInput, TenantUpdateInput } from "@/lib/validation/tenant.schema";

const INCLUDE = {
  contracts: { include: { room: { include: { property: true } } }, orderBy: { startDate: "desc" } },
} satisfies Prisma.TenantInclude;

type TenantWithRelations = Prisma.TenantGetPayload<{ include: typeof INCLUDE }>;

function rentalBrief(c: TenantWithRelations["contracts"][number]): RentalBrief {
  return {
    code: c.contractCode,
    room: c.room.roomNumber,
    building: c.room.property.propertyName,
    period: `${formatDayMonth(c.startDate)} – ${formatDayMonth(c.endDate)}`,
    status: PAYMENT_STATUS[c.paymentStatus] ?? c.paymentStatus,
    badge: PAYMENT_STATUS_BADGE[c.paymentStatus] ?? "gray",
  };
}

function toDTO(t: TenantWithRelations): TenantDTO {
  const rentals = t.contracts.map(rentalBrief);
  return {
    id: t.id,
    tenantCode: t.tenantCode,
    fullName: t.fullName,
    phone: t.phone ?? "",
    email: t.email ?? "",
    lineId: t.lineId ?? "",
    idCardOrPassport: t.idCardOrPassport ?? "",
    nationality: t.nationality ?? "",
    address: t.address ?? "",
    note: t.note ?? "",
    blacklist: t.blacklist,
    status: t.status,
    latest: rentals[0] ?? null,
    rentals,
    hasActiveRental: t.contracts.some((c) => c.rentalStatus === "BOOKED" || c.rentalStatus === "CHECKED_IN"),
  };
}

export async function listTenants(): Promise<TenantDTO[]> {
  const tenants = await prisma.tenant.findMany({ orderBy: { id: "asc" }, include: INCLUDE });
  return tenants.map(toDTO);
}

export async function createTenant(input: TenantCreateInput, session: Session): Promise<number> {
  const tenantCode = await generateCode("TENANT", "TNT");
  const created = await prisma.tenant.create({ data: { tenantCode, ...input } });
  await writeAudit({ userId: session.userId, action: "CREATE", tableName: "tenants", recordId: created.id, newValue: input });
  return created.id;
}

export async function updateTenant(id: number, input: TenantUpdateInput, session: Session): Promise<number> {
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) throw new ApiError("NOT_FOUND", "ไม่พบผู้เช่ารายนี้", 404);
  await prisma.tenant.update({ where: { id }, data: input });
  await writeAudit({ userId: session.userId, action: "UPDATE", tableName: "tenants", recordId: id, oldValue: existing, newValue: input });
  return id;
}

export async function deleteTenant(id: number, session: Session): Promise<boolean> {
  const active = await prisma.rentalContract.count({ where: { tenantId: id, rentalStatus: { in: ["BOOKED", "CHECKED_IN"] } } });
  if (active > 0) throw new ApiError("HAS_DEPENDENTS", "ลบไม่ได้ — ผู้เช่ารายนี้ยังมีสัญญาที่ใช้งานอยู่", 409);
  const any = await prisma.rentalContract.count({ where: { tenantId: id } });
  if (any > 0) throw new ApiError("HAS_DEPENDENTS", "ลบไม่ได้ — ผู้เช่ารายนี้มีประวัติสัญญาเช่าในระบบ", 409);
  await prisma.tenant.delete({ where: { id } });
  await writeAudit({ userId: session.userId, action: "DELETE", tableName: "tenants", recordId: id });
  return true;
}
