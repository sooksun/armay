import { withAuth } from "@/lib/api/handler";
import { listRooms } from "@/lib/services/room.service";

export const GET = withAuth("any", async () => listRooms());
