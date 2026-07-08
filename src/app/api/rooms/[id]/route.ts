import { withAuth } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/response";
import { patchRoom, deleteRoom } from "@/lib/services/room.service";
import { roomUpdateSchema } from "@/lib/validation/room.schema";

function idOf(params: Record<string, string>): number {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) throw new ApiError("BAD_ID", "id ไม่ถูกต้อง", 400);
  return id;
}

// Merge-patch: the full edit form sends every key; a lightweight change (e.g. the
// room photo) sends only what it touches. Both go through patchRoom — the update
// schema has no field defaults, so omitted keys leave existing values untouched.
export const PATCH = withAuth(["ADMIN", "STAFF"], async (req, { session, params }) => {
  const input = roomUpdateSchema.parse(await req.json());
  return { id: await patchRoom(idOf(params), input, session) };
});

export const DELETE = withAuth(["ADMIN"], async (_req, { session, params }) => {
  await deleteRoom(idOf(params), session);
  return { ok: true };
});
