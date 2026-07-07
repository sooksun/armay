"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { badge, fmtTHB } from "@/lib/theme";
import { PropertyDrawer } from "@/components/properties/PropertyDrawer";
import { PropertyFormModal, type PropertyDraft } from "@/components/properties/PropertyFormModal";
import { PROPERTIES, roomsByProperty, type Property } from "@/lib/mock";

function nextPropertyId(list: Property[]): number {
  return list.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

function nextPropertyCode(nextId: number): string {
  return `PPT-${String(nextId).padStart(4, "0")}`;
}

const softBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "8px 13px",
  borderRadius: 11,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.05)",
  color: "#EAF2FF",
  fontFamily: "inherit",
  fontSize: 12.5,
  cursor: "pointer",
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>(PROPERTIES);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const selected = properties.find((p) => p.id === selectedId) ?? null;
  const editing = properties.find((p) => p.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(property: Property) {
    setEditingId(property.id);
    setFormOpen(true);
  }

  function handleSubmit(draft: PropertyDraft) {
    if (editingId != null) {
      setProperties((list) => list.map((p) => (p.id === editingId ? { ...p, ...draft } : p)));
    } else {
      const id = nextPropertyId(properties);
      setProperties((list) => [...list, { id, propertyCode: nextPropertyCode(id), ...draft }]);
    }
    setFormOpen(false);
    setEditingId(null);
  }

  function handleDelete(property: Property) {
    const roomCount = roomsByProperty(property.propertyName).length;
    if (roomCount > 0) {
      alert(`ลบไม่ได้ — อาคารนี้ยังมีห้องอยู่ ${roomCount} ห้อง`);
      return;
    }
    if (!confirm(`ยืนยันลบอาคาร "${property.propertyName}"?`)) return;
    setProperties((list) => list.filter((p) => p.id !== property.id));
    setSelectedId(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <button style={softBtn}>
          ประเภทอาคาร<span style={{ color: "rgba(234,242,255,0.5)" }}>ทั้งหมด</span>
          <span style={{ color: "rgba(234,242,255,0.4)" }}>
            <Icon name="chevDown" size={14} />
          </span>
        </button>
        <button style={softBtn}>
          จังหวัด<span style={{ color: "rgba(234,242,255,0.5)" }}>ทั้งหมด</span>
          <span style={{ color: "rgba(234,242,255,0.4)" }}>
            <Icon name="chevDown" size={14} />
          </span>
        </button>
        <button
          onClick={openCreate}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 15px",
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
          เพิ่มอาคาร
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {properties.map((p) => {
          const rooms = roomsByProperty(p.propertyName);
          const occupied = rooms.filter((r) => r.status === "มีผู้เช่า").length;
          const vacant = rooms.filter((r) => r.status === "ว่าง").length;
          return (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{
                cursor: "pointer",
                overflow: "hidden",
                borderRadius: 22,
                background: "rgba(255,255,255,0.055)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
              }}
            >
              <div
                style={{
                  height: 88,
                  position: "relative",
                  background: "linear-gradient(135deg,#0e2a3a,#123)",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  padding: 12,
                }}
              >
                <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg,rgba(255,255,255,0.05) 0 8px,transparent 8px 16px)" }} />
                <span style={{ position: "relative", fontFamily: "monospace", fontSize: 10.5, color: "rgba(234,242,255,0.5)" }}>property photo</span>
                <span style={badge(p.status === "ACTIVE" ? "green" : "gray")}>{p.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}</span>
              </div>
              <div style={{ padding: "15px 16px 17px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 16 }}>{p.propertyName}</div>
                  <span style={badge("blue")}>{p.propertyType}</span>
                </div>
                <div style={{ fontSize: 12, color: "rgba(234,242,255,0.55)", marginTop: 3 }}>
                  {p.district}, {p.province}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
                  <div style={{ flex: 1, padding: "9px 11px", borderRadius: 12, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.16)" }}>
                    <div style={{ fontSize: 10.5, color: "rgba(234,242,255,0.55)" }}>มีผู้เช่า</div>
                    <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 14.5, color: "#6EE7B7", marginTop: 2 }}>{occupied} ห้อง</div>
                  </div>
                  <div style={{ flex: 1, padding: "9px 11px", borderRadius: 12, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" }}>
                    <div style={{ fontSize: 10.5, color: "rgba(234,242,255,0.55)" }}>ห้องว่าง</div>
                    <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 14.5, color: "#7DD3FC", marginTop: 2 }}>{vacant} ห้อง</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(234,242,255,0.6)", marginTop: 12, paddingTop: 11, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  รายรับเดือนนี้ · {fmtTHB(p.monthlyIncome)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PropertyDrawer
        property={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(property) => {
          setSelectedId(null);
          openEdit(property);
        }}
        onDelete={handleDelete}
      />

      <PropertyFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
