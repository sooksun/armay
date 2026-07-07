import { prisma } from "@/lib/prisma";
import { decToNumber, fmtTHB } from "@/lib/money";
import { EXPENSE_TYPE } from "@/lib/labels";
import type { DashboardDTO, UrgentTaskDTO, DashboardChartsDTO, ChartPointDTO } from "@/lib/api-types";

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const PALETTE = ["#38BDF8", "#5EEAD4", "#A855F7", "#FBBF24", "#FB7185", "var(--pos)", "#818CF8"];

function monthBounds(now: Date) {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1));
  const end = new Date(Date.UTC(m === 11 ? y + 1 : y, (m + 1) % 12, 1));
  return { start, end };
}
function dayBounds(now: Date) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 3600 * 1000);
  return { start, end };
}

async function computeCharts(now: Date): Promise<DashboardChartsDTO> {
  const [incomes, expenses, properties, rooms] = await Promise.all([
    prisma.incomeTransaction.findMany({ select: { amount: true, incomeDate: true, propertyId: true, roomId: true } }),
    prisma.expenseTransaction.findMany({ select: { amount: true, expenseDate: true, expenseType: true } }),
    prisma.property.findMany({ select: { id: true, propertyName: true } }),
    prisma.room.findMany({ select: { id: true, roomNumber: true, property: { select: { propertyName: true } } } }),
  ]);

  // line: last 12 months
  const months: string[] = [];
  const inc: number[] = [];
  const exp: number[] = [];
  for (let k = 11; k >= 0; k--) {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - k, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - k + 1, 1));
    months.push(TH_MONTHS[start.getUTCMonth()]);
    inc.push(incomes.filter((i) => i.incomeDate >= start && i.incomeDate < end).reduce((s, i) => s + decToNumber(i.amount), 0));
    exp.push(expenses.filter((e) => e.expenseDate >= start && e.expenseDate < end).reduce((s, e) => s + decToNumber(e.amount), 0));
  }

  // donut: expense by type (top 5 + others)
  const byType = new Map<string, number>();
  for (const e of expenses) byType.set(e.expenseType, (byType.get(e.expenseType) ?? 0) + decToNumber(e.amount));
  const typeSorted = [...byType.entries()].sort((a, b) => b[1] - a[1]);
  const donut: ChartPointDTO[] = typeSorted.slice(0, 5).map(([t, v], i) => ({ label: EXPENSE_TYPE[t] ?? t, value: v, color: PALETTE[i % PALETTE.length] }));
  const othersSum = typeSorted.slice(5).reduce((s, [, v]) => s + v, 0);
  if (othersSum > 0) donut.push({ label: "อื่นๆ", value: othersSum, color: PALETTE[5] });

  // bar: income by property (top 5)
  const byProp = new Map<number, number>();
  for (const i of incomes) if (i.propertyId != null) byProp.set(i.propertyId, (byProp.get(i.propertyId) ?? 0) + decToNumber(i.amount));
  const bar: ChartPointDTO[] = properties
    .map((p) => ({ label: p.propertyName, value: byProp.get(p.id) ?? 0 }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((r, i) => ({ ...r, color: PALETTE[i % PALETTE.length] }));

  // hbar: top rooms by income
  const byRoom = new Map<number, number>();
  for (const i of incomes) if (i.roomId != null) byRoom.set(i.roomId, (byRoom.get(i.roomId) ?? 0) + decToNumber(i.amount));
  const hbar: ChartPointDTO[] = [...byRoom.entries()]
    .map(([rid, v]) => {
      const room = rooms.find((r) => r.id === rid);
      return { label: room ? `${room.roomNumber} · ${room.property.propertyName}` : `#${rid}`, value: v };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((r, i) => ({ ...r, color: PALETTE[i % PALETTE.length] }));

  return { line: { months, inc, exp }, donut, bar, hbar };
}

export async function getDashboard(): Promise<DashboardDTO> {
  const now = new Date();
  const { start, end } = monthBounds(now);
  const { start: dStart, end: dEnd } = dayBounds(now);

  const [incMonth, expMonth, incToday, pendPayout, unverified, overdue] = await Promise.all([
    prisma.incomeTransaction.aggregate({ _sum: { amount: true }, where: { incomeDate: { gte: start, lt: end } } }),
    prisma.expenseTransaction.aggregate({ _sum: { amount: true }, where: { expenseDate: { gte: start, lt: end } } }),
    prisma.incomeTransaction.aggregate({ _sum: { amount: true }, where: { incomeDate: { gte: dStart, lt: dEnd } } }),
    prisma.ownerPayout.aggregate({ _sum: { netPayoutAmount: true }, where: { payoutStatus: "PENDING" } }),
    prisma.incomeTransaction.count({ where: { verificationStatus: { in: ["DRAFT", "PENDING"] } } }),
    prisma.rentalContract.count({ where: { paymentStatus: "OVERDUE" } }),
  ]);

  const incomeMonth = decToNumber(incMonth._sum.amount);
  const expenseMonth = decToNumber(expMonth._sum.amount);

  // urgent items
  const urgent: UrgentTaskDTO[] = [];
  const overdueRentals = await prisma.rentalContract.findMany({
    where: { paymentStatus: { in: ["OVERDUE", "UNPAID"] } },
    include: { tenant: true, room: true, property: true },
    orderBy: { startDate: "desc" },
    take: 3,
  });
  for (const r of overdueRentals) {
    urgent.push({
      title: `ค้างชำระ · ${r.room.roomNumber}`,
      sub: `${r.tenant.fullName} · ${r.property.propertyName}`,
      amount: `−${fmtTHB(decToNumber(r.totalAmount))}`,
      kind: "alert",
    });
  }
  const noSlip = await prisma.incomeTransaction.findMany({
    where: { proofFileUrl: null },
    include: { tenant: true, room: true },
    orderBy: { incomeDate: "desc" },
    take: 2,
  });
  for (const i of noSlip) {
    urgent.push({
      title: `ไม่มีสลิป · ${i.room?.roomNumber ?? "—"}`,
      sub: `${i.tenant?.fullName ?? "—"}`,
      amount: fmtTHB(decToNumber(i.amount)),
      kind: "income",
    });
  }

  return {
    kpis: {
      incomeMonth,
      expenseMonth,
      netMonth: incomeMonth - expenseMonth,
      pendingPayout: decToNumber(pendPayout._sum.netPayoutAmount),
      incomeToday: decToNumber(incToday._sum.amount),
      unverifiedCount: unverified,
      overdueCount: overdue,
    },
    urgent: urgent.slice(0, 5),
    charts: await computeCharts(now),
  };
}
