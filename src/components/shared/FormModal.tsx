"use client";

import type { ReactNode } from "react";

const fieldBoxStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.05)",
  color: "#EAF2FF",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

function Label({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 12, color: "rgba(234,242,255,0.6)", marginBottom: 6 }}>{children}</div>;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={fieldBoxStyle}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{ ...fieldBoxStyle, resize: "vertical", fontFamily: "inherit" }}
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...fieldBoxStyle, cursor: "pointer" }}>
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "#0B1020" }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
  onLabel,
  offLabel,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          ...fieldBoxStyle,
          cursor: "pointer",
          textAlign: "left",
          color: checked ? "#7FF0D9" : "#EAF2FF",
          borderColor: checked ? "rgba(94,234,212,0.4)" : "rgba(255,255,255,0.14)",
          background: checked ? "rgba(94,234,212,0.08)" : "rgba(255,255,255,0.05)",
        }}
      >
        {checked ? onLabel : offLabel}
      </button>
    </div>
  );
}

export function FieldsGrid({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>{children}</div>;
}

export function FormModal({
  open,
  onClose,
  icon,
  title,
  subtitle,
  onSubmit,
  submitLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
  onSubmit: () => void;
  submitLabel: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 20px",
        overflowY: "auto",
        background: "rgba(4,8,16,0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 26,
          background: "linear-gradient(180deg,rgba(20,28,48,0.96),rgba(12,18,34,0.96))",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "0 30px 70px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
              color: "#04121A",
            }}
          >
            {icon}
          </span>
          <div>
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 17 }}>{title}</div>
            <div style={{ fontSize: 12, color: "rgba(234,242,255,0.5)" }}>{subtitle}</div>
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

        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 15 }}>{children}</div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 11,
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "11px 20px",
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
            ยกเลิก
          </button>
          <button
            onClick={onSubmit}
            style={{
              padding: "11px 24px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.28)",
              color: "#04121A",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
              boxShadow: "0 8px 20px rgba(56,189,248,0.42)",
            }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
