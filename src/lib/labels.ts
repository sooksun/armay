import type { BadgeKind } from "@/lib/theme";

/** Bidirectional map between a DB enum value and its Thai UI label. */
export type LabelMap = Record<string, string>;

export function toThai(map: LabelMap, value: string): string {
  return map[value] ?? value;
}

export function fromThai(map: LabelMap, thai: string): string | undefined {
  const found = Object.entries(map).find(([, label]) => label === thai);
  return found?.[0];
}

export const GENERIC_STATUS: LabelMap = { ACTIVE: "ใช้งานอยู่", INACTIVE: "ปิดใช้งาน" };

export const PROPERTY_TYPE: LabelMap = {
  CONDO: "คอนโด",
  APARTMENT: "แฟลต",
  HOUSE: "บ้านพัก",
  TOWNHOUSE: "ทาวน์เฮาส์",
  COMMERCIAL: "อาคารพาณิชย์",
  DORMITORY: "หอพัก",
  OTHER: "อื่นๆ",
};

export const ROOM_STATUS: LabelMap = {
  AVAILABLE: "ว่าง",
  OCCUPIED: "มีผู้เช่า",
  RESERVED: "จองแล้ว",
  MAINTENANCE: "ปิดปรับปรุง",
  INACTIVE: "ไม่รับจอง",
};
export const ROOM_STATUS_BADGE: Record<string, BadgeKind> = {
  AVAILABLE: "blue",
  OCCUPIED: "green",
  RESERVED: "gold",
  MAINTENANCE: "orange",
  INACTIVE: "gray",
};

export const ACCOUNT_TYPE: LabelMap = {
  RECEIVE_TENANT: "รับผู้เช่า",
  PAY_OWNER: "จ่ายเจ้าของ",
  PERSONAL: "ส่วนตัว",
  CASH: "เงินสด",
};

export const RESPONSIBILITY: LabelMap = { BROKER: "นายหน้า", OWNER: "เจ้าของ", TENANT: "ผู้เช่า" };

export const RENTAL_STATUS: LabelMap = {
  BOOKED: "จองแล้ว",
  CHECKED_IN: "เข้าพักแล้ว",
  ENDED: "สิ้นสุดแล้ว",
  CANCELLED: "ยกเลิก",
};

export const PAYMENT_STATUS: LabelMap = {
  UNPAID: "ยังไม่จ่าย",
  PARTIAL: "จ่ายบางส่วน",
  PAID: "จ่ายครบ",
  OVERDUE: "เกินกำหนด",
};
export const PAYMENT_STATUS_BADGE: Record<string, BadgeKind> = {
  UNPAID: "red",
  PARTIAL: "gold",
  PAID: "green",
  OVERDUE: "red",
};

export const VERIFICATION_STATUS: LabelMap = {
  DRAFT: "ร่าง",
  PENDING: "รอตรวจสอบ",
  VERIFIED: "ตรวจสอบแล้ว",
  NEEDS_FIX: "ต้องแก้ไข",
  CANCELLED: "ยกเลิก",
  PROBLEM: "มีปัญหา",
};
export const VERIFICATION_BADGE: Record<string, BadgeKind> = {
  DRAFT: "gray",
  PENDING: "gold",
  VERIFIED: "green",
  NEEDS_FIX: "orange",
  CANCELLED: "gray",
  PROBLEM: "red",
};

export const PAYOUT_STATUS: LabelMap = { PENDING: "รอจ่าย", PARTIAL: "จ่ายบางส่วน", PAID: "จ่ายแล้ว", CANCELLED: "ยกเลิก" };
export const PAYOUT_STATUS_BADGE: Record<string, BadgeKind> = { PENDING: "gold", PARTIAL: "gold", PAID: "green", CANCELLED: "gray" };

export const INCOME_TYPE: LabelMap = {
  RENT: "ค่าเช่ารายเดือน",
  DEPOSIT: "เงินประกัน",
  CLEANING: "ค่าทำความสะอาด",
  WATER: "ค่าน้ำ",
  ELECTRICITY: "ค่าไฟ",
  PENALTY: "ค่าปรับ",
  OTHER: "อื่นๆ",
};

export const EXPENSE_TYPE: LabelMap = {
  CLEANING: "ค่าทำความสะอาด",
  REPAIR: "ค่าช่างซ่อม",
  MATERIAL: "ค่าวัสดุ",
  WATER: "ค่าน้ำ",
  ELECTRICITY: "ค่าไฟ",
  INTERNET: "ค่าอินเทอร์เน็ต",
  COMMON_AREA: "ค่าส่วนกลาง",
  TRAVEL: "ค่าเดินทาง",
  ADMIN: "ค่าบริหาร",
  ADVERTISING: "ค่าโฆษณา",
  OTHER: "ค่าอื่นๆ",
};

export const PAYMENT_METHOD: LabelMap = {
  CASH: "เงินสด",
  BANK_TRANSFER: "โอนธนาคาร",
  PROMPTPAY: "PromptPay",
  CREDIT_CARD: "บัตรเครดิต",
  OTHER: "อื่นๆ",
};

export const USER_ROLE: LabelMap = { ADMIN: "ผู้ดูแลระบบ", STAFF: "พนักงาน/ผู้ช่วย", VIEWER: "ผู้ดูรายงาน" };
export const USER_ROLE_BADGE: Record<string, BadgeKind> = { ADMIN: "purple", STAFF: "blue", VIEWER: "gray" };
