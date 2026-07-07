import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/codegen";
import { writeAudit } from "@/lib/services/audit.service";
import { decToNumber, fmtTHB } from "@/lib/money";
import { formatBEDate } from "@/lib/date";
import { EXPENSE_TYPE, RESPONSIBILITY, VERIFICATION_STATUS, VERIFICATION_BADGE, fromThai } from "@/lib/labels";
import { ApiError } from "@/lib/api/response";
import type { Session } from "@/lib/auth/session";
import type { ExpenseDTO, ExpenseListDTO, ExpenseSummaryDTO } from "@/lib/api-types";
import type { ExpenseCreateInput, ExpenseUpdateInput } from "@/lib/validation/expense.schema";

const INCLUDE = { room: true, property: true } satisfies Prisma.ExpenseTransactionInclude;
type ExpenseWithRelations = Prisma.ExpenseTransactionGetPayload<{ include: typeof INCLUDE }>;

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/** Parse "6 ก.ค. 2568" (Buddhist Era) into a UTC Date; falls back to now. */
function parseThaiBEDate(s: string): Date {
  const m = s.trim().match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const monthIdx = TH_MONTHS.indexOf(m[2]);
    const gYear = parseInt(m[3], 10) - 543;
    if (monthIdx >= 0) return new Date(Date.UTC(gYear, monthIdx, day));
  }
  return new Date();
}

/** UI status set from the form -> DB verification enum. */
const UI_STATUS_TO_ENUM: Record<string, string> = {
  "รอจ่าย": "PENDING",
  "จ่ายแล้ว": "VERIFIED",
  "รอตรวจสอบ": "PENDING",
  "มีปัญหา": "PROBLEM",
};

function toDTO(t: ExpenseWithRelations): ExpenseDTO {
  return {
    id: t.id,
    expenseCode: t.expenseCode,
    date: formatBEDate(t.expenseDate),
    room: t.room.roomNumber,
    building: t.property?.propertyName ?? "",
    expenseType: EXPENSE_TYPE[t.expenseType] ?? t.expenseType,
    description: t.description ?? "",
    payeeName: t.payeeName ?? "",
    amount: fmtTHB(decToNumber(t.amount)),
    responsibility: RESPONSIBILITY[t.responsibilityType] ?? t.responsibilityType,
    status: VERIFICATION_STATUS[t.verificationStatus] ?? t.verificationStatus,
    badge: VERIFICATION_BADGE[t.verificationStatus] ?? "gray",
    beforeUrl: t.beforeImageUrl,
    afterUrl: t.afterImageUrl,
  };
}

function summarize(rows: ExpenseWithRelations[]): ExpenseSummaryDTO {
  const now = new Date();
  const monthKey = `${now.getUTCFullYear()}-${now.getUTCMonth()}`;
  let month = 0;
  let repairCleaning = 0;
  let pendingReview = 0;
  let problem = 0;
  for (const t of rows) {
    if (t.verificationStatus === "CANCELLED") continue; // never count cancelled in summary totals
    const amt = decToNumber(t.amount);
    const d = t.expenseDate;
    if (`${d.getUTCFullYear()}-${d.getUTCMonth()}` === monthKey) month += amt;
    if (t.expenseType === "REPAIR" || t.expenseType === "CLEANING") repairCleaning += amt;
    if (t.verificationStatus === "PENDING") pendingReview += amt;
    if (t.verificationStatus === "PROBLEM") problem += 1;
  }
  return {
    month: fmtTHB(month),
    repairCleaning: fmtTHB(repairCleaning),
    pendingReview: fmtTHB(pendingReview),
    problem: `${problem} รายการ`,
  };
}

export async function listExpenses(): Promise<ExpenseListDTO> {
  const rows = await prisma.expenseTransaction.findMany({ orderBy: { expenseDate: "desc" }, include: INCLUDE });
  return { rows: rows.map(toDTO), summary: summarize(rows) };
}

/** Resolve a roomNumber string to its room (with owner/property) or throw. */
async function resolveRoom(roomNumber: string) {
  const room = await prisma.room.findFirst({ where: { roomNumber } });
  if (!room) throw new ApiError("ROOM_NOT_FOUND", `ไม่พบห้อง "${roomNumber}"`, 400);
  return room;
}

function mapInput(input: ExpenseCreateInput) {
  const expenseType = fromThai(EXPENSE_TYPE, input.expenseType) ?? "OTHER";
  const responsibilityType = fromThai(RESPONSIBILITY, input.responsibility) ?? "BROKER";
  const verificationStatus = UI_STATUS_TO_ENUM[input.status] ?? "DRAFT";
  return {
    expenseDate: parseThaiBEDate(input.date),
    expenseType: expenseType as Prisma.ExpenseTransactionCreateInput["expenseType"],
    responsibilityType: responsibilityType as Prisma.ExpenseTransactionCreateInput["responsibilityType"],
    verificationStatus: verificationStatus as Prisma.ExpenseTransactionCreateInput["verificationStatus"],
    description: input.description || null,
    payeeName: input.payeeName || null,
    amount: input.amount,
    beforeImageUrl: input.beforeUrl,
    afterImageUrl: input.afterUrl,
  };
}

export async function createExpense(input: ExpenseCreateInput, session: Session): Promise<number> {
  const room = await resolveRoom(input.room);
  const expenseCode = await generateCode("EXPENSE", "EXP");
  const created = await prisma.expenseTransaction.create({
    data: {
      expenseCode,
      roomId: room.id,
      ownerId: room.ownerId,
      propertyId: room.propertyId,
      paymentMethod: "CASH",
      ...mapInput(input),
    },
  });
  await writeAudit({ userId: session.userId, action: "CREATE", tableName: "expense_transactions", recordId: created.id, newValue: input });
  return created.id;
}

export async function updateExpense(id: number, input: ExpenseUpdateInput, session: Session): Promise<number> {
  const existing = await prisma.expenseTransaction.findUnique({ where: { id } });
  if (!existing) throw new ApiError("NOT_FOUND", "ไม่พบรายการค่าใช้จ่ายนี้", 404);
  const room = await resolveRoom(input.room);
  await prisma.expenseTransaction.update({
    where: { id },
    data: { roomId: room.id, ownerId: room.ownerId, propertyId: room.propertyId, ...mapInput(input) },
  });
  await writeAudit({ userId: session.userId, action: "UPDATE", tableName: "expense_transactions", recordId: id, oldValue: existing, newValue: input });
  return id;
}

export async function deleteExpense(id: number, session: Session): Promise<boolean> {
  const existing = await prisma.expenseTransaction.findUnique({ where: { id } });
  if (!existing) throw new ApiError("NOT_FOUND", "ไม่พบรายการค่าใช้จ่ายนี้", 404);
  await prisma.expenseTransaction.delete({ where: { id } });
  await writeAudit({ userId: session.userId, action: "DELETE", tableName: "expense_transactions", recordId: id });
  return true;
}
