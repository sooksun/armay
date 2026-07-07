import { z } from "zod";

const METHODS = ["CASH", "BANK_TRANSFER", "PROMPTPAY", "CREDIT_CARD", "OTHER"] as const;

export const payoutCreateSchema = z.object({
  ownerId: z.coerce.number().int().positive(),
  contractId: z.coerce.number().int().positive().nullable().optional(),
  roomId: z.coerce.number().int().positive().nullable().optional(),
  payoutDate: z.string().min(1),
  grossIncomeAmount: z.coerce.number().nonnegative(),
  commissionAmount: z.coerce.number().nonnegative().default(0),
  deductions: z
    .array(
      z.object({
        sourceId: z.coerce.number().int().positive().nullable().optional().default(null),
        label: z.string().min(1),
        amount: z.coerce.number().nonnegative(),
      })
    )
    .default([]),
  paymentMethod: z.enum(METHODS).nullable().optional(),
  ownerBankAccount: z.string().optional().default(""),
  note: z.string().optional().default(""),
});

export type PayoutCreateInput = z.infer<typeof payoutCreateSchema>;
