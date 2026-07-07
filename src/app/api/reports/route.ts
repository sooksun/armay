import { withAuth } from "@/lib/api/handler";
import { getReports } from "@/lib/services/reports.service";

export const GET = withAuth("any", async () => getReports());
