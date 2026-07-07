import { z } from "zod";

export const expenseCreateSchema = z.object({
  date: z.string().min(1),
  room: z.string().min(1, "กรุณาเลือกห้อง"),
  expenseType: z.string().min(1),
  description: z.string().default(""),
  payeeName: z.string().default(""),
  amount: z.coerce.number().nonnegative(),
  responsibility: z.string().min(1),
  status: z.string().min(1),
  beforeUrl: z.string().nullable().default(null),
  afterUrl: z.string().nullable().default(null),
});

export const expenseUpdateSchema = expenseCreateSchema;

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>;
export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>;
