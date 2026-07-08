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

/**
 * Partial patch schema. NOTE: must NOT be `roomCreateSchema.partial()` — in Zod
 * `.partial()` keeps each field's inner `.default()`, so an absent key parses to
 * its default (0 / "AVAILABLE" / "") instead of `undefined`, which would make a
 * lightweight patch (e.g. only `imageUrl`) silently overwrite every other column.
 * Every field here is optional with NO default: an absent key stays undefined and
 * is skipped by the service, leaving the existing value untouched.
 */
export const roomUpdateSchema = z.object({
  propertyId: z.coerce.number().int().positive().optional(),
  ownerId: z.coerce.number().int().positive().optional(),
  roomNumber: z.string().trim().min(1).optional(),
  floor: z.string().trim().optional(),
  roomType: z.string().trim().optional(),
  roomSize: optSize.optional(),
  defaultRentPrice: z.coerce.number().nonnegative().optional(),
  defaultDeposit: z.coerce.number().nonnegative().optional(),
  defaultCleaningFee: z.coerce.number().nonnegative().optional(),
  defaultCommission: z.coerce.number().nonnegative().optional(),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE", "INACTIVE"]).optional(),
  imageUrl: z.string().nullable().optional(),
  note: z.string().trim().optional(),
});

export type RoomCreateInput = z.infer<typeof roomCreateSchema>;
export type RoomUpdateInput = z.infer<typeof roomUpdateSchema>;
