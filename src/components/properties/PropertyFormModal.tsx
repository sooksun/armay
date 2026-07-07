"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { FormModal, FieldsGrid, TextField, TextAreaField, SelectField, ToggleField } from "@/components/shared/FormModal";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { PROPERTY_TYPE_OPTIONS, type Property, type PropertyStatus } from "@/lib/mock";

export type PropertyDraft = {
  propertyName: string;
  propertyType: string;
  address: string;
  province: string;
  district: string;
  subdistrict: string;
  contactName: string;
  contactPhone: string;
  note: string;
  monthlyIncome: number;
  status: PropertyStatus;
  latitude: string;
  longitude: string;
  imageUrl: string | null;
};

const BLANK_DRAFT: PropertyDraft = {
  propertyName: "",
  propertyType: PROPERTY_TYPE_OPTIONS[0],
  address: "",
  province: "",
  district: "",
  subdistrict: "",
  contactName: "",
  contactPhone: "",
  note: "",
  monthlyIncome: 0,
  status: "ACTIVE",
  latitude: "",
  longitude: "",
  imageUrl: null,
};

export function PropertyFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: Property | null;
  onClose: () => void;
  onSubmit: (draft: PropertyDraft) => void;
}) {
  const [draft, setDraft] = useState<PropertyDraft>(BLANK_DRAFT);

  useEffect(() => {
    if (!open) return;
    setDraft(
      editing
        ? {
            propertyName: editing.propertyName,
            propertyType: editing.propertyType,
            address: editing.address,
            province: editing.province,
            district: editing.district,
            subdistrict: editing.subdistrict,
            contactName: editing.contactName,
            contactPhone: editing.contactPhone,
            note: editing.note,
            monthlyIncome: editing.monthlyIncome,
            status: editing.status,
            latitude: editing.latitude,
            longitude: editing.longitude,
            imageUrl: editing.imageUrl,
          }
        : BLANK_DRAFT
    );
  }, [open, editing]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      icon={<Icon name="building" size={18} />}
      title={editing ? "แก้ไขข้อมูลอาคาร" : "เพิ่มอาคาร/โครงการใหม่"}
      subtitle="ข้อมูลที่ตั้งและผู้ติดต่อของอาคาร"
      onSubmit={() => onSubmit(draft)}
      submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มอาคาร"}
    >
      <FieldsGrid>
        <TextField label="ชื่ออาคาร/โครงการ" value={draft.propertyName} onChange={(v) => setDraft({ ...draft, propertyName: v })} placeholder="เดอะ เครสท์" />
        <SelectField
          label="ประเภทอาคาร"
          value={draft.propertyType}
          onChange={(v) => setDraft({ ...draft, propertyType: v })}
          options={PROPERTY_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
        />
      </FieldsGrid>
      <TextAreaField label="ที่อยู่" value={draft.address} onChange={(v) => setDraft({ ...draft, address: v })} />
      <FieldsGrid>
        <TextField label="จังหวัด" value={draft.province} onChange={(v) => setDraft({ ...draft, province: v })} />
        <TextField label="อำเภอ/เขต" value={draft.district} onChange={(v) => setDraft({ ...draft, district: v })} />
        <TextField label="ตำบล/แขวง" value={draft.subdistrict} onChange={(v) => setDraft({ ...draft, subdistrict: v })} />
        <TextField
          label="รายรับโดยประมาณ/เดือน (บาท)"
          value={String(draft.monthlyIncome)}
          onChange={(v) => setDraft({ ...draft, monthlyIncome: parseInt(v.replace(/\D/g, ""), 10) || 0 })}
        />
      </FieldsGrid>
      <FieldsGrid>
        <TextField label="ผู้ติดต่ออาคาร" value={draft.contactName} onChange={(v) => setDraft({ ...draft, contactName: v })} />
        <TextField label="เบอร์โทร" value={draft.contactPhone} onChange={(v) => setDraft({ ...draft, contactPhone: v })} />
      </FieldsGrid>
      <FieldsGrid>
        <TextField label="ละติจูด (latitude)" value={draft.latitude} onChange={(v) => setDraft({ ...draft, latitude: v })} placeholder="13.7398" />
        <TextField label="ลองจิจูด (longitude)" value={draft.longitude} onChange={(v) => setDraft({ ...draft, longitude: v })} placeholder="100.5804" />
      </FieldsGrid>
      <ImageUpload label="รูปอาคาร" value={draft.imageUrl} onChange={(url) => setDraft({ ...draft, imageUrl: url })} />
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
