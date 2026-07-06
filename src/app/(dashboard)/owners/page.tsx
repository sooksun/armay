"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ListCard, TableWrap, Th } from "@/components/shared/ListCard";
import { OwnerDrawer } from "@/components/owners/OwnerDrawer";
import { OwnerFormModal, type OwnerDraft } from "@/components/owners/OwnerFormModal";
import { badge, fmtTHB, maskAccountNumber } from "@/lib/theme";
import { OWNERS, roomsByOwner, pendingPayoutTotal, type Owner } from "@/lib/mock";

function nextOwnerId(list: Owner[]): number {
  return list.reduce((max, o) => Math.max(max, o.id), 0) + 1;
}

function nextOwnerCode(nextId: number): string {
  return `OWN-${String(nextId).padStart(4, "0")}`;
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>(OWNERS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const selected = owners.find((o) => o.id === selectedId) ?? null;
  const editing = owners.find((o) => o.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(owner: Owner) {
    setEditingId(owner.id);
    setFormOpen(true);
  }

  function handleSubmit(draft: OwnerDraft) {
    if (editingId != null) {
      setOwners((list) => list.map((o) => (o.id === editingId ? { ...o, ...draft } : o)));
    } else {
      const id = nextOwnerId(owners);
      setOwners((list) => [...list, { id, ownerCode: nextOwnerCode(id), ...draft }]);
    }
    setFormOpen(false);
    setEditingId(null);
  }

  function handleDelete(owner: Owner) {
    const roomCount = roomsByOwner(owner.fullName).length;
    if (roomCount > 0) {
      alert(`ลบไม่ได้ — เจ้าของรายนี้ยังมีห้องในความดูแลอยู่ ${roomCount} ห้อง`);
      return;
    }
    if (!confirm(`ยืนยันลบเจ้าของ "${owner.fullName}"?`)) return;
    setOwners((list) => list.filter((o) => o.id !== owner.id));
    setSelectedId(null);
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
            เพิ่มเจ้าของ
          </button>
        }
      >
        <TableWrap minWidth={860}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
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
            {owners.map((o) => {
              const roomCount = roomsByOwner(o.fullName).length;
              const pending = pendingPayoutTotal(o.fullName);
              return (
                <tr key={o.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(234,242,255,0.7)", whiteSpace: "nowrap" }}>
                    {o.ownerCode}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{o.fullName}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{o.phone}</div>
                  </td>
                  <td style={{ padding: "13px 16px", color: "rgba(234,242,255,0.8)", whiteSpace: "nowrap" }}>
                    {o.bankName} · {maskAccountNumber(o.bankAccountNumber)}
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>{roomCount} ห้อง</td>
                  <td
                    style={{
                      padding: "13px 16px",
                      textAlign: "right",
                      fontFamily: "Sora,sans-serif",
                      fontWeight: 600,
                      color: pending > 0 ? "#FDA4AF" : "rgba(234,242,255,0.4)",
                    }}
                  >
                    {fmtTHB(pending)}
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
              );
            })}
          </tbody>
        </TableWrap>
      </ListCard>

      <OwnerDrawer
        owner={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(owner) => {
          setSelectedId(null);
          openEdit(owner);
        }}
        onDelete={handleDelete}
      />

      <OwnerFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
