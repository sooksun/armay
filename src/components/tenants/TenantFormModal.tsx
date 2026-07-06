"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { FormModal, FieldsGrid, TextField, TextAreaField, ToggleField } from "@/components/shared/FormModal";
import type { Tenant, TenantStatus } from "@/lib/mock";

export type TenantDraft = {
  fullName: string;
  phone: string;
  email: string;
  lineId: string;
  idCardOrPassport: string;
  nationality: string;
  address: string;
  note: string;
  blacklist: boolean;
  status: TenantStatus;
};

const BLANK_DRAFT: TenantDraft = {
  fullName: "",
  phone: "",
  email: "",
  lineId: "",
  idCardOrPassport: "",
  nationality: "ไทย",
  address: "",
  note: "",
  blacklist: false,
  status: "ACTIVE",
};

export function TenantFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: Tenant | null;
  onClose: () => void;
  onSubmit: (draft: TenantDraft) => void;
}) {
  const [draft, setDraft] = useState<TenantDraft>(BLANK_DRAFT);

  useEffect(() => {
    if (!open) return;
    setDraft(
      editing
        ? {
            fullName: editing.fullName,
            phone: editing.phone,
            email: editing.email,
            lineId: editing.lineId,
            idCardOrPassport: editing.idCardOrPassport,
            nationality: editing.nationality,
            address: editing.address,
            note: editing.note,
            blacklist: editing.blacklist,
            status: editing.status,
          }
        : BLANK_DRAFT
    );
  }, [open, editing]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      icon={<Icon name="tenant" size={18} />}
      title={editing ? "แก้ไขข้อมูลผู้เช่า" : "เพิ่มผู้เช่าใหม่"}
      subtitle="ข้อมูลติดต่อและเอกสารยืนยันตัวตน"
      onSubmit={() => onSubmit(draft)}
      submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มผู้เช่า"}
    >
      <FieldsGrid>
        <TextField label="ชื่อ-นามสกุล" value={draft.fullName} onChange={(v) => setDraft({ ...draft, fullName: v })} placeholder="คุณกิตติพงษ์ ใจดี" />
        <TextField label="เบอร์โทร" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} placeholder="081-234-5678" />
        <TextField label="อีเมล" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} type="email" />
        <TextField label="LINE ID" value={draft.lineId} onChange={(v) => setDraft({ ...draft, lineId: v })} />
        <TextField label="เลขบัตรประชาชน/Passport" value={draft.idCardOrPassport} onChange={(v) => setDraft({ ...draft, idCardOrPassport: v })} />
        <TextField label="สัญชาติ" value={draft.nationality} onChange={(v) => setDraft({ ...draft, nationality: v })} />
      </FieldsGrid>
      <TextAreaField label="ที่อยู่" value={draft.address} onChange={(v) => setDraft({ ...draft, address: v })} />
      <TextAreaField label="หมายเหตุ" value={draft.note} onChange={(v) => setDraft({ ...draft, note: v })} />
      <ToggleField
        label="Blacklist / Watchlist"
        checked={draft.blacklist}
        onChange={(v) => setDraft({ ...draft, blacklist: v })}
        onLabel="ติดสถานะ Blacklist"
        offLabel="ปกติ"
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
