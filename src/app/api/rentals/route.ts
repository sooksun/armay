import { withAuth } from "@/lib/api/handler";
import { listRentals, createRental } from "@/lib/services/rental.service";
import { rentalCreateSchema } from "@/lib/validation/rental.schema";

export const GET = withAuth("any", async () => listRentals());

export const POST = withAuth(["ADMIN", "STAFF"], async (req, { session }) => {
  const input = rentalCreateSchema.parse(await req.json());
  return { id: await createRental(input, session) };
});
