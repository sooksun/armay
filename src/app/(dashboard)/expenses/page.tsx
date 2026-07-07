"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { MiniKpiCard } from "@/components/MiniKpiCard";
import { ListCard, TableWrap, Th } from "@/components/shared/ListCard";
import { ExpenseDrawer } from "@/components/expenses/ExpenseDrawer";
import { ExpenseFormModal, type ExpenseDraft } from "@/components/expenses/ExpenseFormModal";
import { badge, type BadgeKind } from "@/lib/theme";
import { EXPENSE_ROWS, EXPENSE_KPIS, ROOMS, type ExpenseRow } from "@/lib/mock";

const STATUS_BADGE: Record<string, BadgeKind> = {
  "รอจ่าย": "gold",
  "จ่ายแล้ว": "green",
  "รอตรวจสอบ": "gold",
  "มีปัญหา": "red",
};

function nextExpenseId(list: ExpenseRow[]): number {
  return list.reduce((max, e) => Math.max(max, e.id), 0) + 1;
}

export default function ExpensesPage() {
  const [rows, setRows] = useState<ExpenseRow[]>(EXPENSE_ROWS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const editing = rows.find((r) => r.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }
  function openEdit(e: ExpenseRow) {
    setEditingId(e.id);
    setFormOpen(true);
  }

  function toRow(draft: ExpenseDraft, id: number, code: string): ExpenseRow {
    const building = ROOMS.find((r) => r.no === draft.room)?.building ?? "";
    const amountNum = parseInt(draft.amount || "0", 10) || 0;
    return {
      id,
      expenseCode: code,
      date: draft.date,
      room: draft.room,
      building,
      expenseType: draft.expenseType,
      description: draft.description,
      payeeName: draft.payeeName,
      amount: "฿" + amountNum.toLocaleString(),
      responsibility: draft.responsibility,
      status: draft.status,
      badge: STATUS_BADGE[draft.status] ?? "gold",
      beforeUrl: draft.beforeUrl,
      afterUrl: draft.afterUrl,
    };
  }

  function handleSubmit(draft: ExpenseDraft) {
    if (editingId != null) {
      setRows((list) => list.map((r) => (r.id === editingId ? toRow(draft, r.id, r.expenseCode) : r)));
    } else {
      const id = nextExpenseId(rows);
      setRows((list) => [toRow(draft, id, `EXP-2568-${String(id).padStart(4, "0")}`), ...list]);
    }
    setFormOpen(false);
    setEditingId(null);
  }

  function handleDelete(e: ExpenseRow) {
    if (!confirm(`ยืนยันลบรายการค่าใช้จ่าย "${e.description || e.expenseType}"?`)) return;
    setRows((list) => list.filter((r) => r.id !== e.id));
    setSelectedId(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
        {EXPENSE_KPIS.map((k) => (
          <MiniKpiCard key={k.label} kpi={k} />
        ))}
      </div>

      <ListCard
        title="รายการค่าใช้จ่ายห้อง"
        actions={
          <button
            onClick={openCreate}
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
              background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
              boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
            }}
          >
            <Icon name="plus" size={15} />
            บันทึกค่าใช้จ่าย
          </button>
        }
      >
        <TableWrap minWidth={980}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              <Th>วันที่</Th>
              <Th>ห้อง</Th>
              <Th>ประเภท / รายละเอียด</Th>
              <Th>ผู้รับเงิน</Th>
              <Th align="right">จำนวนเงิน</Th>
              <Th>ผู้รับผิดชอบ</Th>
              <Th>สถานะ</Th>
              <th style={{ padding: "12px 16px" }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  background: r.badge === "red" ? "rgba(251,113,133,0.06)" : undefined,
                }}
              >
                <td style={{ padding: "13px 16px", whiteSpace: "nowrap", color: "rgba(234,242,255,0.85)" }}>{r.date}</td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ fontWeight: 600 }}>{r.room}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{r.building}</div>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ color: "rgba(234,242,255,0.85)" }}>{r.description}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{r.expenseType}</div>
                </td>
                <td style={{ padding: "13px 16px", color: "rgba(234,242,255,0.8)" }}>{r.payeeName}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 600, color: "#FDA4AF", whiteSpace: "nowrap" }}>
                  {r.amount}
                </td>
                <td style={{ padding: "13px 16px", color: "rgba(234,242,255,0.75)", whiteSpace: "nowrap" }}>{r.responsibility}</td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={badge(r.badge)}>{r.status}</span>
                </td>
                <td style={{ padding: "13px 16px", textAlign: "right" }}>
                  <button
                    onClick={() => setSelectedId(r.id)}
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
        </TableWrap>
      </ListCard>

      <ExpenseDrawer
        expense={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(e) => {
          setSelectedId(null);
          openEdit(e);
        }}
        onDelete={handleDelete}
      />

      <ExpenseFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
