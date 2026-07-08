"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { FormModal, FieldsGrid, TextField, SelectField } from "@/components/shared/FormModal";

export type ServiceTaskDraft = {
  expenseType: "CLEANING" | "REPAIR";
  title: string;
  room: string;
  payeeName: string;
  amount: string; // digits only
};

export type ServiceRoomOption = { no: string; building: string };

const TYPE_OPTIONS = [
  { value: "REPAIR", label: "ซ่อม" },
  { value: "CLEANING", label: "ทำความสะอาด" },
];

function blankDraft(rooms: ServiceRoomOption[]): ServiceTaskDraft {
  return { expenseType: "REPAIR", title: "", room: rooms[0]?.no ?? "", payeeName: "", amount: "" };
}

export function ServiceTaskFormModal({
  open,
  rooms,
  onClose,
  onSubmit,
}: {
  open: boolean;
  rooms: ServiceRoomOption[];
  onClose: () => void;
  onSubmit: (draft: ServiceTaskDraft) => void;
}) {
  const [draft, setDraft] = useState<ServiceTaskDraft>(() => blankDraft(rooms));

  useEffect(() => {
    if (open) setDraft(blankDraft(rooms));
  }, [open, rooms]);

  const roomOptions = rooms.map((r) => ({ value: r.no, label: `${r.no} · ${r.building}` }));

  return (
    <FormModal
      open={open}
      onClose={onClose}
      icon={<Icon name="service" size={18} />}
      title="สร้างงานใหม่"
      subtitle="งานแม่บ้าน/งานซ่อม — ผูกกับห้องเสมอ"
      onSubmit={() => onSubmit(draft)}
      submitLabel="สร้างงาน"
    >
      <FieldsGrid>
        <SelectField
          label="ประเภทงาน"
          value={draft.expenseType}
          onChange={(v) => setDraft({ ...draft, expenseType: v as "CLEANING" | "REPAIR" })}
          options={TYPE_OPTIONS}
        />
        <SelectField label="ห้อง" value={draft.room} onChange={(v) => setDraft({ ...draft, room: v })} options={roomOptions} />
        <TextField
          label="ผู้รับผิดชอบ (ช่าง/แม่บ้าน)"
          value={draft.payeeName}
          onChange={(v) => setDraft({ ...draft, payeeName: v })}
          placeholder="คุณช่างเอก"
        />
        <TextField
          label="ค่าใช้จ่าย (บาท, ไม่บังคับ)"
          value={draft.amount}
          onChange={(v) => setDraft({ ...draft, amount: v.replace(/\D/g, "") })}
          placeholder="0"
        />
      </FieldsGrid>
      <TextField
        label="ชื่องาน"
        value={draft.title}
        onChange={(v) => setDraft({ ...draft, title: v })}
        placeholder="แอร์ไม่เย็น ห้องนอน"
      />
    </FormModal>
  );
}
