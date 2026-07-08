import { z } from "zod";

const opt = z.string().trim().optional().default("");
const money = z.coerce.number().nonnegative().default(0);
const optSize = z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().nonnegative().nullable());

export const roomCreateSchema = z.object({
  propertyId: z.coerce.number().int().positive({ message: "กรุณาเลือกอาคาร/โครงการ" }),
  ownerId: z.coerce.number().int().positive({ message: "กรุณาเลือกเจ้าของ" }),
  roomNumber: z.string().trim().min(1, "กรุณากรอกเลขห้อง"),
  floor: opt,
  roomType: opt,
  roomSize: optSize,
  defaultRentPrice: money,
  defaultDeposit: money,
  defaultCleaningFee: money,
  defaultCommission: money,
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE", "INACTIVE"]).default("AVAILABLE"),
  imageUrl: z.string().nullable().default(null),
  note: opt,
});

export const roomUpdateSchema = roomCreateSchema.partial();

export type RoomCreateInput = z.infer<typeof roomCreateSchema>;
export type RoomUpdateInput = z.infer<typeof roomUpdateSchema>;
