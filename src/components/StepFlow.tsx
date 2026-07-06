"use client";

import { Icon } from "@/components/Icon";
import type { StepField } from "@/lib/mock";

type Accent = "teal" | "purple";

const ACCENTS: Record<Accent, { border: string; bg: string; grad: string }> = {
  teal: {
    border: "rgba(94,234,212,0.4)",
    bg: "linear-gradient(135deg,rgba(94,234,212,0.16),rgba(56,189,248,0.12))",
    grad: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
  },
  purple: {
    border: "rgba(168,85,247,0.4)",
    bg: "linear-gradient(135deg,rgba(168,85,247,0.18),rgba(56,189,248,0.12))",
    grad: "linear-gradient(135deg,#A855F7,#38BDF8)",
  },
};

export function StepTabs({
  labels,
  current,
  onSelect,
  accent,
  pad = "9px 15px",
}: {
  labels: string[];
  current: number;
  onSelect: (n: number) => void;
  accent: Accent;
  pad?: string;
}) {
  const a = ACCENTS[accent];
  return (
    <div style={{ display: "flex", gap: 8, padding: "18px 22px 4px", flexWrap: "wrap" }}>
      {labels.map((label, i) => {
        const n = i + 1;
        const cur = n === current;
        const done = n < current;
        return (
          <button
            key={label}
            onClick={() => onSelect(n)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: pad,
              borderRadius: 12,
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: cur ? 600 : 400,
              cursor: "pointer",
              border: `1px solid ${cur ? a.border : "rgba(255,255,255,0.1)"}`,
              color: cur ? "#EAF2FF" : "rgba(234,242,255,0.55)",
              background: cur ? a.bg : "rgba(255,255,255,0.03)",
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11.5,
                fontWeight: 700,
                color: cur || done ? "#04121A" : "rgba(234,242,255,0.6)",
                background: cur || done ? a.grad : "rgba(255,255,255,0.08)",
              }}
            >
              {done ? "✓" : n}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function StepFieldsGrid({ fields }: { fields: StepField[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
      {fields.map((fld, i) => (
        <div key={i}>
          <div style={{ fontSize: 12, color: "rgba(234,242,255,0.6)", marginBottom: 6 }}>{fld.label}</div>
          <div
            style={{
              padding: "11px 13px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.05)",
              fontSize: 13.5,
              color: fld.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {fld.value}
            <span style={{ color: "rgba(234,242,255,0.4)" }}>{fld.icon ? <Icon name={fld.icon} size={15} /> : null}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StepNavButtons({ nextLabel }: { nextLabel: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
      <button
        style={{
          padding: "11px 18px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.16)",
          background: "rgba(255,255,255,0.05)",
          color: "#EAF2FF",
          fontFamily: "inherit",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        ย้อนกลับ
      </button>
      <button
        style={{
          padding: "11px 22px",
          borderRadius: 12,
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
        {nextLabel}
      </button>
    </div>
  );
}
