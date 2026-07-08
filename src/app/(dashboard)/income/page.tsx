"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { MiniKpiCard } from "@/components/MiniKpiCard";
import { IncomeDrawer } from "@/components/income/IncomeDrawer";
import { badge } from "@/lib/theme";
import { type MiniKpi } from "@/lib/mock";
import { apiGet } from "@/lib/api-client";
import type { IncomeDTO, IncomeListDTO } from "@/lib/api-types";
import { useUI } from "@/lib/ui-context";

const th = (align: "left" | "right" | "center" = "left"): React.CSSProperties => ({
  textAlign: align,
  padding: "12px 16px",
  fontWeight: 600,
  color: "rgba(var(--text-rgb),0.6)",
  fontSize: 12,
  whiteSpace: "nowrap",
});

const softBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "8px 13px",
  borderRadius: 11,
  border: "1px solid rgba(var(--surface-rgb),0.14)",
  background: "rgba(var(--surface-rgb),0.05)",
  color: "var(--text)",
  fontFamily: "inherit",
  fontSize: 12.5,
  cursor: "pointer",
};

export default function IncomePage() {
  const { openIncome } = useUI();
  const [rows, setRows] = useState<IncomeDTO[]>([]);
  const [kpis, setKpis] = useState<MiniKpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<IncomeListDTO>("/api/incomes");
      setRows(data.rows);
      setKpis([
        { label: "รายรับวันนี้", icon: "income", color: "#5EEAD4", value: data.summary.today },
        { label: "รายรับเดือนนี้", icon: "income", color: "#38BDF8", value: data.summary.month },
        { label: "รอตรวจสอบ", icon: "audit", color: "#FBBF24", value: data.summary.pending },
        { label: "ไม่มีสลิป", icon: "alert", color: "#FB7185", value: data.summary.noSlip },
        { label: "อาจซ้ำ", icon: "alert", color: "#A855F7", value: data.summary.maybeDup },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const onChanged = () => void load();
    window.addEventListener("armay:income-changed", onChanged);
    return () => window.removeEventListener("armay:income-changed", onChanged);
  }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
        {kpis.map((k) => (
          <MiniKpiCard key={k.label} kpi={k} />
        ))}
      </div>

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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
            padding: "15px 18px",
            borderBottom: "1px solid rgba(var(--surface-rgb),0.08)",
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>รายการรับเงิน</div>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
            <button style={softBtn}>
              <Icon name="filter" size={15} />
              กรองข้อมูล
            </button>
            <button style={{ ...softBtn, fontWeight: 600, border: "1px solid rgba(var(--surface-rgb),0.16)" }}>
              <Icon name="export" size={15} />
              Export
            </button>
            <button
              onClick={() => openIncome()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 15px",
                borderRadius: 11,
                border: "1px solid rgba(var(--surface-rgb),0.28)",
                color: "#04121A",
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
                boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
              }}
            >
              <Icon name="plus" size={15} />
              บันทึกรับเงิน
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 920 }}>
            <thead>
              <tr style={{ background: "rgba(var(--surface-rgb),0.04)" }}>
                <th style={th("left")}>วันที่รับเงิน</th>
                <th style={th("left")}>ผู้เช่า / ห้อง</th>
                <th style={th("left")}>ประเภท</th>
                <th style={th("right")}>จำนวนเงิน</th>
                <th style={th("left")}>ช่องทาง</th>
                <th style={th("center")}>สลิป</th>
                <th style={th("left")}>สถานะ</th>
                <th style={{ padding: "12px 16px" }} />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>
                    กำลังโหลด…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>
                    ยังไม่มีรายการรับเงิน
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr
                  key={r.id ?? i}
                  style={{
                    borderTop: "1px solid rgba(var(--surface-rgb),0.06)",
                    background: r.flag ? "rgba(251,113,133,0.06)" : undefined,
                  }}
                >
                  <td style={{ padding: "13px 16px", whiteSpace: "nowrap", color: "rgba(var(--text-rgb),0.85)" }}>{r.date}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{r.tenant}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)" }}>
                      {r.room} · {r.building}
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px", color: "rgba(var(--text-rgb),0.8)" }}>{r.type}</td>
                  <td
                    style={{
                      padding: "13px 16px",
                      textAlign: "right",
                      fontFamily: "Sora,sans-serif",
                      fontWeight: 600,
                      color: "var(--pos)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.amount}
                  </td>
                  <td style={{ padding: "13px 16px", color: "rgba(var(--text-rgb),0.75)", whiteSpace: "nowrap" }}>{r.channel}</td>
                  <td style={{ padding: "13px 16px", textAlign: "center" }}>
                    <span style={{ color: r.slipOk ? "#6EE7B7" : "var(--neg)", display: "inline-flex" }}>
                      <Icon name={r.slipOk ? "income" : "alert"} size={16} />
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={badge(r.badge)}>{r.status}</span>
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedId(r.id)}
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

      <IncomeDrawer
        incomeId={selectedId}
        onClose={() => setSelectedId(null)}
        onEdit={(id) => {
          setSelectedId(null);
          openIncome(id);
        }}
        onChanged={() => void load()}
      />
    </div>
  );
}
