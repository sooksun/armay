import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

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
