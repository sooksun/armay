import { Icon } from "@/components/Icon";
import { badge } from "@/lib/theme";
import { KANBAN_COLUMNS, initials } from "@/lib/mock";

export default function ServicesPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 13, color: "rgba(234,242,255,0.6)" }}>
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
            border: "1px solid rgba(255,255,255,0.28)",
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
        {KANBAN_COLUMNS.map((col) => (
          <div
            key={col.title}
            style={{
              flex: "0 0 268px",
              width: 268,
              borderRadius: 20,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 11,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: col.color, boxShadow: `0 0 10px ${col.color}` }} />
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>{col.title}</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11.5,
                  color: "rgba(234,242,255,0.5)",
                  background: "rgba(255,255,255,0.06)",
                  padding: "1px 8px",
                  borderRadius: 20,
                }}
              >
                {col.tasks.length}
              </span>
            </div>

            {col.tasks.map((tk, i) => (
              <div
                key={i}
                style={{
                  padding: 13,
                  borderRadius: 15,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.11)",
                  borderLeft: `3px solid ${tk.color}`,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
                  cursor: "grab",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <span style={badge(tk.typeBadge)}>{tk.type}</span>
                  {tk.photos ? (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 10.5,
                        color: "rgba(234,242,255,0.5)",
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
                <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.55)", marginTop: 3 }}>
                  {tk.room} · {tk.building}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 11,
                    paddingTop: 10,
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "rgba(234,242,255,0.6)" }}>
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
                  <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 12.5, color: "#FDA4AF" }}>{tk.cost}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
