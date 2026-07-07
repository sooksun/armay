"use client";

import { useEffect, useState } from "react";
import { Drawer, StatBox, InfoRow, InfoSection } from "@/components/shared/Drawer";
import { badge, fmtTHB } from "@/lib/theme";
import type { PropertyDTO } from "@/lib/api-types";

const TABS = ["ภาพรวม", "ห้องทั้งหมด", "สรุปรายรับ-รายจ่าย"];

export function PropertyDrawer({
  property,
  onClose,
  onEdit,
  onDelete,
}: {
  property: PropertyDTO | null;
  onClose: () => void;
  onEdit: (property: PropertyDTO) => void;
  onDelete: (property: PropertyDTO) => void;
}) {
  const [tab, setTab] = useState(0);

  // reset to the first tab whenever a different record opens
  useEffect(() => {
    setTab(0);
  }, [property?.id]);

  if (!property) return null;

  const rooms = property.rooms;
  const occupied = property.occupied;
  const vacant = property.vacant;
  const totalExpense = property.totalExpense;

  return (
    <Drawer
      onClose={onClose}
      eyebrow={property.propertyCode}
      title={property.propertyName}
      badge={
        <span style={{ ...badge(property.status === "ACTIVE" ? "green" : "gray"), marginTop: 8, display: "inline-flex" }}>
          {property.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}
        </span>
      }
      tabs={TABS.map((label, i) => ({ label, active: tab === i, onClick: () => setTab(i) }))}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatBox bg="rgba(56,189,248,0.1)" border="rgba(56,189,248,0.22)" color="#7DD3FC" label="ห้องทั้งหมด" value={`${rooms.length} ห้อง`} />
        <StatBox bg="rgba(52,211,153,0.08)" border="rgba(52,211,153,0.2)" color="#6EE7B7" label="มีผู้เช่า" value={`${occupied} ห้อง`} />
        <StatBox bg="rgba(56,189,248,0.08)" border="rgba(56,189,248,0.2)" color="#7DD3FC" label="ห้องว่าง" value={`${vacant} ห้อง`} />
        <StatBox bg="rgba(94,234,212,0.09)" border="rgba(94,234,212,0.2)" color="var(--pos)" label="รายรับเดือนนี้" value={fmtTHB(property.monthlyIncome)} />
      </div>

      {tab === 0 ? (
        <>
          {property.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- reason: in-memory object URL, not next/image-optimizable
            <img
              src={property.imageUrl}
              alt={property.propertyName}
              style={{ display: "block", width: "100%", height: 150, objectFit: "cover", borderRadius: 14, border: "1px solid rgba(var(--surface-rgb),0.12)" }}
            />
          ) : null}
          <InfoSection title="ข้อมูลอาคาร">
            <InfoRow k="ประเภทอาคาร" v={property.propertyType} />
            <InfoRow k="ที่อยู่" v={property.address} />
            <InfoRow k="จังหวัด" v={property.province} />
            <InfoRow k="อำเภอ/เขต" v={property.district} />
            <InfoRow k="ตำบล/แขวง" v={property.subdistrict} />
            <InfoRow k="ผู้ติดต่อ" v={property.contactName} />
            <InfoRow k="เบอร์โทร" v={property.contactPhone} />
            {property.note ? <InfoRow k="หมายเหตุ" v={property.note} /> : null}
          </InfoSection>
          <InfoSection title="พิกัด / แผนที่">
            {property.latitude && property.longitude ? (
              <>
                <InfoRow k="ละติจูด" v={property.latitude} />
                <InfoRow k="ลองจิจูด" v={property.longitude} />
                <a
                  href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginTop: 12,
                    padding: 11,
                    borderRadius: 12,
                    border: "1px solid rgba(var(--surface-rgb),0.28)",
                    color: "#04121A",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                    background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
                    boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
                  }}
                >
                  เปิดใน Google Maps
                </a>
              </>
            ) : (
              <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.5)" }}>ยังไม่ได้ระบุพิกัด</div>
            )}
          </InfoSection>
        </>
      ) : null}

      {tab === 1 ? (
        <InfoSection title={`ห้องทั้งหมด (${rooms.length})`}>
          {rooms.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.5)" }}>ยังไม่มีห้องในอาคารนี้</div>
          ) : (
            rooms.map((r) => (
              <div
                key={r.no}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 0",
                  borderBottom: "1px solid rgba(var(--surface-rgb),0.06)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.no}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)" }}>{r.building}</div>
                </div>
                <span style={badge(r.badge)}>{r.status}</span>
              </div>
            ))
          )}
        </InfoSection>
      ) : null}

      {tab === 2 ? (
        <InfoSection title="สรุปรายรับ-รายจ่ายของอาคาร">
          <InfoRow k="รายรับรวมเดือนนี้" v={fmtTHB(property.monthlyIncome)} />
          <InfoRow k="ค่าใช้จ่ายรวมเดือนนี้" v={fmtTHB(totalExpense)} />
          <InfoRow k="กำไรเบื้องต้น" v={fmtTHB(property.monthlyIncome - totalExpense)} />
        </InfoSection>
      ) : null}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => onDelete(property)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(251,113,133,0.35)",
            background: "rgba(251,113,133,0.08)",
            color: "var(--neg)",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ลบอาคาร
        </button>
        <button
          onClick={() => onEdit(property)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(var(--surface-rgb),0.28)",
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
