import { Prisma } from "@prisma/client";

/** Convert a Prisma.Decimal (or number/string) to a JS number for JSON/display. */
export function decToNumber(d: Prisma.Decimal | number | string | null | undefined): number {
  if (d === null || d === undefined) return 0;
  if (typeof d === "number") return d;
  return Number(d.toString());
}

export function fmtTHB(n: number): string {
  return "฿" + n.toLocaleString("en-US");
}
