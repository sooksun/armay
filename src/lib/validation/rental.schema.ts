import { z } from "zod";

const RENTAL_TYPES = ["DAILY", "MONTHLY", "YEARLY"] as const;

export const rentalCreateSchema = z.object({
  tenantId: z.coerce.number().int().positive(),
  roomId: z.coerce.number().int().positive(),
  rentalType: z.enum(RENTAL_TYPES),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  rentAmount: z.coerce.number().nonnegative(),
  depositAmount: z.coerce.number().nonnegative().default(0),
  cleaningFee: z.coerce.number().nonnegative().default(0),
  otherFee: z.coerce.number().nonnegative().default(0),
  discountAmount: z.coerce.number().nonnegative().default(0),
  bookingChannel: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

export type RentalCreateInput = z.infer<typeof rentalCreateSchema>;
