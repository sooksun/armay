import { withAuth } from "@/lib/api/handler";
import { resetData } from "@/lib/services/admin.service";

export const POST = withAuth(["ADMIN"], async (_req, { session }) => ({
  counts: await resetData(session),
}));
