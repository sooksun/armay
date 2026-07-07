import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { formatBEDate } from "@/lib/date";
import type { BadgeKind } from "@/lib/theme";
import type { AuditLogDTO } from "@/lib/api-types";

type Client = Pick<typeof prisma, "auditLog">;

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "CANCEL" | "ADJUST" | "LOGIN";

export async function writeAudit(
  entry: {
    userId?: number | null;
    action: AuditAction;
    tableName: string;
    recordId?: number | null;
    oldValue?: unknown;
    newValue?: unknown;
    ipAddress?: string | null;
  },
  client: Client = prisma
): Promise<void> {
  await client.auditLog.create({
    data: {
      userId: entry.userId ?? null,
      action: entry.action,
      tableName: entry.tableName,
      recordId: entry.recordId ?? null,
      oldValue: (entry.oldValue as Prisma.InputJsonValue) ?? undefined,
      newValue: (entry.newValue as Prisma.InputJsonValue) ?? undefined,
      ipAddress: entry.ipAddress ?? null,
    },
  });
}

const ACTION_THAI: Record<string, string> = {
  CREATE: "สร้าง",
  UPDATE: "แก้ไข",
  DELETE: "ลบ",
  APPROVE: "อนุมัติ",
  REJECT: "ปฏิเสธ",
  CANCEL: "ยกเลิก",
  ADJUST: "ปรับปรุง",
  LOGIN: "เข้าสู่ระบบ",
};
const ACTION_BADGE: Record<string, BadgeKind> = {
  CREATE: "green",
  UPDATE: "blue",
  DELETE: "red",
  APPROVE: "purple",
  REJECT: "orange",
  CANCEL: "orange",
  ADJUST: "gold",
  LOGIN: "gray",
};
const TABLE_THAI: Record<string, string> = {
  owners: "เจ้าของ",
  properties: "อาคาร",
  rooms: "ห้อง",
  tenants: "ผู้เช่า",
  rental_contracts: "รายการเช่า",
  income_transactions: "รายรับ",
  expense_transactions: "รายจ่าย",
  owner_payouts: "จ่ายเจ้าของ",
  payment_accounts: "บัญชี",
  users: "ผู้ใช้งาน",
};

export async function listAuditLogs(): Promise<AuditLogDTO[]> {
  const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { user: true } });
  return logs.map((l) => {
    const bkk = new Date(l.createdAt.getTime() + 7 * 3600 * 1000);
    const hh = String(bkk.getUTCHours()).padStart(2, "0");
    const mm = String(bkk.getUTCMinutes()).padStart(2, "0");
    const action = ACTION_THAI[l.action] ?? l.action;
    const table = TABLE_THAI[l.tableName] ?? l.tableName;
    return {
      id: l.id,
      time: `${formatBEDate(bkk)} · ${hh}:${mm}`,
      user: l.user?.fullName ?? "ระบบ",
      action,
      badge: ACTION_BADGE[l.action] ?? "gray",
      table,
      record: l.recordId ? `#${l.recordId}` : "—",
      detail: `${action}${table ? " " + table : ""}${l.recordId ? " #" + l.recordId : ""}`,
    };
  });
}
