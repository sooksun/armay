import { withAuth } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/response";
import { updateAccount, deleteAccount } from "@/lib/services/account.service";
import { accountUpdateSchema } from "@/lib/validation/account.schema";

function idOf(params: Record<string, string>): number {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) throw new ApiError("BAD_ID", "id ไม่ถูกต้อง", 400);
  return id;
}

export const PATCH = withAuth(["ADMIN", "STAFF"], async (req, { session, params }) => {
  const input = accountUpdateSchema.parse(await req.json());
  return { id: await updateAccount(idOf(params), input, session) };
});

export const DELETE = withAuth(["ADMIN"], async (_req, { session, params }) => {
  await deleteAccount(idOf(params), session);
  return { ok: true };
});
