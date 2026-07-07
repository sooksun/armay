import { withAuth } from "@/lib/api/handler";
import { listUsers, createUser } from "@/lib/services/user.service";
import { userCreateSchema } from "@/lib/validation/user.schema";

export const GET = withAuth(["ADMIN"], async () => listUsers());

export const POST = withAuth(["ADMIN"], async (req, { session }) => {
  const input = userCreateSchema.parse(await req.json());
  return { id: await createUser(input, session) };
});
