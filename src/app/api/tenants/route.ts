import { withAuth } from "@/lib/api/handler";
import { listTenants, createTenant } from "@/lib/services/tenant.service";
import { tenantCreateSchema } from "@/lib/validation/tenant.schema";

export const GET = withAuth("any", async () => listTenants());

export const POST = withAuth(["ADMIN", "STAFF"], async (req, { session }) => {
  const input = tenantCreateSchema.parse(await req.json());
  return { id: await createTenant(input, session) };
});
