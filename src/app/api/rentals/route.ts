import { withAuth } from "@/lib/api/handler";
import { listRentals } from "@/lib/services/rental.service";

export const GET = withAuth("any", async () => listRentals());
