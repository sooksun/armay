import { withAuth } from "@/lib/api/handler";
import { listRooms, createRoom } from "@/lib/services/room.service";
import { roomCreateSchema } from "@/lib/validation/room.schema";

export const GET = withAuth("any", async () => listRooms());

export const POST = withAuth(["ADMIN", "STAFF"], async (req, { session }) => {
  const input = roomCreateSchema.parse(await req.json());
  return { id: await createRoom(input, session) };
});
