import { type NextRequest } from "next/server";
import { ZodError } from "zod";
import { ok, fail, ApiError } from "@/lib/api/response";
import { getSession, type Session, type UserRole } from "@/lib/auth/session";

type Ctx = { session: Session; params: Record<string, string> };

/**
 * Wraps a Route Handler with auth + role check + uniform error → envelope.
 * `roles`: allowed roles, or "any" for any signed-in user.
 * The handler returns plain data (wrapped in `ok`) or throws ApiError / ZodError.
 */
export function withAuth(
  roles: UserRole[] | "any",
  handler: (req: NextRequest, ctx: Ctx) => Promise<unknown>
) {
  return async (req: NextRequest, segment: { params: Promise<Record<string, string>> }) => {
    try {
      const session = await getSession();
      if (!session) return fail("UNAUTHORIZED", "กรุณาเข้าสู่ระบบ", 401);
      if (roles !== "any" && !roles.includes(session.role)) return fail("FORBIDDEN", "ไม่มีสิทธิ์ดำเนินการนี้", 403);

      const params = segment?.params ? await segment.params : {};
      const data = await handler(req, { session, params });
      return ok(data);
    } catch (e) {
      if (e instanceof ApiError) return fail(e.code, e.message, e.status);
      if (e instanceof ZodError) return fail("VALIDATION", "ข้อมูลไม่ถูกต้อง", 400, e.issues);
      console.error("[api]", e);
      return fail("INTERNAL", "เกิดข้อผิดพลาดภายในระบบ", 500);
    }
  };
}

/** Public handler (no auth) — for login. Same error envelope. */
export function publicHandler(handler: (req: NextRequest) => Promise<unknown>) {
  return async (req: NextRequest) => {
    try {
      return ok(await handler(req));
    } catch (e) {
      if (e instanceof ApiError) return fail(e.code, e.message, e.status);
      if (e instanceof ZodError) return fail("VALIDATION", "ข้อมูลไม่ถูกต้อง", 400, e.issues);
      console.error("[api]", e);
      return fail("INTERNAL", "เกิดข้อผิดพลาดภายในระบบ", 500);
    }
  };
}
