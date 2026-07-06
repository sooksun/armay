# Design: Master Data CRUD (Owners, Properties, Tenants, Payment Accounts)

## Context

The Crystal Ledger UI comp (imported from Claude Design) only mocked 6 views in detail — Dashboard, Income, Rooms, Rentals, Payout, Services — and left the remaining 9 menu items as a shared `PlaceholderView`. This spec covers the next round: turning 4 of those placeholders into fully designed, fully interactive CRUD pages, following the exact visual language already implemented (dark glassmorphism, Thai copy, Sora/Noto Sans Thai fonts).

The remaining 5 placeholders (Expenses, Reports, Permissions, Settings, Audit Log) are explicitly **out of scope** for this round — they'll get their own design pass later, since they don't share the master-data list/detail/form pattern these 4 do.

## Scope

Full design + build for:
1. เจ้าของทรัพย์สิน (Owners) — `/owners`
2. อาคาร/โครงการ (Properties) — `/properties`
3. ผู้เช่า (Tenants) — `/tenants`
4. บัญชีรับ–จ่าย (Payment Accounts) — `/accounts`

Each gets: a list view, a click-through detail drawer, and a create/edit modal, all wired to local React state so create/update/delete visibly affect the list (in-memory only — no backend yet, consistent with every other page in the app so far).

## Shared interaction pattern

| Piece | Pattern source | Notes |
|---|---|---|
| List | Table (`Income`/`Rentals`) or card grid (`Rooms`) | Chosen per entity below |
| Detail | Side drawer (`RoomDrawer`) | Backdrop + slide-over aside, tabs, stat boxes, timeline-style history |
| Create/Edit | Single-step modal (`AddIncomeModal`) | No multi-step wizard — these are simple record forms, not transactional flows |
| CRUD | Local `useState` array per page | Create/edit/delete mutate the in-memory list; delete requires confirmation and is blocked when the record has dependent data (e.g. an owner with rooms still assigned) — reflects PRD business rule "ห้องทุกห้องต้องมีเจ้าของ" |
| Filters | Decorative chips, same as `Rooms`/`Rentals` today | Not wired to real filtering — matches existing fidelity level, not a scope regression |

**List style per entity** (recommended, with rationale):

| Page | Style | Why |
|---|---|---|
| Owners | Table | People + numeric data (bank info, amount owed) — same shape as Income/Rentals tables |
| Properties | Card grid | Buildings are spatial/visual entities — same shape as Rooms cards |
| Tenants | Table | Large list of people, needs fast scanning |
| Payment Accounts | Card grid (bank-card style) | Mirrors real bank cards / QR codes better than a table row |

## Mock data continuity

New mock arrays must reuse names/entities that already exist in `mock.ts` so numbers agree across pages instead of introducing disconnected data:

- **Owners** (4): คุณสมชาย วัฒนโสภณ, คุณพิมพ์ใจ ธีรกุล, คุณอนุชา เดชา, คุณวีระ สุขสันต์ — already the `owner` field values on `ROOMS`, and already named in `PAYOUT_ROWS`. Owner drawer's room list and payout history are derived by filtering `ROOMS`/`PAYOUT_ROWS` by name, not duplicated.
- **Properties** (4): เดอะ เครสท์ สุขุมวิท, บ้านสวน พัทยา, แฟลตรุ่งเรือง, ศุภาลัย เรส — already the `building` field values on `ROOMS`. Monthly income figures reuse the exact numbers from the Dashboard's "รายรับแยกตามอาคาร" bar chart (468K / 352K / 246K / 182K) so the two views agree.
- **Tenants** (7): the 7 tenant names already in `RENTAL_ROWS` (คุณกิตติพงษ์ ใจดี, คุณศิริพร มงคล, คุณมณีรัตน์ ทองดี, คุณสุดา แสงทอง, คุณธนา รุ่งเรือง, คุณสมพงษ์ เจริญสุข, คุณกาญจนา ศรีสุข). Rental history tab derives from `RENTAL_ROWS` filtered by tenant name.
- **Payment Accounts** (4): บัญชีรับเงินผู้เช่า (KBank, matches the one shown in `AddIncomeModal`), บัญชีจ่ายเจ้าของ (KBank, matches the one shown in the Payout flow), PromptPay ธุรกิจ, เงินสด.

Minor numeric mismatches already present in the original design comp (e.g. the Payout step-flow's illustrative "4 ห้อง" for an owner who only has 2 rooms in `ROOMS`) are **not** reconciled — those pages are out of scope for this change and untouched.

## New shared components

To avoid copy-pasting the same chrome 4 times, extract:

- `src/components/shared/Drawer.tsx` — generic slide-over shell (backdrop, aside, header with title/badge/close, tab strip, scrollable body). `RoomDrawer` is left as-is (not retrofitted, to avoid touching working code); the 4 new drawers use this shared shell.
- `src/components/shared/FormModal.tsx` — generic modal shell (icon+title+subtitle header, close button, scrollable body, cancel/save footer) plus an exported `Field` labeled-value component matching `AddIncomeModal`'s inline one.
- `src/components/shared/ListCard.tsx` — the outer rounded glass panel + header bar (title + right-aligned action buttons), used to wrap the Owners/Tenants tables and the Properties/Accounts card-grid toolbars.

## Per-entity design

### 1. Owners (`/owners`) — table

**Table columns:** รหัส · ชื่อ+เบอร์โทร · บัญชีธนาคาร (bank + masked number, e.g. `123-4-XXXXX` — show first 3 + last group, mask the middle group) · ห้องในความดูแล (count) · ยอดที่ต้องจ่าย · สถานะ (badge) · [รายละเอียด]

**Derived values** (computed at render time, not stored twice):
- ห้องในความดูแล = `ROOMS.filter(r => r.owner === owner.fullName).length`
- ยอดที่ต้องจ่าย = sum of `PAYOUT_ROWS` amounts for this owner where `status` is not `จ่ายแล้ว`

**Drawer:** 4 stat boxes (ห้องทั้งหมด / ยอดรอจ่าย / จ่ายแล้วสะสม / รายรับรวมเดือนนี้ — the last summed from the owner's rooms' `income` field) + tabs:
- **ภาพรวม** — phone, email, LINE ID, address, bank name/account/holder, PromptPay ID
- **ห้องในความดูแล** — rooms filtered from `ROOMS` by owner name, each with status badge
- **ประวัติจ่ายเงิน** — timeline derived from `PAYOUT_ROWS` filtered by owner name

**Create/Edit modal fields:** ชื่อ-นามสกุล, เบอร์โทร, อีเมล, LINE ID, ที่อยู่, ธนาคาร, เลขที่บัญชี, ชื่อบัญชี, PromptPay ID, หมายเหตุ, สถานะ (ACTIVE/INACTIVE)

**Delete guard:** blocked (with an inline message) if the owner has ≥1 room in `ROOMS`.

### 2. Properties (`/properties`) — card grid

**Card content:** ชื่ออาคาร + ประเภท badge, ที่อยู่/จังหวัด, จำนวนห้อง (ว่าง/มีผู้เช่า/ทั้งหมด — counted from `ROOMS` filtered by `building === property.propertyName`), รายรับเดือนนี้ (fixed mock figure per property, matching the Dashboard bar chart), ผู้ติดต่อ+เบอร์

**Drawer tabs:**
- **ภาพรวม** — full address, province/district/subdistrict, contact name/phone, a "แผนที่" placeholder box (same visual treatment as the "room photo" placeholder already used on Rooms cards)
- **ห้องทั้งหมด** — rooms in this property (from `ROOMS`, filtered by building name) with status badges
- **สรุปรายรับ-รายจ่าย** — stat boxes reusing the property's aggregate figures

**Create/Edit modal fields:** ชื่ออาคาร, ประเภทอาคาร (select: คอนโด/แฟลต/บ้านพัก/อาคาร/หอพัก/อื่นๆ), ที่อยู่, จังหวัด/อำเภอ/ตำบล, พิกัด (lat/long), ผู้ติดต่อ, เบอร์โทร, หมายเหตุ, สถานะ

**Delete guard:** blocked if the property has ≥1 room.

### 3. Tenants (`/tenants`) — table

**Table columns:** รหัส · ชื่อ+เบอร์ · ห้อง/สัญญาปัจจุบัน (most recent `RENTAL_ROWS` entry for this tenant, by array order) · สถานะชำระ (badge, from that same row's `status`) · Blacklist (badge if flagged) · [รายละเอียด]

**Drawer tabs:**
- **ภาพรวม** — phone, email, LINE ID, ID card/passport, nationality, address
- **ประวัติการเช่า** — rows from `RENTAL_ROWS` filtered by tenant name
- **เอกสารแนบ** — mock file chips (สำเนาบัตร, สัญญา)

**Create/Edit modal fields:** ชื่อ-นามสกุล, เบอร์โทร, อีเมล, LINE ID, เลขบัตรประชาชน/Passport, สัญชาติ, ที่อยู่, หมายเหตุ, Blacklist (toggle)

**Delete guard:** blocked if the tenant has an active (non-`ENDED`/`CANCELLED`) rental row.

### 4. Payment Accounts (`/accounts`) — bank-card style grid

**Card content:** ชื่อบัญชี, ธนาคาร+เลขบัญชี (same masking convention as Owners: first group + last group visible, middle group masked; cash accounts show "เงินสด" with no number), ประเภทบัญชี badge (รับผู้เช่า/จ่ายเจ้าของ/ส่วนตัว/เงินสด), QR placeholder box, สถานะ

**Drawer:** full details + large QR placeholder + "ธุรกรรมล่าสุดที่ใช้บัญชีนี้" derived from `INCOME_ROWS` filtered by matching `channel`

**Create/Edit modal fields:** ชื่อบัญชี, ธนาคาร, เลขที่บัญชี, ชื่อเจ้าของบัญชี, PromptPay ID, ประเภทบัญชี (select), แนบ QR (same dropzone visual as the slip-upload in `AddIncomeModal`), สถานะ

**Delete guard:** none needed (no other mock entity references an account by ID yet).

## File plan

```
src/lib/mock.ts                        # + OWNERS, PROPERTIES, TENANTS, ACCOUNTS arrays + relation helpers
src/components/shared/Drawer.tsx       # new — generic slide-over shell
src/components/shared/FormModal.tsx    # new — generic modal shell + Field
src/components/shared/ListCard.tsx     # new — panel + header bar wrapper
src/components/owners/OwnerDrawer.tsx
src/components/owners/OwnerFormModal.tsx
src/components/properties/PropertyDrawer.tsx
src/components/properties/PropertyFormModal.tsx
src/components/tenants/TenantDrawer.tsx
src/components/tenants/TenantFormModal.tsx
src/components/accounts/AccountDrawer.tsx
src/components/accounts/AccountFormModal.tsx
src/app/(dashboard)/owners/page.tsx       # replace PlaceholderView
src/app/(dashboard)/properties/page.tsx   # replace PlaceholderView
src/app/(dashboard)/tenants/page.tsx      # replace PlaceholderView
src/app/(dashboard)/accounts/page.tsx     # replace PlaceholderView
```

Existing files **not** touched: `RoomDrawer.tsx`, `AddIncomeModal.tsx`, `StepFlow.tsx`, and all 5 out-of-scope placeholder pages.

## Out of scope (explicitly deferred)

- Expenses, Reports, Permissions, Settings, Audit Log pages — next design round.
- Real filtering/search logic — chips stay decorative, matching current app-wide fidelity.
- Backend/API/Prisma wiring — everything here stays mock data in local state, same as the rest of the app.

## Verification plan

- `npm run build` — must compile clean, all 4 routes static-generate.
- Manual click-through per page: open drawer from a row/card, switch tabs, open create modal, submit, confirm new record appears in the list; open edit modal from an existing record, change a field, confirm list updates; attempt delete on a record with dependents, confirm it's blocked with a message; delete a record with no dependents, confirm it disappears.
- Cross-check numbers: Owners' room counts/payout amounts match `Rooms`/`Payout` pages; Properties' income figures match the Dashboard bar chart; Tenants' rental history matches `Rentals` page.
