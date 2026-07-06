import type { IconName } from "@/components/Icon";
import { parseAmount } from "@/lib/theme";
import type { BadgeKind } from "@/lib/theme";

/** Mock data ported verbatim from the Crystal Ledger design comp. */

// ---------- DASHBOARD ----------
export type Kpi = {
  label: string;
  icon: IconName;
  color: string;
  value: string;
  suffix: string;
  delta: string;
  up: boolean;
  hint: string;
};

export const DASHBOARD_KPIS: Kpi[] = [
  { label: "รายรับเดือนนี้", icon: "income", color: "#5EEAD4", value: "1,248,500", suffix: "", delta: "+12.4%", up: true, hint: "เทียบเดือนก่อน" },
  { label: "รายจ่ายเดือนนี้", icon: "expense", color: "#FB7185", value: "386,200", suffix: "", delta: "+5.1%", up: false, hint: "เทียบเดือนก่อน" },
  { label: "ยอดสุทธิเบื้องต้น", icon: "payout", color: "#38BDF8", value: "862,300", suffix: "", delta: "+18.2%", up: true, hint: "รายรับ − รายจ่าย" },
  { label: "ผู้เช่าค้างชำระ", icon: "alert", color: "#FBBF24", value: "184,000", suffix: "", delta: "7 ราย", up: false, hint: "ต้องติดตาม" },
  { label: "ต้องจ่ายเจ้าของ", icon: "payout", color: "#A855F7", value: "542,800", suffix: "", delta: "14 ราย", up: false, hint: "รอโอน" },
  { label: "จ่ายเจ้าของแล้ว", icon: "payout", color: "#5EEAD4", value: "318,500", suffix: "", delta: "เดือนนี้", up: true, hint: "ตรวจสอบแล้ว" },
  { label: "ค่าแม่บ้าน/ค่าซ่อม", icon: "service", color: "#FBBF24", value: "94,600", suffix: "", delta: "23 งาน", up: false, hint: "รวมทุกอาคาร" },
  { label: "รายการรอตรวจสอบ", icon: "audit", color: "#FB7185", value: "12", suffix: " รายการ", delta: "ด่วน", up: false, hint: "ไม่มีสลิป/ซ้ำ" },
];

export const DASH_FILTERS: { label: string; value: string }[] = [
  { label: "เดือน", value: "ก.ค." },
  { label: "ปี", value: "2568" },
  { label: "อาคาร", value: "ทั้งหมด" },
  { label: "เจ้าของ", value: "ทั้งหมด" },
  { label: "สถานะจ่าย", value: "ทั้งหมด" },
];

export type UrgentTask = {
  icon: IconName;
  title: string;
  sub: string;
  amount: string;
  color: string;
};

export const URGENT_TASKS: UrgentTask[] = [
  { icon: "alert", title: "ผู้เช่าค้างชำระเกินกำหนด 15 วัน", sub: "คุณสุดา แสงทอง · C-305 · แฟลตรุ่งเรือง", amount: "−18,500", color: "#FB7185" },
  { icon: "payout", title: "เจ้าของยังไม่ได้รับเงิน 3 รายการ", sub: "คุณสมชาย วัฒนโสภณ · เดอะ เครสท์", amount: "142,000", color: "#FBBF24" },
  { icon: "audit", title: "รายรับไม่มีสลิปแนบ", sub: "RN-2568-0138 · B-410 · ศุภาลัย", amount: "9,800", color: "#FB7185" },
  { icon: "audit", title: "รายการซ้ำที่น่าสงสัย", sub: "จำนวนเงิน+วันที่+เลขอ้างอิงตรงกัน", amount: "12,500", color: "#A855F7" },
  { icon: "rental", title: "สัญญาเช่าใกล้หมดใน 7 วัน", sub: "คุณกิตติพงษ์ ใจดี · A-1105", amount: "—", color: "#FBBF24" },
];

// ---------- INCOME ----------
export type MiniKpi = { label: string; icon: IconName; color: string; value: string };

export const INCOME_KPIS: MiniKpi[] = [
  { label: "รายรับวันนี้", icon: "income", color: "#5EEAD4", value: "฿86,500" },
  { label: "รายรับเดือนนี้", icon: "income", color: "#38BDF8", value: "฿1,248,500" },
  { label: "รอตรวจสอบ", icon: "audit", color: "#FBBF24", value: "฿48,200" },
  { label: "ไม่มีสลิป", icon: "alert", color: "#FB7185", value: "฿19,600" },
  { label: "อาจซ้ำ", icon: "alert", color: "#A855F7", value: "2 รายการ" },
];

export type IncomeRow = {
  date: string;
  tenant: string;
  room: string;
  building: string;
  type: string;
  amount: string;
  channel: string;
  slipOk: boolean;
  status: string;
  badge: BadgeKind;
  flag: boolean;
};

export const INCOME_ROWS: IncomeRow[] = [
  { date: "6 ก.ค. 2568", tenant: "คุณกิตติพงษ์ ใจดี", room: "A-1105", building: "เดอะ เครสท์", type: "ค่าเช่ารายเดือน", amount: "฿12,500", channel: "PromptPay", slipOk: true, status: "ตรวจสอบแล้ว", badge: "green", flag: false },
  { date: "6 ก.ค. 2568", tenant: "คุณศิริพร มงคล", room: "A-1204", building: "เดอะ เครสท์", type: "ค่าเช่ารายเดือน", amount: "฿14,000", channel: "โอนธนาคาร", slipOk: true, status: "ตรวจสอบแล้ว", badge: "green", flag: false },
  { date: "5 ก.ค. 2568", tenant: "คุณธนา รุ่งเรือง", room: "B-802", building: "บ้านสวน พัทยา", type: "เงินประกัน", amount: "฿24,000", channel: "เงินสด", slipOk: false, status: "ต้องตรวจสอบ", badge: "gold", flag: true },
  { date: "5 ก.ค. 2568", tenant: "คุณวิภา สายชล", room: "B-410", building: "ศุภาลัย เรส", type: "ค่าเช่ารายเดือน", amount: "฿9,800", channel: "PromptPay", slipOk: false, status: "ไม่มีสลิป", badge: "red", flag: true },
  { date: "4 ก.ค. 2568", tenant: "คุณอนุชา พงษ์ไพร", room: "C-305", building: "แฟลตรุ่งเรือง", type: "ค่าน้ำ/ค่าไฟ", amount: "฿1,850", channel: "PromptPay", slipOk: true, status: "ตรวจสอบแล้ว", badge: "green", flag: false },
  { date: "4 ก.ค. 2568", tenant: "คุณมณีรัตน์ ทองดี", room: "A-902", building: "เดอะ เครสท์", type: "ค่าเช่ารายเดือน", amount: "฿12,500", channel: "โอนธนาคาร", slipOk: true, status: "รอตรวจสอบ", badge: "gold", flag: false },
  { date: "3 ก.ค. 2568", tenant: "คุณสมพงษ์ เจริญสุข", room: "B-1105", building: "บ้านสวน พัทยา", type: "ค่าเช่ารายเดือน", amount: "฿16,000", channel: "PromptPay", slipOk: true, status: "ตรวจสอบแล้ว", badge: "green", flag: false },
  { date: "3 ก.ค. 2568", tenant: "คุณกาญจนา ศรีสุข", room: "C-208", building: "แฟลตรุ่งเรือง", type: "ค่าทำความสะอาด", amount: "฿800", channel: "เงินสด", slipOk: false, status: "ต้องตรวจสอบ", badge: "gold", flag: true },
];

// ---------- ROOMS ----------
export const ROOM_STATUS_COLOR: Record<string, string> = {
  "มีผู้เช่า": "#34D399",
  "ว่าง": "#38BDF8",
  "ค้างชำระ": "#FB7185",
  "ปิดปรับปรุง": "#FB923C",
};
export const ROOM_BADGE_KIND: Record<string, BadgeKind> = {
  "มีผู้เช่า": "green",
  "ว่าง": "blue",
  "ค้างชำระ": "red",
  "ปิดปรับปรุง": "orange",
};
export const ROOM_PHOTO_BGS = [
  "linear-gradient(135deg,#0e2a3a,#123)",
  "linear-gradient(135deg,#1a2140,#0e1830)",
  "linear-gradient(135deg,#241436,#141024)",
  "linear-gradient(135deg,#0e2e28,#0a1a18)",
];

export type Room = {
  no: string;
  building: string;
  owner: string;
  status: string;
  income: string;
  expense: string;
  tenantLine: string;
  rent: string;
};

export const ROOMS: Room[] = [
  { no: "A-1105", building: "เดอะ เครสท์", owner: "คุณสมชาย วัฒนโสภณ", status: "มีผู้เช่า", income: "฿12,500", expense: "฿2,100", tenantLine: "ผู้เช่า: คุณกิตติพงษ์ ใจดี", rent: "฿12,500" },
  { no: "A-1204", building: "เดอะ เครสท์", owner: "คุณสมชาย วัฒนโสภณ", status: "มีผู้เช่า", income: "฿14,000", expense: "฿0", tenantLine: "ผู้เช่า: คุณศิริพร มงคล", rent: "฿14,000" },
  { no: "A-902", building: "เดอะ เครสท์", owner: "คุณพิมพ์ใจ ธีรกุล", status: "ค้างชำระ", income: "฿0", expense: "฿1,200", tenantLine: "ผู้เช่า: คุณมณีรัตน์ (ค้าง 5 วัน)", rent: "฿12,500" },
  { no: "B-802", building: "บ้านสวน พัทยา", owner: "คุณอนุชา เดชา", status: "มีผู้เช่า", income: "฿16,000", expense: "฿4,600", tenantLine: "ผู้เช่า: คุณธนา รุ่งเรือง", rent: "฿16,000" },
  { no: "B-1105", building: "บ้านสวน พัทยา", owner: "คุณอนุชา เดชา", status: "มีผู้เช่า", income: "฿16,000", expense: "฿0", tenantLine: "ผู้เช่า: คุณสมพงษ์ เจริญสุข", rent: "฿16,000" },
  { no: "B-410", building: "ศุภาลัย เรส", owner: "คุณพิมพ์ใจ ธีรกุล", status: "ว่าง", income: "฿0", expense: "฿0", tenantLine: "ห้องว่าง · พร้อมปล่อยเช่า", rent: "฿9,800" },
  { no: "C-305", building: "แฟลตรุ่งเรือง", owner: "คุณวีระ สุขสันต์", status: "ค้างชำระ", income: "฿0", expense: "฿850", tenantLine: "ผู้เช่า: คุณสุดา (ค้าง 15 วัน)", rent: "฿7,500" },
  { no: "C-208", building: "แฟลตรุ่งเรือง", owner: "คุณวีระ สุขสันต์", status: "ปิดปรับปรุง", income: "฿0", expense: "฿8,400", tenantLine: "กำลังซ่อมห้องน้ำ · คาดเสร็จ 12 ก.ค.", rent: "฿7,500" },
  { no: "A-701", building: "เดอะ เครสท์", owner: "คุณพิมพ์ใจ ธีรกุล", status: "ว่าง", income: "฿0", expense: "฿0", tenantLine: "ห้องว่าง · พร้อมปล่อยเช่า", rent: "฿12,500" },
];

export const ROOM_FILTERS = [
  { label: "อาคาร", value: "ทั้งหมด" },
  { label: "สถานะ", value: "ทั้งหมด" },
  { label: "ประเภท", value: "ทั้งหมด" },
  { label: "ช่วงราคา", value: "ทั้งหมด" },
];

export const ROOM_DRAWER_TABS = ["ภาพรวม", "ข้อมูลห้อง", "ผู้เช่า", "รายรับ", "รายจ่าย", "งานซ่อม", "เอกสาร"];

// ---------- RENTALS ----------
export type RentalRow = {
  code: string;
  tenant: string;
  room: string;
  building: string;
  owner: string;
  period: string;
  total: string;
  due: string;
  status: string;
  badge: BadgeKind;
};

export const RENTAL_ROWS: RentalRow[] = [
  { code: "RN-2568-0142", tenant: "คุณกิตติพงษ์ ใจดี", room: "A-1105", building: "เดอะ เครสท์", owner: "คุณสมชาย", period: "1 ก.ค. – 31 ก.ค.", total: "฿12,500", due: "฿0", status: "จ่ายครบ", badge: "green" },
  { code: "RN-2568-0141", tenant: "คุณศิริพร มงคล", room: "A-1204", building: "เดอะ เครสท์", owner: "คุณสมชาย", period: "1 ก.ค. – 31 ธ.ค.", total: "฿84,000", due: "฿0", status: "จ่ายครบ", badge: "green" },
  { code: "RN-2568-0139", tenant: "คุณมณีรัตน์ ทองดี", room: "A-902", building: "เดอะ เครสท์", owner: "คุณพิมพ์ใจ", period: "1 ก.ค. – 31 ก.ค.", total: "฿12,500", due: "฿12,500", status: "ยังไม่จ่าย", badge: "red" },
  { code: "RN-2568-0138", tenant: "คุณสุดา แสงทอง", room: "C-305", building: "แฟลตรุ่งเรือง", owner: "คุณวีระ", period: "20 มิ.ย. – 19 ก.ค.", total: "฿7,500", due: "฿7,500", status: "ค้างชำระ", badge: "red" },
  { code: "RN-2568-0137", tenant: "คุณธนา รุ่งเรือง", room: "B-802", building: "บ้านสวน พัทยา", owner: "คุณอนุชา", period: "1 ก.ค. – 30 ก.ย.", total: "฿48,000", due: "฿16,000", status: "จ่ายบางส่วน", badge: "gold" },
  { code: "RN-2568-0135", tenant: "คุณสมพงษ์ เจริญสุข", room: "B-1105", building: "บ้านสวน พัทยา", owner: "คุณอนุชา", period: "1 ก.ค. – 31 ก.ค.", total: "฿16,000", due: "฿0", status: "จ่ายครบ", badge: "green" },
  { code: "RN-2568-0132", tenant: "คุณกาญจนา ศรีสุข", room: "C-208", building: "แฟลตรุ่งเรือง", owner: "คุณวีระ", period: "15 มิ.ย. – 14 ก.ค.", total: "฿7,500", due: "฿0", status: "จ่ายครบ", badge: "green" },
];

export type StepField = { label: string; value: string; color: string; icon?: IconName };

export const RENTAL_STEPS = ["เลือกผู้เช่า", "เลือกห้อง", "เงื่อนไขเช่า", "ตรวจสอบ"];

export const RENTAL_STEP_DATA: { title: string; desc: string; fields: StepField[] }[] = [
  {
    title: "เลือกผู้เช่า",
    desc: "ค้นหาผู้เช่าเดิมจากระบบ หรือเพิ่มผู้เช่าใหม่",
    fields: [
      { label: "ผู้เช่า", value: "คุณกิตติพงษ์ ใจดี", color: "#EAF2FF", icon: "search" },
      { label: "เบอร์โทร", value: "081-234-5678", color: "#EAF2FF" },
      { label: "เลขบัตรประชาชน", value: "1-2345-67890-12-3", color: "#EAF2FF" },
      { label: "อีเมล", value: "kitti@email.com", color: "rgba(234,242,255,0.5)" },
    ],
  },
  {
    title: "เลือกห้อง",
    desc: "เลือกอาคารและห้องว่าง — ระบบแสดงเจ้าของอัตโนมัติ",
    fields: [
      { label: "อาคาร", value: "เดอะ เครสท์ สุขุมวิท", color: "#EAF2FF", icon: "chevDown" },
      { label: "ห้อง", value: "A-1105 (ว่าง)", color: "#EAF2FF", icon: "chevDown" },
      { label: "เจ้าของ (อัตโนมัติ)", value: "คุณสมชาย วัฒนโสภณ", color: "#7FF0D9" },
      { label: "ค่าเช่าปกติ", value: "฿12,500/เดือน", color: "#7FF0D9" },
    ],
  },
  {
    title: "กำหนดเงื่อนไขเช่า",
    desc: "ระบุระยะเวลา ค่าเช่า และค่าใช้จ่ายอื่น",
    fields: [
      { label: "วันที่เริ่ม", value: "1 ก.ค. 2568", color: "#EAF2FF", icon: "cal" },
      { label: "วันที่สิ้นสุด", value: "31 ก.ค. 2568", color: "#EAF2FF", icon: "cal" },
      { label: "ค่าเช่า", value: "฿12,500", color: "#7FF0D9" },
      { label: "เงินประกัน", value: "฿24,000", color: "#EAF2FF" },
      { label: "ค่าทำความสะอาด", value: "฿800", color: "#EAF2FF" },
      { label: "ส่วนลด", value: "฿0", color: "rgba(234,242,255,0.5)" },
    ],
  },
  {
    title: "ตรวจสอบและบันทึก",
    desc: "ตรวจสอบยอดรวมก่อนยืนยัน",
    fields: [
      { label: "ยอดรวมทั้งสิ้น", value: "฿37,300", color: "#7FF0D9" },
      { label: "ต้องชำระตอนนี้", value: "฿37,300", color: "#7FF0D9" },
      { label: "ประเภทการเช่า", value: "รายเดือน", color: "#EAF2FF" },
      { label: "สถานะ", value: "รอชำระเงิน", color: "#FDE68A" },
    ],
  },
];

// ---------- PAYOUT ----------
export const PAYOUT_KPIS: MiniKpi[] = [
  { label: "ยอดรอจ่ายเจ้าของ", icon: "payout", color: "#FBBF24", value: "฿542,800" },
  { label: "จ่ายแล้วเดือนนี้", icon: "payout", color: "#5EEAD4", value: "฿318,500" },
  { label: "เจ้าของยังไม่ได้รับ", icon: "owners", color: "#FB7185", value: "6 ราย" },
  { label: "รอตรวจสอบ", icon: "audit", color: "#A855F7", value: "4 รายการ" },
];

export const PAYOUT_STEP_META: [string, string][] = [
  ["เลือกเจ้าของ", "ระบบแสดงห้องทั้งหมดในความดูแลของเจ้าของ"],
  ["เลือกรายการเช่า/ห้อง", "ระบบแสดงรายรับที่เกี่ยวข้องในงวดนี้"],
  ["ตรวจสอบรายการหัก", "ค่านายหน้า ค่าแม่บ้าน ค่าซ่อม ค่าโอน และอื่น ๆ"],
  ["คำนวณยอดสุทธิ", "รายรับรวม − รายการหัก = ยอดสุทธิจ่ายเจ้าของ"],
  ["บันทึกการจ่าย", "ระบุจำนวนที่จ่ายจริง ช่องทาง และแนบสลิป"],
];

export type CalcRow = { label: string; amount: string; labelColor: string; amountColor: string; bold: boolean; top: boolean };

export const PAYOUT_CALC_ROWS: CalcRow[] = [
  { label: "รายรับรวมของห้อง A-1105", amount: "฿12,500", labelColor: "rgba(234,242,255,0.8)", amountColor: "#EAF2FF", bold: false, top: false },
  { label: "หัก ค่านายหน้า (10%)", amount: "− ฿1,250", labelColor: "rgba(234,242,255,0.7)", amountColor: "#FDA4AF", bold: false, top: true },
  { label: "หัก ค่าแม่บ้าน", amount: "− ฿800", labelColor: "rgba(234,242,255,0.7)", amountColor: "#FDA4AF", bold: false, top: true },
  { label: "หัก ค่าซ่อมก๊อกน้ำ", amount: "− ฿1,300", labelColor: "rgba(234,242,255,0.7)", amountColor: "#FDA4AF", bold: false, top: true },
  { label: "หัก ค่าธรรมเนียมโอน", amount: "− ฿15", labelColor: "rgba(234,242,255,0.7)", amountColor: "#FDA4AF", bold: false, top: true },
  { label: "ยอดสุทธิจ่ายเจ้าของ", amount: "฿9,135", labelColor: "#7FF0D9", amountColor: "#7FF0D9", bold: true, top: true },
];

export const PAYOUT_FIELDS_BY_STEP: Record<number, StepField[]> = {
  1: [
    { label: "เจ้าของ", value: "คุณสมชาย วัฒนโสภณ", color: "#EAF2FF", icon: "search" },
    { label: "จำนวนห้องในความดูแล", value: "4 ห้อง", color: "#7FF0D9" },
    { label: "บัญชีรับเงิน", value: "KBank · 123-4-56789", color: "#EAF2FF" },
    { label: "ยอดค้างจ่ายสะสม", value: "฿142,000", color: "#FDE68A" },
  ],
  2: [
    { label: "ห้อง", value: "A-1105", color: "#EAF2FF", icon: "chevDown" },
    { label: "รายการเช่า", value: "RN-2568-0142", color: "#EAF2FF", icon: "chevDown" },
    { label: "งวด", value: "ก.ค. 2568", color: "#EAF2FF" },
    { label: "รายรับที่เกี่ยวข้อง", value: "฿12,500", color: "#7FF0D9" },
  ],
  5: [
    { label: "จำนวนที่จ่ายจริง", value: "฿9,135", color: "#7FF0D9" },
    { label: "วันที่จ่าย", value: "6 ก.ค. 2568", color: "#EAF2FF", icon: "cal" },
    { label: "ช่องทางจ่าย", value: "โอนธนาคาร", color: "#EAF2FF", icon: "chevDown" },
    { label: "บัญชีเจ้าของ", value: "KBank · 123-4-56789", color: "#EAF2FF" },
    { label: "เลขอ้างอิง", value: "TXN20680706-0091", color: "#EAF2FF" },
    { label: "แนบสลิป", value: "slip-9135.jpg", color: "#7FF0D9", icon: "upload" },
  ],
};

export type PayoutRow = {
  owner: string;
  room: string;
  income: string;
  deduct: string;
  net: string;
  status: string;
  badge: BadgeKind;
};

export const PAYOUT_ROWS: PayoutRow[] = [
  { owner: "คุณสมชาย วัฒนโสภณ", room: "A-1105 · เดอะ เครสท์", income: "฿12,500", deduct: "฿3,365", net: "฿9,135", status: "รอตรวจสอบ", badge: "purple" },
  { owner: "คุณอนุชา เดชา", room: "B-802 · บ้านสวน พัทยา", income: "฿16,000", deduct: "฿6,200", net: "฿9,800", status: "จ่ายแล้ว", badge: "green" },
  { owner: "คุณพิมพ์ใจ ธีรกุล", room: "A-902 · เดอะ เครสท์", income: "฿12,500", deduct: "฿2,450", net: "฿10,050", status: "รอจ่าย", badge: "gold" },
  { owner: "คุณวีระ สุขสันต์", room: "C-208 · แฟลตรุ่งเรือง", income: "฿7,500", deduct: "฿9,250", net: "−฿1,750", status: "มีปัญหา", badge: "red" },
  { owner: "คุณสมชาย วัฒนโสภณ", room: "A-1204 · เดอะ เครสท์", income: "฿14,000", deduct: "฿1,400", net: "฿12,600", status: "จ่ายแล้ว", badge: "green" },
];

// ---------- SERVICES / KANBAN ----------
export type KanbanTask = {
  type: string;
  typeBadge: BadgeKind;
  title: string;
  room: string;
  building: string;
  assignee: string;
  cost: string;
  color: string;
  photos: boolean;
};

export type KanbanColumn = { title: string; color: string; tasks: KanbanTask[] };

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    title: "งานใหม่",
    color: "#38BDF8",
    tasks: [
      { type: "ซ่อม", typeBadge: "blue", title: "แอร์ไม่เย็น ห้องนอน", room: "A-701", building: "เดอะ เครสท์", assignee: "คุณช่างเอก", cost: "฿—", color: "#38BDF8", photos: false },
      { type: "ทำความสะอาด", typeBadge: "purple", title: "ทำความสะอาดก่อนเข้าอยู่", room: "B-410", building: "ศุภาลัย เรส", assignee: "คุณแม่บ้านนก", cost: "฿800", color: "#A855F7", photos: false },
    ],
  },
  {
    title: "รอดำเนินการ",
    color: "#FBBF24",
    tasks: [
      { type: "ซ่อม", typeBadge: "blue", title: "เปลี่ยนก๊อกน้ำห้องน้ำ", room: "A-1105", building: "เดอะ เครสท์", assignee: "คุณช่างเอก", cost: "฿1,300", color: "#FBBF24", photos: false },
    ],
  },
  {
    title: "กำลังดำเนินการ",
    color: "#A855F7",
    tasks: [
      { type: "ซ่อมใหญ่", typeBadge: "red", title: "รีโนเวทห้องน้ำ", room: "C-208", building: "แฟลตรุ่งเรือง", assignee: "คุณช่างสมพร", cost: "฿8,400", color: "#A855F7", photos: true },
      { type: "ทำความสะอาด", typeBadge: "purple", title: "ทำความสะอาดรายเดือน", room: "B-802", building: "บ้านสวน พัทยา", assignee: "คุณแม่บ้านนก", cost: "฿1,200", color: "#A855F7", photos: false },
    ],
  },
  {
    title: "เสร็จแล้ว",
    color: "#34D399",
    tasks: [
      { type: "ซ่อม", typeBadge: "blue", title: "เปลี่ยนหลอดไฟ + ปลั๊ก", room: "A-902", building: "เดอะ เครสท์", assignee: "คุณช่างเอก", cost: "฿650", color: "#34D399", photos: true },
    ],
  },
  {
    title: "รอตรวจสอบ",
    color: "#FB7185",
    tasks: [
      { type: "ทำความสะอาด", typeBadge: "purple", title: "ทำความสะอาด Big Cleaning", room: "A-1204", building: "เดอะ เครสท์", assignee: "คุณแม่บ้านนก", cost: "฿2,400", color: "#FB7185", photos: true },
    ],
  },
  {
    title: "ปิดงานแล้ว",
    color: "#94A3B8",
    tasks: [
      { type: "ซ่อม", typeBadge: "gray", title: "ซ่อมประตูห้อง", room: "B-1105", building: "บ้านสวน พัทยา", assignee: "คุณช่างสมพร", cost: "฿480", color: "#94A3B8", photos: true },
    ],
  },
];

export function initials(name: string): string {
  return name.replace("คุณ", "").charAt(0);
}

// ---------- OWNERS ----------
export type OwnerStatus = "ACTIVE" | "INACTIVE";

export type Owner = {
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
  status: OwnerStatus;
};

export const OWNERS: Owner[] = [
  {
    id: 1,
    ownerCode: "OWN-0001",
    fullName: "คุณสมชาย วัฒนโสภณ",
    phone: "081-111-2222",
    email: "somchai.w@email.com",
    lineId: "somchai_w",
    address: "99/1 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110",
    bankName: "KBank",
    bankAccountNumber: "123-4-56789",
    bankAccountName: "สมชาย วัฒนโสภณ",
    promptpayId: "081-111-2222",
    note: "",
    status: "ACTIVE",
  },
  {
    id: 2,
    ownerCode: "OWN-0002",
    fullName: "คุณพิมพ์ใจ ธีรกุล",
    phone: "082-222-3333",
    email: "pimjai.t@email.com",
    lineId: "pimjai_t",
    address: "45 ซ.สุขุมวิท 71 แขวงพระโขนงเหนือ เขตวัฒนา กรุงเทพฯ 10110",
    bankName: "SCB",
    bankAccountNumber: "234-5-67890",
    bankAccountName: "พิมพ์ใจ ธีรกุล",
    promptpayId: "082-222-3333",
    note: "",
    status: "ACTIVE",
  },
  {
    id: 3,
    ownerCode: "OWN-0003",
    fullName: "คุณอนุชา เดชา",
    phone: "083-333-4444",
    email: "anucha.d@email.com",
    lineId: "anucha_d",
    address: "12 หมู่ 4 ต.หนองปรือ อ.บางละมุง จ.ชลบุรี 20150",
    bankName: "BBL",
    bankAccountNumber: "345-6-78901",
    bankAccountName: "อนุชา เดชา",
    promptpayId: "083-333-4444",
    note: "",
    status: "ACTIVE",
  },
  {
    id: 4,
    ownerCode: "OWN-0004",
    fullName: "คุณวีระ สุขสันต์",
    phone: "084-444-5555",
    email: "weera.s@email.com",
    lineId: "weera_s",
    address: "78 ถ.รังสิต-นครนายก ต.ประชาธิปัตย์ อ.ธัญบุรี จ.ปทุมธานี 12130",
    bankName: "KTB",
    bankAccountNumber: "456-7-89012",
    bankAccountName: "วีระ สุขสันต์",
    promptpayId: "084-444-5555",
    note: "ติดต่อยากช่วงเย็น",
    status: "ACTIVE",
  },
];

export function roomsByOwner(ownerName: string): Room[] {
  return ROOMS.filter((r) => r.owner === ownerName);
}

export function monthlyIncomeByOwner(ownerName: string): number {
  return roomsByOwner(ownerName).reduce((sum, r) => sum + parseAmount(r.income), 0);
}

export function payoutsByOwner(ownerName: string): PayoutRow[] {
  return PAYOUT_ROWS.filter((r) => r.owner === ownerName);
}

export function pendingPayoutTotal(ownerName: string): number {
  return payoutsByOwner(ownerName)
    .filter((r) => r.status !== "จ่ายแล้ว")
    .reduce((sum, r) => sum + parseAmount(r.net), 0);
}

export function paidPayoutTotal(ownerName: string): number {
  return payoutsByOwner(ownerName)
    .filter((r) => r.status === "จ่ายแล้ว")
    .reduce((sum, r) => sum + parseAmount(r.net), 0);
}

// ---------- PROPERTIES ----------
export type PropertyStatus = "ACTIVE" | "INACTIVE";

export type Property = {
  id: number;
  propertyCode: string;
  propertyName: string;
  propertyType: string;
  address: string;
  province: string;
  district: string;
  subdistrict: string;
  contactName: string;
  contactPhone: string;
  note: string;
  monthlyIncome: number;
  status: PropertyStatus;
};

export const PROPERTY_TYPE_OPTIONS = ["คอนโด", "แฟลต", "บ้านพัก", "อาคารพาณิชย์", "หอพัก", "อื่นๆ"];

// propertyName MUST match ROOMS[].building exactly — roomsByProperty() filters on it.
export const PROPERTIES: Property[] = [
  {
    id: 1,
    propertyCode: "PPT-0001",
    propertyName: "เดอะ เครสท์",
    propertyType: "คอนโด",
    address: "88 ถ.สุขุมวิท",
    province: "กรุงเทพมหานคร",
    district: "วัฒนา",
    subdistrict: "คลองตันเหนือ",
    contactName: "ฝ่ายนิติบุคคล เดอะ เครสท์",
    contactPhone: "02-111-2222",
    note: "",
    monthlyIncome: 468000,
    status: "ACTIVE",
  },
  {
    id: 2,
    propertyCode: "PPT-0002",
    propertyName: "บ้านสวน พัทยา",
    propertyType: "บ้านพัก",
    address: "12 หมู่ 4",
    province: "ชลบุรี",
    district: "บางละมุง",
    subdistrict: "หนองปรือ",
    contactName: "คุณอนุชา เดชา",
    contactPhone: "083-333-4444",
    note: "",
    monthlyIncome: 352000,
    status: "ACTIVE",
  },
  {
    id: 3,
    propertyCode: "PPT-0003",
    propertyName: "แฟลตรุ่งเรือง",
    propertyType: "แฟลต",
    address: "23 ถ.รุ่งเรือง",
    province: "กรุงเทพมหานคร",
    district: "บางกะปิ",
    subdistrict: "คลองจั่น",
    contactName: "คุณวีระ สุขสันต์",
    contactPhone: "084-444-5555",
    note: "",
    monthlyIncome: 246000,
    status: "ACTIVE",
  },
  {
    id: 4,
    propertyCode: "PPT-0004",
    propertyName: "ศุภาลัย เรส",
    propertyType: "คอนโด",
    address: "56 ถ.ศรีนครินทร์",
    province: "กรุงเทพมหานคร",
    district: "สวนหลวง",
    subdistrict: "สวนหลวง",
    contactName: "ฝ่ายนิติบุคคล ศุภาลัย",
    contactPhone: "02-222-3333",
    note: "",
    monthlyIncome: 182000,
    status: "ACTIVE",
  },
];

export function roomsByProperty(propertyName: string): Room[] {
  return ROOMS.filter((r) => r.building === propertyName);
}

// ---------- TENANTS ----------
export type TenantStatus = "ACTIVE" | "INACTIVE";

export type Tenant = {
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
  status: TenantStatus;
};

// fullName MUST match RENTAL_ROWS[].tenant exactly — rentalsByTenant() filters on it.
export const TENANTS: Tenant[] = [
  {
    id: 1,
    tenantCode: "TNT-0001",
    fullName: "คุณกิตติพงษ์ ใจดี",
    phone: "081-234-5678",
    email: "kitti@email.com",
    lineId: "kitti_jaidee",
    idCardOrPassport: "1-2345-67890-12-3",
    nationality: "ไทย",
    address: "A-1105 เดอะ เครสท์",
    note: "",
    blacklist: false,
    status: "ACTIVE",
  },
  {
    id: 2,
    tenantCode: "TNT-0002",
    fullName: "คุณศิริพร มงคล",
    phone: "082-345-6789",
    email: "siriporn@email.com",
    lineId: "siriporn_m",
    idCardOrPassport: "1-3456-78901-23-4",
    nationality: "ไทย",
    address: "A-1204 เดอะ เครสท์",
    note: "",
    blacklist: false,
    status: "ACTIVE",
  },
  {
    id: 3,
    tenantCode: "TNT-0003",
    fullName: "คุณมณีรัตน์ ทองดี",
    phone: "083-456-7890",
    email: "maneerat@email.com",
    lineId: "maneerat_t",
    idCardOrPassport: "1-4567-89012-34-5",
    nationality: "ไทย",
    address: "A-902 เดอะ เครสท์",
    note: "ค้างชำระเดือน ก.ค.",
    blacklist: false,
    status: "ACTIVE",
  },
  {
    id: 4,
    tenantCode: "TNT-0004",
    fullName: "คุณสุดา แสงทอง",
    phone: "084-567-8901",
    email: "suda@email.com",
    lineId: "suda_s",
    idCardOrPassport: "1-5678-90123-45-6",
    nationality: "ไทย",
    address: "C-305 แฟลตรุ่งเรือง",
    note: "ค้างชำระเกิน 15 วัน",
    blacklist: true,
    status: "ACTIVE",
  },
  {
    id: 5,
    tenantCode: "TNT-0005",
    fullName: "คุณธนา รุ่งเรือง",
    phone: "085-678-9012",
    email: "thana@email.com",
    lineId: "thana_r",
    idCardOrPassport: "1-6789-01234-56-7",
    nationality: "ไทย",
    address: "B-802 บ้านสวน พัทยา",
    note: "",
    blacklist: false,
    status: "ACTIVE",
  },
  {
    id: 6,
    tenantCode: "TNT-0006",
    fullName: "คุณสมพงษ์ เจริญสุข",
    phone: "086-789-0123",
    email: "sompong@email.com",
    lineId: "sompong_c",
    idCardOrPassport: "1-7890-12345-67-8",
    nationality: "ไทย",
    address: "B-1105 บ้านสวน พัทยา",
    note: "",
    blacklist: false,
    status: "ACTIVE",
  },
  {
    id: 7,
    tenantCode: "TNT-0007",
    fullName: "คุณกาญจนา ศรีสุข",
    phone: "087-890-1234",
    email: "kanjana@email.com",
    lineId: "kanjana_s",
    idCardOrPassport: "1-8901-23456-78-9",
    nationality: "ไทย",
    address: "C-208 แฟลตรุ่งเรือง",
    note: "",
    blacklist: false,
    status: "ACTIVE",
  },
];

export function rentalsByTenant(tenantName: string): RentalRow[] {
  return RENTAL_ROWS.filter((r) => r.tenant === tenantName);
}

export function latestRentalByTenant(tenantName: string): RentalRow | undefined {
  return rentalsByTenant(tenantName)[0];
}

// ---------- PAYMENT ACCOUNTS ----------
export type AccountType = "รับผู้เช่า" | "จ่ายเจ้าของ" | "ส่วนตัว" | "เงินสด";
export type AccountStatus = "ACTIVE" | "INACTIVE";

export type PaymentAccountRecord = {
  id: number;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  promptpayId: string;
  accountType: AccountType;
  status: AccountStatus;
};

export const ACCOUNT_TYPE_OPTIONS: AccountType[] = ["รับผู้เช่า", "จ่ายเจ้าของ", "ส่วนตัว", "เงินสด"];

export const PAYMENT_ACCOUNTS: PaymentAccountRecord[] = [
  {
    id: 1,
    accountName: "บัญชีรับเงินผู้เช่า",
    bankName: "KBank",
    accountNumber: "123-4-56789",
    accountHolderName: "บจ. คริสตัล เลดเจอร์",
    promptpayId: "088-123-4567",
    accountType: "รับผู้เช่า",
    status: "ACTIVE",
  },
  {
    id: 2,
    accountName: "บัญชีจ่ายเจ้าของ",
    bankName: "KBank",
    accountNumber: "123-4-56789",
    accountHolderName: "บจ. คริสตัล เลดเจอร์",
    promptpayId: "",
    accountType: "จ่ายเจ้าของ",
    status: "ACTIVE",
  },
  {
    id: 3,
    accountName: "PromptPay ธุรกิจ",
    bankName: "",
    accountNumber: "",
    accountHolderName: "บจ. คริสตัล เลดเจอร์",
    promptpayId: "088-123-4567",
    accountType: "รับผู้เช่า",
    status: "ACTIVE",
  },
  {
    id: 4,
    accountName: "เงินสดสำนักงาน",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    promptpayId: "",
    accountType: "เงินสด",
    status: "ACTIVE",
  },
];

// Matches by accountType/promptpayId/bankName rather than accountName — accountName is
// free-text and "เงินสดสำนักงาน" !== "เงินสด", so name-equality would silently mis-bucket it.
export function incomeRowsByChannel(account: PaymentAccountRecord): IncomeRow[] {
  if (account.accountType === "เงินสด") return INCOME_ROWS.filter((r) => r.channel === "เงินสด");
  if (account.promptpayId && !account.bankName) return INCOME_ROWS.filter((r) => r.channel === "PromptPay");
  return INCOME_ROWS.filter((r) => r.channel === "โอนธนาคาร");
}
