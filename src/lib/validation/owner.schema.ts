import { z } from "zod";

const opt = z.string().trim().optional().default("");

export const ownerCreateSchema = z.object({
  fullName: z.string().trim().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  phone: opt,
  email: opt,
  lineId: opt,
  address: opt,
  bankName: opt,
  bankAccountNumber: opt,
  bankAccountName: opt,
  promptpayId: opt,
  note: opt,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const ownerUpdateSchema = ownerCreateSchema.partial();

export type OwnerCreateInput = z.infer<typeof ownerCreateSchema>;
export type OwnerUpdateInput = z.infer<typeof ownerUpdateSchema>;
