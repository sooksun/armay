"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { FormModal, FieldsGrid, TextField, TextAreaField, ToggleField } from "@/components/shared/FormModal";
import type { Owner, OwnerStatus } from "@/lib/mock";

export type OwnerDraft = {
  fullName: string;
  phone: string;
  email: string;
  lineId: string;
  address: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  promptpayId: string;
  note: string;
  status: OwnerStatus;
};

const BLANK_DRAFT: OwnerDraft = {
  fullName: "",
  phone: "",
  email: "",
  lineId: "",
  address: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
  promptpayId: "",
  note: "",
  status: "ACTIVE",
};

export function OwnerFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: Owner | null;
  onClose: () => void;
  onSubmit: (draft: OwnerDraft) => void;
}) {
  const [draft, setDraft] = useState<OwnerDraft>(BLANK_DRAFT);

  useEffect(() => {
    if (!open) return;
    setDraft(
      editing
        ? {
            fullName: editing.fullName,
            phone: editing.phone,
            email: editing.email,
            lineId: editing.lineId,
            address: editing.address,
            bankName: editing.bankName,
            bankAccountNumber: editing.bankAccountNumber,
            bankAccountName: editing.bankAccountName,
            promptpayId: editing.promptpayId,
            note: editing.note,
            status: editing.status,
          }
        : BLANK_DRAFT
    );
  }, [open, editing]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      icon={<Icon name="owners" size={18} />}
      title={editing ? "แก้ไขข้อมูลเจ้าของ" : "เพิ่มเจ้าของใหม่"}
      subtitle="ข้อมูลติดต่อและบัญชีธนาคารสำหรับจ่ายเงิน"
      onSubmit={() => onSubmit(draft)}
      submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มเจ้าของ"}
    >
      <FieldsGrid>
        <TextField label="ชื่อ-นามสกุล" value={draft.fullName} onChange={(v) => setDraft({ ...draft, fullName: v })} placeholder="คุณสมชาย วัฒนโสภณ" />
        <TextField label="เบอร์โทร" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} placeholder="081-234-5678" />
        <TextField label="อีเมล" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} type="email" />
        <TextField label="LINE ID" value={draft.lineId} onChange={(v) => setDraft({ ...draft, lineId: v })} />
      </FieldsGrid>
      <TextAreaField label="ที่อยู่" value={draft.address} onChange={(v) => setDraft({ ...draft, address: v })} />
      <FieldsGrid>
        <TextField label="ธนาคาร" value={draft.bankName} onChange={(v) => setDraft({ ...draft, bankName: v })} placeholder="KBank" />
        <TextField label="เลขที่บัญชี" value={draft.bankAccountNumber} onChange={(v) => setDraft({ ...draft, bankAccountNumber: v })} />
        <TextField label="ชื่อบัญชี" value={draft.bankAccountName} onChange={(v) => setDraft({ ...draft, bankAccountName: v })} />
        <TextField label="PromptPay ID" value={draft.promptpayId} onChange={(v) => setDraft({ ...draft, promptpayId: v })} />
      </FieldsGrid>
      <TextAreaField label="หมายเหตุ" value={draft.note} onChange={(v) => setDraft({ ...draft, note: v })} />
      <ToggleField
        label="สถานะการใช้งาน"
        checked={draft.status === "ACTIVE"}
        onChange={(v) => setDraft({ ...draft, status: v ? "ACTIVE" : "INACTIVE" })}
        onLabel="ใช้งานอยู่"
        offLabel="ปิดใช้งาน"
      />
    </FormModal>
  );
}
