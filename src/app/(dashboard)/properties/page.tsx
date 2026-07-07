"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { badge, fmtTHB } from "@/lib/theme";
import { PropertyDrawer } from "@/components/properties/PropertyDrawer";
import { PropertyFormModal, type PropertyDraft } from "@/components/properties/PropertyFormModal";
import { apiGet, apiSend } from "@/lib/api-client";
import type { PropertyDTO } from "@/lib/api-types";

const softBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "8px 13px",
  borderRadius: 11,
  border: "1px solid rgba(var(--surface-rgb),0.14)",
  background: "rgba(var(--surface-rgb),0.05)",
  color: "var(--text)",
  fontFamily: "inherit",
  fontSize: 12.5,
  cursor: "pointer",
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setProperties(await apiGet<PropertyDTO[]>("/api/properties"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const selected = properties.find((p) => p.id === selectedId) ?? null;
  const editing = properties.find((p) => p.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }
  function openEdit(p: PropertyDTO) {
    setEditingId(p.id);
    setFormOpen(true);
  }
  async function handleSubmit(draft: PropertyDraft) {
    try {
      if (editingId != null) await apiSend(`/api/properties/${editingId}`, "PATCH", draft);
      else await apiSend("/api/properties", "POST", draft);
      setFormOpen(false);
      setEditingId(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  }
  async function handleDelete(p: PropertyDTO) {
    if (!confirm(`ยืนยันลบอาคาร "${p.propertyName}"?`)) return;
    try {
      await apiSend(`/api/properties/${p.id}`, "DELETE");
      setSelectedId(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <button style={softBtn}>
          ประเภทอาคาร<span style={{ color: "rgba(var(--text-rgb),0.5)" }}>ทั้งหมด</span>
          <span style={{ color: "rgba(var(--text-rgb),0.4)" }}>
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
          เพิ่มอาคาร
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "40px 16px", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>กำลังโหลด…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {properties.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{
                cursor: "pointer",
                overflow: "hidden",
                borderRadius: 22,
                background: "rgba(var(--surface-rgb),0.055)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(var(--surface-rgb),0.12)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
              }}
            >
              <div
                style={{
                  height: 88,
                  position: "relative",
                  overflow: "hidden",
                  background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  padding: 12,
                }}
              >
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- reason: in-memory object URL, not next/image-optimizable
                  <img src={p.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg,rgba(var(--surface-rgb),0.05) 0 8px,transparent 8px 16px)" }} />
                )}
                <span style={{ position: "relative", fontFamily: "monospace", fontSize: 10.5, color: "rgba(var(--text-rgb),0.5)" }}>{p.imageUrl ? "" : "property photo"}</span>
                <span style={{ ...badge(p.status === "ACTIVE" ? "green" : "gray"), position: "relative" }}>{p.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}</span>
              </div>
              <div style={{ padding: "15px 16px 17px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 16 }}>{p.propertyName}</div>
                  <span style={badge("blue")}>{p.propertyType}</span>
                </div>
                <div style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.55)", marginTop: 3 }}>
                  {p.district ? `${p.district}, ` : ""}
                  {p.province}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
                  <div style={{ flex: 1, padding: "9px 11px", borderRadius: 12, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.16)" }}>
                    <div style={{ fontSize: 10.5, color: "rgba(var(--text-rgb),0.55)" }}>มีผู้เช่า</div>
                    <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 14.5, color: "#6EE7B7", marginTop: 2 }}>{p.occupied} ห้อง</div>
                  </div>
                  <div style={{ flex: 1, padding: "9px 11px", borderRadius: 12, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" }}>
                    <div style={{ fontSize: 10.5, color: "rgba(var(--text-rgb),0.55)" }}>ห้องว่าง</div>
                    <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 14.5, color: "#7DD3FC", marginTop: 2 }}>{p.vacant} ห้อง</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.6)", marginTop: 12, paddingTop: 11, borderTop: "1px solid rgba(var(--surface-rgb),0.08)" }}>
                  รายรับเดือนนี้ · {fmtTHB(p.monthlyIncome)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PropertyDrawer
        property={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(p) => {
          setSelectedId(null);
          openEdit(p);
        }}
        onDelete={handleDelete}
      />

      <PropertyFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
