# Design — งานแม่บ้าน/งานซ่อม (Service Board) แบบบันทึกจริง

> วันที่: 2026-07-08 · สถานะ: รอผู้ใช้ review
> เกี่ยวข้อง: T-103 (maintenance view) ใน `docs/handoff/tasks.md`

## 1. เป้าหมาย

ทำให้หน้า `/services` (Kanban "งานแม่บ้าน/งานซ่อม") ทำงานจริงแทน mockup:

1. ปุ่ม **"สร้างงานใหม่"** เปิดฟอร์ม → บันทึกงานลง DB จริง
2. การ์ดบนบอร์ดดึงจาก DB จริง (แทน `KANBAN_COLUMNS` ใน `lib/mock.ts`)
3. **ลากการ์ดข้ามคอลัมน์ → บันทึกสถานะงานลง DB** (optimistic update)

## 2. การตัดสินใจเชิงสถาปัตยกรรม (อนุมัติแล้ว)

- **A — งาน = `ExpenseTransaction`** ประเภท `CLEANING`/`REPAIR` (ตาม T-103) ไม่สร้าง entity ใหม่
  เหตุผล: business rule "งานผูกกับห้องและค่าใช้จ่ายเสมอ"; `ExpenseTransaction` มี `beforeImageUrl`/`afterImageUrl` (= ก่อน/หลัง) และ `payeeName` (= ผู้รับผิดชอบ) อยู่แล้ว
- **สองมิติแยกกัน**: `serviceStatus` (สถานะงาน, คุมด้วยการลาก) เป็นอิสระจาก `verificationStatus` (สถานะการเงิน, อนุมัติ/จ่ายที่หน้า "รายจ่าย" ตามเดิม) การลากงานไม่แตะสถานะการเงิน
- **ค่าใช้จ่ายไม่บังคับ** (default 0) — งานใหม่มักยังไม่รู้ราคา กรอกทีหลังได้
- **ลาก = บันทึกทันที (optimistic)** — UI ขยับก่อน ถ้า PATCH error ค่อย rollback + toast

## 3. Non-goals (ไม่ทำในรอบนี้)

- ไม่ทำหน้า table view T-103 (คนละมุมมอง)
- ไม่ผูกการลากงานเข้ากับ verification state machine
- ไม่ทำ reorder ภายในคอลัมน์ (แค่ย้ายข้ามคอลัมน์ = เปลี่ยนสถานะ)
- ไม่แนบรูปก่อน/หลังผ่านฟอร์มสร้าง (ทำผ่านหน้ารายจ่ายเดิม)
- ไม่ทำ "ซ่อมใหญ่" เป็นประเภทแยก (schema มีแค่ `REPAIR`; "ซ่อมใหญ่" ใน mock เป็นแค่ label)

## 4. โมเดลข้อมูล

เพิ่มใน `prisma/schema.prisma`:

```prisma
enum ServiceStatus {
  NEW          // งานใหม่
  PENDING      // รอดำเนินการ
  IN_PROGRESS  // กำลังดำเนินการ
  DONE         // เสร็จแล้ว
  REVIEW       // รอตรวจสอบ
  CLOSED       // ปิดงานแล้ว
}

// ใน model ExpenseTransaction:
serviceStatus ServiceStatus? @map("service_status")
// null = รายการค่าใช้จ่ายการเงินทั่วไป (ไม่แสดงบนบอร์ด)
// มีค่า = งานบนบอร์ด Kanban
@@index([serviceStatus])
```

migration: `npx prisma migrate dev --name expense_service_status`
เข้ากันได้กับข้อมูลเดิม (nullable, ไม่มี default บังคับ) — expense เดิมทั้งหมด `serviceStatus = null`

### การแมปคอลัมน์ (6 คอลัมน์ ↔ enum ↔ สี)

| คอลัมน์ | enum | สี |
|---|---|---|
| งานใหม่ | `NEW` | `#38BDF8` |
| รอดำเนินการ | `PENDING` | `#FBBF24` |
| กำลังดำเนินการ | `IN_PROGRESS` | `#A855F7` |
| เสร็จแล้ว | `DONE` | `#34D399` |
| รอตรวจสอบ | `REVIEW` | `#FB7185` |
| ปิดงานแล้ว | `CLOSED` | `#94A3B8` |

Type badge: `CLEANING` → ม่วง (purple), `REPAIR` → ฟ้า (blue)

## 5. กันตัวเลขปนรายงาน

งานที่สร้างใหม่มี `verificationStatus = DRAFT` (ยังไม่ยืนยัน/ยังไม่จ่าย)
→ **กรอง `DRAFT` ออกจากยอดรวมค่าใช้จ่าย** ใน `summarize()` (`expense.service.ts`) และ dashboard
ถูกต้องเชิงบัญชี: ร่างไม่นับ ยอดเข้ารายงานเมื่อผู้ใช้อนุมัติเป็น `PENDING`/`VERIFIED` เองที่หน้ารายจ่าย
(ปัจจุบัน `summarize()` กรองเฉพาะ `CANCELLED` — เพิ่มเงื่อนไข `DRAFT` เข้าไป)

## 6. Labels (`src/lib/labels.ts`)

เพิ่ม `SERVICE_STATUS` (enum → ไทย), `SERVICE_STATUS_ORDER` (ลำดับคอลัมน์), `SERVICE_STATUS_COLOR`, `SERVICE_TYPE_BADGE` (CLEANING/REPAIR → BadgeKind)

## 7. Service layer (`src/lib/services/expense.service.ts` — ต่อยอด)

- `listServiceBoard(): Promise<ServiceBoardDTO>` — `findMany({ where: { serviceStatus: { not: null } }, include: {room, property} })` แล้ว group เป็น 6 คอลัมน์ตาม `SERVICE_STATUS_ORDER`; แต่ละการ์ด serialize เป็น `ServiceTaskDTO` (id, type, title, room, building, assignee=payeeName, cost=fmtTHB(amount), photos=มี before/after, serviceStatus)
- `createServiceTask(input, session): Promise<number>` — reuse `resolveRoom` + `generateCode` + audit; set `expenseType` (CLEANING/REPAIR), `serviceStatus='NEW'`, `verificationStatus='DRAFT'`, `amount` (default 0), `payeeName`, `description`, `paymentMethod='CASH'`, `responsibilityType` (default BROKER)
- `updateServiceStatus(id, status, session): Promise<number>` — guard `id` มี `serviceStatus != null`; update `serviceStatus` + `writeAudit(action='UPDATE')`

## 8. Validation (`src/lib/validation/service-task.schema.ts`)

```
serviceTaskCreateSchema = z.object({
  expenseType: z.enum(["CLEANING","REPAIR"]),   // ค่า enum ตรง ไม่ใช่ label ไทย
  title:       z.string().min(1),                // → description
  room:        z.string().min(1),                // roomNumber
  payeeName:   z.string().default(""),
  amount:      z.coerce.number().nonnegative().default(0),
})
serviceStatusUpdateSchema = z.object({ serviceStatus: z.enum([...6 ค่า]) })
```

## 9. API

- `src/app/api/service-tasks/route.ts`
  - `GET  = withAuth("any", () => listServiceBoard())`
  - `POST = withAuth(["ADMIN","STAFF"], (req,{session}) => createServiceTask(parse(req), session))`
- `src/app/api/service-tasks/[id]/route.ts`
  - `PATCH = withAuth(["ADMIN","STAFF"], ...)` → `updateServiceStatus(id, body.serviceStatus, session)`

envelope + error ตาม `lib/api/response` เดิม

## 10. UI (`src/app/(dashboard)/services/page.tsx`)

- ดึง board จาก `apiGet("/api/service-tasks")` (แทน `KANBAN_COLUMNS`) — pattern เดียวกับ `rooms/page.tsx`
- **สร้างงานใหม่**: `ServiceTaskFormModal` ใช้ shared `FormModal` + `SelectField`(ประเภท) + `TextField`(ชื่องาน) + room (datalist จาก `/api/rooms`) + `TextField`(ผู้รับผิดชอบ) + `TextField`(ค่าใช้จ่าย, optional) → `apiSend POST` → reload + toast
- **drag**: คง HTML5 DnD เดิม; เมื่อ drop → optimistic move ใน state → `apiSend PATCH /api/service-tasks/[id]` → error ค่อย rollback + `toast.error`

## 11. RBAC

GET = ทุก role ที่ login; POST/PATCH = ADMIN + STAFF (ตรงกับ expense) VIEWER อ่านได้อย่างเดียว (UI ซ่อนปุ่ม + server บังคับ)

## 12. Test plan

- unit: `listServiceBoard` group ครบ 6 คอลัมน์ + คอลัมน์ว่างคืน []; `summarize()` ไม่นับ DRAFT
- integration: POST สร้างงาน → GET เห็นใน "งานใหม่"; PATCH ย้าย → GET เห็นคอลัมน์ใหม่; PATCH id ที่ serviceStatus=null → 400
- manual (preview): กดสร้างงาน → การ์ดโผล่; ลากข้ามคอลัมน์ → refresh แล้วยังอยู่คอลัมน์ใหม่

## 13. Files touched

- `prisma/schema.prisma` (+ migration)
- `src/lib/labels.ts`
- `src/lib/api-types.ts` (+ `ServiceTaskDTO`, `ServiceBoardDTO`)
- `src/lib/validation/service-task.schema.ts` (ใหม่)
- `src/lib/services/expense.service.ts`
- `src/app/api/service-tasks/route.ts` (ใหม่)
- `src/app/api/service-tasks/[id]/route.ts` (ใหม่)
- `src/components/services/ServiceTaskFormModal.tsx` (ใหม่)
- `src/app/(dashboard)/services/page.tsx`
