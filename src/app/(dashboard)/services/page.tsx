"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { badge } from "@/lib/theme";
import { KANBAN_COLUMNS, initials, type KanbanTask } from "@/lib/mock";

type BoardTask = KanbanTask & { uid: string };
type BoardColumn = { title: string; color: string; tasks: BoardTask[] };

function initialBoard(): BoardColumn[] {
  return KANBAN_COLUMNS.map((col, ci) => ({
    title: col.title,
    color: col.color,
    tasks: col.tasks.map((tk, ti) => ({ ...tk, uid: `${ci}-${ti}` })),
  }));
}

export default function ServicesPage() {
  const [columns, setColumns] = useState<BoardColumn[]>(initialBoard);
  const [dragUid, setDragUid] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<number | null>(null);

  function moveTask(uid: string, toCol: number) {
    setColumns((prev) => {
      const from = prev.findIndex((c) => c.tasks.some((t) => t.uid === uid));
      if (from === -1 || from === toCol) return prev;
      const task = prev[from].tasks.find((t) => t.uid === uid)!;
      return prev.map((col, ci) => {
        if (ci === from) return { ...col, tasks: col.tasks.filter((t) => t.uid !== uid) };
        if (ci === toCol) return { ...col, tasks: [...col.tasks, task] };
        return col;
      });
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.6)" }}>
          ลากการ์ดเพื่อเปลี่ยนสถานะงาน (mockup) · ผูกกับห้องและค่าใช้จ่ายเสมอ
        </div>
        <button
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

      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
        {columns.map((col, ci) => (
          <div
            key={col.title}
            onDragOver={(e) => {
              e.preventDefault();
              if (overCol !== ci) setOverCol(ci);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol((c) => (c === ci ? null : c));
            }}
            onDrop={(e) => {
              e.preventDefault();
              const uid = e.dataTransfer.getData("text/plain") || dragUid;
              if (uid) moveTask(uid, ci);
              setDragUid(null);
              setOverCol(null);
            }}
            style={{
              flex: "0 0 268px",
              width: 268,
              borderRadius: 20,
              background: overCol === ci ? "rgba(var(--surface-rgb),0.09)" : "rgba(var(--surface-rgb),0.04)",
              border: `1px solid rgba(var(--surface-rgb),${overCol === ci ? 0.28 : 0.1})`,
              outline: overCol === ci ? `2px dashed ${col.color}` : "none",
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
                key={tk.uid}
                draggable
                onDragStart={(e) => {
                  setDragUid(tk.uid);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", tk.uid);
                }}
                onDragEnd={() => {
                  setDragUid(null);
                  setOverCol(null);
                }}
                style={{
                  padding: 13,
                  borderRadius: 15,
                  background: "rgba(var(--surface-rgb),0.06)",
                  border: "1px solid rgba(var(--surface-rgb),0.11)",
                  borderLeft: `3px solid ${tk.color}`,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
                  cursor: "grab",
                  opacity: dragUid === tk.uid ? 0.4 : 1,
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
    </div>
  );
}
