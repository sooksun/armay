import { withAuth } from "@/lib/api/handler";
import { listOwners, createOwner } from "@/lib/services/owner.service";
import { ownerCreateSchema } from "@/lib/validation/owner.schema";

export const GET = withAuth("any", async () => listOwners());

export const POST = withAuth(["ADMIN", "STAFF"], async (req, { session }) => {
  const input = ownerCreateSchema.parse(await req.json());
  return { id: await createOwner(input, session) };
});
