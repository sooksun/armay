"use client";

import { Drawer, InfoRow, InfoSection } from "@/components/shared/Drawer";
import { badge } from "@/lib/theme";
import type { ExpenseRow } from "@/lib/mock";

const RESP_BADGE = { "นายหน้า": "blue", "เจ้าของ": "purple", "ผู้เช่า": "gold" } as const;

function ImageBox({ label, url }: { label: string; url: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.55)", marginBottom: 5 }}>{label}</div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- reason: in-memory object URL, not next/image-optimizable
        <img src={url} alt={label} style={{ display: "block", width: "100%", height: 110, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }} />
      ) : (
        <div
          style={{
            height: 110,
            borderRadius: 12,
            background: "repeating-linear-gradient(135deg,rgba(255,255,255,0.05) 0 8px,transparent 8px 16px)",
            border: "1px solid rgba(255,255,255,0.09)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            fontSize: 10.5,
            color: "rgba(234,242,255,0.4)",
          }}
        >
          ไม่มีรูป
        </div>
      )}
    </div>
  );
}

export function ExpenseDrawer({
  expense,
  onClose,
  onEdit,
  onDelete,
}: {
  expense: ExpenseRow | null;
  onClose: () => void;
  onEdit: (e: ExpenseRow) => void;
  onDelete: (e: ExpenseRow) => void;
}) {
  if (!expense) return null;

  return (
    <Drawer
      onClose={onClose}
      eyebrow={expense.expenseCode}
      title={expense.description || expense.expenseType}
      badge={<span style={{ ...badge(expense.badge), marginTop: 8, display: "inline-flex" }}>{expense.status}</span>}
    >
      <InfoSection title="รายละเอียดค่าใช้จ่าย">
        <InfoRow k="ห้อง" v={`${expense.room} · ${expense.building}`} />
        <InfoRow k="ประเภท" v={expense.expenseType} />
        <InfoRow k="จำนวนเงิน" v={expense.amount} />
        <InfoRow k="วันที่" v={expense.date} />
        <InfoRow k="ผู้รับเงิน" v={expense.payeeName} />
      </InfoSection>

      <InfoSection title="ผู้รับผิดชอบ">
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <span style={{ color: "rgba(234,242,255,0.55)" }}>ค่าใช้จ่ายนี้รับผิดชอบโดย</span>
          <span style={badge(RESP_BADGE[expense.responsibility])}>{expense.responsibility}</span>
        </div>
      </InfoSection>

      <div style={{ padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>รูปก่อน–หลัง</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <ImageBox label="ก่อน" url={expense.beforeUrl} />
          <ImageBox label="หลัง" url={expense.afterUrl} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => onDelete(expense)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(251,113,133,0.35)",
            background: "rgba(251,113,133,0.08)",
            color: "#FDA4AF",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ลบรายการ
        </button>
        <button
          onClick={() => onEdit(expense)}
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
          แก้ไขข้อมูล
        </button>
      </div>
    </Drawer>
  );
}
