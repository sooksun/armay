import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateCode } from "@/lib/codegen";
import { writeAudit } from "@/lib/services/audit.service";
import type { Session } from "@/lib/auth/session";

/** Demo-data generator + reset. ADMIN-only tools surfaced in Settings. */

const FIRST = ["สมชาย", "พิมพ์ใจ", "อนุชา", "วีระ", "กิตติพงษ์", "ศิริพร", "มณีรัตน์", "สุดา", "ธนา", "สมพงษ์", "กาญจนา", "ปรีชา", "อรทัย", "ณัฐพล", "จิราภรณ์", "ชัยวัฒน์"];
const LAST = ["วัฒนโสภณ", "ธีรกุล", "เดชา", "สุขสันต์", "ใจดี", "มงคล", "ทองดี", "แสงทอง", "รุ่งเรือง", "เจริญสุข", "ศรีสุข", "พงษ์พันธ์", "บุญมี", "อินทร์แก้ว"];
const BANKS = ["KBank", "SCB", "BBL", "KTB", "TTB", "GSB"];
const PROP_NAMES = ["เดอะ นิมิตร", "บ้านกลางเมือง", "ลุมพินี พาร์ค", "ริเวอร์ วิว", "ศุภาลัย พรีมา", "เดอะ ทรี", "ไอดีโอ โมบิ", "ชีวาทัย เรสซิเดนซ์"];
const PROVINCES = ["กรุงเทพมหานคร", "ชลบุรี", "นนทบุรี", "เชียงใหม่", "ภูเก็ต", "ปทุมธานี"];
const PROP_TYPES = ["CONDO", "APARTMENT", "HOUSE", "TOWNHOUSE", "DORMITORY"] as const;
const INCOME_TYPES = ["RENT", "DEPOSIT", "CLEANING", "WATER", "ELECTRICITY", "PENALTY", "OTHER"] as const;
const EXPENSE_TYPES = ["CLEANING", "REPAIR", "MATERIAL", "WATER", "ELECTRICITY", "INTERNET", "COMMON_AREA"] as const;
const METHODS = ["CASH", "BANK_TRANSFER", "PROMPTPAY", "CREDIT_CARD"] as const;
const RESP = ["BROKER", "OWNER", "TENANT"] as const;

const rint = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = <T>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
const money = (a: number, b: number, step = 100) => rint(Math.ceil(a / step), Math.floor(b / step)) * step;
const fullName = () => `คุณ${pick(FIRST)} ${pick(LAST)}`;
const phone = () => `08${rint(0, 9)}-${rint(100, 999)}-${rint(1000, 9999)}`;
function daysAgoUTC(d: number): Date {
  const x = new Date();
  x.setUTCDate(x.getUTCDate() - d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
}

export type DemoCounts = {
  owners: number;
  properties: number;
  rooms: number;
  tenants: number;
  contracts: number;
  incomes: number;
  expenses: number;
  payouts: number;
};

type Tx = Prisma.TransactionClient;

/** Create one coherent, realistic batch of demo records (additive). */
async function generateBatch(tx: Tx, adminId: number | null): Promise<DemoCounts> {
  const c: DemoCounts = { owners: 0, properties: 0, rooms: 0, tenants: 0, contracts: 0, incomes: 0, expenses: 0, payouts: 0 };

  const owners: { id: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const o = await tx.owner.create({
      data: {
        ownerCode: await generateCode("OWNER", "OWN", { client: tx }),
        fullName: fullName(),
        phone: phone(),
        bankName: pick(BANKS),
        bankAccountNumber: `${rint(100, 999)}-${rint(0, 9)}-${rint(10000, 99999)}`,
      },
    });
    owners.push(o);
    c.owners++;
  }

  const props: { id: number }[] = [];
  for (let i = 0; i < 2; i++) {
    const p = await tx.property.create({
      data: {
        propertyCode: await generateCode("PROPERTY", "PPT", { client: tx }),
        propertyName: `${pick(PROP_NAMES)} ${rint(1, 99)}`,
        propertyType: pick(PROP_TYPES) as Prisma.PropertyCreateInput["propertyType"],
        province: pick(PROVINCES),
      },
    });
    props.push(p);
    c.properties++;
  }

  const rooms: { id: number; ownerId: number; propertyId: number; rent: number }[] = [];
  for (let i = 0; i < 5; i++) {
    const prop = pick(props);
    const owner = pick(owners);
    const rent = money(6000, 25000);
    const r = await tx.room.create({
      data: {
        roomCode: await generateCode("ROOM", "ROOM", { client: tx }),
        roomNumber: `${String.fromCharCode(65 + rint(0, 4))}-${rint(101, 1509)}`,
        propertyId: prop.id,
        ownerId: owner.id,
        roomType: "สตูดิโอ 28 ตร.ม.",
        defaultRentPrice: rent,
        defaultDeposit: rent * 2,
        defaultCleaningFee: 800,
        defaultCommission: Math.round(rent * 0.1),
        status: pick(["OCCUPIED", "AVAILABLE", "OCCUPIED"]) as Prisma.RoomCreateInput["status"],
      },
    });
    rooms.push({ id: r.id, ownerId: r.ownerId, propertyId: r.propertyId, rent });
    c.rooms++;
  }

  const tenants: { id: number }[] = [];
  for (let i = 0; i < 4; i++) {
    const t = await tx.tenant.create({
      data: {
        tenantCode: await generateCode("TENANT", "TNT", { client: tx }),
        fullName: fullName(),
        phone: phone(),
        nationality: "ไทย",
      },
    });
    tenants.push(t);
    c.tenants++;
  }

  const contracts: { id: number; tenantId: number; roomId: number; ownerId: number; propertyId: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const room = rooms[i % rooms.length];
    const tenant = pick(tenants);
    const rent = room.rent;
    const dep = rent * 2;
    const clean = 800;
    const start = daysAgoUTC(rint(5, 40));
    const end = new Date(Date.UTC(start.getUTCFullYear() + 1, start.getUTCMonth(), 28));
    const ct = await tx.rentalContract.create({
      data: {
        contractCode: await generateCode("RENTAL", "RN", { client: tx }),
        tenantId: tenant.id,
        roomId: room.id,
        ownerId: room.ownerId,
        propertyId: room.propertyId,
        startDate: start,
        endDate: end,
        rentAmount: rent,
        depositAmount: dep,
        cleaningFee: clean,
        totalAmount: rent + dep + clean,
        rentalStatus: "CHECKED_IN",
        paymentStatus: pick(["PAID", "UNPAID", "PARTIAL"]) as Prisma.RentalContractCreateInput["paymentStatus"],
      },
    });
    contracts.push({ id: ct.id, tenantId: ct.tenantId, roomId: ct.roomId, ownerId: ct.ownerId, propertyId: ct.propertyId });
    c.contracts++;
  }

  for (let i = 0; i < 6; i++) {
    const ct = pick(contracts);
    const verified = Math.random() < 0.6;
    await tx.incomeTransaction.create({
      data: {
        incomeCode: await generateCode("INCOME", "INC", { client: tx }),
        contractId: ct.id,
        tenantId: ct.tenantId,
        roomId: ct.roomId,
        ownerId: ct.ownerId,
        propertyId: ct.propertyId,
        incomeDate: daysAgoUTC(rint(0, 30)),
        incomeType: pick(INCOME_TYPES) as Prisma.IncomeTransactionCreateInput["incomeType"],
        amount: money(1500, 20000),
        paymentMethod: pick(METHODS) as Prisma.IncomeTransactionCreateInput["paymentMethod"],
        transactionReference: `DEMO-${Date.now()}-${i}-${rint(1000, 9999)}`,
        verificationStatus: verified ? "VERIFIED" : "PENDING",
        recordedBy: adminId,
        approvedBy: verified ? adminId : null,
        approvedAt: verified ? new Date() : null,
      },
    });
    c.incomes++;
  }

  for (let i = 0; i < 5; i++) {
    const room = pick(rooms);
    await tx.expenseTransaction.create({
      data: {
        expenseCode: await generateCode("EXPENSE", "EXP", { client: tx }),
        expenseDate: daysAgoUTC(rint(0, 30)),
        roomId: room.id,
        ownerId: room.ownerId,
        propertyId: room.propertyId,
        expenseType: pick(EXPENSE_TYPES) as Prisma.ExpenseTransactionCreateInput["expenseType"],
        description: "รายการค่าใช้จ่ายตัวอย่าง",
        payeeName: `ร้าน${pick(LAST)}`,
        amount: money(200, 12000),
        paymentMethod: "CASH",
        responsibilityType: pick(RESP) as Prisma.ExpenseTransactionCreateInput["responsibilityType"],
        verificationStatus: pick(["VERIFIED", "PENDING", "PENDING"]) as Prisma.ExpenseTransactionCreateInput["verificationStatus"],
        recordedBy: adminId,
      },
    });
    c.expenses++;
  }

  for (let i = 0; i < 2; i++) {
    const owner = pick(owners);
    const gross = money(8000, 30000);
    const commission = Math.round(gross * 0.1);
    const payout = await tx.ownerPayout.create({
      data: {
        payoutCode: await generateCode("PAYOUT", "PO", { client: tx }),
        ownerId: owner.id,
        payoutDate: daysAgoUTC(rint(0, 20)),
        grossIncomeAmount: gross,
        deductionAmount: commission,
        netPayoutAmount: gross - commission,
        paidAmount: 0,
        paymentMethod: "BANK_TRANSFER",
        payoutStatus: pick(["PENDING", "PAID"]) as Prisma.OwnerPayoutCreateInput["payoutStatus"],
        verificationStatus: "PENDING",
      },
    });
    await tx.payoutItem.createMany({
      data: [
        { payoutId: payout.id, sourceType: "INCOME", label: "รายรับรวมของห้อง", amount: gross },
        { payoutId: payout.id, sourceType: "commission", label: "หัก ค่านายหน้า (10%)", amount: commission },
      ],
    });
    c.payouts++;
  }

  return c;
}

const EMPTY: DemoCounts = { owners: 0, properties: 0, rooms: 0, tenants: 0, contracts: 0, incomes: 0, expenses: 0, payouts: 0 };
const addCounts = (a: DemoCounts, b: DemoCounts): DemoCounts => ({
  owners: a.owners + b.owners,
  properties: a.properties + b.properties,
  rooms: a.rooms + b.rooms,
  tenants: a.tenants + b.tenants,
  contracts: a.contracts + b.contracts,
  incomes: a.incomes + b.incomes,
  expenses: a.expenses + b.expenses,
  payouts: a.payouts + b.payouts,
});
const clampBatches = (n: number) => Math.min(Math.max(Math.floor(n) || 1, 1), 10);

async function runBatches(tx: Tx, adminId: number | null, batches: number): Promise<DemoCounts> {
  let total = EMPTY;
  for (let i = 0; i < batches; i++) total = addCounts(total, await generateBatch(tx, adminId));
  return total;
}

/**
 * Add demo data without touching existing rows. One click seeds `batches`
 * coherent sets (default 3 ≈ a full trial dataset); click again for more.
 */
export async function addDemoData(session: Session, batches = 3): Promise<DemoCounts> {
  const n = clampBatches(batches);
  return prisma.$transaction(
    async (tx) => {
      const counts = await runBatches(tx, session.userId, n);
      await writeAudit({ userId: session.userId, action: "CREATE", tableName: "demo_data", newValue: counts }, tx);
      return counts;
    },
    { timeout: 120000 }
  );
}

/** Wipe all business data (users + payment accounts kept), then seed a fresh trial set. */
export async function resetData(session: Session, batches = 3): Promise<DemoCounts> {
  const n = clampBatches(batches);
  return prisma.$transaction(
    async (tx) => {
      await tx.payoutItem.deleteMany();
      await tx.ownerPayout.deleteMany();
      await tx.incomeTransaction.deleteMany();
      await tx.expenseTransaction.deleteMany();
      await tx.rentalContract.deleteMany();
      await tx.room.deleteMany();
      await tx.tenant.deleteMany();
      await tx.property.deleteMany();
      await tx.owner.deleteMany();
      await tx.codeSequence.deleteMany();
      await tx.auditLog.deleteMany();
      const counts = await runBatches(tx, session.userId, n);
      await writeAudit({ userId: session.userId, action: "DELETE", tableName: "reset_data", newValue: counts }, tx);
      return counts;
    },
    { timeout: 120000 }
  );
}
