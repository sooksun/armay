import { withAuth } from "@/lib/api/handler";
import { addDemoData } from "@/lib/services/admin.service";

export const POST = withAuth(["ADMIN"], async (_req, { session }) => ({
  counts: await addDemoData(session),
}));
