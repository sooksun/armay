"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ListCard, TableWrap, Th } from "@/components/shared/ListCard";
import { TenantDrawer } from "@/components/tenants/TenantDrawer";
import { TenantFormModal, type TenantDraft } from "@/components/tenants/TenantFormModal";
import { badge } from "@/lib/theme";
import { TENANTS, latestRentalByTenant, type Tenant } from "@/lib/mock";

function nextTenantId(list: Tenant[]): number {
  return list.reduce((max, t) => Math.max(max, t.id), 0) + 1;
}

function nextTenantCode(nextId: number): string {
  return `TNT-${String(nextId).padStart(4, "0")}`;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(TENANTS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const selected = tenants.find((t) => t.id === selectedId) ?? null;
  const editing = tenants.find((t) => t.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(tenant: Tenant) {
    setEditingId(tenant.id);
    setFormOpen(true);
  }

  function handleSubmit(draft: TenantDraft) {
    if (editingId != null) {
      setTenants((list) => list.map((t) => (t.id === editingId ? { ...t, ...draft } : t)));
    } else {
      const id = nextTenantId(tenants);
      setTenants((list) => [...list, { id, tenantCode: nextTenantCode(id), ...draft }]);
    }
    setFormOpen(false);
    setEditingId(null);
  }

  function handleDelete(tenant: Tenant) {
    const latest = latestRentalByTenant(tenant.fullName);
    if (latest && latest.due !== "฿0") {
      alert(`ลบไม่ได้ — ผู้เช่ารายนี้ยังมีสัญญาที่ค้างชำระอยู่ (${latest.code})`);
      return;
    }
    if (!confirm(`ยืนยันลบผู้เช่า "${tenant.fullName}"?`)) return;
    setTenants((list) => list.filter((t) => t.id !== tenant.id));
    setSelectedId(null);
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
            {tenants.map((t) => {
              const latest = latestRentalByTenant(t.fullName);
              return (
                <tr key={t.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(234,242,255,0.7)", whiteSpace: "nowrap" }}>
                    {t.tenantCode}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{t.fullName}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{t.phone}</div>
                  </td>
                  <td style={{ padding: "13px 16px", color: "rgba(234,242,255,0.8)" }}>{latest ? `${latest.room} · ${latest.building}` : "—"}</td>
                  <td style={{ padding: "13px 16px" }}>
                    {latest ? <span style={badge(latest.badge)}>{latest.status}</span> : <span style={{ color: "rgba(234,242,255,0.4)" }}>—</span>}
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
              );
            })}
          </tbody>
        </TableWrap>
      </ListCard>

      <TenantDrawer
        tenant={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(tenant) => {
          setSelectedId(null);
          openEdit(tenant);
        }}
        onDelete={handleDelete}
      />

      <TenantFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
