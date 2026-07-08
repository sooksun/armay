import { z } from "zod";

const INCOME_TYPES = ["RENT", "DEPOSIT", "CLEANING", "WATER", "ELECTRICITY", "PENALTY", "OTHER"] as const;
const METHODS = ["CASH", "BANK_TRANSFER", "PROMPTPAY", "CREDIT_CARD", "OTHER"] as const;

export const incomeCreateSchema = z.object({
  contractId: z.coerce.number().int().positive(),
  incomeDate: z.string().min(1),
  incomeType: z.enum(INCOME_TYPES),
  amount: z.coerce.number().positive("จำนวนเงินต้องมากกว่า 0"),
  paymentMethod: z.enum(METHODS),
  receivingAccountId: z.coerce.number().int().positive().nullable().optional(),
  transactionReference: z.string().optional().default(""),
  proofFileUrl: z.string().nullable().optional(),
});

export const incomeUpdateSchema = incomeCreateSchema;

export type IncomeCreateInput = z.infer<typeof incomeCreateSchema>;
export type IncomeUpdateInput = z.infer<typeof incomeUpdateSchema>;
