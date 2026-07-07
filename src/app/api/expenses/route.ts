import { withAuth } from "@/lib/api/handler";
import { listExpenses, createExpense } from "@/lib/services/expense.service";
import { expenseCreateSchema } from "@/lib/validation/expense.schema";

export const GET = withAuth("any", async () => listExpenses());

export const POST = withAuth(["ADMIN", "STAFF"], async (req, { session }) => {
  const input = expenseCreateSchema.parse(await req.json());
  return { id: await createExpense(input, session) };
});
