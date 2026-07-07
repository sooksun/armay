"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { FormModal, FieldsGrid, TextField, TextAreaField, SelectField } from "@/components/shared/FormModal";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { EXPENSE_TYPE_OPTIONS, RESPONSIBILITY_OPTIONS, type Responsibility } from "@/lib/mock";
import { todayBEDate } from "@/lib/date";
import type { ExpenseDTO } from "@/lib/api-types";

export const EXPENSE_STATUS_OPTIONS = ["รอจ่าย", "จ่ายแล้ว", "รอตรวจสอบ", "มีปัญหา"];

export type ExpenseDraft = {
  date: string;
  room: string;
  expenseType: string;
  description: string;
  payeeName: string;
  amount: string; // digits only
  responsibility: Responsibility;
  status: string;
  beforeUrl: string | null;
  afterUrl: string | null;
};

export type ExpenseRoomOption = { no: string; building: string };

function blankDraft(rooms: ExpenseRoomOption[]): ExpenseDraft {
  return {
    date: todayBEDate(),
    room: rooms[0]?.no ?? "",
    expenseType: EXPENSE_TYPE_OPTIONS[0],
    description: "",
    payeeName: "",
    amount: "",
    responsibility: RESPONSIBILITY_OPTIONS[0],
    status: "รอจ่าย",
    beforeUrl: null,
    afterUrl: null,
  };
}

export function ExpenseFormModal({
  open,
  editing,
  rooms,
  history = [],
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: ExpenseDTO | null;
  /** real rooms from the API (roomNumber + building) */
  rooms: ExpenseRoomOption[];
  /** past expenses — used to auto-suggest amount / payee for the same room+type */
  history?: ExpenseDTO[];
  onClose: () => void;
  onSubmit: (draft: ExpenseDraft) => void;
}) {
  const [draft, setDraft] = useState<ExpenseDraft>(() => blankDraft(rooms));
  const lastAutoAmount = useRef("");
  const lastAutoPayee = useRef("");

  useEffect(() => {
    if (!open) return;
    lastAutoAmount.current = "";
    lastAutoPayee.current = "";
    setDraft(
      editing
        ? {
            date: editing.date,
            room: editing.room,
            expenseType: editing.expenseType,
            description: editing.description,
            payeeName: editing.payeeName,
            amount: editing.amount.replace(/\D/g, ""),
            responsibility: editing.responsibility as Responsibility,
            status: editing.status,
            beforeUrl: editing.beforeUrl,
            afterUrl: editing.afterUrl,
          }
        : blankDraft(rooms)
    );
  }, [open, editing, rooms]);

  const roomOptions = rooms.map((r) => ({ value: r.no, label: `${r.no} · ${r.building}` }));
  const payeeSuggestions = [...new Set(history.map((h) => h.payeeName).filter(Boolean))];

  /** auto: when room/type changes (create mode), prefill amount + payee from the last matching expense */
  function applyHistorySuggestion(next: ExpenseDraft): ExpenseDraft {
    if (editing) return next;
    const match =
      history.find((h) => h.room === next.room && h.expenseType === next.expenseType) ??
      history.find((h) => h.expenseType === next.expenseType);
    if (!match) return next;
    const amountUntouched = next.amount === "" || next.amount === lastAutoAmount.current;
    if (amountUntouched) {
      next.amount = match.amount.replace(/\D/g, "");
      lastAutoAmount.current = next.amount;
    }
    const payeeUntouched = next.payeeName === "" || next.payeeName === lastAutoPayee.current;
    if (match.payeeName && payeeUntouched) {
      next.payeeName = match.payeeName;
      lastAutoPayee.current = next.payeeName;
    }
    return next;
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      icon={<Icon name="expense" size={18} />}
      title={editing ? "แก้ไขรายการค่าใช้จ่าย" : "บันทึกค่าใช้จ่ายห้อง"}
      subtitle="ค่าแม่บ้าน ค่าซ่อม ค่าวัสดุ ฯลฯ — ผูกกับห้องเสมอ"
      onSubmit={() => onSubmit(draft)}
      submitLabel={editing ? "บันทึกการแก้ไข" : "บันทึกค่าใช้จ่าย"}
    >
      <datalist id="expense-payees">
        {payeeSuggestions.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <FieldsGrid>
        <SelectField
          label="ห้อง"
          value={draft.room}
          onChange={(v) => setDraft((prev) => applyHistorySuggestion({ ...prev, room: v }))}
          options={roomOptions}
        />
        <SelectField
          label="ประเภทค่าใช้จ่าย"
          value={draft.expenseType}
          onChange={(v) => setDraft((prev) => applyHistorySuggestion({ ...prev, expenseType: v }))}
          options={EXPENSE_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
        />
        <TextField label="จำนวนเงิน (บาท)" value={draft.amount} onChange={(v) => setDraft({ ...draft, amount: v.replace(/\D/g, "") })} placeholder="1300" />
        <TextField label="วันที่" value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} placeholder={todayBEDate()} />
        <TextField
          label="ผู้รับเงิน (แม่บ้าน/ช่าง/ร้านค้า)"
          value={draft.payeeName}
          onChange={(v) => setDraft({ ...draft, payeeName: v })}
          placeholder="คุณช่างเอก"
          listId="expense-payees"
        />
        <SelectField
          label="ผู้รับผิดชอบค่าใช้จ่าย"
          value={draft.responsibility}
          onChange={(v) => setDraft({ ...draft, responsibility: v as Responsibility })}
          options={RESPONSIBILITY_OPTIONS.map((t) => ({ value: t, label: t }))}
        />
      </FieldsGrid>
      <TextAreaField label="รายละเอียดงาน" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} />
      <SelectField
        label="สถานะ"
        value={draft.status}
        onChange={(v) => setDraft({ ...draft, status: v })}
        options={EXPENSE_STATUS_OPTIONS.map((t) => ({ value: t, label: t }))}
      />
      <FieldsGrid>
        <ImageUpload label="รูปก่อนซ่อม/ทำ" value={draft.beforeUrl} onChange={(url) => setDraft({ ...draft, beforeUrl: url })} />
        <ImageUpload label="รูปหลังซ่อม/ทำ" value={draft.afterUrl} onChange={(url) => setDraft({ ...draft, afterUrl: url })} />
      </FieldsGrid>
    </FormModal>
  );
}
