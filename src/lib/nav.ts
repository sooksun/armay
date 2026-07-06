import type { IconName } from "@/components/Icon";

export type NavItem = {
  id: string;
  label: string;
  icon: IconName;
  href: string;
  badge?: string;
};

/** Sidebar menu (15 items) — ported from the design comp. */
export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { id: "owners", label: "เจ้าของทรัพย์สิน", icon: "owners", href: "/owners" },
  { id: "properties", label: "อาคาร/โครงการ", icon: "building", href: "/properties" },
  { id: "rooms", label: "ห้อง/ยูนิต", icon: "room", href: "/rooms" },
  { id: "tenants", label: "ผู้เช่า", icon: "tenant", href: "/tenants" },
  { id: "rentals", label: "รายการเช่า", icon: "rental", href: "/rentals" },
  { id: "income", label: "รายรับ", icon: "income", href: "/income" },
  { id: "expenses", label: "รายจ่าย", icon: "expense", href: "/expenses" },
  { id: "payout", label: "จ่ายเงินเจ้าของ", icon: "payout", href: "/payout", badge: "3" },
  { id: "services", label: "งานแม่บ้าน/งานซ่อม", icon: "service", href: "/services" },
  { id: "reports", label: "รายงาน", icon: "report", href: "/reports" },
  { id: "accounts", label: "บัญชีรับ–จ่าย", icon: "account", href: "/accounts" },
  { id: "permissions", label: "ผู้ใช้งานและสิทธิ์", icon: "users", href: "/permissions" },
  { id: "settings", label: "ตั้งค่าระบบ", icon: "settings", href: "/settings" },
  { id: "audit", label: "Audit Log", icon: "audit", href: "/audit" },
];

/** Bottom nav (mobile) — 5 items. */
export const BOTTOM_NAV: { id: string; label: string; icon: IconName; href: string }[] = [
  { id: "dashboard", label: "หน้าหลัก", icon: "dashboard", href: "/dashboard" },
  { id: "rooms", label: "ห้อง", icon: "room", href: "/rooms" },
  { id: "income", label: "รายรับ", icon: "income", href: "/income" },
  { id: "payout", label: "จ่ายเจ้าของ", icon: "payout", href: "/payout" },
  { id: "services", label: "งานซ่อม", icon: "service", href: "/services" },
];

/** Page title + subtitle per view. */
export const PAGE_TITLES: Record<string, [string, string]> = {
  dashboard: ["Dashboard การเงิน", "ภาพรวมรายรับ รายจ่าย ยอดค้าง และรายการที่ต้องตรวจสอบ · ก.ค. 2568"],
  income: ["รายรับ", "บันทึกเงินเข้า ตรวจสอบสลิป และติดตามยอดค้าง"],
  rooms: ["ห้อง/ยูนิต", "ติดตามสถานะห้อง รายรับ รายจ่าย ผู้เช่า และประวัติการดูแล"],
  rentals: ["รายการเช่า", "จัดการการจอง สัญญาเช่า และสถานะการชำระเงิน"],
  payout: ["จ่ายเงินเจ้าของ", "คำนวณยอดสุทธิและตรวจสอบการโอนเงินให้เจ้าของทรัพย์สิน"],
  services: ["งานแม่บ้าน/งานซ่อม", "ติดตามงานบริการห้อง ค่าใช้จ่าย รูปก่อน–หลัง และผู้รับผิดชอบ"],
  owners: ["เจ้าของทรัพย์สิน", "จัดการข้อมูลเจ้าของ ห้องในความดูแล และยอดเงินที่ต้องจ่าย"],
  properties: ["อาคาร/โครงการ", "จัดกลุ่มทรัพย์สินตามสถานที่และประเภทอาคาร"],
  tenants: ["ผู้เช่า", "ค้นหา ติดตาม และตรวจสอบประวัติผู้เช่า"],
  expenses: ["รายจ่าย", "ควบคุมค่าใช้จ่ายที่เกี่ยวข้องกับห้อง อาคาร และรายการเช่า"],
  reports: ["รายงาน", "วิเคราะห์รายรับ รายจ่าย ยอดค้าง และผลประกอบการ"],
  accounts: ["บัญชีรับ–จ่าย", "จัดการช่องทางรับเงินและจ่ายเงินทั้งหมด"],
  permissions: ["ผู้ใช้งานและสิทธิ์", "จัดการบทบาทและสิทธิ์การเข้าถึง"],
  settings: ["ตั้งค่าระบบ", "ประเภทข้อมูล สูตรคำนวณ และการแจ้งเตือน"],
  audit: ["Audit Log", "ตรวจสอบประวัติการเปลี่ยนแปลงข้อมูลสำคัญ"],
};

/** Views that have a full design (others render the placeholder). */
export const BUILT_VIEWS = ["dashboard", "income", "rooms", "rentals", "payout", "services"];
