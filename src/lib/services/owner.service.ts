import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/codegen";
import { writeAudit } from "@/lib/services/audit.service";
import { decToNumber, fmtTHB } from "@/lib/money";
import { ROOM_STATUS, ROOM_STATUS_BADGE, PAYOUT_STATUS, PAYOUT_STATUS_BADGE } from "@/lib/labels";
import { ApiError } from "@/lib/api/response";
import type { Session } from "@/lib/auth/session";
import type { OwnerDTO } from "@/lib/api-types";
import type { OwnerCreateInput, OwnerUpdateInput } from "@/lib/validation/owner.schema";

const INCLUDE = {
  rooms: { include: { property: true } },
  payouts: { include: { room: true, property: true } },
  incomes: { select: { amount: true } },
} satisfies Prisma.OwnerInclude;

type OwnerWithRelations = Prisma.OwnerGetPayload<{ include: typeof INCLUDE }>;

function toDTO(o: OwnerWithRelations): OwnerDTO {
  const payoutsPending = o.payouts.filter((p) => p.payoutStatus !== "PAID");
  const payoutsPaid = o.payouts.filter((p) => p.payoutStatus === "PAID");
  return {
    id: o.id,
    ownerCode: o.ownerCode,
    fullName: o.fullName,
    phone: o.phone ?? "",
    email: o.email ?? "",
    lineId: o.lineId ?? "",
    address: o.address ?? "",
    bankName: o.bankName ?? "",
    bankAccountNumber: o.bankAccountNumber ?? "",
    bankAccountName: o.bankAccountName ?? "",
    promptpayId: o.promptpayId ?? "",
    note: o.note ?? "",
    status: o.status,
    roomCount: o.rooms.length,
    pendingPayout: payoutsPending.reduce((s, p) => s + decToNumber(p.netPayoutAmount), 0),
    paidPayout: payoutsPaid.reduce((s, p) => s + decToNumber(p.netPayoutAmount), 0),
    monthlyIncome: o.incomes.reduce((s, i) => s + decToNumber(i.amount), 0),
    rooms: o.rooms.map((r) => ({
      no: r.roomNumber,
      building: r.property.propertyName,
      status: ROOM_STATUS[r.status] ?? r.status,
      badge: ROOM_STATUS_BADGE[r.status] ?? "gray",
    })),
    payouts: o.payouts.map((p) => ({
      room: `${p.room?.roomNumber ?? "—"} · ${p.property?.propertyName ?? ""}`,
      income: fmtTHB(decToNumber(p.grossIncomeAmount)),
      deduct: fmtTHB(decToNumber(p.deductionAmount)),
      net: fmtTHB(decToNumber(p.netPayoutAmount)),
      status: PAYOUT_STATUS[p.payoutStatus] ?? p.payoutStatus,
      badge: PAYOUT_STATUS_BADGE[p.payoutStatus] ?? "gray",
    })),
  };
}

export async function listOwners(): Promise<OwnerDTO[]> {
  const owners = await prisma.owner.findMany({ orderBy: { id: "asc" }, include: INCLUDE });
  return owners.map(toDTO);
}

export async function createOwner(input: OwnerCreateInput, session: Session): Promise<number> {
  const ownerCode = await generateCode("OWNER", "OWN");
  const created = await prisma.owner.create({ data: { ownerCode, ...input } });
  await writeAudit({ userId: session.userId, action: "CREATE", tableName: "owners", recordId: created.id, newValue: input });
  return created.id;
}

export async function updateOwner(id: number, input: OwnerUpdateInput, session: Session): Promise<number> {
  const existing = await prisma.owner.findUnique({ where: { id } });
  if (!existing) throw new ApiError("NOT_FOUND", "ไม่พบเจ้าของรายนี้", 404);
  await prisma.owner.update({ where: { id }, data: input });
  await writeAudit({ userId: session.userId, action: "UPDATE", tableName: "owners", recordId: id, oldValue: existing, newValue: input });
  return id;
}

export async function deleteOwner(id: number, session: Session): Promise<boolean> {
  const roomCount = await prisma.room.count({ where: { ownerId: id } });
  if (roomCount > 0) throw new ApiError("HAS_DEPENDENTS", `ลบไม่ได้ — เจ้าของรายนี้ยังมีห้องในความดูแลอยู่ ${roomCount} ห้อง`, 409);
  await prisma.owner.delete({ where: { id } });
  await writeAudit({ userId: session.userId, action: "DELETE", tableName: "owners", recordId: id });
  return true;
}
