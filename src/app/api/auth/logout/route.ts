import { withAuth } from "@/lib/api/handler";
import { clearSessionCookie } from "@/lib/auth/session";

export const POST = withAuth("any", async () => {
  await clearSessionCookie();
  return { ok: true };
});
