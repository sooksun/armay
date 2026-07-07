import type { BadgeKind } from "@/lib/theme";

/** DTO shapes returned by the API (JSON-safe: numbers, not Prisma.Decimal). */

export type RoomBrief = { no: string; building: string; status: string; badge: BadgeKind };
export type PayoutBrief = { room: string; income: string; deduct: string; net: string; status: string; badge: BadgeKind };
export type RentalBrief = { code: string; room: string; building: string; period: string; status: string; badge: BadgeKind };

export type OwnerDTO = {
  id: number;
  ownerCode: string;
  fullName: string;
  phone: string;
  email: string;
  lineId: string;
  address: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  promptpayId: string;
  note: string;
  status: "ACTIVE" | "INACTIVE";
  roomCount: number;
  pendingPayout: number;
  paidPayout: number;
  monthlyIncome: number;
  rooms: RoomBrief[];
  payouts: PayoutBrief[];
};

export type TenantDTO = {
  id: number;
  tenantCode: string;
  fullName: string;
  phone: string;
  email: string;
  lineId: string;
  idCardOrPassport: string;
  nationality: string;
  address: string;
  note: string;
  blacklist: boolean;
  status: "ACTIVE" | "INACTIVE";
  latest: RentalBrief | null;
  rentals: RentalBrief[];
  hasActiveRental: boolean;
};

export type IncomeBrief = { date: string; tenant: string; room: string; amount: string; channel: string };

export type AccountDTO = {
  id: number;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  promptpayId: string;
  accountType: string; // Thai label
  status: "ACTIVE" | "INACTIVE";
  qrUrl: string | null;
  recentIncomes: IncomeBrief[];
};

export type PropertyDTO = {
  id: number;
  propertyCode: string;
  propertyName: string;
  propertyType: string; // Thai label
  address: string;
  province: string;
  district: string;
  subdistrict: string;
  latitude: string;
  longitude: string;
  contactName: string;
  contactPhone: string;
  note: string;
  imageUrl: string | null;
  status: "ACTIVE" | "INACTIVE";
  monthlyIncome: number;
  totalExpense: number;
  roomCount: number;
  occupied: number;
  vacant: number;
  rooms: RoomBrief[];
};

export type UserDTO = {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "STAFF" | "VIEWER";
  status: "ACTIVE" | "INACTIVE";
  lastActive: string;
};

export type AuditLogDTO = {
  id: number;
  time: string;
  user: string;
  action: string; // Thai label
  badge: BadgeKind;
  table: string;
  record: string;
  detail: string;
};

export type RoomDTO = {
  id: number;
  roomCode: string;
  no: string;
  building: string;
  owner: string;
  status: string; // Thai label
  badge: BadgeKind;
  statusColor: string;
  income: string;
  expense: string;
  rent: string;
  tenantLine: string;
};

// ---------- TRANSACTIONS (read models) ----------

export type IncomeDTO = {
  id: number;
  date: string; // Thai BE date
  tenant: string;
  room: string;
  building: string;
  type: string; // Thai label
  amount: string; // ฿ formatted
  channel: string; // Thai payment-method label
  slipOk: boolean;
  status: string; // Thai verification label
  badge: BadgeKind;
  flag: boolean;
};
export type IncomeSummaryDTO = { today: string; month: string; pending: string; noSlip: string; maybeDup: string };
export type IncomeListDTO = { rows: IncomeDTO[]; summary: IncomeSummaryDTO };

export type ExpenseDTO = {
  id: number;
  expenseCode: string;
  date: string;
  room: string;
  building: string;
  expenseType: string; // Thai label
  description: string;
  payeeName: string;
  amount: string; // ฿ formatted
  responsibility: string; // Thai label
  status: string; // Thai verification label
  badge: BadgeKind;
  beforeUrl: string | null;
  afterUrl: string | null;
};
export type ExpenseSummaryDTO = { month: string; repairCleaning: string; pendingReview: string; problem: string };
export type ExpenseListDTO = { rows: ExpenseDTO[]; summary: ExpenseSummaryDTO };

export type RentalDTO = {
  id: number;
  code: string;
  tenant: string;
  room: string;
  building: string;
  owner: string;
  period: string;
  total: string; // ฿ formatted
  due: string; // ฿ formatted
  status: string; // Thai payment-status label
  badge: BadgeKind;
};

export type PayoutDTO = {
  id: number;
  owner: string;
  room: string;
  income: string; // ฿ formatted
  deduct: string; // ฿ formatted
  net: string; // ฿ formatted
  status: string; // Thai payout-status label
  badge: BadgeKind;
};
export type PayoutSummaryDTO = { pending: string; paidMonth: string; ownersUnpaid: string; toReview: string };
export type PayoutListDTO = { rows: PayoutDTO[]; summary: PayoutSummaryDTO };

export type PayoutExpenseLineDTO = { sourceId: number; label: string; amount: number };
export type PayoutPreviewDTO = { gross: number; ownerExpenses: PayoutExpenseLineDTO[] };

// ---------- DASHBOARD & REPORTS ----------

export type DashboardKpiDTO = {
  incomeMonth: number;
  expenseMonth: number;
  netMonth: number;
  pendingPayout: number;
  incomeToday: number;
  unverifiedCount: number;
  overdueCount: number;
};
export type UrgentTaskDTO = { title: string; sub: string; amount: string; kind: "income" | "expense" | "payout" | "alert" };
export type ChartPointDTO = { label: string; value: number; color: string };
export type DashboardChartsDTO = {
  line: { months: string[]; inc: number[]; exp: number[] };
  donut: ChartPointDTO[];
  bar: ChartPointDTO[];
  hbar: ChartPointDTO[];
};
export type DashboardDTO = { kpis: DashboardKpiDTO; urgent: UrgentTaskDTO[]; charts: DashboardChartsDTO };

export type ReportRowDTO = { label: string; income: string; expense: string; net: string; netNeg: boolean };
export type ReportsDTO = {
  totalIncome: string;
  totalExpense: string;
  totalNet: string;
  byProperty: ReportRowDTO[];
  byMonth: ReportRowDTO[];
};
