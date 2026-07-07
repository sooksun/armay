"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { MiniKpiCard } from "@/components/MiniKpiCard";
import { StepTabs, StepFieldsGrid, StepNavButtons } from "@/components/StepFlow";
import { badge } from "@/lib/theme";
import {
  PAYOUT_STEP_META,
  PAYOUT_CALC_ROWS,
  PAYOUT_FIELDS_BY_STEP,
  type MiniKpi,
} from "@/lib/mock";
import { apiGet } from "@/lib/api-client";
import type { PayoutDTO, PayoutListDTO } from "@/lib/api-types";

const th = (align: "left" | "right" = "left"): React.CSSProperties => ({
  textAlign: align,
  padding: "12px 16px",
  fontWeight: 600,
  color: "rgba(234,242,255,0.6)",
  fontSize: 12,
});

export default function PayoutPage() {
  const [step, setStep] = useState(4);
  const [title, desc] = PAYOUT_STEP_META[step - 1];
  const showCalc = step === 3 || step === 4;
  const fields = PAYOUT_FIELDS_BY_STEP[step] ?? [];
  const [rows, setRows] = useState<PayoutDTO[]>([]);
  const [kpis, setKpis] = useState<MiniKpi[]>([]);
  const [loading, setLoading] = useState(true);

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

      {/* payout step flow */}
      <div
        style={{
          borderRadius: 24,
          background: "rgba(255,255,255,0.055)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.14)",
          boxShadow: "0 22px 54px rgba(0,0,0,0.34)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,rgba(168,85,247,0.3),rgba(56,189,248,0.3))",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#DDD6FE",
            }}
          >
            <Icon name="payout" size={17} />
          </span>
          <div>
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 16 }}>สร้างรายการจ่ายเจ้าของ</div>
            <div style={{ fontSize: 12, color: "rgba(234,242,255,0.5)" }}>
              เจ้าของ: คุณสมชาย วัฒนโสภณ · เดอะ เครสท์ สุขุมวิท
            </div>
          </div>
        </div>

        <StepTabs labels={PAYOUT_STEP_META.map((m) => m[0])} current={step} onSelect={setStep} accent="purple" pad="9px 14px" />

        <div style={{ padding: "14px 22px 26px" }}>
          <div style={{ padding: 22, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12.5, color: "rgba(234,242,255,0.55)", marginBottom: 18 }}>{desc}</div>

            {showCalc ? (
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                {PAYOUT_CALC_ROWS.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "13px 16px",
                      fontSize: 13.5,
                      borderTop: c.top ? "1px solid rgba(255,255,255,0.1)" : undefined,
                      background: c.bold ? "rgba(94,234,212,0.09)" : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <span style={{ color: c.labelColor }}>{c.label}</span>
                    <span style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, color: c.amountColor }}>{c.amount}</span>
                  </div>
                ))}
              </div>
            ) : (
              <StepFieldsGrid fields={fields} />
            )}
          </div>
          <StepNavButtons nextLabel={step === 5 ? "ยืนยันการจ่าย" : "ถัดไป"} />
        </div>
      </div>

      {/* recent payouts */}
      <div
        style={{
          borderRadius: 22,
          overflow: "hidden",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 18px 44px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ padding: "15px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 600, fontSize: 14.5 }}>
          รายการจ่ายเจ้าของล่าสุด
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 820 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
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
                  <td colSpan={6} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(234,242,255,0.5)" }}>
                    กำลังโหลด…
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(234,242,255,0.5)" }}>
                    ยังไม่มีรายการจ่ายเจ้าของ
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr
                  key={r.id ?? i}
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    background: r.badge === "red" ? "rgba(251,113,133,0.06)" : undefined,
                  }}
                >
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{r.owner}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{r.room}</div>
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 600 }}>{r.income}</td>
                  <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", color: "#FDA4AF" }}>{r.deduct}</td>
                  <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 700, color: "#7FF0D9" }}>{r.net}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={badge(r.badge)}>{r.status}</span>
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>
                    <button
                      style={{
                        padding: "6px 12px",
                        borderRadius: 9,
                        border: "1px solid rgba(255,255,255,0.16)",
                        background: "rgba(255,255,255,0.06)",
                        color: "#EAF2FF",
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
