import { withAuth } from "@/lib/api/handler";

export const GET = withAuth("any", async (_req, { session }) => ({ user: session }));
