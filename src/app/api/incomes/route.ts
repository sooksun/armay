import { withAuth } from "@/lib/api/handler";
import { listIncomes } from "@/lib/services/income.service";

export const GET = withAuth("any", async () => listIncomes());
