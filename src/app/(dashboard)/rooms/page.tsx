"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { RoomDrawer } from "@/components/RoomDrawer";
import { RoomFormModal, type RoomDraft } from "@/components/rooms/RoomFormModal";
import { badge } from "@/lib/theme";
import { ROOM_FILTERS } from "@/lib/mock";
import { apiGet, apiSend } from "@/lib/api-client";
import type { RoomDTO } from "@/lib/api-types";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setRooms(await apiGet<RoomDTO[]>("/api/rooms"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const selectedRoom = rooms.find((r) => r.id === selected) ?? null;
  const editing = rooms.find((r) => r.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }
  function openEdit(r: RoomDTO) {
    setEditingId(r.id);
    setFormOpen(true);
  }

  async function handleSubmit(draft: RoomDraft) {
    if (!draft.propertyId) return alert("กรุณาเลือกอาคาร/โครงการ");
    if (!draft.ownerId) return alert("กรุณาเลือกเจ้าของ");
    if (!draft.roomNumber.trim()) return alert("กรุณากรอกเลขห้อง");
    try {
      if (editingId != null) await apiSend(`/api/rooms/${editingId}`, "PATCH", draft);
      else await apiSend("/api/rooms", "POST", draft);
      setFormOpen(false);
      setEditingId(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  }

  async function handleDelete(r: RoomDTO) {
    if (!confirm(`ยืนยันลบห้อง "${r.no}"?`)) return;
    try {
      await apiSend(`/api/rooms/${r.id}`, "DELETE");
      setSelected(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  async function handleImageChange(r: RoomDTO, url: string | null) {
    try {
      await apiSend(`/api/rooms/${r.id}`, "PATCH", { imageUrl: url });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกรูปไม่สำเร็จ");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        {ROOM_FILTERS.map((f) => (
          <button
            key={f.label}
            style={{
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
            }}
          >
            {f.label}
            <span style={{ color: "rgba(var(--text-rgb),0.5)" }}>{f.value}</span>
            <span style={{ color: "rgba(var(--text-rgb),0.4)" }}>
              <Icon name="chevDown" size={14} />
            </span>
          </button>
        ))}
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
          เพิ่มห้อง
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "40px 16px", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>กำลังโหลด…</div>
      ) : rooms.length === 0 ? (
        <div style={{ padding: "40px 16px", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>ยังไม่มีห้อง — กด “เพิ่มห้อง” เพื่อเริ่มต้น</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
          {rooms.map((rm) => (
            <div
              key={rm.id}
              onClick={() => setSelected(rm.id)}
              style={{
                cursor: "pointer",
                overflow: "hidden",
                borderRadius: 22,
                background: "rgba(var(--surface-rgb),0.055)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(var(--surface-rgb),0.12)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
                borderTop: `3px solid ${rm.statusColor}`,
              }}
            >
              <div
                style={{
                  height: 104,
                  position: "relative",
                  overflow: "hidden",
                  background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  padding: 12,
                }}
              >
                {rm.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- reason: in-memory object URL, not next/image-optimizable
                  <img src={rm.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg,rgba(var(--surface-rgb),0.05) 0 8px,transparent 8px 16px)" }} />
                )}
                <span style={{ position: "relative", fontFamily: "monospace", fontSize: 10.5, color: "rgba(var(--text-rgb),0.5)" }}>{rm.imageUrl ? "" : "room photo"}</span>
                <span style={{ ...badge(rm.badge), position: "relative" }}>{rm.status}</span>
              </div>
              <div style={{ padding: "15px 16px 17px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 17 }}>{rm.no}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)" }}>{rm.building}</div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.55)", marginTop: 3 }}>เจ้าของ: {rm.owner}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
                  <div style={{ flex: 1, padding: "9px 11px", borderRadius: 12, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" }}>
                    <div style={{ fontSize: 10.5, color: "rgba(var(--text-rgb),0.55)" }}>รายรับเดือนนี้</div>
                    <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 14.5, color: "#7DD3FC", marginTop: 2 }}>{rm.income}</div>
                  </div>
                  <div style={{ flex: 1, padding: "9px 11px", borderRadius: 12, background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.16)" }}>
                    <div style={{ fontSize: 10.5, color: "rgba(var(--text-rgb),0.55)" }}>ค่าใช้จ่าย</div>
                    <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 14.5, color: "var(--neg)", marginTop: 2 }}>{rm.expense}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.6)", marginTop: 12, paddingTop: 11, borderTop: "1px solid rgba(var(--surface-rgb),0.08)" }}>
                  {rm.tenantLine}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <RoomDrawer
        room={selectedRoom}
        image={selectedRoom?.imageUrl ?? null}
        onImageChange={(url) => selectedRoom && handleImageChange(selectedRoom, url)}
        onClose={() => setSelected(null)}
        onEdit={(r) => {
          setSelected(null);
          openEdit(r);
        }}
        onDelete={handleDelete}
      />

      <RoomFormModal open={formOpen} editing={editing} rooms={rooms} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
