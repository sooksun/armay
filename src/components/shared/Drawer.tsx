"use client";

import type { ReactNode } from "react";

export type DrawerTab = {
  label: string;
  active: boolean;
  onClick: () => void;
};

/**
 * Generic slide-over detail shell shared by Owner/Property/Tenant/Account drawers.
 * Visual chrome ported from RoomDrawer (RoomDrawer itself is left untouched).
 */
export function Drawer({
  onClose,
  eyebrow,
  title,
  badge,
  tabs,
  children,
}: {
  onClose: () => void;
  eyebrow?: string;
  title: string;
  badge?: ReactNode;
  tabs?: DrawerTab[];
  children: ReactNode;
}) {
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
        <div
          style={{
            padding: "20px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div>
            {eyebrow ? <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{eyebrow}</div> : null}
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 22 }}>{title}</div>
            {badge}
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.05)",
              color: "#EAF2FF",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {tabs && tabs.length > 0 ? (
          <div style={{ display: "flex", gap: 6, padding: "12px 22px 0", overflowX: "auto" }}>
            {tabs.map((t) => (
              <button
                key={t.label}
                onClick={t.onClick}
                style={
                  t.active
                    ? {
                        padding: "8px 13px",
                        borderRadius: "11px 11px 0 0",
                        fontSize: 12.5,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        color: "#EAF2FF",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderBottom: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }
                    : {
                        padding: "8px 13px",
                        fontSize: 12.5,
                        whiteSpace: "nowrap",
                        color: "rgba(234,242,255,0.5)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 22px 30px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {children}
        </div>
      </aside>
    </>
  );
}

export function StatBox({
  bg,
  border,
  color,
  label,
  value,
}: {
  bg: string;
  border: string;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div style={{ padding: 14, borderRadius: 14, background: bg, border: `1px solid ${border}` }}>
      <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.55)" }}>{label}</div>
      <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 19, color, marginTop: 3 }}>{value}</div>
    </div>
  );
}

export function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        fontSize: 13,
      }}
    >
      <span style={{ color: "rgba(234,242,255,0.55)" }}>{k}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{v}</span>
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.09)",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}
