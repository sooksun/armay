import { prisma } from "@/lib/prisma";
import { decToNumber, fmtTHB } from "@/lib/money";
import type { DashboardDTO, UrgentTaskDTO } from "@/lib/api-types";

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
  };
}
