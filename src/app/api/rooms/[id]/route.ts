import { withAuth } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/response";
import { updateRoom, patchRoom, deleteRoom } from "@/lib/services/room.service";
import { roomCreateSchema, roomUpdateSchema } from "@/lib/validation/room.schema";

function idOf(params: Record<string, string>): number {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) throw new ApiError("BAD_ID", "id ไม่ถูกต้อง", 400);
  return id;
}

export const PATCH = withAuth(["ADMIN", "STAFF"], async (req, { session, params }) => {
  const body = await req.json();
  // full form submit carries all required fields; a lightweight patch (e.g. only imageUrl) does not
  const isFull = body && typeof body === "object" && "propertyId" in body && "roomNumber" in body;
  if (isFull) return { id: await updateRoom(idOf(params), roomCreateSchema.parse(body), session) };
  return { id: await patchRoom(idOf(params), roomUpdateSchema.parse(body), session) };
});

export const DELETE = withAuth(["ADMIN"], async (_req, { session, params }) => {
  await deleteRoom(idOf(params), session);
  return { ok: true };
});
