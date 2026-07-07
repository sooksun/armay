import { withAuth } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/response";
import { getRentalDetail } from "@/lib/services/rental.service";

function idOf(params: Record<string, string>): number {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) throw new ApiError("BAD_ID", "id ไม่ถูกต้อง", 400);
  return id;
}

export const GET = withAuth("any", async (_req, { params }) => getRentalDetail(idOf(params)));
