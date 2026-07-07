"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { MiniKpiCard } from "@/components/MiniKpiCard";
import { ListCard, TableWrap, Th } from "@/components/shared/ListCard";
import { badge, fmtTHB, parseAmount, type BadgeKind } from "@/lib/theme";
import { type MiniKpi } from "@/lib/mock";
import { apiGet } from "@/lib/api-client";
import type { ReportsDTO, OwnerDTO, RentalDTO } from "@/lib/api-types";

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

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportsDTO | null>(null);
  const [owners, setOwners] = useState<OwnerDTO[]>([]);
  const [rentals, setRentals] = useState<RentalDTO[]>([]);

  const load = useCallback(async () => {
    try {
      const [rep, own, rent] = await Promise.all([
        apiGet<ReportsDTO>("/api/reports"),
        apiGet<OwnerDTO[]>("/api/owners"),
        apiGet<RentalDTO[]>("/api/rentals"),
      ]);
      setReports(rep);
      setOwners(own);
      setRentals(rent);
    } catch (e) {
      console.error(e);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const overdue = rentals.filter((r) => parseAmount(r.due) > 0);
  const outstandingTotal = overdue.reduce((s, r) => s + parseAmount(r.due), 0);

  const summary: MiniKpi[] = [
    { label: "รายรับรวมสะสม", icon: "income", color: "#5EEAD4", value: reports?.totalIncome ?? "—" },
    { label: "รายจ่ายรวมสะสม", icon: "expense", color: "#FB7185", value: reports?.totalExpense ?? "—" },
    { label: "กำไรสุทธิเบื้องต้น", icon: "payout", color: "#38BDF8", value: reports?.totalNet ?? "—" },
    { label: "ยอดค้างชำระผู้เช่า", icon: "alert", color: "#FBBF24", value: fmtTHB(outstandingTotal) },
  ];

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
          background: "rgba(var(--surface-rgb),0.055)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(var(--surface-rgb),0.12)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.28)",
        }}
      >
        <span style={{ fontSize: 12.5, color: "rgba(var(--text-rgb),0.6)", marginRight: 2 }}>ช่วงรายงาน</span>
        {[
          { label: "เดือน", value: "ก.ค." },
          { label: "ปี", value: "2568" },
          { label: "อาคาร", value: "ทั้งหมด" },
        ].map((f) => (
          <button key={f.label} style={softBtn}>
            {f.label}
            <span style={{ color: "rgba(var(--text-rgb),0.5)" }}>{f.value}</span>
            <span style={{ color: "rgba(var(--text-rgb),0.4)" }}>
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
        {summary.map((k) => (
          <MiniKpiCard key={k.label} kpi={k} />
        ))}
      </div>

      {/* by property */}
      <ListCard title="รายงานแยกตามอาคาร">
        <TableWrap minWidth={720}>
          <thead>
            <tr style={{ background: "rgba(var(--surface-rgb),0.04)" }}>
              <Th>อาคาร / โครงการ</Th>
              <Th align="right">รายรับ</Th>
              <Th align="right">รายจ่าย</Th>
              <Th align="right">กำไรเบื้องต้น</Th>
            </tr>
          </thead>
          <tbody>
            {(reports?.byProperty ?? []).map((p) => (
              <tr key={p.label} style={{ borderTop: "1px solid rgba(var(--surface-rgb),0.06)" }}>
                <td style={{ padding: "13px 16px", fontWeight: 600 }}>{p.label}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", color: "var(--pos)" }}>{p.income}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", color: "var(--neg)" }}>{p.expense}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 700, color: p.netNeg ? "var(--neg)" : "var(--pos)" }}>{p.net}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </ListCard>

      {/* by month */}
      <ListCard title="รายรับ–รายจ่ายย้อนหลัง 6 เดือน">
        <TableWrap minWidth={720}>
          <thead>
            <tr style={{ background: "rgba(var(--surface-rgb),0.04)" }}>
              <Th>เดือน</Th>
              <Th align="right">รายรับ</Th>
              <Th align="right">รายจ่าย</Th>
              <Th align="right">สุทธิ</Th>
            </tr>
          </thead>
          <tbody>
            {(reports?.byMonth ?? []).map((m) => (
              <tr key={m.label} style={{ borderTop: "1px solid rgba(var(--surface-rgb),0.06)" }}>
                <td style={{ padding: "13px 16px", fontWeight: 600 }}>{m.label}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", color: "var(--pos)" }}>{m.income}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", color: "var(--neg)" }}>{m.expense}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 700, color: m.netNeg ? "var(--neg)" : "var(--pos)" }}>{m.net}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </ListCard>

      {/* by owner */}
      <ListCard title="รายงานแยกตามเจ้าของ">
        <TableWrap minWidth={720}>
          <thead>
            <tr style={{ background: "rgba(var(--surface-rgb),0.04)" }}>
              <Th>เจ้าของ</Th>
              <Th align="right">ห้องในดูแล</Th>
              <Th align="right">จ่ายแล้วสะสม</Th>
              <Th align="right">ยอดค้างจ่าย</Th>
            </tr>
          </thead>
          <tbody>
            {owners.map((o) => (
              <tr key={o.id} style={{ borderTop: "1px solid rgba(var(--surface-rgb),0.06)" }}>
                <td style={{ padding: "13px 16px", fontWeight: 600 }}>{o.fullName}</td>
                <td style={{ padding: "13px 16px", textAlign: "right" }}>{o.roomCount} ห้อง</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", color: "var(--pos)" }}>{fmtTHB(o.paidPayout)}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 600, color: o.pendingPayout > 0 ? "var(--neg)" : "rgba(var(--text-rgb),0.4)" }}>{fmtTHB(o.pendingPayout)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </ListCard>

      {/* outstanding tenants */}
      <ListCard title={`ยอดค้างชำระผู้เช่า (${overdue.length})`}>
        <TableWrap minWidth={720}>
          <thead>
            <tr style={{ background: "rgba(var(--surface-rgb),0.04)" }}>
              <Th>ผู้เช่า / ห้อง</Th>
              <Th>รหัสสัญญา</Th>
              <Th align="right">ค้างชำระ</Th>
              <Th>สถานะ</Th>
            </tr>
          </thead>
          <tbody>
            {overdue.map((r) => (
              <tr key={r.code} style={{ borderTop: "1px solid rgba(var(--surface-rgb),0.06)", background: r.badge === "red" ? "rgba(251,113,133,0.06)" : undefined }}>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ fontWeight: 600 }}>{r.tenant}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)" }}>
                    {r.room} · {r.building}
                  </div>
                </td>
                <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(var(--text-rgb),0.7)" }}>{r.code}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 600, color: "var(--neg)" }}>{r.due}</td>
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
