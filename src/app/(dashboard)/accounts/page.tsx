"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { badge, maskAccountNumber } from "@/lib/theme";
import { AccountDrawer } from "@/components/accounts/AccountDrawer";
import { AccountFormModal, type AccountDraft } from "@/components/accounts/AccountFormModal";
import { apiGet, apiSend } from "@/lib/api-client";
import type { AccountDTO } from "@/lib/api-types";

function accountNumberDisplay(a: AccountDTO): string {
  if (a.accountType === "เงินสด") return "เงินสด — ไม่มีเลขบัญชี";
  if (a.accountNumber) return `${a.bankName} · ${maskAccountNumber(a.accountNumber)}`;
  if (a.promptpayId) return `PromptPay · ${a.promptpayId}`;
  return "—";
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setAccounts(await apiGet<AccountDTO[]>("/api/payment-accounts"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const selected = accounts.find((a) => a.id === selectedId) ?? null;
  const editing = accounts.find((a) => a.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }
  function openEdit(a: AccountDTO) {
    setEditingId(a.id);
    setFormOpen(true);
  }
  async function handleSubmit(draft: AccountDraft) {
    try {
      if (editingId != null) await apiSend(`/api/payment-accounts/${editingId}`, "PATCH", draft);
      else await apiSend("/api/payment-accounts", "POST", draft);
      setFormOpen(false);
      setEditingId(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    }
  }
  async function handleDelete(a: AccountDTO) {
    if (!confirm(`ยืนยันลบบัญชี "${a.accountName}"?`)) return;
    try {
      await apiSend(`/api/payment-accounts/${a.id}`, "DELETE");
      setSelectedId(null);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={openCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 15px",
            borderRadius: 11,
            border: "1px solid rgba(var(--surface-rgb),0.28)",
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
          เพิ่มบัญชี
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "40px 16px", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>กำลังโหลด…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
          {accounts.map((a) => (
            <div
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              style={{
                cursor: "pointer",
                padding: 18,
                borderRadius: 20,
                background: "linear-gradient(135deg,rgba(94,234,212,0.1),rgba(168,85,247,0.1))",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(var(--surface-rgb),0.14)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={badge("purple")}>{a.accountType}</span>
                <span style={badge(a.status === "ACTIVE" ? "green" : "gray")}>{a.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}</span>
              </div>
              <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 16, marginTop: 14 }}>{a.accountName}</div>
              <div style={{ fontSize: 12.5, color: "rgba(var(--text-rgb),0.65)", marginTop: 4 }}>{accountNumberDisplay(a)}</div>
              <div
                style={{
                  marginTop: 14,
                  height: 64,
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "rgba(var(--surface-rgb),0.06)",
                  border: "1px solid rgba(var(--surface-rgb),0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "monospace",
                  fontSize: 10.5,
                  color: "rgba(var(--text-rgb),0.4)",
                }}
              >
                {a.qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- reason: in-memory object URL, not next/image-optimizable
                  <img src={a.qrUrl} alt="QR" style={{ height: "100%", width: "100%", objectFit: "contain" }} />
                ) : (
                  "QR"
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AccountDrawer
        account={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(a) => {
          setSelectedId(null);
          openEdit(a);
        }}
        onDelete={handleDelete}
      />

      <AccountFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
