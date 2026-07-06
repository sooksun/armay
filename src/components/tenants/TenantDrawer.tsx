"use client";

import { useState } from "react";
import { Drawer, InfoRow, InfoSection } from "@/components/shared/Drawer";
import { badge } from "@/lib/theme";
import { rentalsByTenant, type Tenant } from "@/lib/mock";

const TABS = ["ภาพรวม", "ประวัติการเช่า", "เอกสารแนบ"];

export function TenantDrawer({
  tenant,
  onClose,
  onEdit,
  onDelete,
}: {
  tenant: Tenant | null;
  onClose: () => void;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
}) {
  const [tab, setTab] = useState(0);

  if (!tenant) return null;

  const rentals = rentalsByTenant(tenant.fullName);

  return (
    <Drawer
      onClose={onClose}
      eyebrow={tenant.tenantCode}
      title={tenant.fullName}
      badge={
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <span style={badge(tenant.status === "ACTIVE" ? "green" : "gray")}>{tenant.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}</span>
          {tenant.blacklist ? <span style={badge("red")}>Blacklist</span> : null}
        </div>
      }
      tabs={TABS.map((label, i) => ({ label, active: tab === i, onClick: () => setTab(i) }))}
    >
      {tab === 0 ? (
        <InfoSection title="ข้อมูลติดต่อ">
          <InfoRow k="เบอร์โทร" v={tenant.phone} />
          <InfoRow k="อีเมล" v={tenant.email} />
          <InfoRow k="LINE ID" v={tenant.lineId} />
          <InfoRow k="เลขบัตรประชาชน/Passport" v={tenant.idCardOrPassport} />
          <InfoRow k="สัญชาติ" v={tenant.nationality} />
          <InfoRow k="ที่อยู่" v={tenant.address} />
          {tenant.note ? <InfoRow k="หมายเหตุ" v={tenant.note} /> : null}
        </InfoSection>
      ) : null}

      {tab === 1 ? (
        <InfoSection title={`ประวัติการเช่า (${rentals.length})`}>
          {rentals.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(234,242,255,0.5)" }}>ยังไม่มีประวัติการเช่า</div>
          ) : (
            rentals.map((r) => (
              <div
                key={r.code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {r.room} · {r.building}
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>
                    {r.code} · {r.period}
                  </div>
                </div>
                <span style={badge(r.badge)}>{r.status}</span>
              </div>
            ))
          )}
        </InfoSection>
      ) : null}

      {tab === 2 ? (
        <InfoSection title="เอกสารแนบ">
          {["สำเนาบัตรประชาชน.jpg", "สัญญาเช่า.pdf"].map((f) => (
            <div
              key={f}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 0",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                fontSize: 13,
              }}
            >
              <span style={{ color: "rgba(234,242,255,0.5)" }}>📎</span>
              {f}
            </div>
          ))}
        </InfoSection>
      ) : null}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => onDelete(tenant)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(251,113,133,0.35)",
            background: "rgba(251,113,133,0.08)",
            color: "#FDA4AF",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ลบผู้เช่า
        </button>
        <button
          onClick={() => onEdit(tenant)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(255,255,255,0.28)",
            color: "#04121A",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
            boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
          }}
        >
          แก้ไขข้อมูล
        </button>
      </div>
    </Drawer>
  );
}
