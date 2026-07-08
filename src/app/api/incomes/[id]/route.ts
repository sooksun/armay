import { withAuth } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/response";
import { getIncomeDetail, updateIncome, deleteIncome } from "@/lib/services/income.service";
import { incomeUpdateSchema } from "@/lib/validation/income.schema";

function idOf(params: Record<string, string>): number {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) throw new ApiError("BAD_ID", "id ไม่ถูกต้อง", 400);
  return id;
}

export const GET = withAuth("any", async (_req, { params }) => getIncomeDetail(idOf(params)));

export const PATCH = withAuth(["ADMIN", "STAFF"], async (req, { session, params }) => {
  const input = incomeUpdateSchema.parse(await req.json());
  return { id: await updateIncome(idOf(params), input, session) };
});

export const DELETE = withAuth(["ADMIN"], async (_req, { session, params }) => {
  await deleteIncome(idOf(params), session);
  return { ok: true };
});
