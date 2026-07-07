"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ListCard, TableWrap, Th } from "@/components/shared/ListCard";
import { UserFormModal, type UserDraft } from "@/components/users/UserFormModal";
import { badge } from "@/lib/theme";
import { USERS, ROLE_LABEL, ROLE_BADGE, type UserRecord } from "@/lib/mock";

function nextUserId(list: UserRecord[]): number {
  return list.reduce((max, u) => Math.max(max, u.id), 0) + 1;
}

export default function PermissionsPage() {
  const [users, setUsers] = useState<UserRecord[]>(USERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const editing = users.find((u) => u.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }
  function openEdit(u: UserRecord) {
    setEditingId(u.id);
    setFormOpen(true);
  }

  function handleSubmit(draft: UserDraft) {
    if (editingId != null) {
      setUsers((list) => list.map((u) => (u.id === editingId ? { ...u, ...draft } : u)));
    } else {
      const id = nextUserId(users);
      setUsers((list) => [...list, { id, ...draft, lastActive: "เพิ่งเพิ่ม" }]);
    }
    setFormOpen(false);
    setEditingId(null);
  }

  function handleDelete(u: UserRecord) {
    if (u.role === "ADMIN" && users.filter((x) => x.role === "ADMIN").length <= 1) {
      alert("ลบไม่ได้ — ต้องมีผู้ดูแลระบบ (ADMIN) อย่างน้อย 1 คน");
      return;
    }
    if (!confirm(`ยืนยันลบผู้ใช้งาน "${u.fullName}"?`)) return;
    setUsers((list) => list.filter((x) => x.id !== u.id));
  }

  const actionBtn: React.CSSProperties = {
    padding: "6px 12px",
    borderRadius: 9,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    color: "#EAF2FF",
    fontFamily: "inherit",
    fontSize: 11.5,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <ListCard
        title="ผู้ใช้งานและสิทธิ์"
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
            เพิ่มผู้ใช้งาน
          </button>
        }
      >
        <TableWrap minWidth={780}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              <Th>ชื่อ / อีเมล</Th>
              <Th>บทบาท</Th>
              <Th>สถานะ</Th>
              <Th>ใช้งานล่าสุด</Th>
              <th style={{ padding: "12px 16px" }} />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{u.email}</div>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={badge(ROLE_BADGE[u.role])}>{u.role}</span>
                  <span style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)", marginLeft: 8 }}>{ROLE_LABEL[u.role]}</span>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={badge(u.status === "ACTIVE" ? "green" : "gray")}>{u.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}</span>
                </td>
                <td style={{ padding: "13px 16px", color: "rgba(234,242,255,0.7)", whiteSpace: "nowrap" }}>{u.lastActive}</td>
                <td style={{ padding: "13px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                  <button onClick={() => openEdit(u)} style={actionBtn}>
                    แก้ไข
                  </button>
                  <button onClick={() => handleDelete(u)} style={{ ...actionBtn, marginLeft: 8, color: "#FDA4AF", borderColor: "rgba(251,113,133,0.35)" }}>
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </ListCard>

      <UserFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
