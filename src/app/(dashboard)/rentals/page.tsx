"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { StepTabs, StepFieldsGrid, StepNavButtons } from "@/components/StepFlow";
import { badge } from "@/lib/theme";
import { RENTAL_STEPS, RENTAL_STEP_DATA } from "@/lib/mock";
import { apiGet } from "@/lib/api-client";
import type { RentalDTO } from "@/lib/api-types";

const th = (align: "left" | "right" = "left"): React.CSSProperties => ({
  textAlign: align,
  padding: "12px 16px",
  fontWeight: 600,
  color: "rgba(234,242,255,0.6)",
  fontSize: 12,
  whiteSpace: "nowrap",
});

export default function RentalsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [step, setStep] = useState(1);
  const active = RENTAL_STEP_DATA[step - 1];
  const [rows, setRows] = useState<RentalDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setRows(await apiGet<RentalDTO[]>("/api/rentals"));
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
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {!createOpen && (
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
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 10,
              padding: "15px 18px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14.5 }}>รายการเช่าทั้งหมด</div>
            <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
              <button
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
                <Icon name="filter" size={15} />
                กรองข้อมูล
              </button>
              <button
                onClick={() => setCreateOpen(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "8px 15px",
                  borderRadius: 11,
                  border: "1px solid rgba(255,255,255,0.28)",
                  color: "#04121A",
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: "linear-gradient(135deg,#A855F7,#38BDF8)",
                  boxShadow: "0 6px 16px rgba(168,85,247,0.4)",
                }}
              >
                <Icon name="plus" size={15} />
                สร้างรายการเช่า
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 980 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                  <th style={th()}>รหัส</th>
                  <th style={th()}>ผู้เช่า / ห้อง</th>
                  <th style={th()}>เจ้าของ</th>
                  <th style={th()}>ช่วงเวลา</th>
                  <th style={th("right")}>ยอดรวม</th>
                  <th style={th("right")}>ค้างชำระ</th>
                  <th style={th()}>สถานะจ่าย</th>
                  <th style={{ padding: "12px 16px" }} />
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(234,242,255,0.5)" }}>
                      กำลังโหลด…
                    </td>
                  </tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(234,242,255,0.5)" }}>
                      ยังไม่มีรายการเช่า
                    </td>
                  </tr>
                )}
                {rows.map((r) => (
                  <tr
                    key={r.code}
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      background: r.badge === "red" ? "rgba(251,113,133,0.06)" : undefined,
                    }}
                  >
                    <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(234,242,255,0.7)", whiteSpace: "nowrap" }}>
                      {r.code}
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{r.tenant}</div>
                      <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>
                        {r.room} · {r.building}
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", color: "rgba(234,242,255,0.8)" }}>{r.owner}</td>
                    <td style={{ padding: "13px 16px", color: "rgba(234,242,255,0.75)", whiteSpace: "nowrap", fontSize: 12 }}>{r.period}</td>
                    <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {r.total}
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        textAlign: "right",
                        fontFamily: "Sora,sans-serif",
                        fontWeight: 600,
                        color: r.due === "฿0" ? "rgba(234,242,255,0.4)" : "#FDA4AF",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {r.due}
                    </td>
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
      )}

      {createOpen && (
        <div
          style={{
            borderRadius: 24,
            background: "rgba(255,255,255,0.055)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.14)",
            boxShadow: "0 22px 54px rgba(0,0,0,0.36)",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 17 }}>สร้างรายการเช่าใหม่</div>
            <button
              onClick={() => setCreateOpen(false)}
              style={{
                marginLeft: "auto",
                padding: "8px 14px",
                borderRadius: 11,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.05)",
                color: "#EAF2FF",
                fontFamily: "inherit",
                fontSize: 12.5,
                cursor: "pointer",
              }}
            >
              ยกเลิก
            </button>
          </div>

          <StepTabs labels={RENTAL_STEPS} current={step} onSelect={setStep} accent="teal" pad="9px 15px" />

          <div style={{ padding: "14px 22px 26px" }}>
            <div style={{ padding: 20, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 4 }}>{active.title}</div>
              <div style={{ fontSize: 12.5, color: "rgba(234,242,255,0.55)", marginBottom: 18 }}>{active.desc}</div>
              <StepFieldsGrid fields={active.fields} />
            </div>
            <StepNavButtons nextLabel={step === 4 ? "บันทึกรายการเช่า" : "ถัดไป"} />
          </div>
        </div>
      )}
    </div>
  );
}
