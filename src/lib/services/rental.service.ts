import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/codegen";
import { writeAudit } from "@/lib/services/audit.service";
import { decToNumber, fmtTHB } from "@/lib/money";
import { formatDayMonth, parseThaiBEDate } from "@/lib/date";
import { PAYMENT_STATUS, PAYMENT_STATUS_BADGE } from "@/lib/labels";
import { ApiError } from "@/lib/api/response";
import type { Session } from "@/lib/auth/session";
import type { RentalDTO } from "@/lib/api-types";
import type { RentalCreateInput } from "@/lib/validation/rental.schema";

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
