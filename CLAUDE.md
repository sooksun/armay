# CLAUDE.md — Operating Manual (Rental Broker Finance Control System)

> อ่านไฟล์นี้ + [`docs/handoff/context.md`](docs/handoff/context.md) ทุกครั้งก่อนเริ่มงาน
> งานย่อยทั้งหมดอยู่ใน [`docs/handoff/tasks.md`](docs/handoff/tasks.md)

## Project

เว็บแอป full-stack สำหรับ **นายหน้าปล่อยเช่าอสังหาริมทรัพย์** — บริหารรายรับ–รายจ่าย ห้อง เจ้าของ ผู้เช่า และจ่ายเงินคืนเจ้าของ ทุกธุรกรรมตรวจสอบได้และแนบหลักฐานได้ ยึด "ห้อง" และ "รายการเช่า" เป็นแกนกลาง

## Stack (ล็อกแล้ว — ห้ามเปลี่ยนโดยไม่มี ADR)

Next.js 15 (App Router, full-stack) · Prisma · **MySQL** · TypeScript strict · Tailwind · react-toastify · **npm** · ไฟล์แนบ local disk (`uploads/`)

## Dev commands

```bash
npm install
npm run dev                         # http://localhost:3000
npm run build
npm run lint
npm run typecheck                   # tsc --noEmit
npm run test                        # vitest
npx prisma migrate dev --name <name>
npx prisma studio
npm run seed                        # admin@armay.local
```

DB dev (laragon): `DATABASE_URL="mysql://root:@localhost:3306/armay"` — ตั้งใน `.env`

## Architecture principles

1. **Server-first** — Server Components เป็น default; ใส่ `"use client"` เฉพาะที่ต้อง interactive
2. **Thin routes, fat services** — route handler แค่ parse→เรียก `lib/services/*`→ตอบ envelope; logic อยู่ใน service
3. **RBAC บังคับที่ server** ทุก endpoint ผ่าน `withAuth(roles, schema)` — UI แค่ซ่อนปุ่ม ไม่ใช่การป้องกัน
4. **Small PRs** — 1 task = 1 PR ห้ามรวมหลาย T-ID
5. **Money = Decimal, Date = UTC** — คำนวณเงินผ่าน `lib/money.ts`, แสดงวันที่ พ.ศ. ผ่าน `lib/date.ts`

## Always do

- อ่าน `context.md` + task ที่จะทำใน `tasks.md` ก่อนเขียนโค้ด
- อัปเดตสถานะ task (`todo → in-progress → done`) ระหว่างทำ
- ทุก **mutation** ห่อด้วย `prisma.$transaction` และเรียก `writeAudit()` (`lib/services/audit.service.ts`)
- เงินใช้ `Decimal(12,2)` เสมอ; รวม/แปลงผ่าน `lib/money.ts`; serialize เป็น string ที่ API
- วันที่เก็บ UTC; แปลงเป็น พ.ศ. ที่ UI boundary ผ่าน `lib/date.ts` เท่านั้น
- enum เก็บค่าอังกฤษที่ DB; แสดงป้ายไทยผ่าน `lib/labels.ts`
- generate `*_code` ผ่าน `lib/codegen.ts` (atomic) — **ห้าม** `count()+1`
- แนบหลักฐานผ่าน `/api/uploads`; serve ผ่าน `/api/files/...` (auth-gated)
- รัน `npm run lint && npm run typecheck && npm run test` ก่อนปิด task
- Conventional Commits + `Refs: T-0XX`
- ถ้า task กำกวม → หยุดถามหรือเขียนคำถามใน Notes ของ task แล้ว mark `blocked`

## Never do

- ห้าม `console.log` ใน production code
- ห้ามแก้/ลบรายการที่ `verificationStatus = VERIFIED` โดยตรง — ต้องสร้าง **adjustment** + ลง Audit Log
- ห้ามรวมรายการ `CANCELLED` ในการคำนวณยอด Dashboard/รายงาน
- ห้ามใช้ `Float` กับฟิลด์เงิน; ห้ามส่ง `Prisma.Decimal` ดิบออก API
- ห้ามเก็บภาษาไทยเป็นค่า enum ใน DB
- ห้ามวางไฟล์แนบใน `public/` (ต้อง auth-gated)
- ห้ามแตะไฟล์นอก `files-touched` ของ task โดยไม่อัปเดต task
- ห้ามข้าม RBAC ที่ server แม้ UI จะซ่อนปุ่มแล้ว
- ห้าม disable ESLint/TS rule โดยไม่มี `// reason:`
- ห้าม commit secrets — ใช้ `.env.example` บันทึกตัวแปรใหม่

## How to read tasks.md

1. หา task แรกที่ `depends-on` เป็น `done` หมด
2. เช็ค `files-touched` ว่าไม่ชนกับ task ที่ `in-progress` (ถ้าชน ข้ามไปก่อน หรือดู `serialize-with`)
3. mark `in-progress` → implement → test → mark `done`
4. ทำ task ถัดไป

**ลำดับแนะนำ**: P0 (T-001→T-005) → P1+P2 ขนานกัน → P3 (master data 5 entity ขนานได้) → P4 → P5 → P6 → P7 → P8

## Commit convention

```
<type>(<scope>): <subject>

Refs: T-0XX
```

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`

## Design decision

ถ้าตัดสินใจเชิงสถาปัตยกรรมที่ไม่ trivial → เพิ่ม ADR ใน [`docs/handoff/decisions.md`](docs/handoff/decisions.md)

## Business rules ที่ห้ามพลาด (สรุป — เต็มใน PRD §6)

- ห้องต้องมีเจ้าของ; contract ต้องผูก tenant+room; รายรับต้องผูก contract; รายจ่ายต้องเลือกห้อง
- จ่ายเจ้าของ = รายรับ − ค่านายหน้า − ค่าใช้จ่ายที่ `responsibilityType=OWNER` และ **ต้องแสดงที่มาการหักทุกบรรทัด** (`PayoutItem`)
- กันบันทึกรายรับซ้ำ (date+amount+method+ref) และกันจ่ายเจ้าของซ้ำ (`PayoutItem @@unique`)
- รายการไม่มีหลักฐานแนบ → flag "ต้องตรวจสอบ"

## Reference

PRD: [`docs/handoff/PRD.md`](docs/handoff/PRD.md) · Architecture+Schema: [`docs/handoff/plan.md`](docs/handoff/plan.md) · Decisions: [`docs/handoff/decisions.md`](docs/handoff/decisions.md)
