import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/codegen";
import { writeAudit } from "@/lib/services/audit.service";
import { decToNumber, fmtTHB } from "@/lib/money";
import { parseThaiBEDate } from "@/lib/date";
import { PAYOUT_STATUS, PAYOUT_STATUS_BADGE, EXPENSE_TYPE } from "@/lib/labels";
import { ApiError } from "@/lib/api/response";
import type { Session } from "@/lib/auth/session";
import type { PayoutDTO, PayoutListDTO, PayoutSummaryDTO, PayoutPreviewDTO } from "@/lib/api-types";
import type { PayoutCreateInput } from "@/lib/validation/payout.schema";

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

/** Suggest gross income + owner-responsibility expense deductions for a payout. */
export async function previewPayout(ownerId: number, contractId: number | null): Promise<PayoutPreviewDTO> {
  const incomeWhere: Prisma.IncomeTransactionWhereInput = {
    ownerId,
    verificationStatus: { not: "CANCELLED" },
    ...(contractId ? { contractId } : {}),
  };
  const incomes = await prisma.incomeTransaction.findMany({ where: incomeWhere, select: { amount: true } });
  const gross = incomes.reduce((s, i) => s + decToNumber(i.amount), 0);

  // owner-responsibility expenses not already tied to a payout item
  const usedIds = (await prisma.payoutItem.findMany({ where: { sourceType: "expense" }, select: { sourceId: true } }))
    .map((x) => x.sourceId)
    .filter((x): x is number => x != null);
  const expenses = await prisma.expenseTransaction.findMany({
    where: {
      ownerId,
      responsibilityType: "OWNER",
      verificationStatus: { not: "CANCELLED" },
      id: { notIn: usedIds.length ? usedIds : [-1] },
      ...(contractId ? { contractId } : {}),
    },
    select: { id: true, amount: true, expenseType: true, description: true },
  });
  const ownerExpenses = expenses.map((e) => ({
    sourceId: e.id,
    label: e.description || EXPENSE_TYPE[e.expenseType] || e.expenseType,
    amount: decToNumber(e.amount),
  }));
  return { gross, ownerExpenses };
}

export async function createPayout(input: PayoutCreateInput, session: Session): Promise<number> {
  const owner = await prisma.owner.findUnique({ where: { id: input.ownerId } });
  if (!owner) throw new ApiError("OWNER_NOT_FOUND", "ไม่พบเจ้าของที่เลือก", 400);

  let roomId: number | null = input.roomId ?? null;
  let propertyId: number | null = null;
  if (input.contractId) {
    const contract = await prisma.rentalContract.findUnique({ where: { id: input.contractId } });
    if (!contract) throw new ApiError("CONTRACT_NOT_FOUND", "ไม่พบรายการเช่าที่เลือก", 400);
    roomId = contract.roomId;
    propertyId = contract.propertyId;
  }

  const deductionLines = [
    ...(input.commissionAmount > 0
      ? [{ sourceType: "commission", sourceId: null as number | null, label: "ค่านายหน้า", amount: input.commissionAmount }]
      : []),
    ...input.deductions.map((d) => ({ sourceType: "expense", sourceId: d.sourceId, label: d.label, amount: d.amount })),
  ];
  const deductionAmount = deductionLines.reduce((s, d) => s + d.amount, 0);
  const netPayoutAmount = input.grossIncomeAmount - deductionAmount;

  const payoutCode = await generateCode("PAYOUT", "PAY");

  try {
    return await createPayoutTx(input, { payoutCode, ownerId: owner.id, roomId, propertyId, deductionLines, deductionAmount, netPayoutAmount }, session);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new ApiError("DEDUCTION_ALREADY_USED", "มีรายการหักบางรายการถูกใช้ในการจ่ายก่อนหน้าแล้ว", 409);
    }
    throw e;
  }
}

async function createPayoutTx(
  input: PayoutCreateInput,
  computed: {
    payoutCode: string;
    ownerId: number;
    roomId: number | null;
    propertyId: number | null;
    deductionLines: { sourceType: string; sourceId: number | null; label: string; amount: number }[];
    deductionAmount: number;
    netPayoutAmount: number;
  },
  session: Session
): Promise<number> {
  const { payoutCode, ownerId, roomId, propertyId, deductionLines, deductionAmount, netPayoutAmount } = computed;
  const created = await prisma.$transaction(async (tx) => {
    const payout = await tx.ownerPayout.create({
      data: {
        payoutCode,
        ownerId,
        roomId,
        propertyId,
        contractId: input.contractId ?? null,
        payoutDate: parseThaiBEDate(input.payoutDate),
        grossIncomeAmount: input.grossIncomeAmount,
        deductionAmount,
        netPayoutAmount,
        paidAmount: 0,
        paymentMethod: (input.paymentMethod as Prisma.OwnerPayoutCreateInput["paymentMethod"]) ?? null,
        ownerBankAccount: input.ownerBankAccount || null,
        payoutStatus: "PENDING",
        verificationStatus: "DRAFT",
        note: input.note || null,
      },
    });
    if (deductionLines.length) {
      await tx.payoutItem.createMany({
        data: deductionLines.map((d) => ({
          payoutId: payout.id,
          sourceType: d.sourceType,
          sourceId: d.sourceId,
          label: d.label,
          amount: d.amount,
        })),
      });
    }
    await writeAudit(
      { userId: session.userId, action: "CREATE", tableName: "owner_payouts", recordId: payout.id, newValue: { ...input, netPayoutAmount } },
      tx
    );
    return payout;
  });
  return created.id;
}
