"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { RoomDrawer } from "@/components/RoomDrawer";
import { badge } from "@/lib/theme";
import { ROOMS, ROOM_FILTERS, ROOM_STATUS_COLOR, ROOM_BADGE_KIND, ROOM_PHOTO_BGS } from "@/lib/mock";

export default function RoomsPage() {
  const [selected, setSelected] = useState<number | null>(null);
  // per-room photo, keyed by room number (in-memory, no backend)
  const [roomImages, setRoomImages] = useState<Record<string, string>>({});

  const selectedRoom = selected != null ? ROOMS[selected] : null;

  function setRoomImage(roomNo: string, url: string | null) {
    setRoomImages((m) => {
      if (url === null) {
        const next = { ...m };
        delete next[roomNo];
        return next;
      }
      return { ...m, [roomNo]: url };
    });
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
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.05)",
              color: "#EAF2FF",
              fontFamily: "inherit",
              fontSize: 12.5,
              cursor: "pointer",
            }}
          >
            {f.label}
            <span style={{ color: "rgba(234,242,255,0.5)" }}>{f.value}</span>
            <span style={{ color: "rgba(234,242,255,0.4)" }}>
              <Icon name="chevDown" size={14} />
            </span>
          </button>
        ))}
        <button
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
          เพิ่มห้อง
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {ROOMS.map((rm, i) => (
          <div
            key={rm.no}
            onClick={() => setSelected(i)}
            style={{
              cursor: "pointer",
              overflow: "hidden",
              borderRadius: 22,
              background: "rgba(255,255,255,0.055)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
              borderTop: `3px solid ${ROOM_STATUS_COLOR[rm.status]}`,
            }}
          >
            <div
              style={{
                height: 104,
                position: "relative",
                overflow: "hidden",
                background: ROOM_PHOTO_BGS[i % ROOM_PHOTO_BGS.length],
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                padding: 12,
              }}
            >
              {roomImages[rm.no] ? (
                // eslint-disable-next-line @next/next/no-img-element -- reason: in-memory object URL, not next/image-optimizable
                <img src={roomImages[rm.no]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "repeating-linear-gradient(135deg,rgba(255,255,255,0.05) 0 8px,transparent 8px 16px)",
                  }}
                />
              )}
              <span style={{ position: "relative", fontFamily: "monospace", fontSize: 10.5, color: "rgba(234,242,255,0.5)" }}>
                {roomImages[rm.no] ? "" : "room photo"}
              </span>
              <span style={{ ...badge(ROOM_BADGE_KIND[rm.status]), position: "relative" }}>{rm.status}</span>
            </div>
            <div style={{ padding: "15px 16px 17px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 17 }}>{rm.no}</div>
                <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{rm.building}</div>
              </div>
              <div style={{ fontSize: 12, color: "rgba(234,242,255,0.55)", marginTop: 3 }}>เจ้าของ: {rm.owner}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
                <div style={{ flex: 1, padding: "9px 11px", borderRadius: 12, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" }}>
                  <div style={{ fontSize: 10.5, color: "rgba(234,242,255,0.55)" }}>รายรับเดือนนี้</div>
                  <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 14.5, color: "#7DD3FC", marginTop: 2 }}>
                    {rm.income}
                  </div>
                </div>
                <div style={{ flex: 1, padding: "9px 11px", borderRadius: 12, background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.16)" }}>
                  <div style={{ fontSize: 10.5, color: "rgba(234,242,255,0.55)" }}>ค่าใช้จ่าย</div>
                  <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 14.5, color: "#FDA4AF", marginTop: 2 }}>
                    {rm.expense}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(234,242,255,0.6)",
                  marginTop: 12,
                  paddingTop: 11,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {rm.tenantLine}
              </div>
            </div>
          </div>
        ))}
      </div>

      <RoomDrawer
        room={selectedRoom}
        image={selectedRoom ? roomImages[selectedRoom.no] ?? null : null}
        onImageChange={(url) => selectedRoom && setRoomImage(selectedRoom.no, url)}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
