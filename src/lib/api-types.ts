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
