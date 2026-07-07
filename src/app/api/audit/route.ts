import { withAuth } from "@/lib/api/handler";
import { listAuditLogs } from "@/lib/services/audit.service";

export const GET = withAuth(["ADMIN"], async () => listAuditLogs());
