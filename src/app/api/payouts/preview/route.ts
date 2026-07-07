import type { NextRequest } from "next/server";
import { withAuth } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/response";
import { previewPayout } from "@/lib/services/payout.service";

export const GET = withAuth(["ADMIN", "STAFF"], async (req: NextRequest) => {
  const sp = req.nextUrl.searchParams;
  const ownerId = parseInt(sp.get("ownerId") ?? "", 10);
  if (Number.isNaN(ownerId)) throw new ApiError("BAD_OWNER", "ต้องระบุ ownerId", 400);
  const contractRaw = sp.get("contractId");
  const contractId = contractRaw ? parseInt(contractRaw, 10) : null;
  return previewPayout(ownerId, Number.isNaN(contractId as number) ? null : contractId);
});
