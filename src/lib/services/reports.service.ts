import { prisma } from "@/lib/prisma";
import { decToNumber, fmtTHB } from "@/lib/money";
import type { ReportRowDTO, ReportsDTO } from "@/lib/api-types";

const TH_MONTHS_REPORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function row(label: string, income: number, expense: number): ReportRowDTO {
  const net = income - expense;
  return { label, income: fmtTHB(income), expense: fmtTHB(expense), net: fmtTHB(net), netNeg: net < 0 };
}

export async function getReports(): Promise<ReportsDTO> {
  const [incomes, expenses, properties] = await Promise.all([
    prisma.incomeTransaction.findMany({ select: { amount: true, propertyId: true, incomeDate: true } }),
    prisma.expenseTransaction.findMany({ select: { amount: true, propertyId: true, expenseDate: true } }),
    prisma.property.findMany({ select: { id: true, propertyName: true }, orderBy: { id: "asc" } }),
  ]);

  const totalIncome = incomes.reduce((s, i) => s + decToNumber(i.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + decToNumber(e.amount), 0);

  // by property
  const incByProp = new Map<number, number>();
  const expByProp = new Map<number, number>();
  for (const i of incomes) if (i.propertyId != null) incByProp.set(i.propertyId, (incByProp.get(i.propertyId) ?? 0) + decToNumber(i.amount));
  for (const e of expenses) if (e.propertyId != null) expByProp.set(e.propertyId, (expByProp.get(e.propertyId) ?? 0) + decToNumber(e.amount));
  const byProperty = properties.map((p) => row(p.propertyName, incByProp.get(p.id) ?? 0, expByProp.get(p.id) ?? 0));

  // by month (last 6 calendar months, oldest -> newest)
  const now = new Date();
  const byMonth: ReportRowDTO[] = [];
  for (let k = 5; k >= 0; k--) {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() - k;
    const start = new Date(Date.UTC(y, m, 1));
    const end = new Date(Date.UTC(y, m + 1, 1));
    const inc = incomes.filter((i) => i.incomeDate >= start && i.incomeDate < end).reduce((s, i) => s + decToNumber(i.amount), 0);
    const exp = expenses.filter((e) => e.expenseDate >= start && e.expenseDate < end).reduce((s, e) => s + decToNumber(e.amount), 0);
    const label = `${TH_MONTHS_REPORT[start.getUTCMonth()]} ${start.getUTCFullYear() + 543}`;
    byMonth.push(row(label, inc, exp));
  }

  return {
    totalIncome: fmtTHB(totalIncome),
    totalExpense: fmtTHB(totalExpense),
    totalNet: fmtTHB(totalIncome - totalExpense),
    byProperty,
    byMonth,
  };
}
