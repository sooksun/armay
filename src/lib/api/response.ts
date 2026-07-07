import { NextResponse } from "next/server";

export type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string; issues?: unknown } };

/** Typed error services can throw; withAuth turns it into a fail envelope. */
export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data } satisfies ApiEnvelope<T>, { status });
}

export function fail(code: string, message: string, status = 400, issues?: unknown) {
  return NextResponse.json({ ok: false, error: { code, message, issues } } satisfies ApiEnvelope<never>, { status });
}
