/* Unit tests for the slip parser (run: npm run test). Pure functions — no DB/server needed. */
import { parseSlipText, refFromQrPayload } from "../src/lib/slip/parse";

let pass = 0;
let fail = 0;
function t(name: string, ok: boolean, detail = "") {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : "  " + detail}`);
}

// ---------- parseSlipText ----------
const textCases: { name: string; text: string; amount?: number; dateBE?: string; refHas?: string }[] = [
  {
    name: "KBank โอนสำเร็จ (ปี พ.ศ. 2 หลัก)",
    text: "โอนเงินสำเร็จ 06 ก.ค. 68 14:23 น. จำนวน: 12,500.00 บาท ค่าธรรมเนียม: 0.00 บาท เลขที่รายการ: 015178KLMN9012345",
    amount: 12500,
    dateBE: "6 ก.ค. 2568",
    refHas: "015178KLMN9012345",
  },
  {
    name: "SCB (วันที่ตัวเลข ค.ศ.)",
    text: "รายการโอนเงินสำเร็จ 06/07/2025 - 09:15 จำนวนเงิน (THB) 1,300.00 รหัสอ้างอิง: 2025070609154321",
    amount: 1300,
    dateBE: "6 ก.ค. 2568",
    refHas: "2025070609154321",
  },
  {
    name: "พร้อมเพย์ (เดือนเต็ม)",
    text: "โอนเงินผ่านพร้อมเพย์ 6 กรกฎาคม 2568 ยอดเงิน 800.00 บาท Ref. AB12CD34EF56",
    amount: 800,
    dateBE: "6 ก.ค. 2568",
    refHas: "AB12CD34EF56",
  },
  {
    name: "PDF อังกฤษ",
    text: "Funds Transfer Receipt Date 06/07/2025 Amount 24,000.00 THB Transaction ID 20250706ABCD001122 Fee 0.00",
    amount: 24000,
    dateBE: "6 ก.ค. 2568",
    refHas: "20250706ABCD001122",
  },
  {
    name: "OCR ไทยจริง (สระหลง + นิคหิต) — capture จาก tesseract",
    text: "06 ก.ุค. 68 14:23 น.\nจํานวน: 1,300.00 บาท",
    amount: 1300,
    dateBE: "6 ก.ค. 2568",
  },
  { name: "OCR จุดหาย (กค)", text: "06 กค 68 จำนวน 1,300.00 บาท", amount: 1300, dateBE: "6 ก.ค. 2568" },
  { name: "OCR เว้นวรรครอบจุด", text: "06 ก . ค . 68 จำนวน : 1,300.00 บาท", amount: 1300, dateBE: "6 ก.ค. 2568" },
  { name: "มี.ค ต้องไม่กลายเป็น ม.ค", text: "15 มี.ค. 68 จำนวน 500.00 บาท", amount: 500, dateBE: "15 มี.ค. 2568" },
  { name: "มิ.ย", text: "1 มิ.ย. 2568 ยอดเงิน 900.00 บาท", amount: 900, dateBE: "1 มิ.ย. 2568" },
  { name: "ม.ค จริง", text: "20 ม.ค. 69 จำนวน 750.00 บาท", amount: 750, dateBE: "20 ม.ค. 2569" },
];

for (const c of textCases) {
  const r = parseSlipText(c.text);
  const ok =
    (c.amount === undefined || r.amount === c.amount) &&
    (c.dateBE === undefined || r.dateBE === c.dateBE) &&
    (c.refHas === undefined || (r.reference ?? "").includes(c.refHas));
  t(c.name, ok, `got ${JSON.stringify(r)}`);
}

// ---------- refFromQrPayload (Thai slip mini-QR TLV) ----------
const ref1 = "015178KLMN9012345";
t("QR TLV ref (มีตัวอักษร)", refFromQrPayload("0031" + "0006000001" + "0117" + ref1 + "5102TH") === ref1);
const ref2 = "00461234567890123456789012";
t("QR TLV ref (26 หลักแบบ KBank)", refFromQrPayload("0040" + "0006000001" + "0126" + ref2 + "5102TH") === ref2);
t("QR ไม่ใช่ TLV -> fallback", refFromQrPayload("hello 015178KLMN9012345 world") === ref1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
