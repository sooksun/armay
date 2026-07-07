import { withAuth } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/response";
import { updateUser, deleteUser } from "@/lib/services/user.service";
import { userUpdateSchema } from "@/lib/validation/user.schema";

function idOf(params: Record<string, string>): number {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) throw new ApiError("BAD_ID", "id ไม่ถูกต้อง", 400);
  return id;
}

export const PATCH = withAuth(["ADMIN"], async (req, { session, params }) => {
  const input = userUpdateSchema.parse(await req.json());
  return { id: await updateUser(idOf(params), input, session) };
});

export const DELETE = withAuth(["ADMIN"], async (_req, { session, params }) => {
  await deleteUser(idOf(params), session);
  return { ok: true };
});
