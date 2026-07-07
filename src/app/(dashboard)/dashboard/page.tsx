"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { LineChart, DonutChart, BarChart, HBarChart } from "@/components/Charts";
import { iconChip } from "@/lib/theme";
import { DASH_FILTERS, type Kpi } from "@/lib/mock";
import { apiGet } from "@/lib/api-client";
import type { DashboardDTO, UrgentTaskDTO, DashboardChartsDTO } from "@/lib/api-types";

const URGENT_ICON: Record<UrgentTaskDTO["kind"], { icon: IconName; color: string }> = {
  income: { icon: "income", color: "#5EEAD4" },
  expense: { icon: "expense", color: "#FB7185" },
  payout: { icon: "payout", color: "#A855F7" },
  alert: { icon: "alert", color: "#FB7185" },
};

function fmtNum(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

const glowStyle = (c: string): React.CSSProperties => ({
  position: "absolute",
  top: -30,
  right: -30,
  width: 110,
  height: 110,
  borderRadius: "50%",
  background: `radial-gradient(circle,${c}33,transparent 70%)`,
  pointerEvents: "none",
});

function KpiCard({ k }: { k: Kpi }) {
  const prefix = /[,\d]{3,}/.test(k.value) && !k.suffix ? "฿" : "";
  const valueColor = k.color === "#FB7185" ? "#FDA4AF" : k.color === "#38BDF8" ? "#7FF0D9" : "#EAF2FF";
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        padding: 18,
        borderRadius: 22,
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: "1px solid rgba(255,255,255,0.13)",
        boxShadow: "0 18px 44px rgba(0,0,0,0.32),inset 0 1px 0 rgba(255,255,255,0.16)",
      }}
    >
      <div style={glowStyle(k.color)} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={iconChip(k.color)}>
          <Icon name={k.icon} size={18} />
        </div>
        {k.delta ? (
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 20,
              background: k.up ? "rgba(52,211,153,0.16)" : "rgba(251,113,133,0.16)",
              color: k.up ? "#6EE7B7" : "#FDA4AF",
              border: `1px solid ${k.up ? "rgba(52,211,153,0.35)" : "rgba(251,113,133,0.35)"}`,
            }}
          >
            {k.up ? "▲" : "▼"} {k.delta}
          </div>
        ) : null}
      </div>
      <div style={{ fontSize: 12.5, color: "rgba(234,242,255,0.62)", marginTop: 14 }}>{k.label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 3 }}>
        <span style={{ fontSize: 14, color: "rgba(234,242,255,0.55)" }}>{prefix}</span>
        <span style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: 0.3, color: valueColor }}>
          {k.value}
        </span>
        <span style={{ fontSize: 12.5, color: "rgba(234,242,255,0.5)" }}>{k.suffix}</span>
      </div>
      <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.45)", marginTop: 5 }}>{k.hint}</div>
    </div>
  );
}

const chartCard: React.CSSProperties = {
  padding: "20px 22px",
  borderRadius: 22,
  background: "rgba(255,255,255,0.055)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 18px 44px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.14)",
  minWidth: 0,
};

const softBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "8px 14px",
  borderRadius: 11,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.05)",
  color: "#EAF2FF",
  fontFamily: "inherit",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

export default function DashboardPage() {
  const [kpiCards, setKpiCards] = useState<Kpi[]>([]);
  const [urgent, setUrgent] = useState<UrgentTaskDTO[]>([]);
  const [charts, setCharts] = useState<DashboardChartsDTO | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<DashboardDTO>("/api/dashboard");
      const k = data.kpis;
      setKpiCards([
        { label: "รายรับเดือนนี้", icon: "income", color: "#5EEAD4", value: fmtNum(k.incomeMonth), suffix: "", delta: "", up: true, hint: "เดือนปัจจุบัน" },
        { label: "รายจ่ายเดือนนี้", icon: "expense", color: "#FB7185", value: fmtNum(k.expenseMonth), suffix: "", delta: "", up: false, hint: "เดือนปัจจุบัน" },
        { label: "ยอดสุทธิเบื้องต้น", icon: "payout", color: "#38BDF8", value: fmtNum(k.netMonth), suffix: "", delta: "", up: k.netMonth >= 0, hint: "รายรับ − รายจ่าย" },
        { label: "รอจ่ายเจ้าของ", icon: "owners", color: "#A855F7", value: fmtNum(k.pendingPayout), suffix: "", delta: "", up: true, hint: `รอตรวจ ${k.unverifiedCount} · เกินกำหนด ${k.overdueCount}` },
      ]);
      setUrgent(data.urgent);
      setCharts(data.charts);
    } catch (e) {
      console.error(e);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* filter bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          padding: "14px 16px",
          borderRadius: 18,
          background: "rgba(255,255,255,0.055)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
        }}
      >
        <span style={{ fontSize: 12.5, color: "rgba(234,242,255,0.6)", marginRight: 2 }}>ตัวกรอง</span>
        {DASH_FILTERS.map((f) => (
          <button
            key={f.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 13px",
              borderRadius: 11,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.05)",
              color: "#EAF2FF",
              fontFamily: "inherit",
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            {f.label}
            <span style={{ color: "rgba(234,242,255,0.5)" }}>{f.value}</span>
            <span style={{ color: "rgba(234,242,255,0.4)" }}>
              <Icon name="chevDown" size={14} />
            </span>
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 9 }}>
          <button style={softBtn}>
            <Icon name="export" size={15} />
            ส่งออก Excel
          </button>
          <button style={softBtn}>
            <Icon name="refresh" size={15} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(232px,1fr))", gap: 16 }}>
        {kpiCards.map((k) => (
          <KpiCard key={k.label} k={k} />
        ))}
      </div>

      {/* charts row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1.65fr 1fr", gap: 16 }}>
        <div style={chartCard}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15.5 }}>รายรับ–รายจ่ายรายเดือน</div>
              <div style={{ fontSize: 12, color: "rgba(234,242,255,0.5)", marginTop: 2 }}>12 เดือนล่าสุด · หน่วยบาท</div>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: "#38BDF8" }} />
                รายรับ
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: "#FB7185" }} />
                รายจ่าย
              </span>
            </div>
          </div>
          <LineChart months={charts?.line.months} inc={charts?.line.inc} exp={charts?.line.exp} />
        </div>
        <div style={chartCard}>
          <div style={{ fontWeight: 600, fontSize: 15.5 }}>สัดส่วนรายจ่าย</div>
          <div style={{ fontSize: 12, color: "rgba(234,242,255,0.5)", marginTop: 2, marginBottom: 6 }}>
            รายจ่ายสะสมตามประเภท
          </div>
          <DonutChart data={charts?.donut} />
        </div>
      </div>

      {/* charts row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={chartCard}>
          <div style={{ fontWeight: 600, fontSize: 15.5 }}>รายรับแยกตามอาคาร</div>
          <div style={{ fontSize: 12, color: "rgba(234,242,255,0.5)", marginTop: 2, marginBottom: 10 }}>
            รายรับสะสม · หน่วยบาท
          </div>
          <BarChart data={charts?.bar} />
        </div>
        <div style={chartCard}>
          <div style={{ fontWeight: 600, fontSize: 15.5 }}>ห้องที่ทำรายรับสูงสุด</div>
          <div style={{ fontSize: 12, color: "rgba(234,242,255,0.5)", marginTop: 2, marginBottom: 12 }}>
            Top 5 · รายรับสะสม
          </div>
          <HBarChart data={charts?.hbar} />
        </div>
      </div>

      {/* urgent tasks */}
      <div style={chartCard}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14 }}>
          <span style={{ color: "#FDA4AF" }}>
            <Icon name="alert" size={16} />
          </span>
          <div style={{ fontWeight: 600, fontSize: 15.5 }}>รายการที่ต้องรีบตรวจสอบ</div>
          <span
            style={{
              fontSize: 11.5,
              fontWeight: 700,
              padding: "2px 9px",
              borderRadius: 20,
              background: "rgba(251,113,133,0.2)",
              color: "#FDA4AF",
              border: "1px solid rgba(251,113,133,0.4)",
            }}
          >
            {urgent.length} รายการ
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {urgent.length === 0 && (
            <div style={{ padding: "13px 15px", fontSize: 13, color: "rgba(234,242,255,0.5)" }}>ไม่มีรายการเร่งด่วน</div>
          )}
          {urgent.map((t, idx) => {
            const meta = URGENT_ICON[t.kind];
            const amountColor =
              t.amount.indexOf("−") === 0 ? "#FDA4AF" : t.amount === "—" ? "rgba(234,242,255,0.4)" : "#EAF2FF";
            return (
              <div
                key={`${t.title}-${idx}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "13px 15px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderLeft: `3px solid ${meta.color}`,
                }}
              >
                <div style={iconChip(meta.color, 30)}>
                  <Icon name={meta.icon} size={15} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: "rgba(234,242,255,0.52)", marginTop: 1 }}>{t.sub}</div>
                </div>
                <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 14, color: amountColor }}>
                  {t.amount}
                </div>
                <button
                  style={{
                    padding: "7px 13px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.16)",
                    background: "rgba(255,255,255,0.06)",
                    color: "#EAF2FF",
                    fontFamily: "inherit",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  ตรวจสอบ
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
