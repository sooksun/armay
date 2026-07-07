import { z } from "zod";

export const userCreateSchema = z.object({
  fullName: z.string().trim().min(1, "กรุณากรอกชื่อ-นามสกุล"),
  email: z.string().trim().email("อีเมลไม่ถูกต้อง"),
  role: z.enum(["ADMIN", "STAFF", "VIEWER"]).default("STAFF"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  password: z.string().min(6).optional(),
});

export const userUpdateSchema = userCreateSchema.partial();

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
