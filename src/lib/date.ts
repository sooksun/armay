const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

/** Gregorian year -> Buddhist Era. */
export function toBEYear(gregorian: number): number {
  return gregorian + 543;
}

/** e.g. 6 ก.ค. 2568 (Buddhist Era, from a UTC date). */
export function formatBEDate(d: Date): string {
  return `${d.getUTCDate()} ${TH_MONTHS[d.getUTCMonth()]} ${toBEYear(d.getUTCFullYear())}`;
}

/** e.g. "6 ก.ค." (day + Thai month, no year). */
export function formatDayMonth(d: Date): string {
  return `${d.getUTCDate()} ${TH_MONTHS[d.getUTCMonth()]}`;
}

/** Parse "6 ก.ค. 2568" (Buddhist Era) into a UTC Date; falls back to now on bad input. */
export function parseThaiBEDate(s: string): Date {
  const m = s.trim().match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const monthIdx = TH_MONTHS.indexOf(m[2]);
    const gYear = parseInt(m[3], 10) - 543;
    if (monthIdx >= 0) return new Date(Date.UTC(gYear, monthIdx, day));
  }
  return new Date();
}

/** Today formatted as a Buddhist-era Thai date, e.g. "7 ก.ค. 2569". */
export function todayBEDate(): string {
  return formatBEDate(new Date());
}

/** UTC [start, end) range for a Buddhist-era "YYYY-MM" period, e.g. "2568-07". */
export function monthRangeUTC(period: string): { start: Date; end: Date } {
  const [beYear, month] = period.split("-").map((x) => parseInt(x, 10));
  const gYear = beYear - 543;
  const start = new Date(Date.UTC(gYear, month - 1, 1));
  const end = new Date(Date.UTC(month === 12 ? gYear + 1 : gYear, month === 12 ? 0 : month, 1));
  return { start, end };
}
