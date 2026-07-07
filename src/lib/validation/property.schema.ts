import { z } from "zod";

const opt = z.string().trim().optional().default("");

export const propertyCreateSchema = z.object({
  propertyName: z.string().trim().min(1, "กรุณากรอกชื่ออาคาร"),
  propertyType: z.enum(["คอนโด", "แฟลต", "บ้านพัก", "ทาวน์เฮาส์", "อาคารพาณิชย์", "หอพัก", "อื่นๆ"]),
  address: opt,
  province: opt,
  district: opt,
  subdistrict: opt,
  latitude: opt,
  longitude: opt,
  contactName: opt,
  contactPhone: opt,
  note: opt,
  imageUrl: z.string().nullable().optional().default(null),
  monthlyIncome: z.number().optional().default(0), // accepted from the form but derived on read
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const propertyUpdateSchema = propertyCreateSchema.partial();

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;
