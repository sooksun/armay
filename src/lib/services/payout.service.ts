import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/codegen";
import { writeAudit } from "@/lib/services/audit.service";
import { decToNumber, fmtTHB } from "@/lib/money";
import { parseThaiBEDate, formatBEDate } from "@/lib/date";
import { PAYOUT_STATUS, PAYOUT_STATUS_BADGE, EXPENSE_TYPE, PAYMENT_METHOD } from "@/lib/labels";
import { ApiError } from "@/lib/api/response";
import type { Session } from "@/lib/auth/session";
import type { PayoutDTO, PayoutListDTO, PayoutSummaryDTO, PayoutPreviewDTO, PayoutDetailDTO } from "@/lib/api-types";
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

const DETAIL_INCLUDE = { owner: true, room: true, property: true, items: { orderBy: { id: "asc" } } } satisfies Prisma.OwnerPayoutInclude;

export async function getPayoutDetail(id: number): Promise<PayoutDetailDTO> {
  const p = await prisma.ownerPayout.findUnique({ where: { id }, include: DETAIL_INCLUDE });
  if (!p) throw new ApiError("NOT_FOUND", "ไม่พบรายการจ่ายเจ้าของนี้", 404);
  return {
    id: p.id,
    payoutCode: p.payoutCode,
    owner: p.owner.fullName,
    ownerBankAccount: p.ownerBankAccount ?? "",
    room: `${p.room?.roomNumber ?? "—"} · ${p.property?.propertyName ?? ""}`,
    payoutDate: formatBEDate(p.payoutDate),
    gross: fmtTHB(decToNumber(p.grossIncomeAmount)),
    deduction: fmtTHB(decToNumber(p.deductionAmount)),
    net: fmtTHB(decToNumber(p.netPayoutAmount)),
    paid: fmtTHB(decToNumber(p.paidAmount)),
    paymentMethod: p.paymentMethod ? PAYMENT_METHOD[p.paymentMethod] ?? p.paymentMethod : "—",
    transactionReference: p.transactionReference ?? "",
    status: PAYOUT_STATUS[p.payoutStatus] ?? p.payoutStatus,
    badge: PAYOUT_STATUS_BADGE[p.payoutStatus] ?? "gray",
    statusValue: p.payoutStatus,
    note: p.note ?? "",
    items: p.items.map((it) => ({ label: it.label, amount: fmtTHB(decToNumber(it.amount)), sourceType: it.sourceType })),
  };
}

/** Mark a payout as fully paid (approved). ADMIN-gated at the route. */
export async function approvePayout(id: number, session: Session): Promise<number> {
  const p = await prisma.ownerPayout.findUnique({ where: { id } });
  if (!p) throw new ApiError("NOT_FOUND", "ไม่พบรายการจ่ายเจ้าของนี้", 404);
  if (p.payoutStatus === "PAID") throw new ApiError("ALREADY_PAID", "รายการนี้จ่ายครบแล้ว", 409);
  if (p.payoutStatus === "CANCELLED") throw new ApiError("CANCELLED", "รายการนี้ถูกยกเลิกแล้ว", 409);
  await prisma.ownerPayout.update({
    where: { id },
    data: { payoutStatus: "PAID", paidAmount: p.netPayoutAmount, verificationStatus: "VERIFIED" },
  });
  await writeAudit({ userId: session.userId, action: "APPROVE", tableName: "owner_payouts", recordId: id, oldValue: p });
  return id;
}

export async function deletePayout(id: number, session: Session): Promise<boolean> {
  const p = await prisma.ownerPayout.findUnique({ where: { id } });
  if (!p) throw new ApiError("NOT_FOUND", "ไม่พบรายการจ่ายเจ้าของนี้", 404);
  if (p.payoutStatus === "PAID") throw new ApiError("PAID_LOCK", "ลบไม่ได้ — รายการที่จ่ายแล้วต้องเก็บไว้เป็นหลักฐาน", 409);
  await prisma.ownerPayout.delete({ where: { id } }); // payout_items cascade-delete, freeing their expense sources
  await writeAudit({ userId: session.userId, action: "DELETE", tableName: "owner_payouts", recordId: id });
  return true;
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

  // suggested commission = ratio of this owner's most recent commission line
  // (abs: legacy/seed rows store deductions as negatives), clamped 0–50%, fallback 10%
  let ratio = 0.1;
  const lastCommission = await prisma.payoutItem.findFirst({
    where: { sourceType: { in: ["commission", "COMMISSION"] }, payout: { ownerId } },
    orderBy: { id: "desc" },
    include: { payout: true },
  });
  if (lastCommission) {
    const lastGross = decToNumber(lastCommission.payout.grossIncomeAmount);
    const r = lastGross > 0 ? Math.abs(decToNumber(lastCommission.amount)) / lastGross : 0;
    if (r > 0 && r <= 0.5) ratio = r;
  }
  const suggestedCommission = Math.round(gross * ratio);

  return { gross, ownerExpenses, suggestedCommission };
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
