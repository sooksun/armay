import { z } from "zod";

const opt = z.string().trim().optional().default("");

export const accountCreateSchema = z.object({
  accountName: z.string().trim().min(1, "กรุณากรอกชื่อบัญชี"),
  bankName: opt,
  accountNumber: opt,
  accountHolderName: opt,
  promptpayId: opt,
  accountType: z.enum(["รับผู้เช่า", "จ่ายเจ้าของ", "ส่วนตัว", "เงินสด"]),
  qrUrl: z.string().nullable().optional().default(null),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const accountUpdateSchema = accountCreateSchema.partial();

export type AccountCreateInput = z.infer<typeof accountCreateSchema>;
export type AccountUpdateInput = z.infer<typeof accountUpdateSchema>;
