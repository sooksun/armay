"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { MiniKpiCard } from "@/components/MiniKpiCard";
import { ListCard, TableWrap, Th } from "@/components/shared/ListCard";
import { ExpenseDrawer } from "@/components/expenses/ExpenseDrawer";
import { ExpenseFormModal, type ExpenseDraft } from "@/components/expenses/ExpenseFormModal";
import { badge } from "@/lib/theme";
import { type MiniKpi } from "@/lib/mock";
import { apiGet, apiSend } from "@/lib/api-client";
import type { ExpenseDTO, ExpenseListDTO, RoomDTO } from "@/lib/api-types";

export default function ExpensesPage() {
  const [rows, setRows] = useState<ExpenseDTO[]>([]);
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [kpis, setKpis] = useState<MiniKpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    apiGet<RoomDTO[]>("/api/rooms").then(setRooms).catch(console.error);
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<ExpenseListDTO>("/api/expenses");
      setRows(data.rows);
      setKpis([
        { label: "รายจ่ายเดือนนี้", icon: "expense", color: "#FB7185", value: data.summary.month },
        { label: "ค่าซ่อม/แม่บ้าน", icon: "service", color: "#FBBF24", value: data.summary.repairCleaning },
        { label: "รอตรวจสอบ", icon: "audit", color: "#A855F7", value: data.summary.pendingReview },
        { label: "มีปัญหา", icon: "alert", color: "#FB7185", value: data.summary.problem },
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

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const editing = rows.find((r) => r.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }
  function openEdit(e: ExpenseDTO) {
    setEditingId(e.id);
    setFormOpen(true);
  }

  async function handleSubmit(draft: ExpenseDraft) {
    try {
      if (editingId != null) await apiSend(`/api/expenses/${editingId}`, "PATCH", draft);
      else await apiSend("/api/expenses", "POST", draft);
      setFormOpen(false);
      setEditingId(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  }

  async function handleDelete(e: ExpenseDTO) {
    if (!confirm(`ยืนยันลบรายการค่าใช้จ่าย "${e.description || e.expenseType}"?`)) return;
    try {
      await apiSend(`/api/expenses/${e.id}`, "DELETE");
      setSelectedId(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
        {kpis.map((k) => (
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
            บันทึกค่าใช้จ่าย
          </button>
        }
      >
        <TableWrap minWidth={980}>
          <thead>
            <tr style={{ background: "rgba(var(--surface-rgb),0.04)" }}>
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
                  ยังไม่มีรายการค่าใช้จ่าย
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr
                key={r.id}
                style={{
                  borderTop: "1px solid rgba(var(--surface-rgb),0.06)",
                  background: r.badge === "red" ? "rgba(251,113,133,0.06)" : undefined,
                }}
              >
                <td style={{ padding: "13px 16px", whiteSpace: "nowrap", color: "rgba(var(--text-rgb),0.85)" }}>{r.date}</td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ fontWeight: 600 }}>{r.room}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)" }}>{r.building}</div>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ color: "rgba(var(--text-rgb),0.85)" }}>{r.description}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)" }}>{r.expenseType}</div>
                </td>
                <td style={{ padding: "13px 16px", color: "rgba(var(--text-rgb),0.8)" }}>{r.payeeName}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", fontFamily: "Sora,sans-serif", fontWeight: 600, color: "var(--neg)", whiteSpace: "nowrap" }}>
                  {r.amount}
                </td>
                <td style={{ padding: "13px 16px", color: "rgba(var(--text-rgb),0.75)", whiteSpace: "nowrap" }}>{r.responsibility}</td>
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

      <ExpenseFormModal
        open={formOpen}
        editing={editing}
        rooms={rooms.map((r) => ({ no: r.no, building: r.building }))}
        history={rows}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
