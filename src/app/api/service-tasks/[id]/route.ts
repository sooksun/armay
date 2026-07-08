import { withAuth } from "@/lib/api/handler";
import { updateServiceStatus } from "@/lib/services/expense.service";
import { serviceStatusUpdateSchema } from "@/lib/validation/service-task.schema";
import { ApiError } from "@/lib/api/response";

export const PATCH = withAuth(["ADMIN", "STAFF"], async (req, { session, params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) throw new ApiError("BAD_ID", "รหัสงานไม่ถูกต้อง", 400);
  const { serviceStatus } = serviceStatusUpdateSchema.parse(await req.json());
  return { id: await updateServiceStatus(id, serviceStatus, session) };
});
