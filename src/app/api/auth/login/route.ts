import { z } from "zod";
import { publicHandler } from "@/lib/api/handler";
import { ApiError } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signSession, setSessionCookie, type Session } from "@/lib/auth/session";
import { writeAudit } from "@/lib/services/audit.service";

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

export const POST = publicHandler(async (req) => {
  const { email, password } = loginSchema.parse(await req.json());

  const user = await prisma.user.findUnique({ where: { email } });
  const invalid = new ApiError("INVALID_CREDENTIALS", "อีเมลหรือรหัสผ่านไม่ถูกต้อง", 401);
  if (!user || user.status !== "ACTIVE") throw invalid;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw invalid;

  const session: Session = { userId: user.id, email: user.email, fullName: user.fullName, role: user.role };
  await setSessionCookie(await signSession(session));
  await writeAudit({ userId: user.id, action: "LOGIN", tableName: "users", recordId: user.id });

  return { user: session };
});
