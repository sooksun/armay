import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decToNumber, fmtTHB } from "@/lib/money";
import { formatDayMonth } from "@/lib/date";
import { PAYMENT_STATUS, PAYMENT_STATUS_BADGE } from "@/lib/labels";
import type { RentalDTO } from "@/lib/api-types";

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
