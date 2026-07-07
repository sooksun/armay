import { withAuth } from "@/lib/api/handler";
import { listAccounts, createAccount } from "@/lib/services/account.service";
import { accountCreateSchema } from "@/lib/validation/account.schema";

export const GET = withAuth("any", async () => listAccounts());

export const POST = withAuth(["ADMIN", "STAFF"], async (req, { session }) => {
  const input = accountCreateSchema.parse(await req.json());
  return { id: await createAccount(input, session) };
});
