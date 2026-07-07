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
