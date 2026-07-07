"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { ListCard, TableWrap, Th } from "@/components/shared/ListCard";
import { OwnerDrawer } from "@/components/owners/OwnerDrawer";
import { OwnerFormModal, type OwnerDraft } from "@/components/owners/OwnerFormModal";
import { badge, fmtTHB, maskAccountNumber } from "@/lib/theme";
import { apiGet, apiSend } from "@/lib/api-client";
import type { OwnerDTO } from "@/lib/api-types";

export default function OwnersPage() {
  const [owners, setOwners] = useState<OwnerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setOwners(await apiGet<OwnerDTO[]>("/api/owners"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = owners.find((o) => o.id === selectedId) ?? null;
  const editing = owners.find((o) => o.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }
  function openEdit(o: OwnerDTO) {
    setEditingId(o.id);
    setFormOpen(true);
  }

  async function handleSubmit(draft: OwnerDraft) {
    try {
      if (editingId != null) await apiSend(`/api/owners/${editingId}`, "PATCH", draft);
      else await apiSend("/api/owners", "POST", draft);
      setFormOpen(false);
      setEditingId(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  }

  async function handleDelete(o: OwnerDTO) {
    if (!confirm(`ยืนยันลบเจ้าของ "${o.fullName}"?`)) return;
    try {
      await apiSend(`/api/owners/${o.id}`, "DELETE");
      setSelectedId(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <ListCard
        title="เจ้าของทรัพย์สินทั้งหมด"
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
            เพิ่มเจ้าของ
          </button>
        }
      >
        <TableWrap minWidth={860}>
          <thead>
            <tr style={{ background: "rgba(var(--surface-rgb),0.04)" }}>
              <Th>รหัส</Th>
              <Th>ชื่อ-นามสกุล</Th>
              <Th>บัญชีธนาคาร</Th>
              <Th align="right">ห้องในความดูแล</Th>
              <Th align="right">ยอดที่ต้องจ่าย</Th>
              <Th>สถานะ</Th>
              <th style={{ padding: "12px 16px" }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>
                  กำลังโหลด…
                </td>
              </tr>
            ) : owners.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>
                  ยังไม่มีเจ้าของ
                </td>
              </tr>
            ) : (
              owners.map((o) => (
                <tr key={o.id} style={{ borderTop: "1px solid rgba(var(--surface-rgb),0.06)" }}>
                  <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(var(--text-rgb),0.7)", whiteSpace: "nowrap" }}>
                    {o.ownerCode}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{o.fullName}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)" }}>{o.phone}</div>
                  </td>
                  <td style={{ padding: "13px 16px", color: "rgba(var(--text-rgb),0.8)", whiteSpace: "nowrap" }}>
                    {o.bankName ? `${o.bankName} · ${maskAccountNumber(o.bankAccountNumber)}` : "—"}
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>{o.roomCount} ห้อง</td>
                  <td
                    style={{
                      padding: "13px 16px",
                      textAlign: "right",
                      fontFamily: "Sora,sans-serif",
                      fontWeight: 600,
                      color: o.pendingPayout > 0 ? "var(--neg)" : "rgba(var(--text-rgb),0.4)",
                    }}
                  >
                    {fmtTHB(o.pendingPayout)}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={badge(o.status === "ACTIVE" ? "green" : "gray")}>{o.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}</span>
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedId(o.id)}
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
              ))
            )}
          </tbody>
        </TableWrap>
      </ListCard>

      <OwnerDrawer
        owner={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(o) => {
          setSelectedId(null);
          openEdit(o);
        }}
        onDelete={handleDelete}
      />

      <OwnerFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
