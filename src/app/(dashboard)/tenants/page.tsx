"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { ListCard, TableWrap, Th } from "@/components/shared/ListCard";
import { TenantDrawer } from "@/components/tenants/TenantDrawer";
import { TenantFormModal, type TenantDraft } from "@/components/tenants/TenantFormModal";
import { badge } from "@/lib/theme";
import { apiGet, apiSend } from "@/lib/api-client";
import type { TenantDTO } from "@/lib/api-types";

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setTenants(await apiGet<TenantDTO[]>("/api/tenants"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const selected = tenants.find((t) => t.id === selectedId) ?? null;
  const editing = tenants.find((t) => t.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }
  function openEdit(t: TenantDTO) {
    setEditingId(t.id);
    setFormOpen(true);
  }
  async function handleSubmit(draft: TenantDraft) {
    try {
      if (editingId != null) await apiSend(`/api/tenants/${editingId}`, "PATCH", draft);
      else await apiSend("/api/tenants", "POST", draft);
      setFormOpen(false);
      setEditingId(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  }
  async function handleDelete(t: TenantDTO) {
    if (!confirm(`ยืนยันลบผู้เช่า "${t.fullName}"?`)) return;
    try {
      await apiSend(`/api/tenants/${t.id}`, "DELETE");
      setSelectedId(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <ListCard
        title="ผู้เช่าทั้งหมด"
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
            เพิ่มผู้เช่า
          </button>
        }
      >
        <TableWrap minWidth={860}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              <Th>รหัส</Th>
              <Th>ชื่อ-นามสกุล</Th>
              <Th>ห้อง/สัญญาปัจจุบัน</Th>
              <Th>สถานะชำระ</Th>
              <Th>Blacklist</Th>
              <th style={{ padding: "12px 16px" }} />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(234,242,255,0.5)" }}>
                  กำลังโหลด…
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(234,242,255,0.7)", whiteSpace: "nowrap" }}>
                    {t.tenantCode}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{t.fullName}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{t.phone}</div>
                  </td>
                  <td style={{ padding: "13px 16px", color: "rgba(234,242,255,0.8)" }}>{t.latest ? `${t.latest.room} · ${t.latest.building}` : "—"}</td>
                  <td style={{ padding: "13px 16px" }}>
                    {t.latest ? <span style={badge(t.latest.badge)}>{t.latest.status}</span> : <span style={{ color: "rgba(234,242,255,0.4)" }}>—</span>}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {t.blacklist ? <span style={badge("red")}>Blacklist</span> : <span style={{ color: "rgba(234,242,255,0.4)" }}>—</span>}
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedId(t.id)}
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
              ))
            )}
          </tbody>
        </TableWrap>
      </ListCard>

      <TenantDrawer
        tenant={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(t) => {
          setSelectedId(null);
          openEdit(t);
        }}
        onDelete={handleDelete}
      />

      <TenantFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
