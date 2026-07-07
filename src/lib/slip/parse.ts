import { TH_MONTHS } from "@/lib/date";

/** Fields extractable from a Thai bank transfer slip (image OCR / PDF text / QR). */
export type SlipData = {
  amount?: number;
  dateBE?: string; // "6 ก.ค. 2568"
  reference?: string;
};

const TH_MONTH_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
// longer patterns first so "มี.ค" doesn't half-match as "ค"
const TH_MONTH_ABBR = ["มี.ค", "เม.ย", "มิ.ย", "ม.ค", "ก.พ", "พ.ค", "ก.ค", "ส.ค", "ก.ย", "ต.ค", "พ.ย", "ธ.ค"];
const ABBR_TO_INDEX: Record<string, number> = {
  "ม.ค": 0, "ก.พ": 1, "มี.ค": 2, "เม.ย": 3, "พ.ค": 4, "มิ.ย": 5,
  "ก.ค": 6, "ส.ค": 7, "ก.ย": 8, "ต.ค": 9, "พ.ย": 10, "ธ.ค": 11,
};

/** Normalize any year (2-digit BE, 4-digit BE, 4-digit CE) to a 4-digit BE year. */
function toBE(yearRaw: number): number {
  if (yearRaw < 100) return yearRaw + 2500; // "68" -> 2568
  if (yearRaw >= 2400) return yearRaw; // already BE
  return yearRaw + 543; // CE -> BE
}

function fmtBE(day: number, monthIdx: number, beYear: number): string | undefined {
  if (day < 1 || day > 31 || monthIdx < 0 || monthIdx > 11) return undefined;
  return `${day} ${TH_MONTHS[monthIdx]} ${beYear}`;
}

function parseAmountFrom(text: string): number | undefined {
  // labeled amount first: "จำนวน: 1,300.00 บาท" / "Amount 12,500.00"
  // (จํานวน = OCR nikhahit form of จำนวน)
  const labeled = text.match(
    /(?:จำนวนเงิน|จํานวนเงิน|จำนวน|จํานวน|ยอดเงิน|ยอดโอน|amount)\s*(?:\(THB\)|\(บาท\))?\s*:?\s*(?:฿|THB)?\s*([\d,]+(?:\.\d{1,2})?)/i
  );
  if (labeled) {
    const n = parseFloat(labeled[1].replace(/,/g, ""));
    if (!Number.isNaN(n) && n > 0) return n;
  }
  // fallback: the largest x,xxx.xx figure on the slip (fee 0.00 loses)
  const all = [...text.matchAll(/\b\d{1,3}(?:,\d{3})*\.\d{2}\b/g)].map((m) => parseFloat(m[0].replace(/,/g, "")));
  const max = Math.max(0, ...all);
  return max > 0 ? max : undefined;
}

// OCR noise allowed where a "." should be: spaces, dots, stray Thai combining
// marks (e.g. tesseract reads "ก.ค." as "ก.ุค."). NOT stripped globally because
// มี.ค legitimately contains ี.
const DOT_NOISE = "[\\s.\\u0E31\\u0E34-\\u0E3A\\u0E47-\\u0E4E]*";

function parseDateFrom(text: string): string | undefined {
  // Thai abbreviated month, e.g. "06 ก.ค. 68" / "6 ก.ค. 2568".
  // OCR-tolerant: dots dropped/padded/garbled ("กค", "ก . ค", "ก.ุค").
  const abbrAlt = TH_MONTH_ABBR.map((m) => m.replace(/\./g, DOT_NOISE)).join("|");
  const mAbbr = text.match(new RegExp(`(\\d{1,2})\\s*(${abbrAlt})${DOT_NOISE}(\\d{2,4})`));
  if (mAbbr) {
    // resolve month by re-testing patterns longest-first (strip would turn มี into ม)
    for (const abbr of TH_MONTH_ABBR) {
      if (new RegExp(`^${abbr.replace(/\./g, DOT_NOISE)}$`).test(mAbbr[2])) {
        return fmtBE(parseInt(mAbbr[1], 10), ABBR_TO_INDEX[abbr], toBE(parseInt(mAbbr[3], 10)));
      }
    }
  }
  // Thai full month, e.g. "6 กรกฎาคม 2568"
  const mFull = text.match(new RegExp(`(\\d{1,2})\\s*(${TH_MONTH_FULL.join("|")})\\s*(\\d{2,4})`));
  if (mFull) {
    return fmtBE(parseInt(mFull[1], 10), TH_MONTH_FULL.indexOf(mFull[2]), toBE(parseInt(mFull[3], 10)));
  }
  // numeric, e.g. "06/07/2025" or "6-7-68"
  const mNum = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/);
  if (mNum) {
    const day = parseInt(mNum[1], 10);
    const month = parseInt(mNum[2], 10);
    if (month >= 1 && month <= 12) return fmtBE(day, month - 1, toBE(parseInt(mNum[3], 10)));
  }
  return undefined;
}

function parseReferenceFrom(text: string): string | undefined {
  const labeled = text.match(
    /(?:เลขที่รายการ|เลขที่อ้างอิง|เลขอ้างอิง|รหัสอ้างอิง|หมายเลขอ้างอิง|Transaction\s*(?:ID|No)|Ref(?:erence)?\.?\s*(?:No\.?|ID)?)\s*:?\s*([A-Za-z0-9]{8,35})/i
  );
  if (labeled) return labeled[1];
  // fallback: a long digit-bearing alphanumeric run (typical transfer ref)
  const runs = [...text.matchAll(/\b(?=[A-Za-z0-9]*\d)[A-Za-z0-9]{14,35}\b/g)].map((m) => m[0]);
  return runs.sort((a, b) => b.length - a.length)[0];
}

/** Parse free text extracted from a slip (OCR result or PDF text layer). */
export function parseSlipText(raw: string): SlipData {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return {};
  return {
    amount: parseAmountFrom(text),
    dateBE: parseDateFrom(text),
    reference: parseReferenceFrom(text),
  };
}

/**
 * Extract a transaction reference from a Thai slip mini-QR (EMV TLV payload).
 * Walks top-level + one nested TLV level and picks the most reference-looking value.
 */
export function refFromQrPayload(payload: string): string | undefined {
  const values: string[] = [];
  /** Fully parse `s` as TLV; push only leaf values. Returns false when not TLV-shaped. */
  function walk(s: string, depth: number): boolean {
    let i = 0;
    const children: string[] = [];
    while (i + 4 <= s.length) {
      const len = parseInt(s.slice(i + 2, i + 4), 10);
      if (Number.isNaN(len) || i + 4 + len > s.length) return false;
      children.push(s.slice(i + 4, i + 4 + len));
      i += 4 + len;
    }
    if (i !== s.length) return false; // trailing junk -> not TLV
    for (const v of children) {
      if (depth >= 3 || !walk(v, depth + 1)) values.push(v); // leaf only
    }
    return true;
  }
  walk(payload, 1);
  const candidates = values
    .filter((v) => /^[A-Za-z0-9]{10,35}$/.test(v) && /\d/.test(v))
    .sort((a, b) => b.length - a.length);
  if (candidates[0]) return candidates[0];
  // fallback: longest alnum run in the raw payload
  const runs = [...payload.matchAll(/[A-Za-z0-9]{12,35}/g)].map((m) => m[0]);
  return runs.sort((a, b) => b.length - a.length)[0];
}
