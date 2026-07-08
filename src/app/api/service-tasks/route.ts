import { withAuth } from "@/lib/api/handler";
import { listServiceBoard, createServiceTask } from "@/lib/services/expense.service";
import { serviceTaskCreateSchema } from "@/lib/validation/service-task.schema";

export const GET = withAuth("any", async () => listServiceBoard());

export const POST = withAuth(["ADMIN", "STAFF"], async (req, { session }) => {
  const input = serviceTaskCreateSchema.parse(await req.json());
  return { id: await createServiceTask(input, session) };
});
