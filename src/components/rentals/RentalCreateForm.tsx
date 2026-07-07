"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FieldsGrid, SelectField, TextField, TextAreaField } from "@/components/shared/FormModal";
import { fmtTHB, parseAmount } from "@/lib/theme";
import { todayBEDate, parseThaiBEDate, formatBEDate } from "@/lib/date";
import { apiGet, apiSend } from "@/lib/api-client";
import type { TenantDTO, RoomDTO } from "@/lib/api-types";

const RENTAL_TYPE_OPTIONS = [
  { value: "MONTHLY", label: "รายเดือน" },
  { value: "DAILY", label: "รายวัน" },
  { value: "YEARLY", label: "รายปี" },
];

/** auto: end date from start + type (MONTHLY -> +1mo −1d, YEARLY -> +1y −1d, DAILY -> +1d) */
function computeEndBE(startBE: string, rentalType: string): string {
  const d = parseThaiBEDate(startBE);
  const end =
    rentalType === "DAILY"
      ? new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1))
      : rentalType === "YEARLY"
        ? new Date(Date.UTC(d.getUTCFullYear() + 1, d.getUTCMonth(), d.getUTCDate() - 1))
        : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate() - 1));
  return formatBEDate(end);
}

type RentalDraft = {
  tenantId: string;
  roomId: string;
  rentalType: string;
  startDate: string;
  endDate: string;
  rentAmount: string;
  depositAmount: string;
  cleaningFee: string;
  otherFee: string;
  discountAmount: string;
  bookingChannel: string;
  note: string;
};

function blankDraft(): RentalDraft {
  return {
    tenantId: "",
    roomId: "",
    rentalType: "MONTHLY",
    startDate: todayBEDate(),
    endDate: computeEndBE(todayBEDate(), "MONTHLY"),
    rentAmount: "",
    depositAmount: "",
    cleaningFee: "",
    otherFee: "",
    discountAmount: "",
    bookingChannel: "",
    note: "",
  };
}

const num = (s: string) => Number(s || "0") || 0;

export function RentalCreateForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [draft, setDraft] = useState<RentalDraft>(blankDraft);
  const [tenants, setTenants] = useState<TenantDTO[]>([]);
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [saving, setSaving] = useState(false);

  const loadOptions = useCallback(async () => {
    try {
      const [t, r] = await Promise.all([apiGet<TenantDTO[]>("/api/tenants"), apiGet<RoomDTO[]>("/api/rooms")]);
      setTenants(t);
      setRooms(r);
    } catch (e) {
      console.error(e);
    }
  }, []);
  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const total = num(draft.rentAmount) + num(draft.depositAmount) + num(draft.cleaningFee) + num(draft.otherFee) - num(draft.discountAmount);

  const tenantOptions = [{ value: "", label: "— เลือกผู้เช่า —" }, ...tenants.map((t) => ({ value: String(t.id), label: `${t.fullName} · ${t.tenantCode}` }))];
  const roomOptions = [{ value: "", label: "— เลือกห้อง —" }, ...rooms.map((r) => ({ value: String(r.id), label: `${r.no} · ${r.building} · ${r.owner}` }))];

  const set = (patch: Partial<RentalDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const digits = (v: string) => v.replace(/\D/g, "");
  const endTouched = useRef(false); // user edited end date manually -> stop auto-computing
  const lastAutoRent = useRef("");

  /** auto: picking a room fills the rent from the room's default price */
  function handleRoomChange(v: string) {
    const rm = rooms.find((r) => String(r.id) === v);
    setDraft((prev) => {
      const next = { ...prev, roomId: v };
      const rent = rm ? parseAmount(rm.rent) : 0;
      const untouched = prev.rentAmount === "" || prev.rentAmount === lastAutoRent.current;
      if (rent > 0 && untouched) {
        next.rentAmount = String(rent);
        lastAutoRent.current = next.rentAmount;
      }
      return next;
    });
  }

  /** auto: keep end date in sync with start/type until the user edits it directly */
  function handleStartOrType(patch: { startDate?: string; rentalType?: string }) {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      if (!endTouched.current) next.endDate = computeEndBE(next.startDate, next.rentalType);
      return next;
    });
  }

  async function handleSubmit() {
    if (!draft.tenantId) return alert("กรุณาเลือกผู้เช่า");
    if (!draft.roomId) return alert("กรุณาเลือกห้อง");
    if (!draft.endDate) return alert("กรุณาระบุวันสิ้นสุด");
    if (num(draft.rentAmount) <= 0) return alert("กรุณาระบุค่าเช่า");
    setSaving(true);
    try {
      await apiSend("/api/rentals", "POST", {
        tenantId: draft.tenantId,
        roomId: draft.roomId,
        rentalType: draft.rentalType,
        startDate: draft.startDate,
        endDate: draft.endDate,
        rentAmount: draft.rentAmount,
        depositAmount: draft.depositAmount || 0,
        cleaningFee: draft.cleaningFee || 0,
        otherFee: draft.otherFee || 0,
        discountAmount: draft.discountAmount || 0,
        bookingChannel: draft.bookingChannel,
        note: draft.note,
      });
      onCreated();
    } catch (e) {
      alert(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: "18px 22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ padding: 20, borderRadius: 18, background: "rgba(var(--surface-rgb),0.04)", border: "1px solid rgba(var(--surface-rgb),0.09)" }}>
        <FieldsGrid>
          <SelectField label="ผู้เช่า" value={draft.tenantId} onChange={(v) => set({ tenantId: v })} options={tenantOptions} />
          <SelectField label="ห้อง (เจ้าของ/อาคาร/ค่าเช่าตามห้อง)" value={draft.roomId} onChange={handleRoomChange} options={roomOptions} />
          <SelectField label="ประเภทการเช่า" value={draft.rentalType} onChange={(v) => handleStartOrType({ rentalType: v })} options={RENTAL_TYPE_OPTIONS} />
          <TextField label="ช่องทางการจอง" value={draft.bookingChannel} onChange={(v) => set({ bookingChannel: v })} placeholder="Walk-in, Agoda, ฯลฯ" />
          <TextField label="วันเริ่มเช่า" value={draft.startDate} onChange={(v) => handleStartOrType({ startDate: v })} placeholder="1 ก.ค. 2569" />
          <TextField
            label="วันสิ้นสุด (คำนวณอัตโนมัติ)"
            value={draft.endDate}
            onChange={(v) => {
              endTouched.current = true;
              set({ endDate: v });
            }}
            placeholder="31 ก.ค. 2569"
          />
          <TextField label="ค่าเช่า (บาท)" value={draft.rentAmount} onChange={(v) => set({ rentAmount: digits(v) })} placeholder="12500" />
          <TextField label="เงินประกัน (บาท)" value={draft.depositAmount} onChange={(v) => set({ depositAmount: digits(v) })} placeholder="24000" />
          <TextField label="ค่าทำความสะอาด (บาท)" value={draft.cleaningFee} onChange={(v) => set({ cleaningFee: digits(v) })} placeholder="500" />
          <TextField label="ค่าใช้จ่ายอื่น (บาท)" value={draft.otherFee} onChange={(v) => set({ otherFee: digits(v) })} placeholder="0" />
          <TextField label="ส่วนลด (บาท)" value={draft.discountAmount} onChange={(v) => set({ discountAmount: digits(v) })} placeholder="0" />
        </FieldsGrid>
        <div style={{ marginTop: 14 }}>
          <TextAreaField label="หมายเหตุ" value={draft.note} onChange={(v) => set({ note: v })} />
        </div>

        <div
          style={{
            marginTop: 16,
            padding: "14px 16px",
            borderRadius: 14,
            background: "rgba(94,234,212,0.09)",
            border: "1px solid rgba(94,234,212,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.7)" }}>ยอดรวมสัญญา (ค่าเช่า + ประกัน + ทำความสะอาด + อื่น − ส่วนลด)</span>
          <span style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 20, color: "var(--pos)" }}>{fmtTHB(total)}</span>
        </div>
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
          disabled={saving}
          style={{
            padding: "11px 22px",
            borderRadius: 12,
            border: "1px solid rgba(var(--surface-rgb),0.28)",
            color: "#04121A",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
            cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
            background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
            boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
          }}
        >
          {saving ? "กำลังบันทึก…" : "บันทึกรายการเช่า"}
        </button>
      </div>
    </div>
  );
}
