import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/codegen";
import { writeAudit } from "@/lib/services/audit.service";
import { decToNumber, fmtTHB } from "@/lib/money";
import { formatDayMonth, formatBEDate, parseThaiBEDate } from "@/lib/date";
import {
  PAYMENT_STATUS,
  PAYMENT_STATUS_BADGE,
  RENTAL_STATUS,
  INCOME_TYPE,
  VERIFICATION_STATUS,
  VERIFICATION_BADGE,
} from "@/lib/labels";
import { ApiError } from "@/lib/api/response";
import type { Session } from "@/lib/auth/session";
import type { RentalDTO, RentalDetailDTO } from "@/lib/api-types";
import type { RentalCreateInput, RentalUpdateInput } from "@/lib/validation/rental.schema";

const RENTAL_TYPE_LABEL: Record<string, string> = { DAILY: "รายวัน", MONTHLY: "รายเดือน", YEARLY: "รายปี" };

const DETAIL_INCLUDE = {
  tenant: true,
  room: true,
  property: true,
  owner: true,
  incomes: { orderBy: { incomeDate: "desc" } },
} satisfies Prisma.RentalContractInclude;

export async function getRentalDetail(id: number): Promise<RentalDetailDTO> {
  const c = await prisma.rentalContract.findUnique({ where: { id }, include: DETAIL_INCLUDE });
  if (!c) throw new ApiError("NOT_FOUND", "ไม่พบรายการเช่านี้", 404);

  const total = decToNumber(c.totalAmount);
  const paid = c.incomes
    .filter((i) => i.verificationStatus !== "CANCELLED")
    .reduce((s, i) => s + decToNumber(i.amount), 0);
  const due = c.paymentStatus === "PAID" ? 0 : Math.max(0, total - paid);

  return {
    id: c.id,
    code: c.contractCode,
    tenant: c.tenant.fullName,
    tenantPhone: c.tenant.phone ?? "",
    room: c.room.roomNumber,
    building: c.property.propertyName,
    owner: c.owner.fullName,
    rentalType: RENTAL_TYPE_LABEL[c.rentalType] ?? c.rentalType,
    tenantId: c.tenantId,
    roomId: c.roomId,
    rentalTypeValue: c.rentalType,
    period: `${formatBEDate(c.startDate)} – ${formatBEDate(c.endDate)}`,
    startDate: formatBEDate(c.startDate),
    endDate: formatBEDate(c.endDate),
    rent: fmtTHB(decToNumber(c.rentAmount)),
    deposit: fmtTHB(decToNumber(c.depositAmount)),
    cleaningFee: fmtTHB(decToNumber(c.cleaningFee)),
    otherFee: fmtTHB(decToNumber(c.otherFee)),
    discount: fmtTHB(decToNumber(c.discountAmount)),
    total: fmtTHB(total),
    paid: fmtTHB(paid),
    due: fmtTHB(due),
    bookingChannel: c.bookingChannel ?? "",
    status: PAYMENT_STATUS[c.paymentStatus] ?? c.paymentStatus,
    badge: PAYMENT_STATUS_BADGE[c.paymentStatus] ?? "gray",
    rentalStatus: RENTAL_STATUS[c.rentalStatus] ?? c.rentalStatus,
    note: c.note ?? "",
    incomes: c.incomes.map((i) => ({
      date: formatBEDate(i.incomeDate),
      type: INCOME_TYPE[i.incomeType] ?? i.incomeType,
      amount: fmtTHB(decToNumber(i.amount)),
      status: VERIFICATION_STATUS[i.verificationStatus] ?? i.verificationStatus,
      badge: VERIFICATION_BADGE[i.verificationStatus] ?? "gray",
    })),
  };
}

const INCLUDE = {
  tenant: true,
  room: true,
  property: true,
  owner: true,
  incomes: { select: { amount: true } },
} satisfies Prisma.RentalContractInclude;

type RentalWithRelations = Prisma.RentalContractGetPayload<{ include: typeof INCLUDE }>;

function toDTO(c: RentalWithRelations): RentalDTO {
  const total = decToNumber(c.totalAmount);
  const paid = c.incomes.reduce((s, i) => s + decToNumber(i.amount), 0);
  const due = c.paymentStatus === "PAID" ? 0 : Math.max(0, total - paid);
  return {
    id: c.id,
    code: c.contractCode,
    tenant: c.tenant.fullName,
    room: c.room.roomNumber,
    building: c.property.propertyName,
    owner: c.owner.fullName,
    period: `${formatDayMonth(c.startDate)} – ${formatDayMonth(c.endDate)}`,
    total: fmtTHB(total),
    due: fmtTHB(due),
    status: PAYMENT_STATUS[c.paymentStatus] ?? c.paymentStatus,
    badge: PAYMENT_STATUS_BADGE[c.paymentStatus] ?? "gray",
  };
}

export async function listRentals(): Promise<RentalDTO[]> {
  const rows = await prisma.rentalContract.findMany({ orderBy: { startDate: "desc" }, include: INCLUDE });
  return rows.map(toDTO);
}

export async function createRental(input: RentalCreateInput, session: Session): Promise<number> {
  const room = await prisma.room.findUnique({ where: { id: input.roomId } });
  if (!room) throw new ApiError("ROOM_NOT_FOUND", "ไม่พบห้องที่เลือก", 400);
  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) throw new ApiError("TENANT_NOT_FOUND", "ไม่พบผู้เช่าที่เลือก", 400);

  const totalAmount =
    input.rentAmount + input.depositAmount + input.cleaningFee + input.otherFee - input.discountAmount;
  const contractCode = await generateCode("RENTAL", "RN");

  const created = await prisma.rentalContract.create({
    data: {
      contractCode,
      tenantId: tenant.id,
      roomId: room.id,
      ownerId: room.ownerId,
      propertyId: room.propertyId,
      rentalType: input.rentalType as Prisma.RentalContractCreateInput["rentalType"],
      startDate: parseThaiBEDate(input.startDate),
      endDate: parseThaiBEDate(input.endDate),
      rentAmount: input.rentAmount,
      depositAmount: input.depositAmount,
      cleaningFee: input.cleaningFee,
      otherFee: input.otherFee,
      discountAmount: input.discountAmount,
      totalAmount,
      bookingChannel: input.bookingChannel || null,
      rentalStatus: "BOOKED",
      paymentStatus: "UNPAID",
      note: input.note || null,
    },
  });
  await writeAudit({ userId: session.userId, action: "CREATE", tableName: "rental_contracts", recordId: created.id, newValue: input });
  return created.id;
}

export async function updateRental(id: number, input: RentalUpdateInput, session: Session): Promise<number> {
  const existing = await prisma.rentalContract.findUnique({ where: { id } });
  if (!existing) throw new ApiError("NOT_FOUND", "ไม่พบรายการเช่านี้", 404);
  const room = await prisma.room.findUnique({ where: { id: input.roomId } });
  if (!room) throw new ApiError("ROOM_NOT_FOUND", "ไม่พบห้องที่เลือก", 400);
  const tenant = await prisma.tenant.findUnique({ where: { id: input.tenantId } });
  if (!tenant) throw new ApiError("TENANT_NOT_FOUND", "ไม่พบผู้เช่าที่เลือก", 400);

  const totalAmount = input.rentAmount + input.depositAmount + input.cleaningFee + input.otherFee - input.discountAmount;
  await prisma.rentalContract.update({
    where: { id },
    data: {
      tenantId: tenant.id,
      roomId: room.id,
      ownerId: room.ownerId,
      propertyId: room.propertyId,
      rentalType: input.rentalType as Prisma.RentalContractCreateInput["rentalType"],
      startDate: parseThaiBEDate(input.startDate),
      endDate: parseThaiBEDate(input.endDate),
      rentAmount: input.rentAmount,
      depositAmount: input.depositAmount,
      cleaningFee: input.cleaningFee,
      otherFee: input.otherFee,
      discountAmount: input.discountAmount,
      totalAmount,
      bookingChannel: input.bookingChannel || null,
      note: input.note || null,
    },
  });
  await writeAudit({ userId: session.userId, action: "UPDATE", tableName: "rental_contracts", recordId: id, oldValue: existing, newValue: input });
  return id;
}

export async function deleteRental(id: number, session: Session): Promise<boolean> {
  const existing = await prisma.rentalContract.findUnique({ where: { id } });
  if (!existing) throw new ApiError("NOT_FOUND", "ไม่พบรายการเช่านี้", 404);
  const [incomes, payouts, expenses] = await Promise.all([
    prisma.incomeTransaction.count({ where: { contractId: id } }),
    prisma.ownerPayout.count({ where: { contractId: id } }),
    prisma.expenseTransaction.count({ where: { contractId: id } }),
  ]);
  if (incomes > 0) throw new ApiError("HAS_DEPENDENTS", `ลบไม่ได้ — รายการเช่านี้มีรายรับผูกอยู่ ${incomes} รายการ`, 409);
  if (payouts > 0 || expenses > 0) throw new ApiError("HAS_DEPENDENTS", "ลบไม่ได้ — รายการเช่านี้มีการจ่ายเจ้าของ/ค่าใช้จ่ายผูกอยู่", 409);
  await prisma.rentalContract.delete({ where: { id } });
  await writeAudit({ userId: session.userId, action: "DELETE", tableName: "rental_contracts", recordId: id });
  return true;
}
