/*
 * Randomized data-driven loop test.
 *   - LOOPS iterations, each posting TX_PER_LOOP random-but-valid transactions
 *     across every create endpoint (owners / tenants / properties / accounts /
 *     rentals / incomes / expenses / payouts / users).
 *   - After each batch, business-rule invariants are asserted end-to-end:
 *     rental total math, income duplicate guard, payout net math, payout
 *     deduction reuse guard, CANCELLED exclusion in dashboard + reports,
 *     and negative-path error codes.
 *
 * Exercises the real stack: HTTP (validation -> route -> service -> MySQL).
 * A few states the API can't reach yet (CANCELLED rows) are seeded directly
 * via Prisma, then asserted through the API — that is where real bugs surface.
 *
 * Run: npm run test:loop        (dev server must be up on $BASE)
 * Env: BASE, LOOPS, TX, SEED
 */
import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE ?? "http://localhost:3000";
const LOOPS = Number(process.env.LOOPS ?? 10);
const TX_PER_LOOP = Number(process.env.TX ?? 20);
const prisma = new PrismaClient();

// ---------- seeded PRNG (mulberry32) so failures reproduce ----------
let _seed = (Number(process.env.SEED ?? 0xc0ffee) >>> 0) || 1;
function rnd(): number {
  _seed |= 0;
  _seed = (_seed + 0x6d2b79f5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const ri = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
const pick = <T>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
const money = (min: number, max: number, step = 100) => ri(Math.ceil(min / step), Math.floor(max / step)) * step;

// ---------- money / date helpers (mirror lib/money.ts + lib/date.ts) ----------
const TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const fmtTHB = (n: number) => "฿" + n.toLocaleString("en-US");
const beDate = (d: Date) => `${d.getUTCDate()} ${TH[d.getUTCMonth()]} ${d.getUTCFullYear() + 543}`;
function recentBE(maxDaysAgo = 40): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - ri(0, maxDaysAgo));
  return beDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())));
}

// ---------- demo vocab (real-looking Thai data) ----------
const FIRST = ["สมชาย", "พิมพ์ใจ", "อนุชา", "วีระ", "กิตติพงษ์", "ศิริพร", "มณีรัตน์", "สุดา", "ธนา", "สมพงษ์", "กาญจนา", "ปรีชา", "อรทัย", "ณัฐพล", "จิราภรณ์"];
const LAST = ["วัฒนโสภณ", "ธีรกุล", "เดชา", "สุขสันต์", "ใจดี", "มงคล", "ทองดี", "แสงทอง", "รุ่งเรือง", "เจริญสุข", "ศรีสุข", "พงษ์พันธ์", "บุญมี", "อินทร์แก้ว"];
const BANKS = ["KBank", "SCB", "BBL", "KTB", "TTB", "GSB"];
const PROP_NAMES = ["เดอะ นิมิตร", "บ้านกลางเมือง", "ลุมพินี พาร์ค", "ริเวอร์ วิว", "ศุภาลัย พรีมา", "เดอะ ทรี", "ไอดีโอ โมบิ", "ชีวาทัย เรสซิเดนซ์"];
const PROP_TYPES_TH = ["คอนโด", "แฟลต", "บ้านพัก", "ทาวน์เฮาส์", "อาคารพาณิชย์", "หอพัก", "อื่นๆ"] as const;
const ACCT_TYPES_TH = ["รับผู้เช่า", "จ่ายเจ้าของ", "ส่วนตัว", "เงินสด"] as const;
const PROVINCES = ["กรุงเทพมหานคร", "ชลบุรี", "นนทบุรี", "เชียงใหม่", "ภูเก็ต", "ปทุมธานี"];
const INCOME_TYPES = ["RENT", "DEPOSIT", "CLEANING", "WATER", "ELECTRICITY", "PENALTY", "OTHER"] as const;
const METHODS = ["CASH", "BANK_TRANSFER", "PROMPTPAY", "CREDIT_CARD", "OTHER"] as const;
const EXP_TYPES_TH = ["ค่าทำความสะอาด", "ค่าช่างซ่อม", "ค่าวัสดุ", "ค่าน้ำ", "ค่าไฟ", "ค่าอินเทอร์เน็ต", "ค่าส่วนกลาง", "ค่าเดินทาง"] as const;
const RESP_TH = ["นายหน้า", "เจ้าของ", "ผู้เช่า"] as const;
const EXP_STATUS_TH = ["รอจ่าย", "จ่ายแล้ว", "รอตรวจสอบ", "มีปัญหา"] as const;
const RENTAL_TYPES = ["DAILY", "MONTHLY", "YEARLY"] as const;
const USER_ROLES = ["ADMIN", "STAFF", "VIEWER"] as const;
const fullName = () => `คุณ${pick(FIRST)} ${pick(LAST)}`;
const phone = () => `08${ri(0, 9)}-${ri(100, 999)}-${ri(1000, 9999)}`;

// ---------- http ----------
let cookie = "";
type Res = { status: number; ok: boolean; code: string | null; data: any; raw: any };
async function api(method: string, path: string, body?: unknown): Promise<Res> {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setc = res.headers.get("set-cookie");
  if (setc) cookie = setc.split(";")[0];
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    /* non-json (redirect/html) */
  }
  return {
    status: res.status,
    ok: !!json?.ok,
    code: json && json.ok === false ? json.error?.code ?? "UNKNOWN" : null,
    data: json?.data,
    raw: json,
  };
}

// ---------- bug collector ----------
type Bug = { loop: number; kind: string; detail: string };
const bugs: Bug[] = [];
let checks = 0;
function bug(loop: number, kind: string, detail: string) {
  bugs.push({ loop, kind, detail });
  console.log(`  \x1b[31mBUG\x1b[0m [${kind}] ${detail}`);
}
/** assert ok:true; anything else on data we built to be valid is a bug */
function expectOk(loop: number, kind: string, r: Res, payload: unknown) {
  checks++;
  if (!r.ok) bug(loop, kind, `expected ok, got status=${r.status} code=${r.code} · payload=${JSON.stringify(payload)}`);
  return r;
}
function expectCode(loop: number, kind: string, r: Res, code: string) {
  checks++;
  if (r.ok || r.code !== code) bug(loop, kind, `expected code=${code}, got ok=${r.ok} status=${r.status} code=${r.code}`);
}
function expectEq(loop: number, kind: string, got: unknown, want: unknown, ctx = "") {
  checks++;
  if (got !== want) bug(loop, kind, `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)} ${ctx}`);
}

// ---------- reference pools (from DB; appended as we create) ----------
type Room = { id: number; roomNumber: string; ownerId: number; propertyId: number };
let rooms: Room[] = [];
const ownerIds: number[] = [];
const tenantIds: number[] = [];
const contractIds: number[] = [];

async function loadPools() {
  rooms = await prisma.room.findMany({ select: { id: true, roomNumber: true, ownerId: true, propertyId: true } });
  ownerIds.push(...(await prisma.owner.findMany({ select: { id: true } })).map((o) => o.id));
  tenantIds.push(...(await prisma.tenant.findMany({ select: { id: true } })).map((t) => t.id));
  contractIds.push(...(await prisma.rentalContract.findMany({ select: { id: true } })).map((c) => c.id));
}

// ---------- random transaction generators ----------
async function txOwner(loop: number) {
  const body = { fullName: fullName(), phone: phone(), bankName: pick(BANKS), bankAccountNumber: `${ri(100, 999)}-${ri(0, 9)}-${ri(10000, 99999)}` };
  const r = expectOk(loop, "create-owner", await api("POST", "/api/owners", body), body);
  if (r.ok) ownerIds.push(r.data.id);
}
async function txTenant(loop: number) {
  const body = { fullName: fullName(), phone: phone(), nationality: "ไทย" };
  const r = expectOk(loop, "create-tenant", await api("POST", "/api/tenants", body), body);
  if (r.ok) tenantIds.push(r.data.id);
}
async function txProperty(loop: number) {
  const body = { propertyName: `${pick(PROP_NAMES)} ${ri(1, 99)}`, propertyType: pick(PROP_TYPES_TH), province: pick(PROVINCES) };
  expectOk(loop, "create-property", await api("POST", "/api/properties", body), body);
}
async function txAccount(loop: number) {
  const body = { accountName: `บัญชี ${pick(BANKS)} ${ri(1, 999)}`, accountType: pick(ACCT_TYPES_TH), bankName: pick(BANKS) };
  expectOk(loop, "create-account", await api("POST", "/api/payment-accounts", body), body);
}
async function txRental(loop: number) {
  if (!rooms.length || !tenantIds.length) return;
  const room = pick(rooms);
  const rent = money(5000, 25000);
  const body = {
    tenantId: pick(tenantIds),
    roomId: room.id,
    rentalType: pick(RENTAL_TYPES),
    startDate: recentBE(30),
    endDate: beDate(new Date(Date.UTC(new Date().getUTCFullYear() + 1, new Date().getUTCMonth(), 28))),
    rentAmount: rent,
    depositAmount: rent * 2,
    cleaningFee: money(500, 1500),
    otherFee: money(0, 2000),
    discountAmount: money(0, 1000),
    bookingChannel: pick(["Agoda", "Booking", "walk-in", "LINE", "Facebook"]),
    note: "loop-test",
  };
  const r = expectOk(loop, "create-rental", await api("POST", "/api/rentals", body), body);
  if (r.ok) contractIds.push(r.data.id);
}
async function txIncome(loop: number, i: number) {
  if (!contractIds.length) return;
  const body = {
    contractId: pick(contractIds),
    incomeDate: recentBE(),
    incomeType: pick(INCOME_TYPES),
    amount: money(1000, 30000),
    paymentMethod: pick(METHODS),
    transactionReference: `LT-${loop}-${i}-${ri(100000, 999999)}`,
  };
  expectOk(loop, "create-income", await api("POST", "/api/incomes", body), body);
}
async function txExpense(loop: number) {
  if (!rooms.length) return;
  const body = {
    date: recentBE(),
    room: pick(rooms).roomNumber,
    expenseType: pick(EXP_TYPES_TH),
    description: "รายการทดสอบ loop",
    payeeName: `ร้าน${pick(LAST)}`,
    amount: money(100, 15000),
    responsibility: pick(RESP_TH),
    status: pick(EXP_STATUS_TH),
    beforeUrl: null,
    afterUrl: null,
  };
  expectOk(loop, "create-expense", await api("POST", "/api/expenses", body), body);
}
async function txPayout(loop: number) {
  if (!ownerIds.length) return;
  const gross = money(5000, 40000);
  const commission = Math.round(gross * 0.1);
  const body = { ownerId: pick(ownerIds), payoutDate: recentBE(), grossIncomeAmount: gross, commissionAmount: commission, deductions: [], paymentMethod: pick(METHODS), ownerBankAccount: "", note: "loop-test" };
  expectOk(loop, "create-payout", await api("POST", "/api/payouts", body), body);
}
async function txUser(loop: number) {
  const body = { fullName: fullName(), email: `lt_${loop}_${ri(100000, 999999)}@armay.test`, role: pick(USER_ROLES), status: "ACTIVE" };
  expectOk(loop, "create-user", await api("POST", "/api/users", body), body);
}

const WEIGHTED: ((loop: number, i: number) => Promise<void>)[] = [
  ...Array(4).fill(txIncome),
  ...Array(4).fill(txExpense),
  ...Array(3).fill(txRental),
  ...Array(2).fill(txPayout),
  ...Array(2).fill(txOwner),
  ...Array(2).fill(txTenant),
  txProperty,
  txAccount,
  txUser,
];

// ---------- invariants ----------
async function invRentalMath(loop: number) {
  if (!rooms.length || !tenantIds.length) return;
  const rent = money(8000, 20000), dep = 24000, clean = 800, other = 1200, disc = 500;
  const body = { tenantId: pick(tenantIds), roomId: pick(rooms).id, rentalType: "MONTHLY", startDate: recentBE(10), endDate: beDate(new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 6, 1))), rentAmount: rent, depositAmount: dep, cleaningFee: clean, otherFee: other, discountAmount: disc, bookingChannel: "inv", note: "inv-rental" };
  const r = expectOk(loop, "inv-rental-create", await api("POST", "/api/rentals", body), body);
  if (!r.ok) return;
  contractIds.push(r.data.id);
  const detail = await api("GET", `/api/rentals/${r.data.id}`);
  expectEq(loop, "inv-rental-total", detail.data?.total, fmtTHB(rent + dep + clean + other - disc), "(total = rent+deposit+cleaning+other-discount)");
}

async function invIncomeDup(loop: number) {
  if (!contractIds.length) return;
  const body = { contractId: pick(contractIds), incomeDate: recentBE(5), incomeType: "RENT", amount: money(10000, 20000), paymentMethod: "PROMPTPAY", transactionReference: `DUP-${loop}-${ri(100000, 999999)}` };
  expectOk(loop, "inv-dup-first", await api("POST", "/api/incomes", body), body);
  expectCode(loop, "inv-dup-second", await api("POST", "/api/incomes", body), "DUPLICATE_INCOME");
}

async function invPayoutMath(loop: number) {
  if (!ownerIds.length) return;
  const gross = money(20000, 40000), commission = money(1000, 3000), extra = money(500, 2000);
  const body = { ownerId: pick(ownerIds), payoutDate: recentBE(5), grossIncomeAmount: gross, commissionAmount: commission, deductions: [{ sourceId: null, label: "ปรับปรุงยอด", amount: extra }], paymentMethod: "BANK_TRANSFER", ownerBankAccount: "", note: "inv-payout" };
  const r = expectOk(loop, "inv-payout-create", await api("POST", "/api/payouts", body), body);
  if (!r.ok) return;
  const list = await api("GET", "/api/payouts");
  const rowNet = list.data?.rows?.find((x: any) => x.id === r.data.id)?.net;
  expectEq(loop, "inv-payout-net", rowNet, fmtTHB(gross - commission - extra), "(net = gross - commission - deductions)");
}

async function invPayoutReuse(loop: number) {
  if (!rooms.length) return;
  const room = pick(rooms);
  // owner-responsibility expense on this owner's room, so preview picks it up
  const exp = { date: recentBE(5), room: room.roomNumber, expenseType: "ค่าช่างซ่อม", description: "reuse-guard", payeeName: "ช่างทดสอบ", amount: money(1000, 5000), responsibility: "เจ้าของ", status: "รอจ่าย", beforeUrl: null, afterUrl: null };
  if (!expectOk(loop, "inv-reuse-expense", await api("POST", "/api/expenses", exp), exp).ok) return;
  const prev = await api("GET", `/api/payouts/preview?ownerId=${room.ownerId}`);
  const ded = prev.data?.ownerExpenses?.[0];
  if (!ded) return; // nothing to reuse this round
  const mk = () => ({ ownerId: room.ownerId, payoutDate: recentBE(5), grossIncomeAmount: money(10000, 20000), commissionAmount: 0, deductions: [{ sourceId: ded.sourceId, label: ded.label, amount: ded.amount }], paymentMethod: "CASH", ownerBankAccount: "", note: "reuse" });
  expectOk(loop, "inv-reuse-first", await api("POST", "/api/payouts", mk()), "reuse-1");
  expectCode(loop, "inv-reuse-second", await api("POST", "/api/payouts", mk()), "DEDUCTION_ALREADY_USED");
}

async function invCancelledExclusion(loop: number) {
  const contract = await prisma.rentalContract.findFirst({ select: { id: true, tenantId: true, roomId: true, ownerId: true, propertyId: true } });
  const room = await prisma.room.findFirst({ select: { id: true, ownerId: true, propertyId: true } });
  if (!contract || !room) return;
  const S = 7_000_000; // sentinel far above any generated amount
  const today = new Date();
  const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  const parseTHB = (s: unknown) => Number(String(s ?? "0").replace(/[฿,]/g, ""));

  // baseline
  const before = await api("GET", "/api/dashboard");
  const incBefore = before.data?.kpis?.incomeMonth ?? 0;
  const expBefore = before.data?.kpis?.expenseMonth ?? 0;
  const incSumBefore = parseTHB((await api("GET", "/api/incomes")).data?.summary?.month);
  const expSumBefore = parseTHB((await api("GET", "/api/expenses")).data?.summary?.month);

  // insert CANCELLED rows directly (no API path sets CANCELLED yet)
  const inc = await prisma.incomeTransaction.create({ data: { incomeCode: `CANx-${loop}-${ri(1000, 9999)}`, contractId: contract.id, tenantId: contract.tenantId, roomId: contract.roomId, ownerId: contract.ownerId, propertyId: contract.propertyId, incomeDate: utcToday, incomeType: "OTHER", amount: S, paymentMethod: "CASH", verificationStatus: "CANCELLED" } });
  const exp = await prisma.expenseTransaction.create({ data: { expenseCode: `CANx-${loop}-${ri(1000, 9999)}`, expenseDate: utcToday, roomId: room.id, ownerId: room.ownerId, propertyId: room.propertyId, expenseType: "OTHER", amount: S, paymentMethod: "CASH", responsibilityType: "BROKER", verificationStatus: "CANCELLED" } });

  // dashboard month totals must be unchanged
  const after = await api("GET", "/api/dashboard");
  expectEq(loop, "inv-cancelled-dashboard-income", after.data?.kpis?.incomeMonth, incBefore, "(CANCELLED income must not count in dashboard)");
  expectEq(loop, "inv-cancelled-dashboard-expense", after.data?.kpis?.expenseMonth, expBefore, "(CANCELLED expense must not count in dashboard)");

  // list-page month summaries must be unchanged too
  expectEq(loop, "inv-cancelled-income-summary", parseTHB((await api("GET", "/api/incomes")).data?.summary?.month), incSumBefore, "(CANCELLED income must not count in incomes summary)");
  expectEq(loop, "inv-cancelled-expense-summary", parseTHB((await api("GET", "/api/expenses")).data?.summary?.month), expSumBefore, "(CANCELLED expense must not count in expenses summary)");

  // reports totals must equal DB sum EXCLUDING cancelled
  const [incAgg, expAgg] = await Promise.all([
    prisma.incomeTransaction.aggregate({ _sum: { amount: true }, where: { verificationStatus: { not: "CANCELLED" } } }),
    prisma.expenseTransaction.aggregate({ _sum: { amount: true }, where: { verificationStatus: { not: "CANCELLED" } } }),
  ]);
  const rep = await api("GET", "/api/reports");
  expectEq(loop, "inv-cancelled-reports-income", rep.data?.totalIncome, fmtTHB(Number(incAgg._sum.amount ?? 0)), "(reports totalIncome excludes CANCELLED)");
  expectEq(loop, "inv-cancelled-reports-expense", rep.data?.totalExpense, fmtTHB(Number(expAgg._sum.amount ?? 0)), "(reports totalExpense excludes CANCELLED)");

  // cleanup sentinels so they don't accumulate
  await prisma.incomeTransaction.delete({ where: { id: inc.id } });
  await prisma.expenseTransaction.delete({ where: { id: exp.id } });
}

async function invShapes(loop: number) {
  const d = await api("GET", "/api/dashboard");
  expectEq(loop, "inv-dash-line12", d.data?.charts?.line?.months?.length, 12, "(dashboard line = 12 months)");
  const r = await api("GET", "/api/reports");
  expectEq(loop, "inv-report-6mo", r.data?.byMonth?.length, 6, "(reports byMonth = 6)");
}

async function invNegative(loop: number) {
  expectCode(loop, "neg-expense-room", await api("POST", "/api/expenses", { date: recentBE(), room: "NO-SUCH-ROOM", expenseType: "ค่าวัสดุ", description: "x", payeeName: "y", amount: 1, responsibility: "นายหน้า", status: "รอจ่าย", beforeUrl: null, afterUrl: null }), "ROOM_NOT_FOUND");
  expectCode(loop, "neg-income-contract", await api("POST", "/api/incomes", { contractId: 999999, incomeDate: recentBE(), incomeType: "OTHER", amount: 100, paymentMethod: "CASH", transactionReference: `NEG-${loop}` }), "CONTRACT_NOT_FOUND");
  expectCode(loop, "neg-owner-validation", await api("POST", "/api/owners", { fullName: "" }), "VALIDATION");
}

// ---------- driver ----------
async function warmup() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(BASE + "/api/auth/me");
      if (r.status) return true;
    } catch {
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
  return false;
}

async function main() {
  console.log(`== loop test :: BASE=${BASE} LOOPS=${LOOPS} TX=${TX_PER_LOOP} SEED=${_seed} ==`);
  if (!(await warmup())) {
    console.error("dev server not reachable at " + BASE);
    process.exit(2);
  }
  const login = await api("POST", "/api/auth/login", { email: "admin@armay.local", password: "owner123!" });
  if (!login.ok) {
    console.error("login failed — run `npm run seed` first:", login.raw);
    process.exit(2);
  }
  await loadPools();
  console.log(`pools: rooms=${rooms.length} owners=${ownerIds.length} tenants=${tenantIds.length} contracts=${contractIds.length}`);

  for (let loop = 1; loop <= LOOPS; loop++) {
    const before = bugs.length;
    for (let i = 0; i < TX_PER_LOOP; i++) await pick(WEIGHTED)(loop, i);
    await invRentalMath(loop);
    await invIncomeDup(loop);
    await invPayoutMath(loop);
    await invPayoutReuse(loop);
    await invCancelledExclusion(loop);
    await invShapes(loop);
    await invNegative(loop);
    const found = bugs.length - before;
    console.log(`loop ${String(loop).padStart(2)}/${LOOPS}  ${TX_PER_LOOP} tx + invariants → ${found ? `\x1b[31m${found} bug(s)\x1b[0m` : "\x1b[32mclean\x1b[0m"}`);
  }

  console.log(`\n==== ${checks} checks · ${bugs.length} bug(s) ====`);
  if (bugs.length) {
    const byKind = new Map<string, number>();
    for (const b of bugs) byKind.set(b.kind, (byKind.get(b.kind) ?? 0) + 1);
    console.log("by kind:");
    for (const [k, n] of [...byKind.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${n}×  ${k}`);
  }
  await prisma.$disconnect();
  process.exit(bugs.length ? 1 : 0);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(3);
});
