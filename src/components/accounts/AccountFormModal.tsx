"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { FormModal, FieldsGrid, TextField, SelectField, ToggleField } from "@/components/shared/FormModal";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { ACCOUNT_TYPE_OPTIONS, type AccountType, type PaymentAccountRecord, type AccountStatus } from "@/lib/mock";

export type AccountDraft = {
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  promptpayId: string;
  accountType: AccountType;
  status: AccountStatus;
  qrUrl: string | null;
};

const BLANK_DRAFT: AccountDraft = {
  accountName: "",
  bankName: "",
  accountNumber: "",
  accountHolderName: "",
  promptpayId: "",
  accountType: ACCOUNT_TYPE_OPTIONS[0],
  status: "ACTIVE",
  qrUrl: null,
};

export function AccountFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: PaymentAccountRecord | null;
  onClose: () => void;
  onSubmit: (draft: AccountDraft) => void;
}) {
  const [draft, setDraft] = useState<AccountDraft>(BLANK_DRAFT);

  useEffect(() => {
    if (!open) return;
    setDraft(
      editing
        ? {
            accountName: editing.accountName,
            bankName: editing.bankName,
            accountNumber: editing.accountNumber,
            accountHolderName: editing.accountHolderName,
            promptpayId: editing.promptpayId,
            accountType: editing.accountType,
            status: editing.status,
            qrUrl: editing.qrUrl,
          }
        : BLANK_DRAFT
    );
  }, [open, editing]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      icon={<Icon name="account" size={18} />}
      title={editing ? "แก้ไขบัญชีรับ-จ่าย" : "เพิ่มบัญชีรับ-จ่ายใหม่"}
      subtitle="ใช้เลือกตอนบันทึกรายรับหรือจ่ายเงิน"
      onSubmit={() => onSubmit(draft)}
      submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มบัญชี"}
    >
      <FieldsGrid>
        <TextField label="ชื่อบัญชี" value={draft.accountName} onChange={(v) => setDraft({ ...draft, accountName: v })} placeholder="บัญชีรับเงินผู้เช่า" />
        <SelectField
          label="ประเภทบัญชี"
          value={draft.accountType}
          onChange={(v) => setDraft({ ...draft, accountType: v as AccountType })}
          options={ACCOUNT_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
        />
        <TextField label="ธนาคาร" value={draft.bankName} onChange={(v) => setDraft({ ...draft, bankName: v })} placeholder="KBank" />
        <TextField label="เลขที่บัญชี" value={draft.accountNumber} onChange={(v) => setDraft({ ...draft, accountNumber: v })} />
        <TextField label="ชื่อเจ้าของบัญชี" value={draft.accountHolderName} onChange={(v) => setDraft({ ...draft, accountHolderName: v })} />
        <TextField label="PromptPay ID" value={draft.promptpayId} onChange={(v) => setDraft({ ...draft, promptpayId: v })} />
      </FieldsGrid>
      <ImageUpload
        label="แนบ QR Code"
        aspect="square"
        value={draft.qrUrl}
        onChange={(url) => setDraft({ ...draft, qrUrl: url })}
        hint="รองรับ JPG, PNG · แสดง preview ทันที"
      />
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
