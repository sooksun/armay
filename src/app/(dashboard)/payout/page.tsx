"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { MiniKpiCard } from "@/components/MiniKpiCard";
import { PayoutCreateForm } from "@/components/payout/PayoutCreateForm";
import { badge } from "@/lib/theme";
import { type MiniKpi } from "@/lib/mock";
import { apiGet } from "@/lib/api-client";
import type { PayoutDTO, PayoutListDTO } from "@/lib/api-types";

const th = (align: "left" | "right" = "left"): React.CSSProperties => ({
  textAlign: align,
  padding: "12px 16px",
  fontWeight: 600,
  color: "rgba(var(--text-rgb),0.6)",
  fontSize: 12,
});

export default function PayoutPage() {
  const [rows, setRows] = useState<PayoutDTO[]>([]);
  const [kpis, setKpis] = useState<MiniKpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<PayoutListDTO>("/api/payouts");
      setRows(data.rows);
      setKpis([
        { label: "ยอดรอจ่ายเจ้าของ", icon: "payout", color: "#FBBF24", value: data.summary.pending },
        { label: "จ่ายแล้วเดือนนี้", icon: "payout", color: "#5EEAD4", value: data.summary.paidMonth },
        { label: "เจ้าของยังไม่ได้รับ", icon: "owners", color: "#FB7185", value: data.summary.ownersUnpaid },
        { label: "รอตรวจสอบ", icon: "audit", color: "#A855F7", value: data.summary.toReview },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
        {kpis.map((k) => (
          <MiniKpiCard key={k.label} kpi={k} />
        ))}
      </div>

      {/* payout create */}
      <div
        style={{
          borderRadius: 24,
          background: "rgba(var(--surface-rgb),0.055)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(var(--surface-rgb),0.14)",
          boxShadow: "0 22px 54px rgba(0,0,0,0.34)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 22px", borderBottom: createOpen ? "1px solid rgba(var(--surface-rgb),0.08)" : "none" }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,rgba(168,85,247,0.3),rgba(56,189,248,0.3))",
              border: "1px solid rgba(var(--surface-rgb),0.2)",
              color: "#DDD6FE",
            }}
          >
            <Icon name="payout" size={17} />
          </span>
          <div>
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 16 }}>สร้างรายการจ่ายเจ้าของ</div>
            <div style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.5)" }}>เลือกเจ้าของ → คำนวณรายรับ − ค่านายหน้า − ค่าใช้จ่าย = ยอดสุทธิ</div>
          </div>
          <button
            onClick={() => setCreateOpen((v) => !v)}
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 16px",
              borderRadius: 11,
              border: "1px solid rgba(var(--surface-rgb),0.28)",
              color: "#04121A",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              background: "linear-gradient(135deg,#A855F7,#38BDF8)",
              boxShadow: "0 6px 16px rgba(168,85,247,0.4)",
            }}
          >
            <Icon name={createOpen ? "chevDown" : "plus"} size={15} />
            {createOpen ? "ปิดฟอร์ม" : "สร้างรายการจ่าย"}
          </button>
        </div>

        {createOpen && (
          <PayoutCreateForm
            onClose={() => setCreateOpen(false)}
            onCreated={() => {
              setCreateOpen(false);
              void load();
            }}
          />
        )}
      </div>

      {/* recent payouts */}
      <div
        style={{
          borderRadius: 22,
          overflow: "hidden",
          background: "rgba(var(--surface-rgb),0.05)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: "1px solid rgba(var(--surface-rgb),0.12)",
          boxShadow: "0 18px 44px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ padding: "15px 18px", borderBottom: "1px solid rgba(var(--surface-rgb),0.08)", fontWeight: 600, fontSize: 14.5 }}>
          รายการจ่ายเจ้าของล่าสุด
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 820 }}>
            <thead>
              <tr style={{ background: "rgba(var(--surface-rgb),0.04)" }}>
                <th style={th()}>เจ้าของ / ห้อง</th>
                <th style={th("right")}>รายรับรวม</th>
                <th style={th("right")}>รายการหัก</th>
                <th style={th("right")}>ยอดสุทธิ</th>
                <th style={th()}>สถานะ</th>
                <th style={{ padding: "12px 16px" }} />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>
                    กำลังโหลด…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>
                    ยังไม่มีรายการจ่ายเจ้าของ
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr
                  key={r.id ?? i}
                  style={{
                    borderTop: "1px solid rgba(var(--surface-rgb),0.06)",
                    background: r.badge === "red" ? "rgba(251,113,133,0.06)" : undefined,
                  }}
                >
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{r.owner}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)" }}>{r.room}</div>
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 600 }}>{r.income}</td>
                  <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", color: "var(--neg)" }}>{r.deduct}</td>
                  <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 700, color: "var(--pos)" }}>{r.net}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={badge(r.badge)}>{r.status}</span>
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>
                    <button
                      style={{
                        padding: "6px 12px",
                        borderRadius: 9,
                        border: "1px solid rgba(var(--surface-rgb),0.16)",
                        background: "rgba(var(--surface-rgb),0.06)",
                        color: "var(--text)",
                        fontFamily: "inherit",
                        fontSize: 11.5,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      รายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
