import { withAuth } from "@/lib/api/handler";
import { getDashboard } from "@/lib/services/dashboard.service";

export const GET = withAuth("any", async () => getDashboard());
