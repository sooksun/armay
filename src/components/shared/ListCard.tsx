"use client";

import type { ReactNode } from "react";

export function ListCard({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 22,
        overflow: "hidden",
        background: "rgba(var(--surface-rgb),0.05)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: "1px solid rgba(var(--surface-rgb),0.12)",
        boxShadow: "0 18px 44px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          padding: "15px 18px",
          borderBottom: "1px solid rgba(var(--surface-rgb),0.08)",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{title}</div>
        {actions ? <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function TableWrap({ children, minWidth }: { children: ReactNode; minWidth: number }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth }}>{children}</table>
    </div>
  );
}

export function Th({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: "12px 16px",
        fontWeight: 600,
        color: "rgba(var(--text-rgb),0.6)",
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}
