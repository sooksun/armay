"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { FormModal, FieldsGrid, TextField, SelectField, ToggleField } from "@/components/shared/FormModal";
import { ROLE_OPTIONS, ROLE_LABEL, type UserRole, type UserStatus } from "@/lib/mock";
import type { UserDTO } from "@/lib/api-types";

export type UserDraft = {
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

const BLANK_DRAFT: UserDraft = {
  fullName: "",
  email: "",
  role: "STAFF",
  status: "ACTIVE",
};

export function UserFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: UserDTO | null;
  onClose: () => void;
  onSubmit: (draft: UserDraft) => void;
}) {
  const [draft, setDraft] = useState<UserDraft>(BLANK_DRAFT);

  useEffect(() => {
    if (!open) return;
    setDraft(
      editing
        ? { fullName: editing.fullName, email: editing.email, role: editing.role, status: editing.status }
        : BLANK_DRAFT
    );
  }, [open, editing]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      icon={<Icon name="users" size={18} />}
      title={editing ? "แก้ไขผู้ใช้งาน" : "เพิ่มผู้ใช้งานใหม่"}
      subtitle="กำหนดบทบาทและสิทธิ์การเข้าถึง"
      onSubmit={() => onSubmit(draft)}
      submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มผู้ใช้งาน"}
    >
      <FieldsGrid>
        <TextField label="ชื่อ-นามสกุล" value={draft.fullName} onChange={(v) => setDraft({ ...draft, fullName: v })} placeholder="คุณสมหญิง ผู้ช่วย" />
        <TextField label="อีเมล" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} type="email" placeholder="user@armay.local" />
      </FieldsGrid>
      <SelectField
        label="บทบาท / สิทธิ์"
        value={draft.role}
        onChange={(v) => setDraft({ ...draft, role: v as UserRole })}
        options={ROLE_OPTIONS.map((r) => ({ value: r, label: `${r} · ${ROLE_LABEL[r]}` }))}
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
