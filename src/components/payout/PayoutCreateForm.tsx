"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FieldsGrid, SelectField, TextField } from "@/components/shared/FormModal";
import { fmtTHB } from "@/lib/theme";
import { PAYMENT_METHOD } from "@/lib/labels";
import { todayBEDate } from "@/lib/date";
import { apiGet, apiSend } from "@/lib/api-client";
import type { OwnerDTO, RentalDTO, PayoutPreviewDTO } from "@/lib/api-types";

const METHOD_OPTIONS = [{ value: "", label: "— ไม่ระบุ —" }, ...Object.entries(PAYMENT_METHOD).map(([value, label]) => ({ value, label }))];
const num = (s: string) => Number(s || "0") || 0;

type ExpenseLine = { sourceId: number; label: string; amount: number; checked: boolean };

export function PayoutCreateForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [owners, setOwners] = useState<OwnerDTO[]>([]);
  const [contracts, setContracts] = useState<RentalDTO[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [contractId, setContractId] = useState("");
  const [gross, setGross] = useState("");
  const [commission, setCommission] = useState("");
  const [lines, setLines] = useState<ExpenseLine[]>([]);
  const [previewed, setPreviewed] = useState(false);
  const [payoutDate, setPayoutDate] = useState(todayBEDate());
  const [paymentMethod, setPaymentMethod] = useState("");
  const [ownerBankAccount, setOwnerBankAccount] = useState("");
  const [note, setNote] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadOptions = useCallback(async () => {
    try {
      const [o, r] = await Promise.all([apiGet<OwnerDTO[]>("/api/owners"), apiGet<RentalDTO[]>("/api/rentals")]);
      setOwners(o);
      setContracts(r);
    } catch (e) {
      console.error(e);
    }
  }, []);
  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const selectedOwner = owners.find((o) => String(o.id) === ownerId) ?? null;

  const ownerOptions = [{ value: "", label: "— เลือกเจ้าของ —" }, ...owners.map((o) => ({ value: String(o.id), label: `${o.fullName} · ${o.ownerCode}` }))];
  const contractOptions = useMemo(() => {
    const forOwner = selectedOwner ? contracts.filter((c) => c.owner === selectedOwner.fullName) : contracts;
    return [{ value: "", label: "— ทั้งหมดของเจ้าของ —" }, ...forOwner.map((c) => ({ value: String(c.id), label: `${c.code} · ${c.room}` }))];
  }, [contracts, selectedOwner]);

  async function runPreview() {
    if (!ownerId) return alert("กรุณาเลือกเจ้าของก่อน");
    setLoadingPreview(true);
    try {
      const qs = contractId ? `?ownerId=${ownerId}&contractId=${contractId}` : `?ownerId=${ownerId}`;
      const data = await apiGet<PayoutPreviewDTO>(`/api/payouts/preview${qs}`);
      setGross(String(Math.round(data.gross)));
      setLines(data.ownerExpenses.map((e) => ({ ...e, checked: true })));
      // auto: commission from the owner's usual rate; bank account from the owner profile
      if (!commission && data.suggestedCommission > 0) setCommission(String(data.suggestedCommission));
      if (!ownerBankAccount && selectedOwner) {
        const bank = [selectedOwner.bankName, selectedOwner.bankAccountNumber].filter(Boolean).join(" ");
        if (bank) setOwnerBankAccount(bank);
      }
      setPreviewed(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "คำนวณไม่สำเร็จ");
    } finally {
      setLoadingPreview(false);
    }
  }

  const deductChecked = lines.filter((l) => l.checked).reduce((s, l) => s + l.amount, 0);
  const net = num(gross) - num(commission) - deductChecked;

  function toggleLine(sourceId: number) {
    setLines((ls) => ls.map((l) => (l.sourceId === sourceId ? { ...l, checked: !l.checked } : l)));
  }

  async function handleSubmit() {
    if (!ownerId) return alert("กรุณาเลือกเจ้าของ");
    if (!previewed) return alert("กรุณากด “คำนวณยอด” ก่อนบันทึก");
    setSaving(true);
    try {
      await apiSend("/api/payouts", "POST", {
        ownerId,
        contractId: contractId || null,
        payoutDate,
        grossIncomeAmount: gross || 0,
        commissionAmount: commission || 0,
        deductions: lines.filter((l) => l.checked).map((l) => ({ sourceId: l.sourceId, label: l.label, amount: l.amount })),
        paymentMethod: paymentMethod || null,
        ownerBankAccount,
        note,
      });
      onCreated();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  const calcRow = (label: string, value: string, opts: { neg?: boolean; bold?: boolean; top?: boolean } = {}) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "13px 16px",
        fontSize: 13.5,
        borderTop: opts.top ? "1px solid rgba(var(--surface-rgb),0.1)" : undefined,
        background: opts.bold ? "rgba(94,234,212,0.09)" : "rgba(var(--surface-rgb),0.02)",
      }}
    >
      <span style={{ color: "rgba(var(--text-rgb),0.75)" }}>{label}</span>
      <span style={{ fontFamily: "Sora,sans-serif", fontWeight: opts.bold ? 700 : 600, color: opts.bold ? "var(--pos)" : opts.neg ? "var(--neg)" : "var(--text)", fontSize: opts.bold ? 17 : 13.5 }}>{value}</span>
    </div>
  );

  return (
    <div style={{ padding: "18px 22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: 20, borderRadius: 18, background: "rgba(var(--surface-rgb),0.04)", border: "1px solid rgba(var(--surface-rgb),0.09)" }}>
        <FieldsGrid>
          <SelectField
            label="เจ้าของ"
            value={ownerId}
            onChange={(v) => {
              setOwnerId(v);
              setContractId("");
              setPreviewed(false);
              setLines([]);
              setGross("");
            }}
            options={ownerOptions}
          />
          <SelectField label="รายการเช่า (ตัวเลือก)" value={contractId} onChange={(v) => { setContractId(v); setPreviewed(false); }} options={contractOptions} />
        </FieldsGrid>

        <div style={{ marginTop: 14 }}>
          <button
            onClick={runPreview}
            disabled={loadingPreview}
            style={{
              padding: "10px 18px",
              borderRadius: 11,
              border: "1px solid rgba(168,85,247,0.4)",
              background: "linear-gradient(135deg,rgba(168,85,247,0.2),rgba(56,189,248,0.14))",
              color: "var(--text)",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: loadingPreview ? "wait" : "pointer",
            }}
          >
            {loadingPreview ? "กำลังคำนวณ…" : "คำนวณยอด (ดึงรายรับ + ค่าใช้จ่ายเจ้าของ)"}
          </button>
        </div>

        {previewed && (
          <>
            <div style={{ marginTop: 16 }}>
              <FieldsGrid>
                <TextField label="รายรับรวม (บาท)" value={gross} onChange={(v) => setGross(v.replace(/\D/g, ""))} />
                <TextField label="ค่านายหน้า (บาท)" value={commission} onChange={(v) => setCommission(v.replace(/\D/g, ""))} placeholder="เช่น 10% ของรายรับ" />
              </FieldsGrid>
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12.5, color: "rgba(var(--text-rgb),0.6)", marginBottom: 8 }}>รายการหักค่าใช้จ่าย (ความรับผิดชอบเจ้าของ)</div>
              {lines.length === 0 && <div style={{ fontSize: 12.5, color: "rgba(var(--text-rgb),0.45)" }}>ไม่มีค่าใช้จ่ายเจ้าของที่ยังไม่ถูกหัก</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lines.map((l) => (
                  <label
                    key={l.sourceId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 13px",
                      borderRadius: 11,
                      background: l.checked ? "rgba(251,113,133,0.08)" : "rgba(var(--surface-rgb),0.03)",
                      border: `1px solid ${l.checked ? "rgba(251,113,133,0.28)" : "rgba(var(--surface-rgb),0.1)"}`,
                      cursor: "pointer",
                    }}
                  >
                    <input type="checkbox" checked={l.checked} onChange={() => toggleLine(l.sourceId)} />
                    <span style={{ flex: 1, fontSize: 13 }}>{l.label}</span>
                    <span style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, color: "var(--neg)" }}>−{fmtTHB(l.amount)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(var(--surface-rgb),0.1)" }}>
              {calcRow("รายรับรวม", fmtTHB(num(gross)))}
              {calcRow("หัก ค่านายหน้า", `−${fmtTHB(num(commission))}`, { neg: true, top: true })}
              {calcRow("หัก ค่าใช้จ่ายเจ้าของ", `−${fmtTHB(deductChecked)}`, { neg: true, top: true })}
              {calcRow("ยอดสุทธิจ่ายเจ้าของ", fmtTHB(net), { bold: true, top: true })}
            </div>

            <div style={{ marginTop: 16 }}>
              <FieldsGrid>
                <TextField label="วันที่จ่าย" value={payoutDate} onChange={setPayoutDate} placeholder="7 ก.ค. 2569" />
                <SelectField label="ช่องทางจ่าย" value={paymentMethod} onChange={setPaymentMethod} options={METHOD_OPTIONS} />
                <TextField label="บัญชีเจ้าของ" value={ownerBankAccount} onChange={setOwnerBankAccount} placeholder="ธนาคาร · เลขบัญชี" />
                <TextField label="หมายเหตุ" value={note} onChange={setNote} placeholder="งวดการจ่าย ฯลฯ" />
              </FieldsGrid>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button
          onClick={onClose}
          style={{
            padding: "11px 18px",
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
          disabled={saving || !previewed}
          style={{
            padding: "11px 22px",
            borderRadius: 12,
            border: "1px solid rgba(var(--surface-rgb),0.28)",
            color: "#04121A",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
            cursor: saving || !previewed ? "not-allowed" : "pointer",
            opacity: saving || !previewed ? 0.55 : 1,
            background: "linear-gradient(135deg,#A855F7,#38BDF8)",
            boxShadow: "0 6px 16px rgba(168,85,247,0.4)",
          }}
        >
          {saving ? "กำลังบันทึก…" : "ยืนยันการจ่ายเจ้าของ"}
        </button>
      </div>
    </div>
  );
}
