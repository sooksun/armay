"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";

/**
 * Reusable image/file picker + preview. Client-side only (no backend): the selected
 * file becomes an in-memory object URL, shown as a preview and lost on reload —
 * consistent with the rest of the mock app.
 */
export function ImageUpload({
  value,
  onChange,
  onFileSelected,
  label,
  hint,
  aspect = "wide",
  accept = "image/*",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  /** Raw File callback (e.g. slip auto-extraction) — fired alongside onChange. */
  onFileSelected?: (file: File) => void;
  label?: string;
  hint?: string;
  aspect?: "wide" | "square";
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pickedName, setPickedName] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const height = aspect === "square" ? 150 : 120;

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPickedName(file.name);
      setIsPdf(file.type === "application/pdf" || /\.pdf$/i.test(file.name));
      onChange(URL.createObjectURL(file));
      onFileSelected?.(file);
    }
    e.target.value = ""; // allow re-selecting the same file
  }

  const chip: React.CSSProperties = {
    padding: "5px 10px",
    borderRadius: 9,
    border: "1px solid rgba(var(--surface-rgb),0.2)",
    background: "rgba(4,8,16,0.6)",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: 11.5,
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div>
      {label ? <div style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.6)", marginBottom: 6 }}>{label}</div> : null}
      <input ref={inputRef} type="file" accept={accept} onChange={pick} style={{ display: "none" }} />

      {value ? (
        <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(var(--surface-rgb),0.14)" }}>
          {isPdf ? (
            <div
              style={{
                height,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: "rgba(94,234,212,0.06)",
              }}
            >
              <span style={{ color: "var(--pos)", display: "flex" }}>
                <Icon name="rental" size={26} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, maxWidth: "85%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {pickedName ?? "ไฟล์ PDF"}
              </span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- reason: object/data URLs, not next/image-optimizable
            <img src={value} alt={label ?? "รูปที่แนบ"} style={{ display: "block", width: "100%", height, objectFit: "cover" }} />
          )}
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
            <button type="button" onClick={() => inputRef.current?.click()} style={chip}>
              เปลี่ยน
            </button>
            <button type="button" onClick={() => onChange(null)} style={{ ...chip, color: "var(--neg)", borderColor: "rgba(251,113,133,0.4)" }}>
              ลบ
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            width: "100%",
            height,
            padding: 16,
            borderRadius: 14,
            border: "1.5px dashed rgba(94,234,212,0.4)",
            background: "rgba(94,234,212,0.05)",
            color: "var(--text)",
            fontFamily: "inherit",
            textAlign: "center",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color: "var(--pos)", display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <Icon name="upload" size={26} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>ลากรูปมาวาง หรืออัปโหลด</div>
          <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)", marginTop: 3 }}>{hint ?? "รองรับ JPG, PNG · แสดง preview ทันที"}</div>
        </button>
      )}
    </div>
  );
}
