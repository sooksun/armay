import { withAuth } from "@/lib/api/handler";
import { listIncomes, createIncome } from "@/lib/services/income.service";
import { incomeCreateSchema } from "@/lib/validation/income.schema";

export const GET = withAuth("any", async () => listIncomes());

export const POST = withAuth(["ADMIN", "STAFF"], async (req, { session }) => {
  const input = incomeCreateSchema.parse(await req.json());
  return { id: await createIncome(input, session) };
});
