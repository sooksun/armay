"use client";

import { Icon } from "@/components/Icon";
import { MiniKpiCard } from "@/components/MiniKpiCard";
import { ListCard, TableWrap, Th } from "@/components/shared/ListCard";
import { badge, fmtTHB, parseAmount, type BadgeKind } from "@/lib/theme";
import {
  PROPERTIES,
  OWNERS,
  RENTAL_ROWS,
  EXPENSE_ROWS,
  roomsByOwner,
  roomsByProperty,
  pendingPayoutTotal,
  paidPayoutTotal,
  type MiniKpi,
} from "@/lib/mock";

const softBtn: React.CSSProperties = {
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
};

function expenseByBuilding(building: string): number {
  return EXPENSE_ROWS.filter((e) => e.building === building).reduce((s, e) => s + parseAmount(e.amount), 0);
}

const SUMMARY: MiniKpi[] = [
  { label: "รายรับรวมเดือนนี้", icon: "income", color: "#5EEAD4", value: "฿1,248,500" },
  { label: "รายจ่ายรวมเดือนนี้", icon: "expense", color: "#FB7185", value: "฿386,200" },
  { label: "กำไรสุทธิเบื้องต้น", icon: "payout", color: "#38BDF8", value: "฿862,300" },
  { label: "ยอดค้างชำระผู้เช่า", icon: "alert", color: "#FBBF24", value: "฿184,000" },
];

export default function ReportsPage() {
  const overdue = RENTAL_ROWS.filter((r) => r.due !== "฿0");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* filter + export */}
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
        <span style={{ fontSize: 12.5, color: "rgba(234,242,255,0.6)", marginRight: 2 }}>ช่วงรายงาน</span>
        {[
          { label: "เดือน", value: "ก.ค." },
          { label: "ปี", value: "2568" },
          { label: "อาคาร", value: "ทั้งหมด" },
        ].map((f) => (
          <button key={f.label} style={softBtn}>
            {f.label}
            <span style={{ color: "rgba(234,242,255,0.5)" }}>{f.value}</span>
            <span style={{ color: "rgba(234,242,255,0.4)" }}>
              <Icon name="chevDown" size={14} />
            </span>
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 9 }}>
          <button style={{ ...softBtn, fontWeight: 600 }}>
            <Icon name="export" size={15} />
            ส่งออก Excel
          </button>
          <button style={{ ...softBtn, fontWeight: 600 }}>
            <Icon name="export" size={15} />
            ส่งออก PDF
          </button>
        </div>
      </div>

      {/* summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
        {SUMMARY.map((k) => (
          <MiniKpiCard key={k.label} kpi={k} />
        ))}
      </div>

      {/* by building */}
      <ListCard title="รายงานแยกตามอาคาร">
        <TableWrap minWidth={720}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              <Th>อาคาร / โครงการ</Th>
              <Th align="right">ห้อง</Th>
              <Th align="right">รายรับ</Th>
              <Th align="right">รายจ่าย</Th>
              <Th align="right">กำไรเบื้องต้น</Th>
            </tr>
          </thead>
          <tbody>
            {PROPERTIES.map((p) => {
              const exp = expenseByBuilding(p.propertyName);
              const net = p.monthlyIncome - exp;
              return (
                <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "13px 16px", fontWeight: 600 }}>{p.propertyName}</td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>{roomsByProperty(p.propertyName).length}</td>
                  <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", color: "#7FF0D9" }}>{fmtTHB(p.monthlyIncome)}</td>
                  <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", color: "#FDA4AF" }}>{fmtTHB(exp)}</td>
                  <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 700, color: net >= 0 ? "#7FF0D9" : "#FDA4AF" }}>{fmtTHB(net)}</td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </ListCard>

      {/* by owner */}
      <ListCard title="รายงานแยกตามเจ้าของ">
        <TableWrap minWidth={720}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              <Th>เจ้าของ</Th>
              <Th align="right">ห้องในดูแล</Th>
              <Th align="right">จ่ายแล้วสะสม</Th>
              <Th align="right">ยอดค้างจ่าย</Th>
            </tr>
          </thead>
          <tbody>
            {OWNERS.map((o) => {
              const pending = pendingPayoutTotal(o.fullName);
              return (
                <tr key={o.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "13px 16px", fontWeight: 600 }}>{o.fullName}</td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>{roomsByOwner(o.fullName).length} ห้อง</td>
                  <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", color: "#7FF0D9" }}>{fmtTHB(paidPayoutTotal(o.fullName))}</td>
                  <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 600, color: pending > 0 ? "#FDA4AF" : "rgba(234,242,255,0.4)" }}>{fmtTHB(pending)}</td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </ListCard>

      {/* outstanding tenants */}
      <ListCard title={`ยอดค้างชำระผู้เช่า (${overdue.length})`}>
        <TableWrap minWidth={720}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              <Th>ผู้เช่า / ห้อง</Th>
              <Th>รหัสสัญญา</Th>
              <Th align="right">ค้างชำระ</Th>
              <Th>สถานะ</Th>
            </tr>
          </thead>
          <tbody>
            {overdue.map((r) => (
              <tr key={r.code} style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: r.badge === "red" ? "rgba(251,113,133,0.06)" : undefined }}>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ fontWeight: 600 }}>{r.tenant}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>
                    {r.room} · {r.building}
                  </div>
                </td>
                <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(234,242,255,0.7)" }}>{r.code}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 600, color: "#FDA4AF" }}>{r.due}</td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={badge(r.badge as BadgeKind)}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </ListCard>
    </div>
  );
}
