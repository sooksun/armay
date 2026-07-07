"use client";

import { badge } from "@/lib/theme";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ROOM_DRAWER_TABS } from "@/lib/mock";
import type { RoomDTO } from "@/lib/api-types";

function statBox(bg: string, border: string, color: string, label: string, value: string) {
  return (
    <div style={{ padding: 14, borderRadius: 14, background: bg, border: `1px solid ${border}` }}>
      <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.55)" }}>{label}</div>
      <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 19, color, marginTop: 3 }}>{value}</div>
    </div>
  );
}

export function RoomDrawer({
  room,
  onClose,
  image,
  onImageChange,
}: {
  room: RoomDTO | null;
  onClose: () => void;
  image: string | null;
  onImageChange: (url: string | null) => void;
}) {
  if (!room) return null;

  const net = (parseInt(room.income.replace(/\D/g, "")) || 0) - (parseInt(room.expense.replace(/\D/g, "")) || 0);
  const floor = /\d/.test(room.no) ? room.no.replace(/\D/g, "").slice(0, -2) || "1" : "—";
  const info: { k: string; v: string }[] = [
    { k: "เจ้าของ", v: room.owner },
    { k: "ประเภทห้อง", v: "สตูดิโอ 28 ตร.ม." },
    { k: "ค่าเช่าปกติ", v: room.rent + "/เดือน" },
    { k: "เงินประกัน", v: "฿24,000" },
    { k: "ชั้น", v: floor },
  ];
  const timeline: { title: string; time: string; color: string }[] = [
    { title: "รับค่าเช่าเดือน ก.ค. " + room.income, time: "6 ก.ค. 2568 · 10:24", color: "#34D399" },
    { title: "บันทึกค่าซ่อมก๊อกน้ำ " + room.expense, time: "3 ก.ค. 2568 · 15:10", color: "#FB7185" },
    { title: "จ่ายเงินเจ้าของงวดที่แล้ว", time: "30 มิ.ย. 2568 · 09:00", color: "#38BDF8" },
    { title: "ต่อสัญญาเช่า 12 เดือน", time: "1 มิ.ย. 2568 · 14:30", color: "#A855F7" },
  ];

  const closeBtn: React.CSSProperties = {
    marginLeft: "auto",
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "#EAF2FF",
    cursor: "pointer",
    fontSize: 16,
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 55,
          background: "rgba(4,8,16,0.55)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
        }}
      />
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 56,
          width: "min(460px,94vw)",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg,rgba(20,28,48,0.97),rgba(12,18,34,0.97))",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          borderLeft: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "-30px 0 70px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{room.building}</div>
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 22 }}>ห้อง {room.no}</div>
            <span style={{ ...badge(room.badge), marginTop: 8 }}>{room.status}</span>
          </div>
          <button onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, padding: "12px 22px 0", overflowX: "auto" }}>
          {ROOM_DRAWER_TABS.map((label, i) =>
            i === 0 ? (
              <span
                key={label}
                style={{
                  padding: "8px 13px",
                  borderRadius: "11px 11px 0 0",
                  fontSize: 12.5,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  color: "#EAF2FF",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderBottom: "none",
                }}
              >
                {label}
              </span>
            ) : (
              <span key={label} style={{ padding: "8px 13px", fontSize: 12.5, whiteSpace: "nowrap", color: "rgba(234,242,255,0.5)" }}>
                {label}
              </span>
            )
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px 30px", display: "flex", flexDirection: "column", gap: 16 }}>
          <ImageUpload label="รูปห้อง" value={image} onChange={onImageChange} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {statBox("rgba(56,189,248,0.1)", "rgba(56,189,248,0.22)", "#7DD3FC", "รายรับเดือนนี้", room.income)}
            {statBox("rgba(251,113,133,0.08)", "rgba(251,113,133,0.18)", "#FDA4AF", "ค่าใช้จ่าย", room.expense)}
            {statBox("rgba(94,234,212,0.09)", "rgba(94,234,212,0.2)", "#7FF0D9", "กำไรสุทธิของห้อง", "฿" + net.toLocaleString())}
            {statBox("rgba(168,85,247,0.09)", "rgba(168,85,247,0.2)", "#DDD6FE", "ค่าเช่า / เดือน", room.rent)}
          </div>

          <div style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>ข้อมูลห้อง</div>
            {info.map((row) => (
              <div
                key={row.k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "rgba(234,242,255,0.55)" }}>{row.k}</span>
                <span style={{ fontWeight: 600 }}>{row.v}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Timeline เหตุการณ์ล่าสุด</div>
            {timeline.map((ev, i) => (
              <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 14, position: "relative" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ width: 11, height: 11, borderRadius: "50%", background: ev.color, boxShadow: `0 0 8px ${ev.color}`, marginTop: 3 }} />
                  <span style={{ flex: 1, width: 1.5, background: "rgba(255,255,255,0.1)", marginTop: 3 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{ev.title}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)", marginTop: 1 }}>{ev.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 13,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.05)",
                color: "#EAF2FF",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              แนบหลักฐาน
            </button>
            <button
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
              บันทึกรับเงิน
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
