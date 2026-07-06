# context.md — System Context for AI

> อ่านไฟล์นี้ก่อนเสมอในทุก session — เป็น ground truth ของ domain, conventions และโครงสร้าง
> คู่กับ [`CLAUDE.md`](../../CLAUDE.md) (operating manual) และ [`tasks.md`](./tasks.md) (งานย่อย)

## 1. One-liner

**Rental Broker Finance Control System** — เว็บแอป full-stack สำหรับ *นายหน้าปล่อยเช่าอสังหาริมทรัพย์* ใช้บริหารรายรับ–รายจ่าย ห้อง เจ้าของ ผู้เช่า และการจ่ายเงินคืนเจ้าของ โดยทุกธุรกรรมตรวจสอบได้และแนบหลักฐานได้

## 2. Domain glossary (TH ↔ EN)

| Thai | English / model | Meaning |
|---|---|---|
| เจ้าของทรัพย์สิน | Owner (`owners`) | เจ้าของห้อง/บ้าน/คอนโด 1 คนมีได้หลายห้อง/หลายอาคาร |
| อาคาร / โครงการ | Property (`properties`) | คอนโด/แฟลต/บ้านพัก/อาคาร — ระดับที่อยู่เหนือห้อง |
| ห้อง / ยูนิต | Room (`rooms`) | หน่วยปล่อยเช่า ผูกกับ 1 property + 1 owner เสมอ — **แกนกลางของระบบ** |
| ผู้เช่า | Tenant (`tenants`) | คนที่จอง/เช่าห้อง |
| รายการเช่า / สัญญา / booking | Rental Contract (`rental_contracts`) | ศูนย์กลางเชื่อม ผู้เช่า+ห้อง+รายรับ+รายจ่าย — **แกนกลางที่สอง** |
| รายรับ | Income Transaction (`income_transactions`) | เงินที่รับจากผู้เช่า (ค่าเช่า/ประกัน/ทำความสะอาด/ค่าปรับ ฯลฯ) ผูก contract เสมอ |
| รายจ่าย / ค่าใช้จ่ายห้อง | Expense Transaction (`expense_transactions`) | ค่าแม่บ้าน/ช่าง/วัสดุ/น้ำ/ไฟ ฯลฯ ผูก **ห้อง** เสมอ |
| จ่ายเงินเจ้าของ | Owner Payout (`owner_payouts`) | เงินที่นายหน้าโอนคืนเจ้าของ = รายรับ − ค่านายหน้า − ค่าใช้จ่ายที่หักเจ้าของ |
| รายการหักย่อย | Payout Item (`payout_items`) | breakdown ที่มาการหักแต่ละบรรทัดของ payout (บังคับ "แสดงที่มาการหัก" + กันจ่ายซ้ำ) |
| บัญชีรับ–จ่าย | Payment Account (`payment_accounts`) | บัญชีธนาคาร/PromptPay/QR/เงินสด ที่ใช้รับหรือจ่าย |
| สถานะตรวจสอบ | verificationStatus | `DRAFT/PENDING/VERIFIED/NEEDS_FIX/CANCELLED/PROBLEM` |
| ค่านายหน้า / ค่าบริหาร | commission | ส่วนที่นายหน้าหักไว้เป็นรายได้ |
| ผู้รับผิดชอบค่าใช้จ่าย | responsibilityType | `BROKER` นายหน้า / `OWNER` เจ้าของ / `TENANT` ผู้เช่า |
| ปรับปรุงรายการ | adjustment | การแก้รายการที่ `VERIFIED` แล้วโดยสร้างรายการใหม่ (ห้ามแก้ทับ) |

## 3. Existing systems & integrations

- **ไม่มี integration ภายนอกใน v1** — ระบบ self-contained
- **ฐานข้อมูล**: MySQL/MariaDB ผ่าน laragon (dev: `mysql://root:@localhost:3306/armay`)
- **ไฟล์แนบ**: เก็บใน `uploads/` (local disk) — serve ผ่าน route handler auth-gated ที่ `GET /api/files/[...path]`
- **v2 เผื่อไว้**: OCR สลิป, import statement, LINE notify, Owner/Tenant portal (ดู PRD §9)

## 4. Folder structure (enforced)

```
armay/
├── CLAUDE.md                       # operating manual (root, auto-loaded)
├── docs/handoff/                   # PRD, context, plan, tasks, decisions
├── prisma/
│   ├── schema.prisma               # 13 models (ดู plan.md §3)
│   ├── seed.ts                     # admin user + demo payment_accounts
│   └── migrations/
├── uploads/                        # local disk (gitignored) — .gitkeep
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # root: ToastContainer (react-toastify)
│   │   ├── globals.css
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/            # authenticated area
│   │   │   ├── layout.tsx          # Sidebar 15 เมนู + auth guard
│   │   │   ├── dashboard/
│   │   │   ├── owners/ properties/ rooms/ tenants/ contracts/
│   │   │   ├── incomes/ expenses/ payouts/ maintenance/
│   │   │   ├── reports/ payment-accounts/ users/ settings/ audit-logs/
│   │   │   └── {entity}/{page.tsx, [id]/page.tsx, new/page.tsx}
│   │   └── api/                    # route handlers (thin: parse→service→response)
│   │       ├── auth/{login,logout,me}/route.ts
│   │       ├── {entity}/{route.ts, [id]/route.ts}
│   │       ├── incomes|expenses/[id]/{approve,adjust}/route.ts
│   │       ├── payouts/{calculate/route.ts, [id]/approve/route.ts}
│   │       ├── uploads/route.ts  files/[...path]/route.ts
│   │       ├── dashboard/metrics/route.ts  reports/route.ts
│   │       ├── export/[entity]/route.ts   audit-logs/route.ts
│   ├── lib/
│   │   ├── prisma.ts               # singleton PrismaClient
│   │   ├── auth/{session.ts, password.ts, rbac.ts}
│   │   ├── api/{handler.ts, response.ts}   # withAuth() wrapper + envelope
│   │   ├── services/*.service.ts   # business logic ต่อ entity
│   │   ├── validation/*.schema.ts  # zod schemas
│   │   ├── codegen.ts money.ts date.ts labels.ts duplicate.ts upload.ts excel.ts
│   ├── components/
│   │   ├── ui/                     # Button, Input, Select, Modal, Badge, Card
│   │   ├── layout/                 # Sidebar, Topbar, PageHeader
│   │   ├── data/                   # DataTable, FilterBar, StatusBadge, ExportButton
│   │   ├── form/                   # FormField, MoneyInput, ThaiDatePicker, FileUpload
│   │   └── charts/
│   ├── hooks/                      # useFilters, useAuth, useToast
│   ├── types/index.ts              # DTO / API envelope types
│   └── middleware.ts               # edge: ตรวจ session cookie
├── .env  .env.example
├── next.config.ts  tailwind.config.ts  tsconfig.json  package.json
```

**หลักการ**: route handler บาง → เรียก service; business logic ทั้งหมดอยู่ใน `lib/services/*`; validation ใน `lib/validation/*`; ทุกหน้า list ใช้ `DataTable` + `FilterBar` ตัวเดียวกัน

## 5. Coding conventions

- **ภาษา**: TypeScript strict, ห้าม `any` โดยไม่มีเหตุผลกำกับ (`// reason:`)
- **Components**: Server Components เป็น default; ใส่ `"use client"` เฉพาะที่ต้อง interactive
- **Data fetching**: RSC + server actions / route handlers; ห้าม fetch ใน `useEffect`
- **Forms**: `react-hook-form` + `zod` resolver (แชร์ schema กับฝั่ง API)
- **Money**: ทุกฟิลด์เงิน = Prisma `Decimal`; คำนวณ/แปลงผ่าน `lib/money.ts` เท่านั้น; serialize เป็น string ที่ API (ห้ามส่ง `Prisma.Decimal` ดิบ)
- **Date**: เก็บ UTC ใน DB; แปลงเป็น **พ.ศ.** ที่ UI ผ่าน `lib/date.ts` เท่านั้น
- **Enum**: เก็บค่าอังกฤษที่ DB; แสดงป้ายไทยผ่าน `lib/labels.ts`
- **Mutation**: ห่อด้วย `prisma.$transaction` + เรียก `writeAudit()` ทุกครั้ง
- **Errors**: throw typed error จาก `lib/api/*`; API ตอบ envelope `{ ok, data?, error? }`; ห้าม swallow
- **Logging**: ห้าม `console.log` ใน production code
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`) + `Refs: T-0XX`

## 6. Constraints

- **Stack ล็อก**: Next.js 15 (App Router, full-stack) + Prisma + **MySQL** + TypeScript + Tailwind + react-toastify — **ไม่มี NestJS แยก**
- **Package manager**: `npm`
- **RBAC บังคับที่ server** เสมอ — UI แค่ซ่อนปุ่ม ไม่ใช่การป้องกัน
- **VERIFIED = ล็อก** — รายการที่อนุมัติแล้วห้ามแก้/ลบตรง ต้องสร้าง adjustment + ลง Audit Log
- **Dashboard/รายงานไม่รวม `CANCELLED`** ในการรวมยอด
- **ภาษาไทยเป็นหลักสำหรับ UI copy**; โค้ด/identifier/คอมเมนต์เป็นอังกฤษ

## 7. Assumptions

- ผู้ใช้ใช้ Chrome/Safari/Edge รุ่นใหม่ (2 เวอร์ชันล่าสุด) และมือถือ
- Dev บน Windows + laragon (MySQL localhost, root, password ว่าง)
- Single-tenant (นายหน้ารายเดียว) — ไม่มี multi-company ใน v1
- Deploy เป้าหมายภายหลัง: Node host + MySQL (รายละเอียด ops อยู่นอก v1)

## 8. References

- PRD: [`./PRD.md`](./PRD.md)
- Architecture + Prisma schema: [`./plan.md`](./plan.md)
- Active tasks: [`./tasks.md`](./tasks.md)
- Decision log: [`./decisions.md`](./decisions.md)
- Operating manual: [`../../CLAUDE.md`](../../CLAUDE.md)
