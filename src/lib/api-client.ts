/** Thin client for the API envelope { ok, data } | { ok, error }. Throws on !ok. */

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error?.message ?? "โหลดข้อมูลไม่สำเร็จ");
  return json.data as T;
}

export async function apiSend<T = unknown>(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error?.message ?? "ดำเนินการไม่สำเร็จ");
  return json.data as T;
}
