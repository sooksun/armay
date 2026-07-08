import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/codegen";
import { writeAudit } from "@/lib/services/audit.service";
import { decToNumber, fmtTHB } from "@/lib/money";
import { formatBEDate, parseThaiBEDate } from "@/lib/date";
import { INCOME_TYPE, PAYMENT_METHOD, VERIFICATION_STATUS, VERIFICATION_BADGE } from "@/lib/labels";
import { ApiError } from "@/lib/api/response";
import type { Session } from "@/lib/auth/session";
import type { IncomeDTO, IncomeListDTO, IncomeSummaryDTO, IncomeDetailDTO } from "@/lib/api-types";
import type { IncomeCreateInput, IncomeUpdateInput } from "@/lib/validation/income.schema";

const INCLUDE = {
  tenant: true,
  room: true,
  property: true,
} satisfies Prisma.IncomeTransactionInclude;

type IncomeWithRelations = Prisma.IncomeTransactionGetPayload<{ include: typeof INCLUDE }>;

function toDTO(t: IncomeWithRelations): IncomeDTO {
  const slipOk = !!t.proofFileUrl;
  const flag = !slipOk || t.verificationStatus === "PROBLEM" || t.verificationStatus === "NEEDS_FIX";
  return {
    id: t.id,
    date: formatBEDate(t.incomeDate),
    tenant: t.tenant?.fullName ?? "—",
    room: t.room?.roomNumber ?? "—",
    building: t.property?.propertyName ?? "",
    type: INCOME_TYPE[t.incomeType] ?? t.incomeType,
    amount: fmtTHB(decToNumber(t.amount)),
    channel: PAYMENT_METHOD[t.paymentMethod] ?? t.paymentMethod,
    slipOk,
    status: VERIFICATION_STATUS[t.verificationStatus] ?? t.verificationStatus,
    badge: VERIFICATION_BADGE[t.verificationStatus] ?? "gray",
    flag,
  };
}

function summarize(rows: IncomeWithRelations[]): IncomeSummaryDTO {
  const now = new Date();
  const todayKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}`;
  const monthKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}`;

  let today = 0;
  let month = 0;
  let pending = 0;
  let noSlip = 0;
  const dupSeen = new Map<string, number>();

  for (const t of rows) {
    if (t.verificationStatus === "CANCELLED") continue; // never count cancelled in summary totals
    const amt = decToNumber(t.amount);
    const d = t.incomeDate;
    if (`${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}` === todayKey) today += amt;
    if (`${d.getUTCFullYear()}-${d.getUTCMonth()}` === monthKey) month += amt;
    if (t.verificationStatus === "PENDING") pending += amt;
    if (!t.proofFileUrl) noSlip += amt;
    const dupKey = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}|${amt}|${t.paymentMethod}`;
    dupSeen.set(dupKey, (dupSeen.get(dupKey) ?? 0) + 1);
  }
  const maybeDup = [...dupSeen.values()].filter((c) => c > 1).reduce((s, c) => s + c, 0);

  return {
    today: fmtTHB(today),
    month: fmtTHB(month),
    pending: fmtTHB(pending),
    noSlip: fmtTHB(noSlip),
    maybeDup: `${maybeDup} รายการ`,
  };
}

export async function listIncomes(): Promise<IncomeListDTO> {
  const rows = await prisma.incomeTransaction.findMany({ orderBy: { incomeDate: "desc" }, include: INCLUDE });
  return { rows: rows.map(toDTO), summary: summarize(rows) };
}

export async function createIncome(input: IncomeCreateInput, session: Session): Promise<number> {
  const contract = await prisma.rentalContract.findUnique({ where: { id: input.contractId } });
  if (!contract) throw new ApiError("CONTRACT_NOT_FOUND", "ไม่พบรายการเช่าที่เลือก", 400);

  const incomeDate = parseThaiBEDate(input.incomeDate);
  const dayStart = new Date(Date.UTC(incomeDate.getUTCFullYear(), incomeDate.getUTCMonth(), incomeDate.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);

  // duplicate guard: same day + amount + method + reference
  const dup = await prisma.incomeTransaction.findFirst({
    where: {
      incomeDate: { gte: dayStart, lt: dayEnd },
      amount: input.amount,
      paymentMethod: input.paymentMethod as Prisma.IncomeTransactionCreateInput["paymentMethod"],
      transactionReference: input.transactionReference || null,
    },
  });
  if (dup) throw new ApiError("DUPLICATE_INCOME", "มีรายการรับเงินที่ตรงกันนี้อยู่แล้ว (วันที่ + จำนวน + ช่องทาง + อ้างอิง)", 409);

  const incomeCode = await generateCode("INCOME", "INC");
  const created = await prisma.incomeTransaction.create({
    data: {
      incomeCode,
      contractId: contract.id,
      tenantId: contract.tenantId,
      roomId: contract.roomId,
      ownerId: contract.ownerId,
      propertyId: contract.propertyId,
      incomeDate,
      incomeType: input.incomeType as Prisma.IncomeTransactionCreateInput["incomeType"],
      amount: input.amount,
      paymentMethod: input.paymentMethod as Prisma.IncomeTransactionCreateInput["paymentMethod"],
      receivingAccountId: input.receivingAccountId ?? null,
      transactionReference: input.transactionReference || null,
      proofFileUrl: input.proofFileUrl || null,
      verificationStatus: input.proofFileUrl ? "VERIFIED" : "PENDING",
      recordedBy: session.userId,
    },
  });
  await writeAudit({ userId: session.userId, action: "CREATE", tableName: "income_transactions", recordId: created.id, newValue: input });
  return created.id;
}

const DETAIL_INCLUDE = {
  contract: true,
  tenant: true,
  room: true,
  property: true,
} satisfies Prisma.IncomeTransactionInclude;

export async function getIncomeDetail(id: number): Promise<IncomeDetailDTO> {
  const t = await prisma.incomeTransaction.findUnique({ where: { id }, include: DETAIL_INCLUDE });
  if (!t) throw new ApiError("NOT_FOUND", "ไม่พบรายการรับเงินนี้", 404);
  const tenant = t.tenant?.fullName ?? "—";
  const room = t.room?.roomNumber ?? "—";
  return {
    id: t.id,
    incomeCode: t.incomeCode,
    contractId: t.contractId,
    contractLabel: `${t.contract.contractCode} · ${tenant} · ${room}`,
    tenant,
    room,
    building: t.property?.propertyName ?? "",
    incomeType: t.incomeType,
    incomeTypeLabel: INCOME_TYPE[t.incomeType] ?? t.incomeType,
    amount: decToNumber(t.amount),
    incomeDate: formatBEDate(t.incomeDate),
    paymentMethod: t.paymentMethod,
    paymentMethodLabel: PAYMENT_METHOD[t.paymentMethod] ?? t.paymentMethod,
    receivingAccountId: t.receivingAccountId,
    transactionReference: t.transactionReference ?? "",
    proofFileUrl: t.proofFileUrl,
    verificationStatus: t.verificationStatus,
    statusLabel: VERIFICATION_STATUS[t.verificationStatus] ?? t.verificationStatus,
    badge: VERIFICATION_BADGE[t.verificationStatus] ?? "gray",
    note: t.note ?? "",
  };
}

/** VERIFIED rows are locked — the domain requires an adjustment, not a direct edit. */
function assertMutable(status: string) {
  if (status === "VERIFIED")
    throw new ApiError("LOCKED", "รายการที่ตรวจสอบแล้ว (VERIFIED) แก้ไข/ลบโดยตรงไม่ได้ — ต้องสร้างรายการปรับปรุง (adjustment)", 409);
}

export async function updateIncome(id: number, input: IncomeUpdateInput, session: Session): Promise<number> {
  const existing = await prisma.incomeTransaction.findUnique({ where: { id } });
  if (!existing) throw new ApiError("NOT_FOUND", "ไม่พบรายการรับเงินนี้", 404);
  assertMutable(existing.verificationStatus);

  const contract = await prisma.rentalContract.findUnique({ where: { id: input.contractId } });
  if (!contract) throw new ApiError("CONTRACT_NOT_FOUND", "ไม่พบรายการเช่าที่เลือก", 400);

  const incomeDate = parseThaiBEDate(input.incomeDate);
  const dayStart = new Date(Date.UTC(incomeDate.getUTCFullYear(), incomeDate.getUTCMonth(), incomeDate.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000);

  // duplicate guard excludes the row being edited
  const dup = await prisma.incomeTransaction.findFirst({
    where: {
      id: { not: id },
      incomeDate: { gte: dayStart, lt: dayEnd },
      amount: input.amount,
      paymentMethod: input.paymentMethod as Prisma.IncomeTransactionCreateInput["paymentMethod"],
      transactionReference: input.transactionReference || null,
    },
  });
  if (dup) throw new ApiError("DUPLICATE_INCOME", "มีรายการรับเงินที่ตรงกันนี้อยู่แล้ว (วันที่ + จำนวน + ช่องทาง + อ้างอิง)", 409);

  await prisma.incomeTransaction.update({
    where: { id },
    data: {
      contractId: contract.id,
      tenantId: contract.tenantId,
      roomId: contract.roomId,
      ownerId: contract.ownerId,
      propertyId: contract.propertyId,
      incomeDate,
      incomeType: input.incomeType as Prisma.IncomeTransactionCreateInput["incomeType"],
      amount: input.amount,
      paymentMethod: input.paymentMethod as Prisma.IncomeTransactionCreateInput["paymentMethod"],
      receivingAccountId: input.receivingAccountId ?? null,
      transactionReference: input.transactionReference || null,
      proofFileUrl: input.proofFileUrl || null,
      verificationStatus: input.proofFileUrl ? "VERIFIED" : "PENDING",
    },
  });
  await writeAudit({ userId: session.userId, action: "UPDATE", tableName: "income_transactions", recordId: id, oldValue: existing, newValue: input });
  return id;
}

export async function deleteIncome(id: number, session: Session): Promise<boolean> {
  const existing = await prisma.incomeTransaction.findUnique({ where: { id } });
  if (!existing) throw new ApiError("NOT_FOUND", "ไม่พบรายการรับเงินนี้", 404);
  assertMutable(existing.verificationStatus);
  await prisma.incomeTransaction.delete({ where: { id } });
  await writeAudit({ userId: session.userId, action: "DELETE", tableName: "income_transactions", recordId: id });
  return true;
}
