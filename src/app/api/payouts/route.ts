import { withAuth } from "@/lib/api/handler";
import { listPayouts } from "@/lib/services/payout.service";

export const GET = withAuth("any", async () => listPayouts());
