"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { ListCard, TableWrap, Th } from "@/components/shared/ListCard";
import { UserFormModal, type UserDraft } from "@/components/users/UserFormModal";
import { badge } from "@/lib/theme";
import { ROLE_LABEL, ROLE_BADGE } from "@/lib/mock";
import { apiGet, apiSend } from "@/lib/api-client";
import type { UserDTO } from "@/lib/api-types";

export default function PermissionsPage() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setUsers(await apiGet<UserDTO[]>("/api/users"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const editing = users.find((u) => u.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }
  function openEdit(u: UserDTO) {
    setEditingId(u.id);
    setFormOpen(true);
  }
  async function handleSubmit(draft: UserDraft) {
    try {
      if (editingId != null) await apiSend(`/api/users/${editingId}`, "PATCH", draft);
      else await apiSend("/api/users", "POST", draft);
      setFormOpen(false);
      setEditingId(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  }
  async function handleDelete(u: UserDTO) {
    if (!confirm(`ยืนยันลบผู้ใช้งาน "${u.fullName}"?`)) return;
    try {
      await apiSend(`/api/users/${u.id}`, "DELETE");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  const actionBtn: React.CSSProperties = {
    padding: "6px 12px",
    borderRadius: 9,
    border: "1px solid rgba(var(--surface-rgb),0.16)",
    background: "rgba(var(--surface-rgb),0.06)",
    color: "var(--text)",
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
            เพิ่มผู้ใช้งาน
          </button>
        }
      >
        <TableWrap minWidth={780}>
          <thead>
            <tr style={{ background: "rgba(var(--surface-rgb),0.04)" }}>
              <Th>ชื่อ / อีเมล</Th>
              <Th>บทบาท</Th>
              <Th>สถานะ</Th>
              <Th>ใช้งานล่าสุด</Th>
              <th style={{ padding: "12px 16px" }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>
                  กำลังโหลด…
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid rgba(var(--surface-rgb),0.06)" }}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)" }}>{u.email}</div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={badge(ROLE_BADGE[u.role])}>{u.role}</span>
                    <span style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)", marginLeft: 8 }}>{ROLE_LABEL[u.role]}</span>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={badge(u.status === "ACTIVE" ? "green" : "gray")}>{u.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}</span>
                  </td>
                  <td style={{ padding: "13px 16px", color: "rgba(var(--text-rgb),0.7)", whiteSpace: "nowrap" }}>{u.lastActive}</td>
                  <td style={{ padding: "13px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => openEdit(u)} style={actionBtn}>
                      แก้ไข
                    </button>
                    <button onClick={() => handleDelete(u)} style={{ ...actionBtn, marginLeft: 8, color: "var(--neg)", borderColor: "rgba(251,113,133,0.35)" }}>
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrap>
      </ListCard>

      <UserFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
