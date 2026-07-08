import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type UserRole = "ADMIN" | "STAFF" | "VIEWER";

export type Session = {
  userId: number;
  email: string;
  fullName: string;
  role: UserRole;
};

const COOKIE = "armay_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secretKey(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      userId: payload.userId as number,
      email: payload.email as string,
      fullName: payload.fullName as string,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

/** Read the current session in a Route Handler / Server Component. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE)?.value);
}

/**
 * Cookie `Secure` flag. Defaults on in production, but overridable via
 * SESSION_COOKIE_SECURE so an HTTP-only LAN deploy (no TLS in front) can still
 * hold the session cookie. Behind an HTTPS reverse proxy, leave it unset/true.
 */
function cookieSecure(): boolean {
  const v = process.env.SESSION_COOKIE_SECURE;
  if (v === "true") return true;
  if (v === "false") return false;
  return process.env.NODE_ENV === "production";
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: cookieSecure(),
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export const SESSION_COOKIE = COOKIE;
