import { z } from "zod";

const opt = z.string().trim().optional().default("");

export const tenantCreateSchema = z.object({
  fullName: z.string().trim().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  phone: opt,
  email: opt,
  lineId: opt,
  idCardOrPassport: opt,
  nationality: z.string().trim().optional().default("ไทย"),
  address: opt,
  note: opt,
  blacklist: z.boolean().optional().default(false),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const tenantUpdateSchema = tenantCreateSchema.partial();

export type TenantCreateInput = z.infer<typeof tenantCreateSchema>;
export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>;
