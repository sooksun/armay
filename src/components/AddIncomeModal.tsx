"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { FieldsGrid, SelectField, TextField } from "@/components/shared/FormModal";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { INCOME_TYPE, PAYMENT_METHOD, ACCOUNT_TYPE } from "@/lib/labels";
import { todayBEDate } from "@/lib/date";
import { parseAmount } from "@/lib/theme";
import { extractFromSlipFile } from "@/lib/slip/extract";
import { apiGet, apiSend } from "@/lib/api-client";
import type { RentalDTO, AccountDTO, IncomeDetailDTO } from "@/lib/api-types";
import { useUI } from "@/lib/ui-context";

const INCOME_TYPE_OPTIONS = Object.entries(INCOME_TYPE).map(([value, label]) => ({ value, label }));
const METHOD_OPTIONS = Object.entries(PAYMENT_METHOD).map(([value, label]) => ({ value, label }));

type IncomeDraft = {
  contractId: string;
  incomeType: string;
  amount: string;
  incomeDate: string;
  paymentMethod: string;
  receivingAccountId: string;
  transactionReference: string;
};

function blankDraft(): IncomeDraft {
  return {
    contractId: "",
    incomeType: "RENT",
    amount: "",
    incomeDate: todayBEDate(),
    paymentMethod: "PROMPTPAY",
    receivingAccountId: "",
    transactionReference: "",
  };
}

export function AddIncomeModal() {
  const { incomeOpen, editingIncomeId, closeIncome } = useUI();
  const isEdit = editingIncomeId != null;
  const [draft, setDraft] = useState<IncomeDraft>(blankDraft);
  const [slip, setSlip] = useState<string | null>(null);
  const [contracts, setContracts] = useState<RentalDTO[]>([]);
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [saving, setSaving] = useState(false);
  const [slipStatus, setSlipStatus] = useState<string | null>(null);
  const lastAutoAmount = useRef(""); // remembers auto-filled amount so we never clobber user edits

  const loadOptions = useCallback(async (applyDefaultAccount: boolean) => {
    try {
      const [rent, acc] = await Promise.all([apiGet<RentalDTO[]>("/api/rentals"), apiGet<AccountDTO[]>("/api/payment-accounts")]);
      setContracts(rent);
      setAccounts(acc);
      if (applyDefaultAccount) {
        // auto: default receiving account = first "รับผู้เช่า" account
        const preferred = acc.find((a) => a.accountType === ACCOUNT_TYPE.RECEIVE_TENANT) ?? acc[0];
        if (preferred) setDraft((prev) => (prev.receivingAccountId ? prev : { ...prev, receivingAccountId: String(preferred.id) }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!incomeOpen) return;
    setDraft(blankDraft());
    setSlip(null);
    setSlipStatus(null);
    lastAutoAmount.current = "";
    if (editingIncomeId != null) {
      void (async () => {
        await loadOptions(false);
        try {
          const d = await apiGet<IncomeDetailDTO>(`/api/incomes/${editingIncomeId}`);
          setDraft({
            contractId: String(d.contractId),
            incomeType: d.incomeType,
            amount: String(d.amount),
            incomeDate: d.incomeDate,
            paymentMethod: d.paymentMethod,
            receivingAccountId: d.receivingAccountId ? String(d.receivingAccountId) : "",
            transactionReference: d.transactionReference,
          });
          setSlip(d.proofFileUrl);
        } catch (e) {
          console.error(e);
        }
      })();
    } else {
      void loadOptions(true);
    }
  }, [incomeOpen, editingIncomeId, loadOptions]);

  if (!incomeOpen) return null;

  /** auto: picking a contract fills the amount with its outstanding balance */
  function handleContractChange(v: string) {
    const c = contracts.find((x) => String(x.id) === v);
    setDraft((prev) => {
      const next = { ...prev, contractId: v };
      const due = c ? parseAmount(c.due) : 0;
      const amountUntouched = prev.amount === "" || prev.amount === lastAutoAmount.current;
      if (due > 0 && amountUntouched) {
        next.amount = String(due);
        lastAutoAmount.current = next.amount;
      }
      return next;
    });
  }

  /** auto: read amount / transfer date / reference out of the attached slip */
  async function handleSlipFile(file: File) {
    setSlipStatus("กำลังอ่านข้อมูลจากสลิป…");
    try {
      const d = await extractFromSlipFile(file);
      setDraft((prev) => {
        const next = { ...prev };
        if (d.amount && (prev.amount === "" || prev.amount === lastAutoAmount.current)) {
          next.amount = String(Math.round(d.amount));
          lastAutoAmount.current = next.amount;
        }
        if (d.dateBE) next.incomeDate = d.dateBE;
        if (d.reference && !prev.transactionReference) next.transactionReference = d.reference;
        return next;
      });
      const found = [
        d.amount ? `฿${Math.round(d.amount).toLocaleString()}` : null,
        d.dateBE ?? null,
        d.reference ? `Ref ${d.reference.slice(0, 14)}` : null,
      ].filter(Boolean);
      setSlipStatus(
        found.length
          ? `อ่านสลิปสำเร็จ (${d.via.join("+")}): ${found.join(" · ")} — ตรวจสอบก่อนบันทึก`
          : "อ่านข้อมูลจากสลิปไม่ได้ — กรุณากรอกเอง"
      );
    } catch (e) {
      console.error(e);
      setSlipStatus("อ่านข้อมูลจากสลิปไม่ได้ — กรุณากรอกเอง");
    }
  }

  const selectedContract = contracts.find((c) => String(c.id) === draft.contractId) ?? null;

  const contractOptions = [
    { value: "", label: "— เลือกรายการเช่า —" },
    ...contracts.map((c) => ({ value: String(c.id), label: `${c.code} · ${c.tenant} · ${c.room}` })),
  ];
  const accountOptions = [
    { value: "", label: "— ไม่ระบุ —" },
    ...accounts.map((a) => ({ value: String(a.id), label: a.bankName ? `${a.accountName} · ${a.bankName}` : a.accountName })),
  ];

  async function handleSubmit() {
    if (!draft.contractId) {
      alert("กรุณาเลือกรายการเช่า");
      return;
    }
    if (!draft.amount || Number(draft.amount) <= 0) {
      alert("กรุณาระบุจำนวนเงิน");
      return;
    }
    setSaving(true);
    try {
      await apiSend(isEdit ? `/api/incomes/${editingIncomeId}` : "/api/incomes", isEdit ? "PATCH" : "POST", {
        contractId: draft.contractId,
        incomeDate: draft.incomeDate,
        incomeType: draft.incomeType,
        amount: draft.amount,
        paymentMethod: draft.paymentMethod,
        receivingAccountId: draft.receivingAccountId || null,
        transactionReference: draft.transactionReference,
        proofFileUrl: slip,
      });
      closeIncome();
      window.dispatchEvent(new CustomEvent("armay:income-changed"));
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

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
          background: "linear-gradient(180deg,rgba(var(--panel2-rgb),0.96),rgba(var(--panel-rgb),0.96))",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(var(--surface-rgb),0.16)",
          boxShadow: "0 30px 70px rgba(0,0,0,0.5),inset 0 1px 0 rgba(var(--surface-rgb),0.2)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px", borderBottom: "1px solid rgba(var(--surface-rgb),0.1)" }}>
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
            <Icon name="income" size={18} />
          </span>
          <div>
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 17 }}>{isEdit ? "แก้ไขรายการรับเงิน" : "บันทึกรับเงิน"}</div>
            <div style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.5)" }}>แนบสลิปเพื่อยืนยันการโอน</div>
          </div>
          <button
            onClick={closeIncome}
            style={{
              marginLeft: "auto",
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(var(--surface-rgb),0.14)",
              background: "rgba(var(--surface-rgb),0.05)",
              color: "var(--text)",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 15 }}>
          {selectedContract && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 13,
                background: "rgba(56,189,248,0.1)",
                border: "1px solid rgba(56,189,248,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.6)" }}>รายการเช่าที่เลือก</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 1 }}>
                  {selectedContract.code} · {selectedContract.tenant} · {selectedContract.room}
                </div>
              </div>
              <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 18, color: "var(--neg)" }}>{selectedContract.due}</div>
            </div>
          )}

          <FieldsGrid>
            <SelectField label="รายการเช่า" value={draft.contractId} onChange={handleContractChange} options={contractOptions} />
            <SelectField label="ประเภทรายรับ" value={draft.incomeType} onChange={(v) => setDraft({ ...draft, incomeType: v })} options={INCOME_TYPE_OPTIONS} />
            <TextField label="จำนวนเงิน (บาท)" value={draft.amount} onChange={(v) => setDraft({ ...draft, amount: v.replace(/\D/g, "") })} placeholder="12500" />
            <TextField label="วันที่รับเงิน" value={draft.incomeDate} onChange={(v) => setDraft({ ...draft, incomeDate: v })} placeholder="7 ก.ค. 2569" />
            <SelectField label="ช่องทางรับเงิน" value={draft.paymentMethod} onChange={(v) => setDraft({ ...draft, paymentMethod: v })} options={METHOD_OPTIONS} />
            <SelectField label="บัญชีที่รับเงิน" value={draft.receivingAccountId} onChange={(v) => setDraft({ ...draft, receivingAccountId: v })} options={accountOptions} />
          </FieldsGrid>
          <TextField label="เลขอ้างอิงการโอน (ถ้ามี)" value={draft.transactionReference} onChange={(v) => setDraft({ ...draft, transactionReference: v })} placeholder="เช่น เลขที่สลิป" />

          <ImageUpload
            label="แนบสลิปการโอน (ระบบอ่านจำนวนเงิน/วันที่/เลขอ้างอิงอัตโนมัติ)"
            value={slip}
            onChange={setSlip}
            onFileSelected={handleSlipFile}
            accept="image/*,application/pdf"
            hint="รองรับ JPG, PNG, PDF · ระบบดึงข้อมูลจากสลิปให้อัตโนมัติ"
          />
          {slipStatus && (
            <div
              style={{
                padding: "9px 12px",
                borderRadius: 11,
                background: "rgba(94,234,212,0.08)",
                border: "1px solid rgba(94,234,212,0.28)",
                fontSize: 12,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: "var(--pos)", display: "flex" }}>
                <Icon name="audit" size={14} />
              </span>
              {slipStatus}
            </div>
          )}

          <div
            style={{
              padding: "11px 13px",
              borderRadius: 12,
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.3)",
              fontSize: 12.5,
              color: "#FDE68A",
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <Icon name="alert" size={16} />
            หากไม่มีสลิป ระบบจะตั้งสถานะเป็น “ต้องตรวจสอบ” โดยอัตโนมัติ
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 11,
            padding: "16px 24px",
            borderTop: "1px solid rgba(var(--surface-rgb),0.1)",
            background: "rgba(var(--surface-rgb),0.02)",
          }}
        >
          <button
            onClick={closeIncome}
            style={{
              padding: "11px 20px",
              borderRadius: 12,
              border: "1px solid rgba(var(--surface-rgb),0.16)",
              background: "rgba(var(--surface-rgb),0.05)",
              color: "var(--text)",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: "11px 24px",
              borderRadius: 12,
              border: "1px solid rgba(var(--surface-rgb),0.28)",
              color: "#04121A",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.7 : 1,
              background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
              boxShadow: "0 8px 20px rgba(56,189,248,0.42)",
            }}
          >
            {saving ? "กำลังบันทึก…" : isEdit ? "บันทึกการแก้ไข" : "ยืนยันการบันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}
