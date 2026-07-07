import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decToNumber, fmtTHB } from "@/lib/money";
import { PAYOUT_STATUS, PAYOUT_STATUS_BADGE } from "@/lib/labels";
import type { PayoutDTO, PayoutListDTO, PayoutSummaryDTO } from "@/lib/api-types";

const INCLUDE = { owner: true, room: true, property: true } satisfies Prisma.OwnerPayoutInclude;
type PayoutWithRelations = Prisma.OwnerPayoutGetPayload<{ include: typeof INCLUDE }>;

function toDTO(p: PayoutWithRelations): PayoutDTO {
  return {
    id: p.id,
    owner: p.owner.fullName,
    room: `${p.room?.roomNumber ?? "—"} · ${p.property?.propertyName ?? ""}`,
    income: fmtTHB(decToNumber(p.grossIncomeAmount)),
    deduct: fmtTHB(decToNumber(p.deductionAmount)),
    net: fmtTHB(decToNumber(p.netPayoutAmount)),
    status: PAYOUT_STATUS[p.payoutStatus] ?? p.payoutStatus,
    badge: PAYOUT_STATUS_BADGE[p.payoutStatus] ?? "gray",
  };
}

function summarize(rows: PayoutWithRelations[]): PayoutSummaryDTO {
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}`;
  let pending = 0;
  let paidMonth = 0;
  const ownersUnpaid = new Set<number>();
  let toReview = 0;
  for (const p of rows) {
    if (p.payoutStatus === "PENDING") {
      pending += decToNumber(p.netPayoutAmount);
      ownersUnpaid.add(p.ownerId);
    }
    const d = p.payoutDate;
    if (p.payoutStatus === "PAID" && `${d.getUTCFullYear()}-${d.getUTCMonth()}` === monthKey) {
      paidMonth += decToNumber(p.paidAmount);
    }
    if (p.verificationStatus === "PENDING") toReview += 1;
  }
  return {
    pending: fmtTHB(pending),
    paidMonth: fmtTHB(paidMonth),
    ownersUnpaid: `${ownersUnpaid.size} ราย`,
    toReview: `${toReview} รายการ`,
  };
}

export async function listPayouts(): Promise<PayoutListDTO> {
  const rows = await prisma.ownerPayout.findMany({ orderBy: { payoutDate: "desc" }, include: INCLUDE });
  return { rows: rows.map(toDTO), summary: summarize(rows) };
}
