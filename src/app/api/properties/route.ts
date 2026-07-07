import { withAuth } from "@/lib/api/handler";
import { listProperties, createProperty } from "@/lib/services/property.service";
import { propertyCreateSchema } from "@/lib/validation/property.schema";

export const GET = withAuth("any", async () => listProperties());

export const POST = withAuth(["ADMIN", "STAFF"], async (req, { session }) => {
  const input = propertyCreateSchema.parse(await req.json());
  return { id: await createProperty(input, session) };
});
