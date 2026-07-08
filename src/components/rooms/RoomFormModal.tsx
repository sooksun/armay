"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { FormModal, FieldsGrid, TextField, TextAreaField, SelectField } from "@/components/shared/FormModal";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { GoogleMapPicker } from "@/components/shared/GoogleMapPicker";
import { ROOM_STATUS } from "@/lib/labels";
import { apiGet } from "@/lib/api-client";
import type { RoomDTO, PropertyDTO, OwnerDTO } from "@/lib/api-types";

type RoomStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE" | "INACTIVE";

const STATUS_OPTIONS = Object.entries(ROOM_STATUS).map(([value, label]) => ({ value, label }));

export type RoomDraft = {
  propertyId: string;
  ownerId: string;
  roomNumber: string;
  floor: string;
  roomType: string;
  latitude: string;
  longitude: string;
  roomSize: string;
  defaultRentPrice: string;
  defaultDeposit: string;
  defaultCleaningFee: string;
  defaultCommission: string;
  status: RoomStatus;
  imageUrl: string | null;
  note: string;
};

function blankDraft(): RoomDraft {
  return {
    propertyId: "",
    ownerId: "",
    roomNumber: "",
    floor: "",
    roomType: "",
    latitude: "",
    longitude: "",
    roomSize: "",
    defaultRentPrice: "",
    defaultDeposit: "",
    defaultCleaningFee: "",
    defaultCommission: "",
    status: "AVAILABLE",
    imageUrl: null,
    note: "",
  };
}

const digits = (v: string) => v.replace(/\D/g, "");

/** auto: "301" -> "3", "1203" -> "12" (all but the last two digits) */
function floorFromRoomNo(roomNo: string): string {
  const d = digits(roomNo);
  return d.length >= 3 ? d.slice(0, -2) : "";
}

export function RoomFormModal({
  open,
  editing,
  rooms,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: RoomDTO | null;
  /** existing rooms — used to auto-pick the owner when a property is chosen */
  rooms: RoomDTO[];
  onClose: () => void;
  onSubmit: (draft: RoomDraft) => void;
}) {
  const [draft, setDraft] = useState<RoomDraft>(blankDraft);
  const [properties, setProperties] = useState<PropertyDTO[]>([]);
  const [owners, setOwners] = useState<OwnerDTO[]>([]);
  const [locating, setLocating] = useState(false);
  const lastAutoOwner = useRef("");
  const lastAutoFloor = useRef("");
  const lastAutoDeposit = useRef("");

  const loadOptions = useCallback(async () => {
    try {
      const [p, o] = await Promise.all([apiGet<PropertyDTO[]>("/api/properties"), apiGet<OwnerDTO[]>("/api/owners")]);
      setProperties(p);
      setOwners(o);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    lastAutoOwner.current = "";
    lastAutoFloor.current = "";
    lastAutoDeposit.current = "";
    void loadOptions();
    setDraft(
      editing
        ? {
            propertyId: String(editing.propertyId),
            ownerId: String(editing.ownerId),
            roomNumber: editing.no,
            floor: editing.floor,
            roomType: editing.roomType,
            latitude: editing.latitude,
            longitude: editing.longitude,
            roomSize: editing.roomSize,
            defaultRentPrice: editing.rentValue ? String(editing.rentValue) : "",
            defaultDeposit: editing.depositValue ? String(editing.depositValue) : "",
            defaultCleaningFee: editing.cleaningValue ? String(editing.cleaningValue) : "",
            defaultCommission: editing.commissionValue ? String(editing.commissionValue) : "",
            status: editing.statusValue,
            imageUrl: editing.imageUrl,
            note: editing.note,
          }
        : blankDraft()
    );
  }, [open, editing, loadOptions]);

  const propertyOptions = [{ value: "", label: "— เลือกอาคาร/โครงการ —" }, ...properties.map((p) => ({ value: String(p.id), label: p.propertyName }))];
  const ownerOptions = [{ value: "", label: "— เลือกเจ้าของ —" }, ...owners.map((o) => ({ value: String(o.id), label: `${o.fullName} · ${o.ownerCode}` }))];

  const set = (patch: Partial<RoomDraft>) => setDraft((d) => ({ ...d, ...patch }));

  /** auto: fill lat/long from the device's current position */
  function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert("เบราว์เซอร์นี้ไม่รองรับการอ่านพิกัด");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set({ latitude: pos.coords.latitude.toFixed(7), longitude: pos.coords.longitude.toFixed(7) });
        setLocating(false);
      },
      (err) => {
        alert(`อ่านพิกัดไม่สำเร็จ: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  /** auto: choosing a property fills the owner from another room in that same property */
  function handlePropertyChange(v: string) {
    setDraft((prev) => {
      const next = { ...prev, propertyId: v };
      const sibling = rooms.find((r) => String(r.propertyId) === v);
      const ownerUntouched = prev.ownerId === "" || prev.ownerId === lastAutoOwner.current;
      if (sibling && ownerUntouched) {
        next.ownerId = String(sibling.ownerId);
        lastAutoOwner.current = next.ownerId;
      }
      return next;
    });
  }

  /** auto: floor derived from the room number until the user edits floor directly */
  function handleRoomNumberChange(v: string) {
    setDraft((prev) => {
      const next = { ...prev, roomNumber: v };
      const floorUntouched = prev.floor === "" || prev.floor === lastAutoFloor.current;
      const guess = floorFromRoomNo(v);
      if (guess && floorUntouched) {
        next.floor = guess;
        lastAutoFloor.current = guess;
      }
      return next;
    });
  }

  /** auto: deposit defaults to one month's rent until edited directly */
  function handleRentChange(v: string) {
    const rent = digits(v);
    setDraft((prev) => {
      const next = { ...prev, defaultRentPrice: rent };
      const depositUntouched = prev.defaultDeposit === "" || prev.defaultDeposit === lastAutoDeposit.current;
      if (rent && depositUntouched) {
        next.defaultDeposit = rent;
        lastAutoDeposit.current = rent;
      }
      return next;
    });
  }

  return (
    <FormModal
      open={open}
      onClose={onClose}
      icon={<Icon name="room" size={18} />}
      title={editing ? "แก้ไขข้อมูลห้อง" : "เพิ่มห้องใหม่"}
      subtitle="ผูกกับอาคาร/โครงการและเจ้าของเสมอ · ค่าเช่า/ประกันตั้งเป็นค่าเริ่มต้นของห้อง"
      onSubmit={() => onSubmit(draft)}
      submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มห้อง"}
    >
      <FieldsGrid>
        <SelectField label="อาคาร / โครงการ" value={draft.propertyId} onChange={handlePropertyChange} options={propertyOptions} />
        <SelectField label="เจ้าของ (เติมอัตโนมัติจากอาคาร)" value={draft.ownerId} onChange={(v) => set({ ownerId: v })} options={ownerOptions} />
        <TextField label="เลขห้อง" value={draft.roomNumber} onChange={handleRoomNumberChange} placeholder="301" />
        <TextField label="ชั้น (เติมอัตโนมัติจากเลขห้อง)" value={draft.floor} onChange={(v) => set({ floor: v })} placeholder="3" />
        <TextField label="ประเภทห้อง" value={draft.roomType} onChange={(v) => set({ roomType: v })} placeholder="สตูดิโอ / 1 ห้องนอน" />
        <TextField label="ขนาด (ตร.ม.)" value={draft.roomSize} onChange={(v) => set({ roomSize: digits(v) })} placeholder="28" />
        <TextField label="ค่าเช่า/เดือน (บาท)" value={draft.defaultRentPrice} onChange={handleRentChange} placeholder="12500" />
        <TextField label="เงินประกัน (เติมอัตโนมัติ = ค่าเช่า)" value={draft.defaultDeposit} onChange={(v) => set({ defaultDeposit: digits(v) })} placeholder="12500" />
        <TextField label="ค่าทำความสะอาด (บาท)" value={draft.defaultCleaningFee} onChange={(v) => set({ defaultCleaningFee: digits(v) })} placeholder="500" />
        <TextField label="ค่านายหน้า/เดือน (บาท)" value={draft.defaultCommission} onChange={(v) => set({ defaultCommission: digits(v) })} placeholder="0" />
      </FieldsGrid>
      <SelectField label="สถานะห้อง" value={draft.status} onChange={(v) => set({ status: v as RoomStatus })} options={STATUS_OPTIONS} />
      <FieldsGrid>
        <TextField label="ละติจูด (latitude)" value={draft.latitude} onChange={(v) => set({ latitude: v })} placeholder="13.7398" />
        <TextField label="ลองจิจูด (longitude)" value={draft.longitude} onChange={(v) => set({ longitude: v })} placeholder="100.5804" />
      </FieldsGrid>
      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        style={{
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "9px 14px",
          borderRadius: 11,
          border: "1px solid rgba(94,234,212,0.4)",
          background: "rgba(94,234,212,0.08)",
          color: "var(--text)",
          fontFamily: "inherit",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: locating ? "wait" : "pointer",
        }}
      >
        <span style={{ color: "var(--pos)", display: "flex" }}>
          <Icon name="search" size={15} />
        </span>
        {locating ? "กำลังอ่านพิกัด…" : "ใช้พิกัดปัจจุบันของเครื่อง"}
      </button>
      <GoogleMapPicker
        lat={draft.latitude}
        lng={draft.longitude}
        onPick={(latitude, longitude) => set({ latitude, longitude })}
      />
      <ImageUpload label="รูปห้อง" value={draft.imageUrl} onChange={(url) => set({ imageUrl: url })} />
      <TextAreaField label="หมายเหตุ" value={draft.note} onChange={(v) => set({ note: v })} />
    </FormModal>
  );
}
