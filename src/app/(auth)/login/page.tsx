"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@armay.local");
  const [password, setPassword] = useState("owner123!");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "เข้าสู่ระบบไม่สำเร็จ");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setLoading(false);
    }
  }

  const field: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(var(--surface-rgb),0.14)",
    background: "rgba(var(--surface-rgb),0.06)",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, color: "var(--text)", background: "var(--bg)" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "32px 30px",
          borderRadius: 26,
          background: "linear-gradient(180deg,rgba(var(--panel2-rgb),0.9),rgba(var(--panel-rgb),0.9))",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(var(--surface-rgb),0.16)",
          boxShadow: "0 30px 70px rgba(0,0,0,0.5),inset 0 1px 0 rgba(var(--surface-rgb),0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "conic-gradient(from 210deg,#5EEAD4,#38BDF8,#A855F7,#5EEAD4)",
              boxShadow: "0 8px 22px rgba(56,189,248,0.45)",
            }}
          >
            <div style={{ width: 16, height: 16, transform: "rotate(45deg)", background: "rgba(7,17,31,0.55)", border: "1.5px solid rgba(var(--surface-rgb),0.8)", borderRadius: 3 }} />
          </div>
          <div>
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 18 }}>Crystal Ledger</div>
            <div style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.55)" }}>ระบบควบคุมรายรับ–รายจ่าย</div>
          </div>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12.5, color: "rgba(var(--text-rgb),0.6)", marginBottom: 6 }}>อีเมล</div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={field} autoComplete="username" />
          </div>
          <div>
            <div style={{ fontSize: 12.5, color: "rgba(var(--text-rgb),0.6)", marginBottom: 6 }}>รหัสผ่าน</div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={field} autoComplete="current-password" />
          </div>

          {error ? (
            <div style={{ padding: "10px 12px", borderRadius: 11, background: "rgba(251,113,133,0.12)", border: "1px solid rgba(251,113,133,0.35)", color: "var(--neg)", fontSize: 12.5 }}>
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "12px",
              borderRadius: 12,
              border: "1px solid rgba(var(--surface-rgb),0.28)",
              color: "#04121A",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
              background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
              boxShadow: "0 8px 20px rgba(56,189,248,0.42)",
            }}
          >
            {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div style={{ marginTop: 16, fontSize: 11.5, color: "rgba(var(--text-rgb),0.45)", textAlign: "center" }}>
          ทดลอง: admin@armay.local / owner123!
        </div>
      </div>
    </div>
  );
}
