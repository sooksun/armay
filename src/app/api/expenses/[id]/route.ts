import { withAuth } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/response";
import { updateExpense, deleteExpense } from "@/lib/services/expense.service";
import { expenseUpdateSchema } from "@/lib/validation/expense.schema";

function idOf(params: Record<string, string>): number {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) throw new ApiError("BAD_ID", "id ไม่ถูกต้อง", 400);
  return id;
}

export const PATCH = withAuth(["ADMIN", "STAFF"], async (req, { session, params }) => {
  const input = expenseUpdateSchema.parse(await req.json());
  return { id: await updateExpense(idOf(params), input, session) };
});

export const DELETE = withAuth(["ADMIN"], async (_req, { session, params }) => {
  await deleteExpense(idOf(params), session);
  return { ok: true };
});
