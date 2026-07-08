# Service Board Persistence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ทำให้หน้า `/services` (Kanban งานแม่บ้าน/งานซ่อม) สร้างงานและลากเปลี่ยนสถานะโดยบันทึกจริงลง DB

**Architecture:** งาน = `ExpenseTransaction` ประเภท `CLEANING`/`REPAIR` + field ใหม่ `serviceStatus` (enum, nullable) คุมคอลัมน์ Kanban แยกจาก `verificationStatus` (การเงิน) ต่อยอด `expense.service.ts` + route ใหม่ `/api/service-tasks` + FormModal ใหม่ + rewrite หน้า services ให้ดึงข้อมูลจริง

**Tech Stack:** Next.js 15 App Router · Prisma · MySQL · TypeScript strict · zod · shared `FormModal` · HTML5 native drag-and-drop

## Global Constraints

- Money = `Decimal(12,2)`; แปลง/แสดงผ่าน `lib/money.ts` (`decToNumber`, `fmtTHB`) — ห้ามส่ง `Prisma.Decimal` ดิบออก API
- enum เก็บค่าอังกฤษที่ DB; แสดงป้ายไทยผ่าน `lib/labels.ts`
- generate `*_code` ผ่าน `lib/codegen.ts` (`generateCode("EXPENSE","EXP")`) — ห้าม `count()+1`
- ทุก mutation เรียก `writeAudit()` (`lib/services/audit.service.ts`)
- RBAC บังคับที่ server ผ่าน `withAuth(roles, ...)` — GET = `"any"`, POST/PATCH = `["ADMIN","STAFF"]`
- ห้าม `console.log` ใน production code (ยกเว้น `console.error` ใน catch ตาม pattern เดิม)
- Verification: โปรเจกต์ไม่มี vitest — ใช้ `npx tsc --noEmit` เป็น gate ทุก task + manual verify ผ่าน preview (port จาก `.claude/launch.json` = `web`) ใน task สุดท้าย
- Commit convention: Conventional Commits; ปิดท้ายด้วย `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`

---

### Task 1: Schema — enum `ServiceStatus` + field + migration

**Files:**
- Modify: `prisma/schema.prisma` (หลัง `enum ExpenseType`, ภายใน `model ExpenseTransaction`)

**Interfaces:**
- Produces: DB column `expense_transactions.service_status` (nullable) + enum `ServiceStatus { NEW PENDING IN_PROGRESS DONE REVIEW CLOSED }`; Prisma client field `ExpenseTransaction.serviceStatus: ServiceStatus | null`

- [ ] **Step 1: เพิ่ม enum** — วางต่อจากบล็อก `enum ExpenseType { ... }` (ปิดที่บรรทัด ~109)

```prisma
enum ServiceStatus {
  NEW
  PENDING
  IN_PROGRESS
  DONE
  REVIEW
  CLOSED
}
```

- [ ] **Step 2: เพิ่ม field** — ใน `model ExpenseTransaction` ต่อจากบรรทัด `verificationStatus VerificationStatus @default(DRAFT) @map("verification_status")`

```prisma
  serviceStatus      ServiceStatus?     @map("service_status")
```

- [ ] **Step 3: เพิ่ม index** — ในบล็อก `@@index` ของ `model ExpenseTransaction` (ใกล้ `@@index([roomId])`)

```prisma
  @@index([serviceStatus])
```

- [ ] **Step 4: รัน migration**

Run: `npx prisma migrate dev --name expense_service_status`
Expected: สร้างไฟล์ `prisma/migrations/*_expense_service_status/migration.sql` และ regenerate client สำเร็จ (ไม่มี prompt เพราะ field nullable ไม่มี default บังคับ)

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: ผ่าน (ไม่มี error)

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(services): add ServiceStatus enum + serviceStatus field to expenses

Refs: service-board-persist"
```

---

### Task 2: Labels — SERVICE_STATUS maps

**Files:**
- Modify: `src/lib/labels.ts` (หลัง `export const EXPENSE_TYPE`, บรรทัด ~113)

**Interfaces:**
- Produces: `SERVICE_STATUS: LabelMap`, `SERVICE_STATUS_ORDER: readonly string[]`, `SERVICE_STATUS_COLOR: Record<string,string>`, `SERVICE_TYPE_BADGE: Record<string,BadgeKind>`

- [ ] **Step 1: เพิ่ม maps** — วางต่อจาก `EXPENSE_TYPE`

```ts
export const SERVICE_STATUS: LabelMap = {
  NEW: "งานใหม่",
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังดำเนินการ",
  DONE: "เสร็จแล้ว",
  REVIEW: "รอตรวจสอบ",
  CLOSED: "ปิดงานแล้ว",
};

export const SERVICE_STATUS_ORDER = ["NEW", "PENDING", "IN_PROGRESS", "DONE", "REVIEW", "CLOSED"] as const;

export const SERVICE_STATUS_COLOR: Record<string, string> = {
  NEW: "#38BDF8",
  PENDING: "#FBBF24",
  IN_PROGRESS: "#A855F7",
  DONE: "#34D399",
  REVIEW: "#FB7185",
  CLOSED: "#94A3B8",
};

export const SERVICE_TYPE_BADGE: Record<string, BadgeKind> = {
  CLEANING: "purple",
  REPAIR: "blue",
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: ผ่าน (`BadgeKind` ถูก import อยู่แล้วที่บรรทัด 1)

- [ ] **Step 3: Commit**

```bash
git add src/lib/labels.ts
git commit -m "feat(services): add SERVICE_STATUS label/color/badge maps

Refs: service-board-persist"
```

---

### Task 3: DTO types

**Files:**
- Modify: `src/lib/api-types.ts` (เพิ่มท้ายไฟล์)

**Interfaces:**
- Consumes: `BadgeKind` (import มีอยู่แล้วในไฟล์)
- Produces: `ServiceTaskDTO`, `ServiceColumnDTO`, `ServiceBoardDTO`

- [ ] **Step 1: เพิ่ม types** — ท้ายไฟล์

```ts
export type ServiceTaskDTO = {
  id: number;
  type: string; // Thai label ของ expenseType
  typeBadge: BadgeKind;
  title: string;
  room: string;
  building: string;
  assignee: string;
  cost: string; // "฿1,300" หรือ "฿—" เมื่อ 0
  color: string; // สีตาม serviceStatus
  photos: boolean;
  serviceStatus: string; // enum value
};

export type ServiceColumnDTO = { title: string; status: string; color: string; tasks: ServiceTaskDTO[] };
export type ServiceBoardDTO = ServiceColumnDTO[];
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: ผ่าน

- [ ] **Step 3: Commit**

```bash
git add src/lib/api-types.ts
git commit -m "feat(services): add ServiceTask/ServiceBoard DTO types

Refs: service-board-persist"
```

---

### Task 4: Validation schema

**Files:**
- Create: `src/lib/validation/service-task.schema.ts`

**Interfaces:**
- Produces: `serviceTaskCreateSchema`, `serviceStatusUpdateSchema`, `ServiceTaskCreateInput`, `ServiceStatusUpdateInput`, `SERVICE_STATUS_VALUES`

- [ ] **Step 1: สร้างไฟล์**

```ts
import { z } from "zod";

export const SERVICE_STATUS_VALUES = ["NEW", "PENDING", "IN_PROGRESS", "DONE", "REVIEW", "CLOSED"] as const;

export const serviceTaskCreateSchema = z.object({
  expenseType: z.enum(["CLEANING", "REPAIR"]),
  title: z.string().min(1, "กรุณาระบุชื่องาน"),
  room: z.string().min(1, "กรุณาเลือกห้อง"),
  payeeName: z.string().default(""),
  amount: z.coerce.number().nonnegative().default(0),
});

export const serviceStatusUpdateSchema = z.object({
  serviceStatus: z.enum(SERVICE_STATUS_VALUES),
});

export type ServiceTaskCreateInput = z.infer<typeof serviceTaskCreateSchema>;
export type ServiceStatusUpdateInput = z.infer<typeof serviceStatusUpdateSchema>;
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: ผ่าน

- [ ] **Step 3: Commit**

```bash
git add src/lib/validation/service-task.schema.ts
git commit -m "feat(services): add service-task zod schemas

Refs: service-board-persist"
```

---

### Task 5: Service layer — board list, create, status update, DRAFT filter

**Files:**
- Modify: `src/lib/services/expense.service.ts`

**Interfaces:**
- Consumes: `resolveRoom`, `generateCode`, `writeAudit`, `INCLUDE`, `ExpenseWithRelations`, `decToNumber`, `fmtTHB` (มีในไฟล์แล้ว); `SERVICE_STATUS`, `SERVICE_STATUS_ORDER`, `SERVICE_STATUS_COLOR`, `SERVICE_TYPE_BADGE`, `EXPENSE_TYPE` (labels); `ServiceTaskCreateInput`, `ServiceStatusUpdateInput` (validation); `ServiceBoardDTO`, `ServiceTaskDTO` (api-types)
- Produces: `listServiceBoard()`, `createServiceTask(input, session)`, `updateServiceStatus(id, status, session)`

- [ ] **Step 1: เพิ่ม import** — แก้บรรทัด import ด้านบนไฟล์

แก้บรรทัด labels import ให้รวมของใหม่:
```ts
import {
  EXPENSE_TYPE,
  RESPONSIBILITY,
  VERIFICATION_STATUS,
  VERIFICATION_BADGE,
  fromThai,
  SERVICE_STATUS,
  SERVICE_STATUS_ORDER,
  SERVICE_STATUS_COLOR,
  SERVICE_TYPE_BADGE,
} from "@/lib/labels";
```

เพิ่ม 2 import ใหม่ (ต่อจาก import เดิม):
```ts
import type { ServiceBoardDTO, ServiceTaskDTO } from "@/lib/api-types";
import type { ServiceTaskCreateInput, ServiceStatusUpdateInput } from "@/lib/validation/service-task.schema";
```
(หมายเหตุ: `ExpenseDTO, ExpenseListDTO, ExpenseSummaryDTO` import เดิมคงไว้; รวม `ServiceBoardDTO, ServiceTaskDTO` เข้ากับบรรทัด `import type { ... } from "@/lib/api-types"` เดิมได้)

- [ ] **Step 2: กรอง DRAFT ออกจากยอดรวม** — ใน `summarize()` แก้บรรทัด guard

เปลี่ยนจาก:
```ts
    if (t.verificationStatus === "CANCELLED") continue; // never count cancelled in summary totals
```
เป็น:
```ts
    if (t.verificationStatus === "CANCELLED" || t.verificationStatus === "DRAFT") continue; // ร่าง/ยกเลิก ไม่นับในยอดรวม
```

- [ ] **Step 3: เพิ่ม DTO mapper + 3 ฟังก์ชัน** — วางท้ายไฟล์

```ts
function toServiceTaskDTO(t: ExpenseWithRelations): ServiceTaskDTO {
  const status = t.serviceStatus ?? "NEW";
  const amt = decToNumber(t.amount);
  return {
    id: t.id,
    type: EXPENSE_TYPE[t.expenseType] ?? t.expenseType,
    typeBadge: SERVICE_TYPE_BADGE[t.expenseType] ?? "gray",
    title: t.description ?? "",
    room: t.room.roomNumber,
    building: t.property?.propertyName ?? "",
    assignee: t.payeeName ?? "",
    cost: amt > 0 ? fmtTHB(amt) : "฿—",
    color: SERVICE_STATUS_COLOR[status] ?? "#94A3B8",
    photos: Boolean(t.beforeImageUrl || t.afterImageUrl),
    serviceStatus: status,
  };
}

export async function listServiceBoard(): Promise<ServiceBoardDTO> {
  const rows = await prisma.expenseTransaction.findMany({
    where: { serviceStatus: { not: null } },
    orderBy: { updatedAt: "desc" },
    include: INCLUDE,
  });
  return SERVICE_STATUS_ORDER.map((status) => ({
    title: SERVICE_STATUS[status],
    status,
    color: SERVICE_STATUS_COLOR[status],
    tasks: rows.filter((r) => r.serviceStatus === status).map(toServiceTaskDTO),
  }));
}

export async function createServiceTask(input: ServiceTaskCreateInput, session: Session): Promise<number> {
  const room = await resolveRoom(input.room);
  const expenseCode = await generateCode("EXPENSE", "EXP");
  const created = await prisma.expenseTransaction.create({
    data: {
      expenseCode,
      expenseDate: new Date(),
      roomId: room.id,
      ownerId: room.ownerId,
      propertyId: room.propertyId,
      expenseType: input.expenseType,
      description: input.title,
      payeeName: input.payeeName || null,
      amount: input.amount,
      paymentMethod: "CASH",
      responsibilityType: "BROKER",
      verificationStatus: "DRAFT",
      serviceStatus: "NEW",
    },
  });
  await writeAudit({ userId: session.userId, action: "CREATE", tableName: "expense_transactions", recordId: created.id, newValue: input });
  return created.id;
}

export async function updateServiceStatus(
  id: number,
  status: ServiceStatusUpdateInput["serviceStatus"],
  session: Session
): Promise<number> {
  const existing = await prisma.expenseTransaction.findUnique({ where: { id } });
  if (!existing) throw new ApiError("NOT_FOUND", "ไม่พบงานนี้", 404);
  if (existing.serviceStatus === null) throw new ApiError("NOT_A_SERVICE_TASK", "รายการนี้ไม่ใช่งานบนบอร์ด", 400);
  await prisma.expenseTransaction.update({ where: { id }, data: { serviceStatus: status } });
  await writeAudit({
    userId: session.userId,
    action: "UPDATE",
    tableName: "expense_transactions",
    recordId: id,
    oldValue: { serviceStatus: existing.serviceStatus },
    newValue: { serviceStatus: status },
  });
  return id;
}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: ผ่าน — ถ้า Prisma บ่นเรื่อง enum literal ให้ cast `expenseType: input.expenseType as Prisma.ExpenseTransactionCreateInput["expenseType"]` และเช่นเดียวกันกับ `serviceStatus`/`verificationStatus`/`responsibilityType` (ตาม pattern `mapInput` เดิมในไฟล์)

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/expense.service.ts
git commit -m "feat(services): board list + create + status update; exclude DRAFT from totals

Refs: service-board-persist"
```

---

### Task 6: API routes

**Files:**
- Create: `src/app/api/service-tasks/route.ts`
- Create: `src/app/api/service-tasks/[id]/route.ts`

**Interfaces:**
- Consumes: `withAuth`, `listServiceBoard`, `createServiceTask`, `updateServiceStatus`, `serviceTaskCreateSchema`, `serviceStatusUpdateSchema`, `ApiError`
- Produces: `GET/POST /api/service-tasks`, `PATCH /api/service-tasks/[id]`

- [ ] **Step 1: สร้าง `route.ts`**

```ts
import { withAuth } from "@/lib/api/handler";
import { listServiceBoard, createServiceTask } from "@/lib/services/expense.service";
import { serviceTaskCreateSchema } from "@/lib/validation/service-task.schema";

export const GET = withAuth("any", async () => listServiceBoard());

export const POST = withAuth(["ADMIN", "STAFF"], async (req, { session }) => {
  const input = serviceTaskCreateSchema.parse(await req.json());
  return { id: await createServiceTask(input, session) };
});
```

- [ ] **Step 2: สร้าง `[id]/route.ts`**

```ts
import { withAuth } from "@/lib/api/handler";
import { updateServiceStatus } from "@/lib/services/expense.service";
import { serviceStatusUpdateSchema } from "@/lib/validation/service-task.schema";
import { ApiError } from "@/lib/api/response";

export const PATCH = withAuth(["ADMIN", "STAFF"], async (req, { session, params }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id)) throw new ApiError("BAD_ID", "รหัสงานไม่ถูกต้อง", 400);
  const { serviceStatus } = serviceStatusUpdateSchema.parse(await req.json());
  return { id: await updateServiceStatus(id, serviceStatus, session) };
});
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: ผ่าน

- [ ] **Step 4: Commit**

```bash
git add src/app/api/service-tasks
git commit -m "feat(services): /api/service-tasks GET/POST + [id] PATCH

Refs: service-board-persist"
```

---

### Task 7: FormModal component

**Files:**
- Create: `src/components/services/ServiceTaskFormModal.tsx`

**Interfaces:**
- Consumes: shared `FormModal`, `FieldsGrid`, `TextField`, `SelectField`; `Icon`
- Produces: `ServiceTaskFormModal`, `ServiceTaskDraft`, `ServiceRoomOption`

- [ ] **Step 1: สร้างไฟล์**

```tsx
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: ผ่าน

- [ ] **Step 3: Commit**

```bash
git add src/components/services/ServiceTaskFormModal.tsx
git commit -m "feat(services): ServiceTaskFormModal (create job form)

Refs: service-board-persist"
```

---

### Task 8: UI — rewrite services page (fetch + create + drag persist)

**Files:**
- Modify: `src/app/(dashboard)/services/page.tsx` (แทนที่ทั้งไฟล์)

**Interfaces:**
- Consumes: `apiGet`, `apiSend`, `ServiceBoardDTO`, `RoomDTO`, `ServiceTaskFormModal`, `ServiceTaskDraft`, `badge`, `Icon`, `initials`
- Produces: หน้า `/services` ที่ทำงานจริง

- [ ] **Step 1: แทนที่ทั้งไฟล์ด้วยโค้ดนี้**

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { badge } from "@/lib/theme";
import { initials } from "@/lib/mock";
import { ServiceTaskFormModal, type ServiceTaskDraft } from "@/components/services/ServiceTaskFormModal";
import { apiGet, apiSend } from "@/lib/api-client";
import type { ServiceBoardDTO, RoomDTO } from "@/lib/api-types";

export default function ServicesPage() {
  const [columns, setColumns] = useState<ServiceBoardDTO>([]);
  const [rooms, setRooms] = useState<RoomDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setColumns(await apiGet<ServiceBoardDTO>("/api/service-tasks"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    apiGet<RoomDTO[]>("/api/rooms").then(setRooms).catch(console.error);
  }, []);

  async function moveTask(id: number, toStatus: string) {
    const from = columns.find((c) => c.tasks.some((t) => t.id === id));
    if (!from || from.status === toStatus) return;
    const task = from.tasks.find((t) => t.id === id)!;
    const target = columns.find((c) => c.status === toStatus);
    const prev = columns;
    setColumns((cols) =>
      cols.map((c) => {
        if (c.status === from.status) return { ...c, tasks: c.tasks.filter((t) => t.id !== id) };
        if (c.status === toStatus) return { ...c, tasks: [...c.tasks, { ...task, color: target?.color ?? task.color, serviceStatus: toStatus }] };
        return c;
      })
    );
    try {
      await apiSend(`/api/service-tasks/${id}`, "PATCH", { serviceStatus: toStatus });
    } catch (e) {
      setColumns(prev);
      alert(e instanceof Error ? e.message : "ย้ายงานไม่สำเร็จ");
    }
  }

  async function handleCreate(draft: ServiceTaskDraft) {
    try {
      await apiSend("/api/service-tasks", "POST", {
        expenseType: draft.expenseType,
        title: draft.title,
        room: draft.room,
        payeeName: draft.payeeName,
        amount: draft.amount === "" ? 0 : Number(draft.amount),
      });
      setFormOpen(false);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "สร้างงานไม่สำเร็จ");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.6)" }}>
          ลากการ์ดเพื่อเปลี่ยนสถานะงาน · ผูกกับห้องและค่าใช้จ่ายเสมอ
        </div>
        <button
          onClick={() => setFormOpen(true)}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 15px",
            borderRadius: 11,
            border: "1px solid rgba(var(--surface-rgb),0.28)",
            color: "#04121A",
            fontFamily: "inherit",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            background: "linear-gradient(135deg,#FBBF24,#F59E0B)",
            boxShadow: "0 6px 16px rgba(251,191,36,0.35)",
          }}
        >
          <Icon name="plus" size={15} />
          สร้างงานใหม่
        </button>
      </div>

      {loading && <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.5)" }}>กำลังโหลด…</div>}

      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
        {columns.map((col) => (
          <div
            key={col.status}
            onDragOver={(e) => {
              e.preventDefault();
              if (overStatus !== col.status) setOverStatus(col.status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverStatus((s) => (s === col.status ? null : s));
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragId != null) void moveTask(dragId, col.status);
              setDragId(null);
              setOverStatus(null);
            }}
            style={{
              flex: "0 0 268px",
              width: 268,
              borderRadius: 20,
              background: overStatus === col.status ? "rgba(var(--surface-rgb),0.09)" : "rgba(var(--surface-rgb),0.04)",
              border: `1px solid rgba(var(--surface-rgb),${overStatus === col.status ? 0.28 : 0.1})`,
              outline: overStatus === col.status ? `2px dashed ${col.color}` : "none",
              outlineOffset: -2,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 11,
              transition: "background 0.12s, border-color 0.12s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: col.color, boxShadow: `0 0 10px ${col.color}` }} />
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>{col.title}</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11.5,
                  color: "rgba(var(--text-rgb),0.5)",
                  background: "rgba(var(--surface-rgb),0.06)",
                  padding: "1px 8px",
                  borderRadius: 20,
                }}
              >
                {col.tasks.length}
              </span>
            </div>

            {col.tasks.map((tk) => (
              <div
                key={tk.id}
                draggable
                onDragStart={(e) => {
                  setDragId(tk.id);
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(tk.id));
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverStatus(null);
                }}
                style={{
                  padding: 13,
                  borderRadius: 15,
                  background: "rgba(var(--surface-rgb),0.06)",
                  border: "1px solid rgba(var(--surface-rgb),0.11)",
                  borderLeft: `3px solid ${tk.color}`,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
                  cursor: "grab",
                  opacity: dragId === tk.id ? 0.4 : 1,
                  transition: "opacity 0.12s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <span style={badge(tk.typeBadge)}>{tk.type}</span>
                  {tk.photos ? (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 10.5,
                        color: "rgba(var(--text-rgb),0.5)",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                    >
                      <Icon name="image" size={12} />
                      ก่อน/หลัง
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{tk.title}</div>
                <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.55)", marginTop: 3 }}>
                  {tk.room} · {tk.building}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 11,
                    paddingTop: 10,
                    borderTop: "1px solid rgba(var(--surface-rgb),0.08)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "rgba(var(--text-rgb),0.6)" }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 6,
                        background: "linear-gradient(135deg,#A855F7,#38BDF8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                      }}
                    >
                      {initials(tk.assignee)}
                    </span>
                    {tk.assignee}
                  </div>
                  <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 12.5, color: "var(--neg)" }}>{tk.cost}</div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <ServiceTaskFormModal
        open={formOpen}
        rooms={rooms.map((r) => ({ no: r.no, building: r.building }))}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: ผ่าน

- [ ] **Step 3: Manual verify ผ่าน preview**

1. `preview_start` (config `web`) → login (`admin@armay.local` / `owner123!`) → ไป `/services`
2. board โหลดจาก DB (ตอนแรกอาจว่างทุกคอลัมน์ถ้ายังไม่มีงาน — ปกติ)
3. กด "สร้างงานใหม่" → กรอกประเภท/ห้อง/ชื่องาน → "สร้างงาน" → การ์ดโผล่ในคอลัมน์ "งานใหม่"
4. ลากการ์ดไป "กำลังดำเนินการ" → reload หน้า → การ์ดยังอยู่คอลัมน์ใหม่ (persist)
5. เช็ค `preview_console_logs` (level error) ว่าไม่มี error
6. `preview_screenshot` เป็นหลักฐาน

Expected: สร้าง + ลาก persist ได้ ไม่มี console error

- [ ] **Step 4: Commit**

```bash
git add "src/app/(dashboard)/services/page.tsx"
git commit -m "feat(services): fetch real board + create job + drag-to-persist status

Refs: service-board-persist"
```

---

## Self-Review

**1. Spec coverage:**
- §4 schema → Task 1 ✓ · §6 labels → Task 2 ✓ · §7 service (list/create/update) → Task 5 ✓ · §5 DRAFT filter → Task 5 Step 2 ✓ · §8 validation → Task 4 ✓ · §9 API → Task 6 ✓ · §10 UI (fetch+form+drag) → Task 7+8 ✓ · §11 RBAC → Task 6 (withAuth) ✓ · DTO (§13) → Task 3 ✓
- §12 test: unit vitest ไม่มีในโปรเจกต์ → แทนด้วย typecheck + manual preview (ระบุใน Global Constraints + Task 8 Step 3) — เป็น gap ที่ยอมรับตาม constraint จริงของ repo

**2. Placeholder scan:** ไม่มี TBD/TODO; ทุก step ที่แก้โค้ดมี code block จริง ✓

**3. Type consistency:**
- `serviceStatus` เป็น `string` ใน DTO, enum literal ใน validation/Prisma — สอดคล้อง (API ส่ง enum value ตรง)
- `ServiceBoardDTO = ServiceColumnDTO[]` ใช้ตรงกันใน service (return) + page (state) ✓
- `ServiceTaskDraft.expenseType: "CLEANING"|"REPAIR"` ตรงกับ `serviceTaskCreateSchema.expenseType` ✓
- `moveTask(id, toStatus)` / `handleCreate(draft)` ชื่อตรงกันใน Task 8 ✓
- `initials` import จาก `@/lib/mock` (มีจริง, ใช้ในไฟล์เดิม) ✓
