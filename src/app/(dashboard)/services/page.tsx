"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { badge } from "@/lib/theme";
import { initials } from "@/lib/mock";
import { ServiceTaskFormModal, type ServiceTaskDraft } from "@/components/services/ServiceTaskFormModal";
import { apiGet, apiSend } from "@/lib/api-client";
import type { ServiceBoardDTO, RoomDTO } from "@/lib/api-types";

export default function ServicesPage() {
  const [columns, setColumns] = useState<ServiceBoardDTO>([]);
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setColumns(await apiGet<ServiceBoardDTO>("/api/service-tasks"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    apiGet<RoomDTO[]>("/api/rooms").then(setRooms).catch(console.error);
  }, []);

  async function moveTask(id: number, toStatus: string) {
    const from = columns.find((c) => c.tasks.some((t) => t.id === id));
    if (!from || from.status === toStatus) return;
    const task = from.tasks.find((t) => t.id === id)!;
    const target = columns.find((c) => c.status === toStatus);
    const prev = columns;
    setColumns((cols) =>
      cols.map((c) => {
        if (c.status === from.status) return { ...c, tasks: c.tasks.filter((t) => t.id !== id) };
        if (c.status === toStatus) return { ...c, tasks: [...c.tasks, { ...task, color: target?.color ?? task.color, serviceStatus: toStatus }] };
        return c;
      })
    );
    try {
      await apiSend(`/api/service-tasks/${id}`, "PATCH", { serviceStatus: toStatus });
    } catch (e) {
      setColumns(prev);
      alert(e instanceof Error ? e.message : "ย้ายงานไม่สำเร็จ");
    }
  }

  async function handleCreate(draft: ServiceTaskDraft) {
    try {
      await apiSend("/api/service-tasks", "POST", {
        expenseType: draft.expenseType,
        title: draft.title,
        room: draft.room,
        payeeName: draft.payeeName,
        amount: draft.amount === "" ? 0 : Number(draft.amount),
      });
      setFormOpen(false);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "สร้างงานไม่สำเร็จ");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.6)" }}>
          ลากการ์ดเพื่อเปลี่ยนสถานะงาน · ผูกกับห้องและค่าใช้จ่ายเสมอ
        </div>
        <button
          onClick={() => setFormOpen(true)}
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
            background: "linear-gradient(135deg,#FBBF24,#F59E0B)",
            boxShadow: "0 6px 16px rgba(251,191,36,0.35)",
          }}
        >
          <Icon name="plus" size={15} />
          สร้างงานใหม่
        </button>
      </div>

      {loading && <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.5)" }}>กำลังโหลด…</div>}

      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
        {columns.map((col) => (
          <div
            key={col.status}
            onDragOver={(e) => {
              e.preventDefault();
              if (overStatus !== col.status) setOverStatus(col.status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverStatus((s) => (s === col.status ? null : s));
            }}
            onDrop={(e) => {
              e.preventDefault();
              const raw = e.dataTransfer.getData("text/plain");
              const id = raw ? Number(raw) : dragId;
              if (id != null && Number.isInteger(id)) void moveTask(id, col.status);
              setDragId(null);
              setOverStatus(null);
            }}
            style={{
              flex: "0 0 268px",
              width: 268,
              borderRadius: 20,
              background: overStatus === col.status ? "rgba(var(--surface-rgb),0.09)" : "rgba(var(--surface-rgb),0.04)",
              border: `1px solid rgba(var(--surface-rgb),${overStatus === col.status ? 0.28 : 0.1})`,
              outline: overStatus === col.status ? `2px dashed ${col.color}` : "none",
              outlineOffset: -2,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 11,
              transition: "background 0.12s, border-color 0.12s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: col.color, boxShadow: `0 0 10px ${col.color}` }} />
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>{col.title}</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11.5,
                  color: "rgba(var(--text-rgb),0.5)",
                  background: "rgba(var(--surface-rgb),0.06)",
                  padding: "1px 8px",
                  borderRadius: 20,
                }}
              >
                {col.tasks.length}
              </span>
            </div>

            {col.tasks.map((tk) => (
              <div
                key={tk.id}
                draggable
                onDragStart={(e) => {
                  setDragId(tk.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(tk.id));
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverStatus(null);
                }}
                style={{
                  padding: 13,
                  borderRadius: 15,
                  background: "rgba(var(--surface-rgb),0.06)",
                  border: "1px solid rgba(var(--surface-rgb),0.11)",
                  borderLeft: `3px solid ${tk.color}`,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
                  cursor: "grab",
                  opacity: dragId === tk.id ? 0.4 : 1,
                  transition: "opacity 0.12s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <span style={badge(tk.typeBadge)}>{tk.type}</span>
                  {tk.photos ? (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 10.5,
                        color: "rgba(var(--text-rgb),0.5)",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <Icon name="image" size={12} />
                      ก่อน/หลัง
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{tk.title}</div>
                <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.55)", marginTop: 3 }}>
                  {tk.room} · {tk.building}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 11,
                    paddingTop: 10,
                    borderTop: "1px solid rgba(var(--surface-rgb),0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "rgba(var(--text-rgb),0.6)" }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: "linear-gradient(135deg,#A855F7,#38BDF8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {initials(tk.assignee)}
                    </span>
                    {tk.assignee}
                  </div>
                  <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 12.5, color: "var(--neg)" }}>{tk.cost}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <ServiceTaskFormModal
        open={formOpen}
        rooms={rooms.map((r) => ({ no: r.no, building: r.building }))}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
