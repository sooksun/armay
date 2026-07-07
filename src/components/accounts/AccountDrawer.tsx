"use client";

import { Drawer, InfoRow, InfoSection } from "@/components/shared/Drawer";
import { badge, maskAccountNumber } from "@/lib/theme";
import type { AccountDTO } from "@/lib/api-types";

export function AccountDrawer({
  account,
  onClose,
  onEdit,
  onDelete,
}: {
  account: AccountDTO | null;
  onClose: () => void;
  onEdit: (account: AccountDTO) => void;
  onDelete: (account: AccountDTO) => void;
}) {
  if (!account) return null;

  const recentIncome = account.recentIncomes;

  return (
    <Drawer
      onClose={onClose}
      eyebrow={account.accountType}
      title={account.accountName}
      badge={
        <span style={{ ...badge(account.status === "ACTIVE" ? "green" : "gray"), marginTop: 8, display: "inline-flex" }}>
          {account.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}
        </span>
      }
    >
      {account.qrUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- reason: in-memory object URL, not next/image-optimizable
        <img
          src={account.qrUrl}
          alt="QR Code"
          style={{ display: "block", width: 180, height: 180, objectFit: "contain", margin: "0 auto", borderRadius: 16, background: "rgba(var(--surface-rgb),0.06)", border: "1px solid rgba(var(--surface-rgb),0.12)", padding: 8 }}
        />
      ) : (
        <div
          style={{
            height: 140,
            borderRadius: 16,
            background: "repeating-linear-gradient(135deg,rgba(var(--surface-rgb),0.05) 0 8px,transparent 8px 16px)",
            border: "1px solid rgba(var(--surface-rgb),0.09)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "monospace",
            fontSize: 11,
            color: "rgba(var(--text-rgb),0.4)",
          }}
        >
          QR Code (placeholder)
        </div>
      )}

      <InfoSection title="ข้อมูลบัญชี">
        <InfoRow k="ธนาคาร" v={account.bankName || "—"} />
        <InfoRow k="เลขที่บัญชี" v={account.accountNumber ? maskAccountNumber(account.accountNumber) : "—"} />
        <InfoRow k="ชื่อบัญชี" v={account.accountHolderName || "—"} />
        <InfoRow k="PromptPay ID" v={account.promptpayId || "—"} />
        <InfoRow k="ประเภทบัญชี" v={account.accountType} />
      </InfoSection>

      <InfoSection title="ธุรกรรมล่าสุดที่ใช้บัญชีนี้">
        {recentIncome.length === 0 ? (
          <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.5)" }}>ยังไม่มีธุรกรรม</div>
        ) : (
          recentIncome.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: "1px solid rgba(var(--surface-rgb),0.06)",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.tenant}</div>
                <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)" }}>
                  {r.date} · {r.room}
                </div>
              </div>
              <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, color: "var(--pos)" }}>{r.amount}</div>
            </div>
          ))
        )}
      </InfoSection>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => onDelete(account)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(251,113,133,0.35)",
            background: "rgba(251,113,133,0.08)",
            color: "var(--neg)",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ลบบัญชี
        </button>
        <button
          onClick={() => onEdit(account)}
          style={{
            flex: 1,
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
          แก้ไขข้อมูล
        </button>
      </div>
    </Drawer>
  );
}
