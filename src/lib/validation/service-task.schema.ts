import { z } from "zod";

export const SERVICE_STATUS_VALUES = ["NEW", "PENDING", "IN_PROGRESS", "DONE", "REVIEW", "CLOSED"] as const;

export const serviceTaskCreateSchema = z.object({
  expenseType: z.enum(["CLEANING", "REPAIR"]),
  title: z.string().min(1, "กรุณาระบุชื่องาน"),
  room: z.string().min(1, "กรุณาเลือกห้อง"),
  payeeName: z.string().default(""),
  amount: z.coerce.number().nonnegative().default(0),
});

export const serviceStatusUpdateSchema = z.object({
  serviceStatus: z.enum(SERVICE_STATUS_VALUES),
});

export type ServiceTaskCreateInput = z.infer<typeof serviceTaskCreateSchema>;
export type ServiceStatusUpdateInput = z.infer<typeof serviceStatusUpdateSchema>;
