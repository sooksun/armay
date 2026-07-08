"use client";

import { badge, fmtTHB } from "@/lib/theme";
import { Icon } from "@/components/Icon";
import { ImageUpload } from "@/components/shared/ImageUpload";
import type { RoomDTO } from "@/lib/api-types";

function statBox(bg: string, border: string, color: string, label: string, value: string) {
  return (
    <div style={{ padding: 14, borderRadius: 14, background: bg, border: `1px solid ${border}` }}>
      <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.55)" }}>{label}</div>
      <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 19, color, marginTop: 3 }}>{value}</div>
    </div>
  );
}

export function RoomDrawer({
  room,
  onClose,
  image,
  onImageChange,
  onEdit,
  onDelete,
}: {
  room: RoomDTO | null;
  onClose: () => void;
  image: string | null;
  onImageChange: (url: string | null) => void;
  onEdit: (room: RoomDTO) => void;
  onDelete: (room: RoomDTO) => void;
}) {
  if (!room) return null;

  const net = (parseInt(room.income.replace(/\D/g, "")) || 0) - (parseInt(room.expense.replace(/\D/g, "")) || 0);
  const info: { k: string; v: string }[] = [
    { k: "รหัสห้อง", v: room.roomCode },
    { k: "เจ้าของ", v: room.owner },
    { k: "ประเภทห้อง", v: room.roomType || "—" },
    { k: "ขนาด", v: room.roomSize ? `${room.roomSize} ตร.ม.` : "—" },
    { k: "ชั้น", v: room.floor || "—" },
    { k: "ค่าเช่าปกติ", v: fmtTHB(room.rentValue) + "/เดือน" },
    { k: "เงินประกัน", v: fmtTHB(room.depositValue) },
    { k: "ค่าทำความสะอาด", v: fmtTHB(room.cleaningValue) },
    { k: "ค่านายหน้า/เดือน", v: fmtTHB(room.commissionValue) },
  ];

  const closeBtn: React.CSSProperties = {
    marginLeft: "auto",
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "1px solid rgba(var(--surface-rgb),0.14)",
    background: "rgba(var(--surface-rgb),0.05)",
    color: "var(--text)",
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
          background: "linear-gradient(180deg,rgba(var(--panel2-rgb),0.97),rgba(var(--panel-rgb),0.97))",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          borderLeft: "1px solid rgba(var(--surface-rgb),0.16)",
          boxShadow: "-30px 0 70px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(var(--surface-rgb),0.1)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)" }}>{room.building}</div>
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 22 }}>ห้อง {room.no}</div>
            <span style={{ ...badge(room.badge), marginTop: 8 }}>{room.status}</span>
          </div>
          <button onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px 30px", display: "flex", flexDirection: "column", gap: 16 }}>
          <ImageUpload label="รูปห้อง" value={image} onChange={onImageChange} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {statBox("rgba(56,189,248,0.1)", "rgba(56,189,248,0.22)", "#7DD3FC", "รายรับเดือนนี้", room.income)}
            {statBox("rgba(251,113,133,0.08)", "rgba(251,113,133,0.18)", "var(--neg)", "ค่าใช้จ่าย", room.expense)}
            {statBox("rgba(94,234,212,0.09)", "rgba(94,234,212,0.2)", "var(--pos)", "กำไรสุทธิของห้อง", "฿" + net.toLocaleString())}
            {statBox("rgba(168,85,247,0.09)", "rgba(168,85,247,0.2)", "#DDD6FE", "ค่าเช่า / เดือน", room.rent)}
          </div>

          <div style={{ padding: 16, borderRadius: 16, background: "rgba(var(--surface-rgb),0.04)", border: "1px solid rgba(var(--surface-rgb),0.09)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>ข้อมูลห้อง</div>
            {info.map((row) => (
              <div
                key={row.k}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "7px 0",
                  borderBottom: "1px solid rgba(var(--surface-rgb),0.06)",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "rgba(var(--text-rgb),0.55)" }}>{row.k}</span>
                <span style={{ fontWeight: 600 }}>{row.v}</span>
              </div>
            ))}
          </div>

          {room.latitude && room.longitude ? (
            <div style={{ padding: 16, borderRadius: 16, background: "rgba(var(--surface-rgb),0.04)", border: "1px solid rgba(var(--surface-rgb),0.09)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>พิกัด / แผนที่</div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(var(--surface-rgb),0.06)", fontSize: 13 }}>
                <span style={{ color: "rgba(var(--text-rgb),0.55)" }}>ละติจูด</span>
                <span style={{ fontWeight: 600 }}>{room.latitude}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13 }}>
                <span style={{ color: "rgba(var(--text-rgb),0.55)" }}>ลองจิจูด</span>
                <span style={{ fontWeight: 600 }}>{room.longitude}</span>
              </div>
              <a
                href={`https://www.google.com/maps?q=${room.latitude},${room.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginTop: 10,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 14px",
                  borderRadius: 11,
                  border: "1px solid rgba(56,189,248,0.4)",
                  background: "rgba(56,189,248,0.08)",
                  color: "var(--text)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                <Icon name="search" size={15} />
                เปิดใน Google Maps
              </a>
            </div>
          ) : null}

          {room.note ? (
            <div style={{ padding: 16, borderRadius: 16, background: "rgba(var(--surface-rgb),0.04)", border: "1px solid rgba(var(--surface-rgb),0.09)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>หมายเหตุ</div>
              <div style={{ fontSize: 12.5, color: "rgba(var(--text-rgb),0.75)", lineHeight: 1.6 }}>{room.note}</div>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => onDelete(room)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                padding: 12,
                borderRadius: 13,
                border: "1px solid rgba(251,113,133,0.4)",
                background: "rgba(251,113,133,0.08)",
                color: "var(--neg)",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ลบห้อง
            </button>
            <button
              onClick={() => onEdit(room)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
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
              <Icon name="settings" size={15} />
              แก้ไขข้อมูลห้อง
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
