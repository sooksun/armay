import { withAuth } from "@/lib/api/handler";
import { addDemoData } from "@/lib/services/admin.service";

export const POST = withAuth(["ADMIN"], async (req, { session }) => {
  let batches = 3;
  try {
    const body = await req.json();
    if (body && typeof body.batches === "number") batches = body.batches;
  } catch {
    /* no body → use default */
  }
  return { counts: await addDemoData(session, batches) };
});
