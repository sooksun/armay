import { withAuth } from "@/lib/api/handler";
import { listPayouts, createPayout } from "@/lib/services/payout.service";
import { payoutCreateSchema } from "@/lib/validation/payout.schema";

export const GET = withAuth("any", async () => listPayouts());

export const POST = withAuth(["ADMIN", "STAFF"], async (req, { session }) => {
  const input = payoutCreateSchema.parse(await req.json());
  return { id: await createPayout(input, session) };
});
