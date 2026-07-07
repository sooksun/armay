import { withAuth } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/response";
import { updateProperty, deleteProperty } from "@/lib/services/property.service";
import { propertyUpdateSchema } from "@/lib/validation/property.schema";

function idOf(params: Record<string, string>): number {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) throw new ApiError("BAD_ID", "id ไม่ถูกต้อง", 400);
  return id;
}

export const PATCH = withAuth(["ADMIN", "STAFF"], async (req, { session, params }) => {
  const input = propertyUpdateSchema.parse(await req.json());
  return { id: await updateProperty(idOf(params), input, session) };
});

export const DELETE = withAuth(["ADMIN"], async (_req, { session, params }) => {
  await deleteProperty(idOf(params), session);
  return { ok: true };
});
