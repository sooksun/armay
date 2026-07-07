import type { Prisma, AccountType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/services/audit.service";
import { decToNumber, fmtTHB } from "@/lib/money";
import { formatBEDate } from "@/lib/date";
import { ACCOUNT_TYPE, PAYMENT_METHOD } from "@/lib/labels";
import { ApiError } from "@/lib/api/response";
import type { Session } from "@/lib/auth/session";
import type { AccountDTO, IncomeBrief } from "@/lib/api-types";
import type { AccountCreateInput, AccountUpdateInput } from "@/lib/validation/account.schema";

const TYPE_ENUM: Record<string, AccountType> = {
  "รับผู้เช่า": "RECEIVE_TENANT",
  "จ่ายเจ้าของ": "PAY_OWNER",
  "ส่วนตัว": "PERSONAL",
  "เงินสด": "CASH",
};

const INCLUDE = {
  incomes: { include: { tenant: true, room: true }, orderBy: { incomeDate: "desc" }, take: 5 },
} satisfies Prisma.PaymentAccountInclude;

type AccountWithRelations = Prisma.PaymentAccountGetPayload<{ include: typeof INCLUDE }>;

function toDTO(a: AccountWithRelations): AccountDTO {
  const recentIncomes: IncomeBrief[] = a.incomes.map((i) => ({
    date: formatBEDate(i.incomeDate),
    tenant: i.tenant?.fullName ?? "—",
    room: i.room?.roomNumber ?? "—",
    amount: fmtTHB(decToNumber(i.amount)),
    channel: PAYMENT_METHOD[i.paymentMethod] ?? i.paymentMethod,
  }));
  return {
    id: a.id,
    accountName: a.accountName,
    bankName: a.bankName ?? "",
    accountNumber: a.accountNumber ?? "",
    accountHolderName: a.accountHolderName ?? "",
    promptpayId: a.promptpayId ?? "",
    accountType: ACCOUNT_TYPE[a.accountType] ?? a.accountType,
    status: a.status,
    qrUrl: a.qrCodeUrl,
    recentIncomes,
  };
}

export async function listAccounts(): Promise<AccountDTO[]> {
  const accounts = await prisma.paymentAccount.findMany({ orderBy: { id: "asc" }, include: INCLUDE });
  return accounts.map(toDTO);
}

export async function createAccount(input: AccountCreateInput, session: Session): Promise<number> {
  const created = await prisma.paymentAccount.create({
    data: {
      accountName: input.accountName,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      accountHolderName: input.accountHolderName,
      promptpayId: input.promptpayId,
      accountType: TYPE_ENUM[input.accountType],
      qrCodeUrl: input.qrUrl,
      status: input.status,
    },
  });
  await writeAudit({ userId: session.userId, action: "CREATE", tableName: "payment_accounts", recordId: created.id, newValue: input });
  return created.id;
}

export async function updateAccount(id: number, input: AccountUpdateInput, session: Session): Promise<number> {
  const existing = await prisma.paymentAccount.findUnique({ where: { id } });
  if (!existing) throw new ApiError("NOT_FOUND", "ไม่พบบัญชีนี้", 404);
  const data: Prisma.PaymentAccountUncheckedUpdateInput = {};
  if (input.accountName !== undefined) data.accountName = input.accountName;
  if (input.bankName !== undefined) data.bankName = input.bankName;
  if (input.accountNumber !== undefined) data.accountNumber = input.accountNumber;
  if (input.accountHolderName !== undefined) data.accountHolderName = input.accountHolderName;
  if (input.promptpayId !== undefined) data.promptpayId = input.promptpayId;
  if (input.accountType !== undefined) data.accountType = TYPE_ENUM[input.accountType];
  if (input.qrUrl !== undefined) data.qrCodeUrl = input.qrUrl;
  if (input.status !== undefined) data.status = input.status;
  await prisma.paymentAccount.update({ where: { id }, data });
  await writeAudit({ userId: session.userId, action: "UPDATE", tableName: "payment_accounts", recordId: id, oldValue: existing, newValue: input });
  return id;
}

export async function deleteAccount(id: number, session: Session): Promise<boolean> {
  const used = (await prisma.incomeTransaction.count({ where: { receivingAccountId: id } })) + (await prisma.expenseTransaction.count({ where: { paymentAccountId: id } }));
  if (used > 0) throw new ApiError("HAS_DEPENDENTS", `ลบไม่ได้ — บัญชีนี้ถูกใช้ในธุรกรรม ${used} รายการ`, 409);
  await prisma.paymentAccount.delete({ where: { id } });
  await writeAudit({ userId: session.userId, action: "DELETE", tableName: "payment_accounts", recordId: id });
  return true;
}
