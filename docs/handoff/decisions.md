# decisions.md — Architecture Decision Record

> บันทึก "ทำไม" ของการตัดสินใจที่ไม่ชัดเจนในตัวเอง แต่ละ ADR = Context / Decision / Consequences

---

## ADR-001 — Next.js 15 full-stack (ไม่แยก NestJS)

- **Context**: PRD เป็นระบบ CRUD + finance domain ขนาดกลาง ทีมเล็ก ต้องการ MVP เร็วและ deploy ง่าย. Global default ของผู้ใช้คือ Next.js + NestJS แยก
- **Decision**: ใช้ **Next.js 15 App Router เป็น full-stack** — business logic อยู่ใน `lib/services/*`, expose ผ่าน Route Handlers `app/api/*` (+ server actions ตามเหมาะสม) ไม่มี NestJS แยก
- **Consequences**: (+) โปรเจกต์เดียว, deploy/dev ง่าย, type แชร์ตรง, MVP เร็ว. (−) ถ้าอนาคตต้อง background jobs/queue หนัก ต้องเพิ่ม worker แยก — ยอมรับได้ในระยะ MVP. โครงสร้าง service-layer ทำให้ย้ายไป NestJS ภายหลังได้ถ้าจำเป็น

## ADR-002 — MySQL (ผ่าน laragon) เป็นฐานข้อมูล

- **Context**: โปรเจกต์อยู่ใน `D:\laragon\www\armay`; laragon มาพร้อม MySQL/MariaDB; global default DB = MySQL. Template ทักษะ handoff เดิมอิง Supabase/Postgres
- **Decision**: ใช้ **MySQL** ผ่าน Prisma (`provider = "mysql"`), dev = `mysql://root:@localhost:3306/armay`
- **Consequences**: (+) เข้ากับ environment เดิมทันที. (−) ไม่มี Row-Level Security แบบ Postgres → authorization บังคับที่ application layer (`withAuth`) แทน. `binaryTargets` ต้องคุมทั้ง Windows dev และ Linux deploy

## ADR-003 — Auth เอง (bcryptjs + JWT cookie) ไม่ใช้ managed auth

- **Context**: ไม่ใช้ Supabase จึงไม่มี managed auth; ต้องการ RBAC 3 ระดับที่คุมเองได้
- **Decision**: email+password hash ด้วย **bcryptjs**, session เป็น **JWT ใน httpOnly cookie** ลงนามด้วย **jose** (edge-compatible เพื่อใช้ใน `middleware.ts`), RBAC ผ่าน `requireRole()`
- **Consequences**: (+) ควบคุมเต็ม, ไม่มี vendor lock. (−) ต้องดูแล security เอง (rotate secret, cookie flags). 2FA เป็น v2

## ADR-004 — ไฟล์แนบเก็บ local disk (auth-gated)

- **Context**: MVP ระยะแรก, single-tenant, ต้องการง่ายและถ่ายรูปจากมือถือได้
- **Decision**: เก็บไฟล์ใน `uploads/` (gitignored), ตั้งชื่อไฟล์ใหม่เป็น uuid, serve ผ่าน `GET /api/files/[...path]` แบบ **auth-gated** (ไม่วางใน `public/`)
- **Consequences**: (+) ง่าย, ไม่ต้องตั้ง credentials cloud. (−) ไฟล์ผูกกับเครื่อง → ต้อง backup `uploads/` แยก และย้ายขึ้น object storage (S3/R2) ภายหลังเมื่อสเกล. ต้องกัน path traversal เอง

## ADR-005 — npm เป็น package manager

- **Context**: single Next.js app (ไม่ใช่ pnpm workspace monorepo แบบ global deploy convention), dev บน Windows/laragon
- **Decision**: ใช้ **npm**
- **Consequences**: (+) ง่ายสุดบน Windows, ไม่ต้องตั้งค่าเพิ่ม. (−) ต่างจาก convention deploy เดิม (pnpm) — ยอมรับได้เพราะเป็น single app; ปรับตอน deploy ถ้าจำเป็น

## ADR-006 — เพิ่มตาราง `PayoutItem` (breakdown การจ่ายเจ้าของ)

- **Context**: Business rule บังคับ "แสดงที่มาการหักทุกครั้ง" (PRD FR-051) และ "กันจ่ายซ้ำ" (FR-052). Schema เดิมใน PRD §8 มีแค่ `deduction_amount` รวมก้อนเดียว ซึ่งตรวจที่มาไม่ได้และกันซ้ำไม่ได้
- **Decision**: เพิ่ม model **`PayoutItem`** (payout_id, sourceType, sourceId, label, amount) โดย `@@unique([sourceType, sourceId])` — แต่ละบรรทัดคือที่มาของ gross/deduction และธุรกรรมหนึ่งเข้า payout ได้ครั้งเดียว
- **Consequences**: (+) ตรวจสอบที่มาการหักได้เต็ม, กันจ่ายซ้ำที่ระดับ DB constraint. (−) เพิ่มความซับซ้อนตอนคำนวณ payout (ต้องเขียน items ใน `$transaction` เดียวกับ payout)

## ADR-007 — เพิ่มตาราง `CodeSequence` (gen รหัสแบบ atomic)

- **Context**: ทุก entity ต้องมีรหัส unique (`owner_code`, `income_code` ...) การใช้ `count()+1` มี race condition ทำให้รหัสซ้ำเมื่อบันทึกพร้อมกัน
- **Decision**: เพิ่ม model **`CodeSequence`** (entity, period, lastNo) `@@unique([entity, period])`; `generateCode()` เพิ่มเลขใน `$transaction` (atomic)
- **Consequences**: (+) รหัสไม่ซ้ำแม้ concurrent. (−) มีตารางเสริม 1 ตาราง; ต้องเรียกผ่าน `lib/codegen.ts` เสมอ

## ADR-008 — enum เก็บค่าอังกฤษที่ DB, ป้ายไทยที่ UI

- **Context**: UI ต้องเป็นไทย แต่การเก็บภาษาไทยเป็นค่า enum ทำให้ migrate/เทียบค่า/debug ยาก
- **Decision**: enum ทั้งหมดเก็บค่าอังกฤษ (`BOOKED`, `VERIFIED` ...); แปลงเป็นไทยที่ UI ผ่าน `lib/labels.ts`
- **Consequences**: (+) เสถียร, query/debug ง่าย, migrate ปลอดภัย. (−) ต้อง maintain label map ให้ครบทุก enum

## ADR-009 — เงินเป็น `Decimal(12,2)`, วันที่เก็บ UTC แปลง พ.ศ. ที่ UI

- **Context**: ธุรกิจการเงินต้องแม่นยำ; float ทำให้ยอดเพี้ยน. วันที่ต้องแสดง พ.ศ. แต่ต้องคำนวณช่วงเวลาถูกต้อง
- **Decision**: ฟิลด์เงินทุกตัวใช้ `Decimal(12,2)` คำนวณผ่าน `lib/money.ts`; วันที่เก็บ **UTC** ใน DB แปลงเป็น พ.ศ. ที่ UI ผ่าน `lib/date.ts` (คำนวณช่วงเดือนแบบ Asia/Bangkok)
- **Consequences**: (+) ยอดแม่นยำ, ไม่มีปัญหา timezone drift ใน DB. (−) ต้องระวัง serialize `Prisma.Decimal` (ส่งเป็น string) และแปลง พ.ศ.↔ค.ศ. ให้ถูกทุก boundary

## ADR-010 — verification state machine + ล็อก VERIFIED

- **Context**: PRD บังคับว่ารายการที่อนุมัติแล้วห้ามแก้/ลบตรง (FR-061) เพื่อความน่าเชื่อถือของตัวเลข
- **Decision**: `verification.service.ts` คุม transition (`DRAFT→PENDING→VERIFIED/NEEDS_FIX/PROBLEM/CANCELLED`); `assertMutable()` บล็อกการแก้ VERIFIED; การเปลี่ยนแปลงหลังอนุมัติทำผ่าน **adjustment** (รายการใหม่) + Audit Log; อนุมัติได้เฉพาะ ADMIN
- **Consequences**: (+) ตัวเลขตรวจสอบย้อนหลังได้, ป้องกันแก้ทับ. (−) UX การแก้รายการที่อนุมัติแล้วซับซ้อนขึ้น (ต้องสร้าง adjustment)

## ADR-011 — Auto-input จากสลิปฝั่ง client (pdfjs-dist / jsQR / tesseract.js)

- **Context**: ผู้ใช้ต้องการให้ระบบกรอกฟอร์มอัตโนมัติมากที่สุด รวมถึงอ่าน จำนวนเงิน/วันที่โอน/เลขอ้างอิง จากไฟล์สลิป (รูปภาพ/PDF) ตอนบันทึกรับเงิน — PRD เดิมกำหนด OCR เป็น out-of-scope v1 แต่ product owner สั่งเพิ่มภายหลัง (7 ก.ค. 2569)
- **Decision**: ประมวลผล **ฝั่ง client ทั้งหมด** (ไม่มี egress ของไฟล์สลิป) ผ่าน `lib/slip/{parse,extract}.ts`; lazy-load 3 ไลบรารีเมื่อผู้ใช้แนบไฟล์เท่านั้น — `pdfjs-dist` (text layer ของ PDF สลิป), `jsqr` (mini-QR บนสลิป → เลขอ้างอิง), `tesseract.js` eng (OCR ตัวเลข/วันที่จากรูป; โมเดลโหลดจาก CDN ครั้งแรก). ตัว parser (`parseSlipText`) เป็น pure function มี unit test แยก
- **Consequences**: (+) ไฟล์การเงินไม่ออกจากเครื่อง, ไม่มีค่า API, bundle หลักไม่บวม (dynamic import). (−) OCR รูปเป็น best-effort (ผู้ใช้ต้องตรวจก่อนบันทึก — UI ระบุชัด), tesseract ต้องการอินเทอร์เน็ตครั้งแรกเพื่อโหลดโมเดล
