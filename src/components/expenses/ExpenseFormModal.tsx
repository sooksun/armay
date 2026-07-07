"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { FormModal, FieldsGrid, TextField, TextAreaField, SelectField } from "@/components/shared/FormModal";
import { ImageUpload } from "@/components/shared/ImageUpload";
import {
  EXPENSE_TYPE_OPTIONS,
  RESPONSIBILITY_OPTIONS,
  ROOMS,
  type ExpenseRow,
  type Responsibility,
} from "@/lib/mock";

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

const ROOM_OPTIONS = ROOMS.map((r) => ({ value: r.no, label: `${r.no} · ${r.building}` }));

const BLANK_DRAFT: ExpenseDraft = {
  date: "6 ก.ค. 2568",
  room: ROOMS[0].no,
  expenseType: EXPENSE_TYPE_OPTIONS[0],
  description: "",
  payeeName: "",
  amount: "",
  responsibility: RESPONSIBILITY_OPTIONS[0],
  status: "รอจ่าย",
  beforeUrl: null,
  afterUrl: null,
};

export function ExpenseFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: ExpenseRow | null;
  onClose: () => void;
  onSubmit: (draft: ExpenseDraft) => void;
}) {
  const [draft, setDraft] = useState<ExpenseDraft>(BLANK_DRAFT);

  useEffect(() => {
    if (!open) return;
    setDraft(
      editing
        ? {
            date: editing.date,
            room: editing.room,
            expenseType: editing.expenseType,
            description: editing.description,
            payeeName: editing.payeeName,
            amount: editing.amount.replace(/\D/g, ""),
            responsibility: editing.responsibility,
            status: editing.status,
            beforeUrl: editing.beforeUrl,
            afterUrl: editing.afterUrl,
          }
        : BLANK_DRAFT
    );
  }, [open, editing]);

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
      <FieldsGrid>
        <SelectField label="ห้อง" value={draft.room} onChange={(v) => setDraft({ ...draft, room: v })} options={ROOM_OPTIONS} />
        <SelectField
          label="ประเภทค่าใช้จ่าย"
          value={draft.expenseType}
          onChange={(v) => setDraft({ ...draft, expenseType: v })}
          options={EXPENSE_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
        />
        <TextField label="จำนวนเงิน (บาท)" value={draft.amount} onChange={(v) => setDraft({ ...draft, amount: v.replace(/\D/g, "") })} placeholder="1300" />
        <TextField label="วันที่" value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} placeholder="6 ก.ค. 2568" />
        <TextField label="ผู้รับเงิน (แม่บ้าน/ช่าง/ร้านค้า)" value={draft.payeeName} onChange={(v) => setDraft({ ...draft, payeeName: v })} placeholder="คุณช่างเอก" />
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
