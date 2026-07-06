# Master Data CRUD (Owners, Properties, Tenants, Payment Accounts) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn 4 of the 9 remaining placeholder pages — เจ้าของทรัพย์สิน (Owners), อาคาร/โครงการ (Properties), ผู้เช่า (Tenants), บัญชีรับ–จ่าย (Payment Accounts) — into fully designed, fully interactive CRUD pages matching the Crystal Ledger visual language already implemented.

**Architecture:** Extract 3 shared shell components (`Drawer`, `FormModal`, `ListCard`) from the existing `RoomDrawer`/`AddIncomeModal`/table-page patterns, add 4 new mock data arrays (with relation helpers that derive from data already in `mock.ts` so numbers agree across pages), then build each entity's drawer + form modal + page using those shells. Each page holds its own `useState` array so create/edit/delete visibly mutate the in-memory list.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, inline-style JSX (no Tailwind — matches the rest of the app), no backend/API calls.

## Global Constraints

- **No backend.** Everything is `useState` over mock arrays, in-memory only, resets on reload — same as every other page in the app (Rooms, Rentals, Payout, Income).
- **Visual language is fixed.** Dark glassmorphism (`rgba(255,255,255,0.05-0.14)` panels, `backdropFilter: blur(20-30px)`, `border: 1px solid rgba(255,255,255,0.1-0.16)`), Thai UI copy, `Sora` for numbers/headings, system Thai font for body text. Reuse `src/lib/theme.ts` (`badge()`, `iconChip()`, `fmtTHB()`, `glass()`) and `src/components/Icon.tsx` — do not invent new colors or fonts.
- **Filter chips are decorative**, matching `Rooms`/`Rentals` today — do not wire real filtering logic in this pass.
- **Mock data must reuse existing names**, not invent disconnected ones: the 4 owners already exist as `ROOMS[].owner` and `PAYOUT_ROWS[].owner` values; the 4 properties already exist as `ROOMS[].building` values (use the exact same strings so `.filter()` relations work); the 7 tenants already exist as `RENTAL_ROWS[].tenant` values.
- **Delete is guarded** by dependent-record checks (an owner/property with rooms, a tenant with an unpaid rental) — reflects the PRD rule that every room must have an owner.
- **No test framework is installed** (no vitest/jest) and none of the existing pages have automated tests — this project's established QA method is `npm run build` (compiles + typechecks the whole project, confirmed in earlier sessions to catch errors in files that aren't yet imported anywhere) plus manual click-through verification using the Claude Code Preview MCP tools (`mcp__Claude_Preview__preview_start`, `preview_eval`, `preview_console_logs`). Every task below uses this same pattern instead of unit tests — this is a deliberate match to existing project practice, not a shortcut.
- **Account-number masking convention:** first dash-separated group and last group visible, middle group(s) replaced with `•` of the same length (e.g. `123-4-56789` → `123-•-56789`).
- Spec reference: [`docs/superpowers/specs/2026-07-07-master-data-crud-design.md`](../specs/2026-07-07-master-data-crud-design.md)

---

### Task 1: Shared shell components (Drawer, FormModal, ListCard)

**Files:**
- Create: `src/components/shared/Drawer.tsx`
- Create: `src/components/shared/FormModal.tsx`
- Create: `src/components/shared/ListCard.tsx`

**Interfaces:**
- Consumes: nothing new (pure UI shells).
- Produces:
  - `Drawer(props: { onClose: () => void; eyebrow?: string; title: string; badge?: ReactNode; tabs?: DrawerTab[]; children: ReactNode })` where `DrawerTab = { label: string; active: boolean; onClick: () => void }`
  - `StatBox(props: { bg: string; border: string; color: string; label: string; value: string })`
  - `InfoRow(props: { k: string; v: string })`
  - `InfoSection(props: { title: string; children: ReactNode })`
  - `FormModal(props: { open: boolean; onClose: () => void; icon: ReactNode; title: string; subtitle: string; onSubmit: () => void; submitLabel: string; children: ReactNode })`
  - `TextField(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string })`
  - `TextAreaField(props: { label: string; value: string; onChange: (v: string) => void })`
  - `SelectField(props: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] })`
  - `ToggleField(props: { label: string; checked: boolean; onChange: (v: boolean) => void; onLabel: string; offLabel: string })`
  - `FieldsGrid(props: { children: ReactNode })`
  - `ListCard(props: { title: string; actions?: ReactNode; children: ReactNode })`
  - `TableWrap(props: { children: ReactNode; minWidth: number })`
  - `Th(props: { children: ReactNode; align?: "left" | "right" | "center" })`

- [ ] **Step 1: Create `src/components/shared/Drawer.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";

export type DrawerTab = {
  label: string;
  active: boolean;
  onClick: () => void;
};

/**
 * Generic slide-over detail shell shared by Owner/Property/Tenant/Account drawers.
 * Visual chrome ported from RoomDrawer (RoomDrawer itself is left untouched).
 */
export function Drawer({
  onClose,
  eyebrow,
  title,
  badge,
  tabs,
  children,
}: {
  onClose: () => void;
  eyebrow?: string;
  title: string;
  badge?: ReactNode;
  tabs?: DrawerTab[];
  children: ReactNode;
}) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 55,
          background: "rgba(4,8,16,0.55)",
          backdropFilter: "blur(5px)",
          WebkitBackdropFilter: "blur(5px)",
        }}
      />
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 56,
          width: "min(460px,94vw)",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(180deg,rgba(20,28,48,0.97),rgba(12,18,34,0.97))",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          borderLeft: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "-30px 0 70px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            padding: "20px 22px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div>
            {eyebrow ? <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{eyebrow}</div> : null}
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 22 }}>{title}</div>
            {badge}
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.05)",
              color: "#EAF2FF",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        {tabs && tabs.length > 0 ? (
          <div style={{ display: "flex", gap: 6, padding: "12px 22px 0", overflowX: "auto" }}>
            {tabs.map((t) => (
              <button
                key={t.label}
                onClick={t.onClick}
                style={
                  t.active
                    ? {
                        padding: "8px 13px",
                        borderRadius: "11px 11px 0 0",
                        fontSize: 12.5,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        color: "#EAF2FF",
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderBottom: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }
                    : {
                        padding: "8px 13px",
                        fontSize: 12.5,
                        whiteSpace: "nowrap",
                        color: "rgba(234,242,255,0.5)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 22px 30px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {children}
        </div>
      </aside>
    </>
  );
}

export function StatBox({
  bg,
  border,
  color,
  label,
  value,
}: {
  bg: string;
  border: string;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div style={{ padding: 14, borderRadius: 14, background: bg, border: `1px solid ${border}` }}>
      <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.55)" }}>{label}</div>
      <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 19, color, marginTop: 3 }}>{value}</div>
    </div>
  );
}

export function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        fontSize: 13,
      }}
    >
      <span style={{ color: "rgba(234,242,255,0.55)" }}>{k}</span>
      <span style={{ fontWeight: 600, textAlign: "right" }}>{v}</span>
    </div>
  );
}

export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.09)",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/components/shared/FormModal.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";

const fieldBoxStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.05)",
  color: "#EAF2FF",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

function Label({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 12, color: "rgba(234,242,255,0.6)", marginBottom: 6 }}>{children}</div>;
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={fieldBoxStyle}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        style={{ ...fieldBoxStyle, resize: "vertical", fontFamily: "inherit" }}
      />
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...fieldBoxStyle, cursor: "pointer" }}>
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "#0B1020" }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
  onLabel,
  offLabel,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          ...fieldBoxStyle,
          cursor: "pointer",
          textAlign: "left",
          color: checked ? "#7FF0D9" : "#EAF2FF",
          borderColor: checked ? "rgba(94,234,212,0.4)" : "rgba(255,255,255,0.14)",
          background: checked ? "rgba(94,234,212,0.08)" : "rgba(255,255,255,0.05)",
        }}
      >
        {checked ? onLabel : offLabel}
      </button>
    </div>
  );
}

export function FieldsGrid({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>{children}</div>;
}

export function FormModal({
  open,
  onClose,
  icon,
  title,
  subtitle,
  onSubmit,
  submitLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  icon: ReactNode;
  title: string;
  subtitle: string;
  onSubmit: () => void;
  submitLabel: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 20px",
        overflowY: "auto",
        background: "rgba(4,8,16,0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 26,
          background: "linear-gradient(180deg,rgba(20,28,48,0.96),rgba(12,18,34,0.96))",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "0 30px 70px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
              color: "#04121A",
            }}
          >
            {icon}
          </span>
          <div>
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 17 }}>{title}</div>
            <div style={{ fontSize: 12, color: "rgba(234,242,255,0.5)" }}>{subtitle}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.05)",
              color: "#EAF2FF",
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 15 }}>{children}</div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 11,
            padding: "16px 24px",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "11px 20px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.16)",
              background: "rgba(255,255,255,0.05)",
              color: "#EAF2FF",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ยกเลิก
          </button>
          <button
            onClick={onSubmit}
            style={{
              padding: "11px 24px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.28)",
              color: "#04121A",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
              boxShadow: "0 8px 20px rgba(56,189,248,0.42)",
            }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/components/shared/ListCard.tsx`**

```tsx
"use client";

import type { ReactNode } from "react";

export function ListCard({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 22,
        overflow: "hidden",
        background: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 18px 44px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          padding: "15px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: 14.5 }}>{title}</div>
        {actions ? <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

export function TableWrap({ children, minWidth }: { children: ReactNode; minWidth: number }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth }}>{children}</table>
    </div>
  );
}

export function Th({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" | "center" }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: "12px 16px",
        fontWeight: 600,
        color: "rgba(234,242,255,0.6)",
        fontSize: 12,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: `✓ Compiled successfully` and `✓ Generating static pages (19/19)` (unchanged route count — these 3 files aren't imported by any page yet, but `next build` typechecks every `.tsx` under `src/`, so a type error here still fails the build).

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/Drawer.tsx src/components/shared/FormModal.tsx src/components/shared/ListCard.tsx
git commit -m "feat: add shared Drawer/FormModal/ListCard shells for master-data CRUD"
```

---

### Task 2: Mock data — Owners, Properties, Tenants, Payment Accounts

**Files:**
- Modify: `src/lib/theme.ts` (append 2 functions)
- Modify: `src/lib/mock.ts` (append 4 data arrays + relation helpers)

**Interfaces:**
- Consumes: `ROOMS`, `PAYOUT_ROWS`, `RENTAL_ROWS`, `INCOME_ROWS`, `Room`, `PayoutRow`, `RentalRow`, `IncomeRow`, `BadgeKind` (all already exported from `src/lib/mock.ts` / `src/lib/theme.ts`).
- Produces:
  - `theme.ts`: `parseAmount(display: string): number`, `maskAccountNumber(num: string): string`
  - `mock.ts` types: `OwnerStatus`, `Owner`, `PropertyStatus`, `Property`, `TenantStatus`, `Tenant`, `AccountType`, `AccountStatus`, `PaymentAccountRecord`
  - `mock.ts` data: `OWNERS: Owner[]`, `PROPERTIES: Property[]`, `PROPERTY_TYPE_OPTIONS: string[]`, `TENANTS: Tenant[]`, `PAYMENT_ACCOUNTS: PaymentAccountRecord[]`, `ACCOUNT_TYPE_OPTIONS: AccountType[]`
  - `mock.ts` helpers: `roomsByOwner(ownerName: string): Room[]`, `pendingPayoutTotal(ownerName: string): number`, `paidPayoutTotal(ownerName: string): number`, `payoutsByOwner(ownerName: string): PayoutRow[]`, `monthlyIncomeByOwner(ownerName: string): number`, `roomsByProperty(propertyName: string): Room[]`, `rentalsByTenant(tenantName: string): RentalRow[]`, `latestRentalByTenant(tenantName: string): RentalRow | undefined`, `incomeRowsByChannel(account: PaymentAccountRecord): IncomeRow[]`

- [ ] **Step 1: Append `parseAmount` and `maskAccountNumber` to `src/lib/theme.ts`**

Open `src/lib/theme.ts` and add this to the end of the file (after `fmtTHB`):

```ts

/** Parses a Thai-baht display string like "฿12,500" or "−฿1,750" into a signed integer. */
export function parseAmount(display: string): number {
  const normalized = display.replace(/−/g, "-");
  const digits = normalized.replace(/[^\d-]/g, "");
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Masks the middle dash-separated group(s) of an account number, keeping the first and last visible. */
export function maskAccountNumber(num: string): string {
  const parts = num.split("-");
  if (parts.length < 3) return num;
  return parts.map((p, i) => (i === 0 || i === parts.length - 1 ? p : "•".repeat(p.length))).join("-");
}
```

- [ ] **Step 2: Append Owners mock data + helpers to `src/lib/mock.ts`**

Add near the top of `mock.ts`, in the imports section, add `parseAmount` to the existing `theme` import (find the line `import type { BadgeKind } from "@/lib/theme";` and change it to also import the value):

```ts
import { parseAmount } from "@/lib/theme";
import type { BadgeKind } from "@/lib/theme";
```

Then append to the end of `mock.ts`:

```ts

// ---------- OWNERS ----------
export type OwnerStatus = "ACTIVE" | "INACTIVE";

export type Owner = {
  id: number;
  ownerCode: string;
  fullName: string;
  phone: string;
  email: string;
  lineId: string;
  address: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  promptpayId: string;
  note: string;
  status: OwnerStatus;
};

export const OWNERS: Owner[] = [
  {
    id: 1,
    ownerCode: "OWN-0001",
    fullName: "คุณสมชาย วัฒนโสภณ",
    phone: "081-111-2222",
    email: "somchai.w@email.com",
    lineId: "somchai_w",
    address: "99/1 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110",
    bankName: "KBank",
    bankAccountNumber: "123-4-56789",
    bankAccountName: "สมชาย วัฒนโสภณ",
    promptpayId: "081-111-2222",
    note: "",
    status: "ACTIVE",
  },
  {
    id: 2,
    ownerCode: "OWN-0002",
    fullName: "คุณพิมพ์ใจ ธีรกุล",
    phone: "082-222-3333",
    email: "pimjai.t@email.com",
    lineId: "pimjai_t",
    address: "45 ซ.สุขุมวิท 71 แขวงพระโขนงเหนือ เขตวัฒนา กรุงเทพฯ 10110",
    bankName: "SCB",
    bankAccountNumber: "234-5-67890",
    bankAccountName: "พิมพ์ใจ ธีรกุล",
    promptpayId: "082-222-3333",
    note: "",
    status: "ACTIVE",
  },
  {
    id: 3,
    ownerCode: "OWN-0003",
    fullName: "คุณอนุชา เดชา",
    phone: "083-333-4444",
    email: "anucha.d@email.com",
    lineId: "anucha_d",
    address: "12 หมู่ 4 ต.หนองปรือ อ.บางละมุง จ.ชลบุรี 20150",
    bankName: "BBL",
    bankAccountNumber: "345-6-78901",
    bankAccountName: "อนุชา เดชา",
    promptpayId: "083-333-4444",
    note: "",
    status: "ACTIVE",
  },
  {
    id: 4,
    ownerCode: "OWN-0004",
    fullName: "คุณวีระ สุขสันต์",
    phone: "084-444-5555",
    email: "weera.s@email.com",
    lineId: "weera_s",
    address: "78 ถ.รังสิต-นครนายก ต.ประชาธิปัตย์ อ.ธัญบุรี จ.ปทุมธานี 12130",
    bankName: "KTB",
    bankAccountNumber: "456-7-89012",
    bankAccountName: "วีระ สุขสันต์",
    promptpayId: "084-444-5555",
    note: "ติดต่อยากช่วงเย็น",
    status: "ACTIVE",
  },
];

export function roomsByOwner(ownerName: string): Room[] {
  return ROOMS.filter((r) => r.owner === ownerName);
}

export function monthlyIncomeByOwner(ownerName: string): number {
  return roomsByOwner(ownerName).reduce((sum, r) => sum + parseAmount(r.income), 0);
}

export function payoutsByOwner(ownerName: string): PayoutRow[] {
  return PAYOUT_ROWS.filter((r) => r.owner === ownerName);
}

export function pendingPayoutTotal(ownerName: string): number {
  return payoutsByOwner(ownerName)
    .filter((r) => r.status !== "จ่ายแล้ว")
    .reduce((sum, r) => sum + parseAmount(r.net), 0);
}

export function paidPayoutTotal(ownerName: string): number {
  return payoutsByOwner(ownerName)
    .filter((r) => r.status === "จ่ายแล้ว")
    .reduce((sum, r) => sum + parseAmount(r.net), 0);
}
```

- [ ] **Step 3: Verify Owner types/helpers compile**

Run: `npm run build`
Expected: `✓ Compiled successfully`, `✓ Generating static pages (19/19)` (no route count change yet)

- [ ] **Step 4: Commit**

```bash
git add src/lib/theme.ts src/lib/mock.ts
git commit -m "feat: add Owner mock data and relation helpers"
```

- [ ] **Step 5: Append Properties mock data + helper to `src/lib/mock.ts`**

Append to the end of `mock.ts`:

```ts

// ---------- PROPERTIES ----------
export type PropertyStatus = "ACTIVE" | "INACTIVE";

export type Property = {
  id: number;
  propertyCode: string;
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
};

export const PROPERTY_TYPE_OPTIONS = ["คอนโด", "แฟลต", "บ้านพัก", "อาคารพาณิชย์", "หอพัก", "อื่นๆ"];

// propertyName MUST match ROOMS[].building exactly — roomsByProperty() filters on it.
export const PROPERTIES: Property[] = [
  {
    id: 1,
    propertyCode: "PPT-0001",
    propertyName: "เดอะ เครสท์",
    propertyType: "คอนโด",
    address: "88 ถ.สุขุมวิท",
    province: "กรุงเทพมหานคร",
    district: "วัฒนา",
    subdistrict: "คลองตันเหนือ",
    contactName: "ฝ่ายนิติบุคคล เดอะ เครสท์",
    contactPhone: "02-111-2222",
    note: "",
    monthlyIncome: 468000,
    status: "ACTIVE",
  },
  {
    id: 2,
    propertyCode: "PPT-0002",
    propertyName: "บ้านสวน พัทยา",
    propertyType: "บ้านพัก",
    address: "12 หมู่ 4",
    province: "ชลบุรี",
    district: "บางละมุง",
    subdistrict: "หนองปรือ",
    contactName: "คุณอนุชา เดชา",
    contactPhone: "083-333-4444",
    note: "",
    monthlyIncome: 352000,
    status: "ACTIVE",
  },
  {
    id: 3,
    propertyCode: "PPT-0003",
    propertyName: "แฟลตรุ่งเรือง",
    propertyType: "แฟลต",
    address: "23 ถ.รุ่งเรือง",
    province: "กรุงเทพมหานคร",
    district: "บางกะปิ",
    subdistrict: "คลองจั่น",
    contactName: "คุณวีระ สุขสันต์",
    contactPhone: "084-444-5555",
    note: "",
    monthlyIncome: 246000,
    status: "ACTIVE",
  },
  {
    id: 4,
    propertyCode: "PPT-0004",
    propertyName: "ศุภาลัย เรส",
    propertyType: "คอนโด",
    address: "56 ถ.ศรีนครินทร์",
    province: "กรุงเทพมหานคร",
    district: "สวนหลวง",
    subdistrict: "สวนหลวง",
    contactName: "ฝ่ายนิติบุคคล ศุภาลัย",
    contactPhone: "02-222-3333",
    note: "",
    monthlyIncome: 182000,
    status: "ACTIVE",
  },
];

export function roomsByProperty(propertyName: string): Room[] {
  return ROOMS.filter((r) => r.building === propertyName);
}
```

- [ ] **Step 6: Verify, commit**

Run: `npm run build`
Expected: `✓ Compiled successfully`

```bash
git add src/lib/mock.ts
git commit -m "feat: add Property mock data and roomsByProperty helper"
```

- [ ] **Step 7: Append Tenants mock data + helpers to `src/lib/mock.ts`**

Append to the end of `mock.ts`:

```ts

// ---------- TENANTS ----------
export type TenantStatus = "ACTIVE" | "INACTIVE";

export type Tenant = {
  id: number;
  tenantCode: string;
  fullName: string;
  phone: string;
  email: string;
  lineId: string;
  idCardOrPassport: string;
  nationality: string;
  address: string;
  note: string;
  blacklist: boolean;
  status: TenantStatus;
};

// fullName MUST match RENTAL_ROWS[].tenant exactly — rentalsByTenant() filters on it.
export const TENANTS: Tenant[] = [
  {
    id: 1,
    tenantCode: "TNT-0001",
    fullName: "คุณกิตติพงษ์ ใจดี",
    phone: "081-234-5678",
    email: "kitti@email.com",
    lineId: "kitti_jaidee",
    idCardOrPassport: "1-2345-67890-12-3",
    nationality: "ไทย",
    address: "A-1105 เดอะ เครสท์",
    note: "",
    blacklist: false,
    status: "ACTIVE",
  },
  {
    id: 2,
    tenantCode: "TNT-0002",
    fullName: "คุณศิริพร มงคล",
    phone: "082-345-6789",
    email: "siriporn@email.com",
    lineId: "siriporn_m",
    idCardOrPassport: "1-3456-78901-23-4",
    nationality: "ไทย",
    address: "A-1204 เดอะ เครสท์",
    note: "",
    blacklist: false,
    status: "ACTIVE",
  },
  {
    id: 3,
    tenantCode: "TNT-0003",
    fullName: "คุณมณีรัตน์ ทองดี",
    phone: "083-456-7890",
    email: "maneerat@email.com",
    lineId: "maneerat_t",
    idCardOrPassport: "1-4567-89012-34-5",
    nationality: "ไทย",
    address: "A-902 เดอะ เครสท์",
    note: "ค้างชำระเดือน ก.ค.",
    blacklist: false,
    status: "ACTIVE",
  },
  {
    id: 4,
    tenantCode: "TNT-0004",
    fullName: "คุณสุดา แสงทอง",
    phone: "084-567-8901",
    email: "suda@email.com",
    lineId: "suda_s",
    idCardOrPassport: "1-5678-90123-45-6",
    nationality: "ไทย",
    address: "C-305 แฟลตรุ่งเรือง",
    note: "ค้างชำระเกิน 15 วัน",
    blacklist: true,
    status: "ACTIVE",
  },
  {
    id: 5,
    tenantCode: "TNT-0005",
    fullName: "คุณธนา รุ่งเรือง",
    phone: "085-678-9012",
    email: "thana@email.com",
    lineId: "thana_r",
    idCardOrPassport: "1-6789-01234-56-7",
    nationality: "ไทย",
    address: "B-802 บ้านสวน พัทยา",
    note: "",
    blacklist: false,
    status: "ACTIVE",
  },
  {
    id: 6,
    tenantCode: "TNT-0006",
    fullName: "คุณสมพงษ์ เจริญสุข",
    phone: "086-789-0123",
    email: "sompong@email.com",
    lineId: "sompong_c",
    idCardOrPassport: "1-7890-12345-67-8",
    nationality: "ไทย",
    address: "B-1105 บ้านสวน พัทยา",
    note: "",
    blacklist: false,
    status: "ACTIVE",
  },
  {
    id: 7,
    tenantCode: "TNT-0007",
    fullName: "คุณกาญจนา ศรีสุข",
    phone: "087-890-1234",
    email: "kanjana@email.com",
    lineId: "kanjana_s",
    idCardOrPassport: "1-8901-23456-78-9",
    nationality: "ไทย",
    address: "C-208 แฟลตรุ่งเรือง",
    note: "",
    blacklist: false,
    status: "ACTIVE",
  },
];

export function rentalsByTenant(tenantName: string): RentalRow[] {
  return RENTAL_ROWS.filter((r) => r.tenant === tenantName);
}

export function latestRentalByTenant(tenantName: string): RentalRow | undefined {
  return rentalsByTenant(tenantName)[0];
}
```

- [ ] **Step 8: Verify, commit**

Run: `npm run build`
Expected: `✓ Compiled successfully`

```bash
git add src/lib/mock.ts
git commit -m "feat: add Tenant mock data and rental-history helpers"
```

- [ ] **Step 9: Append Payment Accounts mock data + helper to `src/lib/mock.ts`**

Append to the end of `mock.ts`:

```ts

// ---------- PAYMENT ACCOUNTS ----------
export type AccountType = "รับผู้เช่า" | "จ่ายเจ้าของ" | "ส่วนตัว" | "เงินสด";
export type AccountStatus = "ACTIVE" | "INACTIVE";

export type PaymentAccountRecord = {
  id: number;
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  promptpayId: string;
  accountType: AccountType;
  status: AccountStatus;
};

export const ACCOUNT_TYPE_OPTIONS: AccountType[] = ["รับผู้เช่า", "จ่ายเจ้าของ", "ส่วนตัว", "เงินสด"];

export const PAYMENT_ACCOUNTS: PaymentAccountRecord[] = [
  {
    id: 1,
    accountName: "บัญชีรับเงินผู้เช่า",
    bankName: "KBank",
    accountNumber: "123-4-56789",
    accountHolderName: "บจ. คริสตัล เลดเจอร์",
    promptpayId: "088-123-4567",
    accountType: "รับผู้เช่า",
    status: "ACTIVE",
  },
  {
    id: 2,
    accountName: "บัญชีจ่ายเจ้าของ",
    bankName: "KBank",
    accountNumber: "123-4-56789",
    accountHolderName: "บจ. คริสตัล เลดเจอร์",
    promptpayId: "",
    accountType: "จ่ายเจ้าของ",
    status: "ACTIVE",
  },
  {
    id: 3,
    accountName: "PromptPay ธุรกิจ",
    bankName: "",
    accountNumber: "",
    accountHolderName: "บจ. คริสตัล เลดเจอร์",
    promptpayId: "088-123-4567",
    accountType: "รับผู้เช่า",
    status: "ACTIVE",
  },
  {
    id: 4,
    accountName: "เงินสดสำนักงาน",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    promptpayId: "",
    accountType: "เงินสด",
    status: "ACTIVE",
  },
];

// Matches by accountType/promptpayId/bankName rather than accountName — accountName is
// free-text and "เงินสดสำนักงาน" !== "เงินสด", so name-equality would silently mis-bucket it.
export function incomeRowsByChannel(account: PaymentAccountRecord): IncomeRow[] {
  if (account.accountType === "เงินสด") return INCOME_ROWS.filter((r) => r.channel === "เงินสด");
  if (account.promptpayId && !account.bankName) return INCOME_ROWS.filter((r) => r.channel === "PromptPay");
  return INCOME_ROWS.filter((r) => r.channel === "โอนธนาคาร");
}
```

- [ ] **Step 10: Verify, commit**

Run: `npm run build`
Expected: `✓ Compiled successfully`

```bash
git add src/lib/mock.ts
git commit -m "feat: add PaymentAccount mock data and channel-matching helper"
```

---

### Task 3: Owners page (table + drawer + form modal)

**Files:**
- Create: `src/components/owners/OwnerDrawer.tsx`
- Create: `src/components/owners/OwnerFormModal.tsx`
- Modify: `src/app/(dashboard)/owners/page.tsx` (replace `PlaceholderView` entirely)

**Interfaces:**
- Consumes: `Drawer, StatBox, InfoRow, InfoSection` from `@/components/shared/Drawer`; `FormModal, FieldsGrid, TextField, TextAreaField, ToggleField` from `@/components/shared/FormModal`; `ListCard, TableWrap, Th` from `@/components/shared/ListCard`; `badge, fmtTHB, maskAccountNumber` from `@/lib/theme`; `Icon` from `@/components/Icon`; `OWNERS, Owner, OwnerStatus, roomsByOwner, payoutsByOwner, pendingPayoutTotal, paidPayoutTotal, monthlyIncomeByOwner, ROOM_BADGE_KIND` from `@/lib/mock`.
- Produces: `OwnerDrawer(props: { owner: Owner | null; onClose: () => void; onEdit: (o: Owner) => void; onDelete: (o: Owner) => void })`; `OwnerFormModal(props: { open: boolean; editing: Owner | null; onClose: () => void; onSubmit: (draft: OwnerDraft) => void })` with exported type `OwnerDraft`; default export page component at `/owners`.

- [ ] **Step 1: Create `src/components/owners/OwnerDrawer.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Drawer, StatBox, InfoRow, InfoSection } from "@/components/shared/Drawer";
import { badge, fmtTHB } from "@/lib/theme";
import {
  roomsByOwner,
  payoutsByOwner,
  pendingPayoutTotal,
  paidPayoutTotal,
  monthlyIncomeByOwner,
  ROOM_BADGE_KIND,
  type Owner,
} from "@/lib/mock";

const TABS = ["ภาพรวม", "ห้องในความดูแล", "ประวัติจ่ายเงิน"];

export function OwnerDrawer({
  owner,
  onClose,
  onEdit,
  onDelete,
}: {
  owner: Owner | null;
  onClose: () => void;
  onEdit: (owner: Owner) => void;
  onDelete: (owner: Owner) => void;
}) {
  const [tab, setTab] = useState(0);

  if (!owner) return null;

  const rooms = roomsByOwner(owner.fullName);
  const payouts = payoutsByOwner(owner.fullName);
  const pending = pendingPayoutTotal(owner.fullName);
  const paid = paidPayoutTotal(owner.fullName);
  const income = monthlyIncomeByOwner(owner.fullName);

  return (
    <Drawer
      onClose={onClose}
      eyebrow={owner.ownerCode}
      title={owner.fullName}
      badge={
        <span style={{ ...badge(owner.status === "ACTIVE" ? "green" : "gray"), marginTop: 8, display: "inline-flex" }}>
          {owner.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}
        </span>
      }
      tabs={TABS.map((label, i) => ({ label, active: tab === i, onClick: () => setTab(i) }))}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatBox bg="rgba(56,189,248,0.1)" border="rgba(56,189,248,0.22)" color="#7DD3FC" label="ห้องทั้งหมด" value={`${rooms.length} ห้อง`} />
        <StatBox bg="rgba(251,191,36,0.08)" border="rgba(251,191,36,0.2)" color="#FDE68A" label="ยอดรอจ่าย" value={fmtTHB(pending)} />
        <StatBox bg="rgba(94,234,212,0.09)" border="rgba(94,234,212,0.2)" color="#7FF0D9" label="จ่ายแล้วสะสม" value={fmtTHB(paid)} />
        <StatBox bg="rgba(168,85,247,0.09)" border="rgba(168,85,247,0.2)" color="#DDD6FE" label="รายรับรวมเดือนนี้" value={fmtTHB(income)} />
      </div>

      {tab === 0 ? (
        <InfoSection title="ข้อมูลติดต่อ">
          <InfoRow k="เบอร์โทร" v={owner.phone} />
          <InfoRow k="อีเมล" v={owner.email} />
          <InfoRow k="LINE ID" v={owner.lineId} />
          <InfoRow k="ที่อยู่" v={owner.address} />
          <InfoRow k="ธนาคาร" v={owner.bankName} />
          <InfoRow k="เลขที่บัญชี" v={owner.bankAccountNumber} />
          <InfoRow k="ชื่อบัญชี" v={owner.bankAccountName} />
          <InfoRow k="PromptPay ID" v={owner.promptpayId} />
          {owner.note ? <InfoRow k="หมายเหตุ" v={owner.note} /> : null}
        </InfoSection>
      ) : null}

      {tab === 1 ? (
        <InfoSection title={`ห้องในความดูแล (${rooms.length})`}>
          {rooms.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(234,242,255,0.5)" }}>ยังไม่มีห้องผูกกับเจ้าของรายนี้</div>
          ) : (
            rooms.map((r) => (
              <div
                key={r.no}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.no}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{r.building}</div>
                </div>
                <span style={badge(ROOM_BADGE_KIND[r.status])}>{r.status}</span>
              </div>
            ))
          )}
        </InfoSection>
      ) : null}

      {tab === 2 ? (
        <InfoSection title="ประวัติจ่ายเงิน">
          {payouts.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(234,242,255,0.5)" }}>ยังไม่มีประวัติการจ่ายเงิน</div>
          ) : (
            payouts.map((p, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.room}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>
                    รายรับ {p.income} · หัก {p.deduct}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, color: "#7FF0D9" }}>{p.net}</div>
                  <span style={badge(p.badge)}>{p.status}</span>
                </div>
              </div>
            ))
          )}
        </InfoSection>
      ) : null}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => onDelete(owner)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(251,113,133,0.35)",
            background: "rgba(251,113,133,0.08)",
            color: "#FDA4AF",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ลบเจ้าของ
        </button>
        <button
          onClick={() => onEdit(owner)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(255,255,255,0.28)",
            color: "#04121A",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
            boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
          }}
        >
          แก้ไขข้อมูล
        </button>
      </div>
    </Drawer>
  );
}
```

- [ ] **Step 2: Create `src/components/owners/OwnerFormModal.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { FormModal, FieldsGrid, TextField, TextAreaField, ToggleField } from "@/components/shared/FormModal";
import type { Owner, OwnerStatus } from "@/lib/mock";

export type OwnerDraft = {
  fullName: string;
  phone: string;
  email: string;
  lineId: string;
  address: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  promptpayId: string;
  note: string;
  status: OwnerStatus;
};

const BLANK_DRAFT: OwnerDraft = {
  fullName: "",
  phone: "",
  email: "",
  lineId: "",
  address: "",
  bankName: "",
  bankAccountNumber: "",
  bankAccountName: "",
  promptpayId: "",
  note: "",
  status: "ACTIVE",
};

export function OwnerFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: Owner | null;
  onClose: () => void;
  onSubmit: (draft: OwnerDraft) => void;
}) {
  const [draft, setDraft] = useState<OwnerDraft>(BLANK_DRAFT);

  useEffect(() => {
    if (!open) return;
    setDraft(
      editing
        ? {
            fullName: editing.fullName,
            phone: editing.phone,
            email: editing.email,
            lineId: editing.lineId,
            address: editing.address,
            bankName: editing.bankName,
            bankAccountNumber: editing.bankAccountNumber,
            bankAccountName: editing.bankAccountName,
            promptpayId: editing.promptpayId,
            note: editing.note,
            status: editing.status,
          }
        : BLANK_DRAFT
    );
  }, [open, editing]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      icon={<Icon name="owners" size={18} />}
      title={editing ? "แก้ไขข้อมูลเจ้าของ" : "เพิ่มเจ้าของใหม่"}
      subtitle="ข้อมูลติดต่อและบัญชีธนาคารสำหรับจ่ายเงิน"
      onSubmit={() => onSubmit(draft)}
      submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มเจ้าของ"}
    >
      <FieldsGrid>
        <TextField label="ชื่อ-นามสกุล" value={draft.fullName} onChange={(v) => setDraft({ ...draft, fullName: v })} placeholder="คุณสมชาย วัฒนโสภณ" />
        <TextField label="เบอร์โทร" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} placeholder="081-234-5678" />
        <TextField label="อีเมล" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} type="email" />
        <TextField label="LINE ID" value={draft.lineId} onChange={(v) => setDraft({ ...draft, lineId: v })} />
      </FieldsGrid>
      <TextAreaField label="ที่อยู่" value={draft.address} onChange={(v) => setDraft({ ...draft, address: v })} />
      <FieldsGrid>
        <TextField label="ธนาคาร" value={draft.bankName} onChange={(v) => setDraft({ ...draft, bankName: v })} placeholder="KBank" />
        <TextField label="เลขที่บัญชี" value={draft.bankAccountNumber} onChange={(v) => setDraft({ ...draft, bankAccountNumber: v })} />
        <TextField label="ชื่อบัญชี" value={draft.bankAccountName} onChange={(v) => setDraft({ ...draft, bankAccountName: v })} />
        <TextField label="PromptPay ID" value={draft.promptpayId} onChange={(v) => setDraft({ ...draft, promptpayId: v })} />
      </FieldsGrid>
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
```

- [ ] **Step 3: Replace `src/app/(dashboard)/owners/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ListCard, TableWrap, Th } from "@/components/shared/ListCard";
import { OwnerDrawer } from "@/components/owners/OwnerDrawer";
import { OwnerFormModal, type OwnerDraft } from "@/components/owners/OwnerFormModal";
import { badge, fmtTHB, maskAccountNumber } from "@/lib/theme";
import { OWNERS, roomsByOwner, pendingPayoutTotal, type Owner } from "@/lib/mock";

function nextOwnerId(list: Owner[]): number {
  return list.reduce((max, o) => Math.max(max, o.id), 0) + 1;
}

function nextOwnerCode(nextId: number): string {
  return `OWN-${String(nextId).padStart(4, "0")}`;
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>(OWNERS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const selected = owners.find((o) => o.id === selectedId) ?? null;
  const editing = owners.find((o) => o.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(owner: Owner) {
    setEditingId(owner.id);
    setFormOpen(true);
  }

  function handleSubmit(draft: OwnerDraft) {
    if (editingId != null) {
      setOwners((list) => list.map((o) => (o.id === editingId ? { ...o, ...draft } : o)));
    } else {
      const id = nextOwnerId(owners);
      setOwners((list) => [...list, { id, ownerCode: nextOwnerCode(id), ...draft }]);
    }
    setFormOpen(false);
    setEditingId(null);
  }

  function handleDelete(owner: Owner) {
    const roomCount = roomsByOwner(owner.fullName).length;
    if (roomCount > 0) {
      alert(`ลบไม่ได้ — เจ้าของรายนี้ยังมีห้องในความดูแลอยู่ ${roomCount} ห้อง`);
      return;
    }
    if (!confirm(`ยืนยันลบเจ้าของ "${owner.fullName}"?`)) return;
    setOwners((list) => list.filter((o) => o.id !== owner.id));
    setSelectedId(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <ListCard
        title="เจ้าของทรัพย์สินทั้งหมด"
        actions={
          <button
            onClick={openCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 15px",
              borderRadius: 11,
              border: "1px solid rgba(255,255,255,0.28)",
              color: "#04121A",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
              boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
            }}
          >
            <Icon name="plus" size={15} />
            เพิ่มเจ้าของ
          </button>
        }
      >
        <TableWrap minWidth={860}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              <Th>รหัส</Th>
              <Th>ชื่อ-นามสกุล</Th>
              <Th>บัญชีธนาคาร</Th>
              <Th align="right">ห้องในความดูแล</Th>
              <Th align="right">ยอดที่ต้องจ่าย</Th>
              <Th>สถานะ</Th>
              <th style={{ padding: "12px 16px" }} />
            </tr>
          </thead>
          <tbody>
            {owners.map((o) => {
              const roomCount = roomsByOwner(o.fullName).length;
              const pending = pendingPayoutTotal(o.fullName);
              return (
                <tr key={o.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(234,242,255,0.7)", whiteSpace: "nowrap" }}>
                    {o.ownerCode}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{o.fullName}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{o.phone}</div>
                  </td>
                  <td style={{ padding: "13px 16px", color: "rgba(234,242,255,0.8)", whiteSpace: "nowrap" }}>
                    {o.bankName} · {maskAccountNumber(o.bankAccountNumber)}
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>{roomCount} ห้อง</td>
                  <td
                    style={{
                      padding: "13px 16px",
                      textAlign: "right",
                      fontFamily: "Sora,sans-serif",
                      fontWeight: 600,
                      color: pending > 0 ? "#FDA4AF" : "rgba(234,242,255,0.4)",
                    }}
                  >
                    {fmtTHB(pending)}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={badge(o.status === "ACTIVE" ? "green" : "gray")}>{o.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}</span>
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedId(o.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 9,
                        border: "1px solid rgba(255,255,255,0.16)",
                        background: "rgba(255,255,255,0.06)",
                        color: "#EAF2FF",
                        fontFamily: "inherit",
                        fontSize: 11.5,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      รายละเอียด
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </ListCard>

      <OwnerDrawer
        owner={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(owner) => {
          setSelectedId(null);
          openEdit(owner);
        }}
        onDelete={handleDelete}
      />

      <OwnerFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: `✓ Compiled successfully`, `✓ Generating static pages (19/19)`, and the route table includes `/owners` with a non-trivial JS size (bigger than the ~3.44 kB placeholder size it had before).

- [ ] **Step 5: Manual verification with Claude Code Preview tools**

Call `mcp__Claude_Preview__preview_start` with `name: "web"` (uses `.claude/launch.json`), then:

1. `mcp__Claude_Preview__preview_eval` with `expression: "window.location.href = 'http://localhost:3210/owners'; 'ok'"`
2. `mcp__Claude_Preview__preview_snapshot` — confirm the table shows 4 rows: คุณสมชาย วัฒนโสภณ, คุณพิมพ์ใจ ธีรกุล, คุณอนุชา เดชา, คุณวีระ สุขสันต์, and คุณสมชาย's row shows "2 ห้อง"
3. Click "รายละเอียด" on คุณสมชาย's row (via `preview_click` with a selector matching that row's button, or `preview_eval` dispatching a click) — confirm the drawer opens showing "ห้องทั้งหมด: 2 ห้อง" and the ห้องในความดูแล tab lists A-1105 and A-1204
4. Click "เพิ่มเจ้าของ" — confirm the modal opens; fill "ชื่อ-นามสกุล" with a test value via `preview_fill`, click "เพิ่มเจ้าของ" — confirm the modal closes and the new row appears in the table
5. `mcp__Claude_Preview__preview_console_logs` with `level: "error"` — expected: no errors (in particular, no duplicate-key warnings — see the earlier BarChart incident)

- [ ] **Step 6: Commit**

```bash
git add src/components/owners src/app/\(dashboard\)/owners/page.tsx
git commit -m "feat: build Owners CRUD page (table, drawer, form modal)"
```

---

### Task 4: Properties page (card grid + drawer + form modal)

**Files:**
- Create: `src/components/properties/PropertyDrawer.tsx`
- Create: `src/components/properties/PropertyFormModal.tsx`
- Modify: `src/app/(dashboard)/properties/page.tsx` (replace `PlaceholderView` entirely)

**Interfaces:**
- Consumes: `Drawer, StatBox, InfoRow, InfoSection` from `@/components/shared/Drawer`; `FormModal, FieldsGrid, TextField, TextAreaField, SelectField, ToggleField` from `@/components/shared/FormModal`; `badge, fmtTHB, parseAmount` from `@/lib/theme`; `Icon` from `@/components/Icon`; `PROPERTIES, Property, PropertyStatus, PROPERTY_TYPE_OPTIONS, roomsByProperty, ROOM_BADGE_KIND` from `@/lib/mock`.
- Produces: `PropertyDrawer(props: { property: Property | null; onClose: () => void; onEdit: (p: Property) => void; onDelete: (p: Property) => void })`; `PropertyFormModal(props: { open: boolean; editing: Property | null; onClose: () => void; onSubmit: (draft: PropertyDraft) => void })` with exported type `PropertyDraft`; default export page component at `/properties`.

- [ ] **Step 1: Create `src/components/properties/PropertyDrawer.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Drawer, StatBox, InfoRow, InfoSection } from "@/components/shared/Drawer";
import { badge, fmtTHB, parseAmount } from "@/lib/theme";
import { roomsByProperty, ROOM_BADGE_KIND, type Property } from "@/lib/mock";

const TABS = ["ภาพรวม", "ห้องทั้งหมด", "สรุปรายรับ-รายจ่าย"];

export function PropertyDrawer({
  property,
  onClose,
  onEdit,
  onDelete,
}: {
  property: Property | null;
  onClose: () => void;
  onEdit: (property: Property) => void;
  onDelete: (property: Property) => void;
}) {
  const [tab, setTab] = useState(0);

  if (!property) return null;

  const rooms = roomsByProperty(property.propertyName);
  const occupied = rooms.filter((r) => r.status === "มีผู้เช่า").length;
  const vacant = rooms.filter((r) => r.status === "ว่าง").length;
  const totalExpense = rooms.reduce((sum, r) => sum + parseAmount(r.expense), 0);

  return (
    <Drawer
      onClose={onClose}
      eyebrow={property.propertyCode}
      title={property.propertyName}
      badge={
        <span style={{ ...badge(property.status === "ACTIVE" ? "green" : "gray"), marginTop: 8, display: "inline-flex" }}>
          {property.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}
        </span>
      }
      tabs={TABS.map((label, i) => ({ label, active: tab === i, onClick: () => setTab(i) }))}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatBox bg="rgba(56,189,248,0.1)" border="rgba(56,189,248,0.22)" color="#7DD3FC" label="ห้องทั้งหมด" value={`${rooms.length} ห้อง`} />
        <StatBox bg="rgba(52,211,153,0.08)" border="rgba(52,211,153,0.2)" color="#6EE7B7" label="มีผู้เช่า" value={`${occupied} ห้อง`} />
        <StatBox bg="rgba(56,189,248,0.08)" border="rgba(56,189,248,0.2)" color="#7DD3FC" label="ห้องว่าง" value={`${vacant} ห้อง`} />
        <StatBox bg="rgba(94,234,212,0.09)" border="rgba(94,234,212,0.2)" color="#7FF0D9" label="รายรับเดือนนี้" value={fmtTHB(property.monthlyIncome)} />
      </div>

      {tab === 0 ? (
        <>
          <InfoSection title="ข้อมูลอาคาร">
            <InfoRow k="ประเภทอาคาร" v={property.propertyType} />
            <InfoRow k="ที่อยู่" v={property.address} />
            <InfoRow k="จังหวัด" v={property.province} />
            <InfoRow k="อำเภอ/เขต" v={property.district} />
            <InfoRow k="ตำบล/แขวง" v={property.subdistrict} />
            <InfoRow k="ผู้ติดต่อ" v={property.contactName} />
            <InfoRow k="เบอร์โทร" v={property.contactPhone} />
            {property.note ? <InfoRow k="หมายเหตุ" v={property.note} /> : null}
          </InfoSection>
          <div
            style={{
              height: 100,
              borderRadius: 14,
              background: "repeating-linear-gradient(135deg,rgba(255,255,255,0.05) 0 8px,transparent 8px 16px)",
              border: "1px solid rgba(255,255,255,0.09)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "monospace",
              fontSize: 11,
              color: "rgba(234,242,255,0.4)",
            }}
          >
            แผนที่ (placeholder)
          </div>
        </>
      ) : null}

      {tab === 1 ? (
        <InfoSection title={`ห้องทั้งหมด (${rooms.length})`}>
          {rooms.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(234,242,255,0.5)" }}>ยังไม่มีห้องในอาคารนี้</div>
          ) : (
            rooms.map((r) => (
              <div
                key={r.no}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.no}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>เจ้าของ: {r.owner}</div>
                </div>
                <span style={badge(ROOM_BADGE_KIND[r.status])}>{r.status}</span>
              </div>
            ))
          )}
        </InfoSection>
      ) : null}

      {tab === 2 ? (
        <InfoSection title="สรุปรายรับ-รายจ่ายของอาคาร">
          <InfoRow k="รายรับรวมเดือนนี้" v={fmtTHB(property.monthlyIncome)} />
          <InfoRow k="ค่าใช้จ่ายรวมเดือนนี้" v={fmtTHB(totalExpense)} />
          <InfoRow k="กำไรเบื้องต้น" v={fmtTHB(property.monthlyIncome - totalExpense)} />
        </InfoSection>
      ) : null}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => onDelete(property)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(251,113,133,0.35)",
            background: "rgba(251,113,133,0.08)",
            color: "#FDA4AF",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ลบอาคาร
        </button>
        <button
          onClick={() => onEdit(property)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(255,255,255,0.28)",
            color: "#04121A",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
            boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
          }}
        >
          แก้ไขข้อมูล
        </button>
      </div>
    </Drawer>
  );
}
```

- [ ] **Step 2: Create `src/components/properties/PropertyFormModal.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { FormModal, FieldsGrid, TextField, TextAreaField, SelectField, ToggleField } from "@/components/shared/FormModal";
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
```

- [ ] **Step 3: Replace `src/app/(dashboard)/properties/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { badge, fmtTHB } from "@/lib/theme";
import { PropertyDrawer } from "@/components/properties/PropertyDrawer";
import { PropertyFormModal, type PropertyDraft } from "@/components/properties/PropertyFormModal";
import { PROPERTIES, roomsByProperty, type Property } from "@/lib/mock";

function nextPropertyId(list: Property[]): number {
  return list.reduce((max, p) => Math.max(max, p.id), 0) + 1;
}

function nextPropertyCode(nextId: number): string {
  return `PPT-${String(nextId).padStart(4, "0")}`;
}

const softBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "8px 13px",
  borderRadius: 11,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.05)",
  color: "#EAF2FF",
  fontFamily: "inherit",
  fontSize: 12.5,
  cursor: "pointer",
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>(PROPERTIES);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const selected = properties.find((p) => p.id === selectedId) ?? null;
  const editing = properties.find((p) => p.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(property: Property) {
    setEditingId(property.id);
    setFormOpen(true);
  }

  function handleSubmit(draft: PropertyDraft) {
    if (editingId != null) {
      setProperties((list) => list.map((p) => (p.id === editingId ? { ...p, ...draft } : p)));
    } else {
      const id = nextPropertyId(properties);
      setProperties((list) => [...list, { id, propertyCode: nextPropertyCode(id), ...draft }]);
    }
    setFormOpen(false);
    setEditingId(null);
  }

  function handleDelete(property: Property) {
    const roomCount = roomsByProperty(property.propertyName).length;
    if (roomCount > 0) {
      alert(`ลบไม่ได้ — อาคารนี้ยังมีห้องอยู่ ${roomCount} ห้อง`);
      return;
    }
    if (!confirm(`ยืนยันลบอาคาร "${property.propertyName}"?`)) return;
    setProperties((list) => list.filter((p) => p.id !== property.id));
    setSelectedId(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
        <button style={softBtn}>
          ประเภทอาคาร<span style={{ color: "rgba(234,242,255,0.5)" }}>ทั้งหมด</span>
          <span style={{ color: "rgba(234,242,255,0.4)" }}>
            <Icon name="chevDown" size={14} />
          </span>
        </button>
        <button style={softBtn}>
          จังหวัด<span style={{ color: "rgba(234,242,255,0.5)" }}>ทั้งหมด</span>
          <span style={{ color: "rgba(234,242,255,0.4)" }}>
            <Icon name="chevDown" size={14} />
          </span>
        </button>
        <button
          onClick={openCreate}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 15px",
            borderRadius: 11,
            border: "1px solid rgba(255,255,255,0.28)",
            color: "#04121A",
            fontFamily: "inherit",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
            boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
          }}
        >
          <Icon name="plus" size={15} />
          เพิ่มอาคาร
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {properties.map((p) => {
          const rooms = roomsByProperty(p.propertyName);
          const occupied = rooms.filter((r) => r.status === "มีผู้เช่า").length;
          const vacant = rooms.filter((r) => r.status === "ว่าง").length;
          return (
            <div
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{
                cursor: "pointer",
                overflow: "hidden",
                borderRadius: 22,
                background: "rgba(255,255,255,0.055)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
              }}
            >
              <div
                style={{
                  height: 88,
                  position: "relative",
                  background: "linear-gradient(135deg,#0e2a3a,#123)",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  padding: 12,
                }}
              >
                <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(135deg,rgba(255,255,255,0.05) 0 8px,transparent 8px 16px)" }} />
                <span style={{ position: "relative", fontFamily: "monospace", fontSize: 10.5, color: "rgba(234,242,255,0.5)" }}>property photo</span>
                <span style={badge(p.status === "ACTIVE" ? "green" : "gray")}>{p.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}</span>
              </div>
              <div style={{ padding: "15px 16px 17px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 16 }}>{p.propertyName}</div>
                  <span style={badge("blue")}>{p.propertyType}</span>
                </div>
                <div style={{ fontSize: 12, color: "rgba(234,242,255,0.55)", marginTop: 3 }}>
                  {p.district}, {p.province}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 13 }}>
                  <div style={{ flex: 1, padding: "9px 11px", borderRadius: 12, background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.16)" }}>
                    <div style={{ fontSize: 10.5, color: "rgba(234,242,255,0.55)" }}>มีผู้เช่า</div>
                    <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 14.5, color: "#6EE7B7", marginTop: 2 }}>{occupied} ห้อง</div>
                  </div>
                  <div style={{ flex: 1, padding: "9px 11px", borderRadius: 12, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" }}>
                    <div style={{ fontSize: 10.5, color: "rgba(234,242,255,0.55)" }}>ห้องว่าง</div>
                    <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, fontSize: 14.5, color: "#7DD3FC", marginTop: 2 }}>{vacant} ห้อง</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "rgba(234,242,255,0.6)", marginTop: 12, paddingTop: 11, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                  รายรับเดือนนี้ · {fmtTHB(p.monthlyIncome)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PropertyDrawer
        property={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(property) => {
          setSelectedId(null);
          openEdit(property);
        }}
        onDelete={handleDelete}
      />

      <PropertyFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: `✓ Compiled successfully`, `/properties` route size grows past its placeholder size.

- [ ] **Step 5: Manual verification with Claude Code Preview tools**

1. Navigate to `/properties` via `preview_eval`
2. `preview_snapshot` — confirm 4 cards: เดอะ เครสท์ (rอรับเดือนนี้ · ฿468,000), บ้านสวน พัทยา (฿352,000), แฟลตรุ่งเรือง (฿246,000), ศุภาลัย เรส (฿182,000) — these must match the Dashboard's "รายรับแยกตามอาคาร" bar chart figures exactly; cross-check by also navigating to `/dashboard` and comparing
3. Click the เดอะ เครสท์ card — confirm drawer shows "ห้องทั้งหมด: 4 ห้อง", "มีผู้เช่า: 2 ห้อง", "ห้องว่าง: 1 ห้อง"
4. Open "เพิ่มอาคาร", fill required fields, submit — confirm new card appears
5. `preview_console_logs` with `level: "error"` — expected: none

- [ ] **Step 6: Commit**

```bash
git add src/components/properties src/app/\(dashboard\)/properties/page.tsx
git commit -m "feat: build Properties CRUD page (card grid, drawer, form modal)"
```

---

### Task 5: Tenants page (table + drawer + form modal)

**Files:**
- Create: `src/components/tenants/TenantDrawer.tsx`
- Create: `src/components/tenants/TenantFormModal.tsx`
- Modify: `src/app/(dashboard)/tenants/page.tsx` (replace `PlaceholderView` entirely)

**Interfaces:**
- Consumes: `Drawer, InfoRow, InfoSection` from `@/components/shared/Drawer`; `FormModal, FieldsGrid, TextField, TextAreaField, ToggleField` from `@/components/shared/FormModal`; `ListCard, TableWrap, Th` from `@/components/shared/ListCard`; `badge` from `@/lib/theme`; `Icon` from `@/components/Icon`; `TENANTS, Tenant, TenantStatus, rentalsByTenant, latestRentalByTenant` from `@/lib/mock`.
- Produces: `TenantDrawer(props: { tenant: Tenant | null; onClose: () => void; onEdit: (t: Tenant) => void; onDelete: (t: Tenant) => void })`; `TenantFormModal(props: { open: boolean; editing: Tenant | null; onClose: () => void; onSubmit: (draft: TenantDraft) => void })` with exported type `TenantDraft`; default export page component at `/tenants`.

- [ ] **Step 1: Create `src/components/tenants/TenantDrawer.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Drawer, InfoRow, InfoSection } from "@/components/shared/Drawer";
import { badge } from "@/lib/theme";
import { rentalsByTenant, type Tenant } from "@/lib/mock";

const TABS = ["ภาพรวม", "ประวัติการเช่า", "เอกสารแนบ"];

export function TenantDrawer({
  tenant,
  onClose,
  onEdit,
  onDelete,
}: {
  tenant: Tenant | null;
  onClose: () => void;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
}) {
  const [tab, setTab] = useState(0);

  if (!tenant) return null;

  const rentals = rentalsByTenant(tenant.fullName);

  return (
    <Drawer
      onClose={onClose}
      eyebrow={tenant.tenantCode}
      title={tenant.fullName}
      badge={
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <span style={badge(tenant.status === "ACTIVE" ? "green" : "gray")}>{tenant.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}</span>
          {tenant.blacklist ? <span style={badge("red")}>Blacklist</span> : null}
        </div>
      }
      tabs={TABS.map((label, i) => ({ label, active: tab === i, onClick: () => setTab(i) }))}
    >
      {tab === 0 ? (
        <InfoSection title="ข้อมูลติดต่อ">
          <InfoRow k="เบอร์โทร" v={tenant.phone} />
          <InfoRow k="อีเมล" v={tenant.email} />
          <InfoRow k="LINE ID" v={tenant.lineId} />
          <InfoRow k="เลขบัตรประชาชน/Passport" v={tenant.idCardOrPassport} />
          <InfoRow k="สัญชาติ" v={tenant.nationality} />
          <InfoRow k="ที่อยู่" v={tenant.address} />
          {tenant.note ? <InfoRow k="หมายเหตุ" v={tenant.note} /> : null}
        </InfoSection>
      ) : null}

      {tab === 1 ? (
        <InfoSection title={`ประวัติการเช่า (${rentals.length})`}>
          {rentals.length === 0 ? (
            <div style={{ fontSize: 13, color: "rgba(234,242,255,0.5)" }}>ยังไม่มีประวัติการเช่า</div>
          ) : (
            rentals.map((r) => (
              <div
                key={r.code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {r.room} · {r.building}
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>
                    {r.code} · {r.period}
                  </div>
                </div>
                <span style={badge(r.badge)}>{r.status}</span>
              </div>
            ))
          )}
        </InfoSection>
      ) : null}

      {tab === 2 ? (
        <InfoSection title="เอกสารแนบ">
          {["สำเนาบัตรประชาชน.jpg", "สัญญาเช่า.pdf"].map((f) => (
            <div
              key={f}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 0",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                fontSize: 13,
              }}
            >
              <span style={{ color: "rgba(234,242,255,0.5)" }}>📎</span>
              {f}
            </div>
          ))}
        </InfoSection>
      ) : null}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => onDelete(tenant)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(251,113,133,0.35)",
            background: "rgba(251,113,133,0.08)",
            color: "#FDA4AF",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ลบผู้เช่า
        </button>
        <button
          onClick={() => onEdit(tenant)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(255,255,255,0.28)",
            color: "#04121A",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
            boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
          }}
        >
          แก้ไขข้อมูล
        </button>
      </div>
    </Drawer>
  );
}
```

- [ ] **Step 2: Create `src/components/tenants/TenantFormModal.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { FormModal, FieldsGrid, TextField, TextAreaField, ToggleField } from "@/components/shared/FormModal";
import type { Tenant, TenantStatus } from "@/lib/mock";

export type TenantDraft = {
  fullName: string;
  phone: string;
  email: string;
  lineId: string;
  idCardOrPassport: string;
  nationality: string;
  address: string;
  note: string;
  blacklist: boolean;
  status: TenantStatus;
};

const BLANK_DRAFT: TenantDraft = {
  fullName: "",
  phone: "",
  email: "",
  lineId: "",
  idCardOrPassport: "",
  nationality: "ไทย",
  address: "",
  note: "",
  blacklist: false,
  status: "ACTIVE",
};

export function TenantFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: Tenant | null;
  onClose: () => void;
  onSubmit: (draft: TenantDraft) => void;
}) {
  const [draft, setDraft] = useState<TenantDraft>(BLANK_DRAFT);

  useEffect(() => {
    if (!open) return;
    setDraft(
      editing
        ? {
            fullName: editing.fullName,
            phone: editing.phone,
            email: editing.email,
            lineId: editing.lineId,
            idCardOrPassport: editing.idCardOrPassport,
            nationality: editing.nationality,
            address: editing.address,
            note: editing.note,
            blacklist: editing.blacklist,
            status: editing.status,
          }
        : BLANK_DRAFT
    );
  }, [open, editing]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      icon={<Icon name="tenant" size={18} />}
      title={editing ? "แก้ไขข้อมูลผู้เช่า" : "เพิ่มผู้เช่าใหม่"}
      subtitle="ข้อมูลติดต่อและเอกสารยืนยันตัวตน"
      onSubmit={() => onSubmit(draft)}
      submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มผู้เช่า"}
    >
      <FieldsGrid>
        <TextField label="ชื่อ-นามสกุล" value={draft.fullName} onChange={(v) => setDraft({ ...draft, fullName: v })} placeholder="คุณกิตติพงษ์ ใจดี" />
        <TextField label="เบอร์โทร" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} placeholder="081-234-5678" />
        <TextField label="อีเมล" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} type="email" />
        <TextField label="LINE ID" value={draft.lineId} onChange={(v) => setDraft({ ...draft, lineId: v })} />
        <TextField label="เลขบัตรประชาชน/Passport" value={draft.idCardOrPassport} onChange={(v) => setDraft({ ...draft, idCardOrPassport: v })} />
        <TextField label="สัญชาติ" value={draft.nationality} onChange={(v) => setDraft({ ...draft, nationality: v })} />
      </FieldsGrid>
      <TextAreaField label="ที่อยู่" value={draft.address} onChange={(v) => setDraft({ ...draft, address: v })} />
      <TextAreaField label="หมายเหตุ" value={draft.note} onChange={(v) => setDraft({ ...draft, note: v })} />
      <ToggleField
        label="Blacklist / Watchlist"
        checked={draft.blacklist}
        onChange={(v) => setDraft({ ...draft, blacklist: v })}
        onLabel="ติดสถานะ Blacklist"
        offLabel="ปกติ"
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
```

- [ ] **Step 3: Replace `src/app/(dashboard)/tenants/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { ListCard, TableWrap, Th } from "@/components/shared/ListCard";
import { TenantDrawer } from "@/components/tenants/TenantDrawer";
import { TenantFormModal, type TenantDraft } from "@/components/tenants/TenantFormModal";
import { badge } from "@/lib/theme";
import { TENANTS, latestRentalByTenant, type Tenant } from "@/lib/mock";

function nextTenantId(list: Tenant[]): number {
  return list.reduce((max, t) => Math.max(max, t.id), 0) + 1;
}

function nextTenantCode(nextId: number): string {
  return `TNT-${String(nextId).padStart(4, "0")}`;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(TENANTS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const selected = tenants.find((t) => t.id === selectedId) ?? null;
  const editing = tenants.find((t) => t.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(tenant: Tenant) {
    setEditingId(tenant.id);
    setFormOpen(true);
  }

  function handleSubmit(draft: TenantDraft) {
    if (editingId != null) {
      setTenants((list) => list.map((t) => (t.id === editingId ? { ...t, ...draft } : t)));
    } else {
      const id = nextTenantId(tenants);
      setTenants((list) => [...list, { id, tenantCode: nextTenantCode(id), ...draft }]);
    }
    setFormOpen(false);
    setEditingId(null);
  }

  function handleDelete(tenant: Tenant) {
    const latest = latestRentalByTenant(tenant.fullName);
    if (latest && latest.due !== "฿0") {
      alert(`ลบไม่ได้ — ผู้เช่ารายนี้ยังมีสัญญาที่ค้างชำระอยู่ (${latest.code})`);
      return;
    }
    if (!confirm(`ยืนยันลบผู้เช่า "${tenant.fullName}"?`)) return;
    setTenants((list) => list.filter((t) => t.id !== tenant.id));
    setSelectedId(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <ListCard
        title="ผู้เช่าทั้งหมด"
        actions={
          <button
            onClick={openCreate}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 15px",
              borderRadius: 11,
              border: "1px solid rgba(255,255,255,0.28)",
              color: "#04121A",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
              boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
            }}
          >
            <Icon name="plus" size={15} />
            เพิ่มผู้เช่า
          </button>
        }
      >
        <TableWrap minWidth={860}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.04)" }}>
              <Th>รหัส</Th>
              <Th>ชื่อ-นามสกุล</Th>
              <Th>ห้อง/สัญญาปัจจุบัน</Th>
              <Th>สถานะชำระ</Th>
              <Th>Blacklist</Th>
              <th style={{ padding: "12px 16px" }} />
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => {
              const latest = latestRentalByTenant(t.fullName);
              return (
                <tr key={t.id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(234,242,255,0.7)", whiteSpace: "nowrap" }}>
                    {t.tenantCode}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{t.fullName}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>{t.phone}</div>
                  </td>
                  <td style={{ padding: "13px 16px", color: "rgba(234,242,255,0.8)" }}>{latest ? `${latest.room} · ${latest.building}` : "—"}</td>
                  <td style={{ padding: "13px 16px" }}>
                    {latest ? <span style={badge(latest.badge)}>{latest.status}</span> : <span style={{ color: "rgba(234,242,255,0.4)" }}>—</span>}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {t.blacklist ? <span style={badge("red")}>Blacklist</span> : <span style={{ color: "rgba(234,242,255,0.4)" }}>—</span>}
                  </td>
                  <td style={{ padding: "13px 16px", textAlign: "right" }}>
                    <button
                      onClick={() => setSelectedId(t.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 9,
                        border: "1px solid rgba(255,255,255,0.16)",
                        background: "rgba(255,255,255,0.06)",
                        color: "#EAF2FF",
                        fontFamily: "inherit",
                        fontSize: 11.5,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      รายละเอียด
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </ListCard>

      <TenantDrawer
        tenant={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(tenant) => {
          setSelectedId(null);
          openEdit(tenant);
        }}
        onDelete={handleDelete}
      />

      <TenantFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: `✓ Compiled successfully`, `/tenants` route size grows past its placeholder size.

- [ ] **Step 5: Manual verification with Claude Code Preview tools**

1. Navigate to `/tenants`
2. `preview_snapshot` — confirm 7 rows; คุณสุดา แสงทอง's row shows a "Blacklist" badge and status "ค้างชำระ"
3. Click คุณสุดา's "รายละเอียด" — confirm the drawer's ประวัติการเช่า tab shows RN-2568-0138 · C-305 · แฟลตรุ่งเรือง
4. Attempt to delete คุณสุดา (drawer's "ลบผู้เช่า" button) — confirm the blocking alert fires (her rental has `due` "฿7,500", not "฿0")
5. Delete a tenant with no outstanding balance (e.g. คุณกิตติพงษ์ ใจดี, `due` "฿0") — confirm the row disappears after confirming
6. `preview_console_logs` with `level: "error"` — expected: none

- [ ] **Step 6: Commit**

```bash
git add src/components/tenants src/app/\(dashboard\)/tenants/page.tsx
git commit -m "feat: build Tenants CRUD page (table, drawer, form modal)"
```

---

### Task 6: Payment Accounts page (bank-card grid + drawer + form modal)

**Files:**
- Create: `src/components/accounts/AccountDrawer.tsx`
- Create: `src/components/accounts/AccountFormModal.tsx`
- Modify: `src/app/(dashboard)/accounts/page.tsx` (replace `PlaceholderView` entirely)

**Interfaces:**
- Consumes: `Drawer, InfoRow, InfoSection` from `@/components/shared/Drawer`; `FormModal, FieldsGrid, TextField, SelectField, ToggleField` from `@/components/shared/FormModal`; `badge, maskAccountNumber` from `@/lib/theme`; `Icon` from `@/components/Icon`; `PAYMENT_ACCOUNTS, PaymentAccountRecord, AccountType, AccountStatus, ACCOUNT_TYPE_OPTIONS, incomeRowsByChannel` from `@/lib/mock`.
- Produces: `AccountDrawer(props: { account: PaymentAccountRecord | null; onClose: () => void; onEdit: (a: PaymentAccountRecord) => void; onDelete: (a: PaymentAccountRecord) => void })`; `AccountFormModal(props: { open: boolean; editing: PaymentAccountRecord | null; onClose: () => void; onSubmit: (draft: AccountDraft) => void })` with exported type `AccountDraft`; default export page component at `/accounts`.

- [ ] **Step 1: Create `src/components/accounts/AccountDrawer.tsx`**

```tsx
"use client";

import { Drawer, InfoRow, InfoSection } from "@/components/shared/Drawer";
import { badge, maskAccountNumber } from "@/lib/theme";
import { incomeRowsByChannel, type PaymentAccountRecord } from "@/lib/mock";

export function AccountDrawer({
  account,
  onClose,
  onEdit,
  onDelete,
}: {
  account: PaymentAccountRecord | null;
  onClose: () => void;
  onEdit: (account: PaymentAccountRecord) => void;
  onDelete: (account: PaymentAccountRecord) => void;
}) {
  if (!account) return null;

  const recentIncome = incomeRowsByChannel(account).slice(0, 5);

  return (
    <Drawer
      onClose={onClose}
      eyebrow={account.accountType}
      title={account.accountName}
      badge={
        <span style={{ ...badge(account.status === "ACTIVE" ? "green" : "gray"), marginTop: 8, display: "inline-flex" }}>
          {account.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}
        </span>
      }
    >
      <div
        style={{
          height: 140,
          borderRadius: 16,
          background: "repeating-linear-gradient(135deg,rgba(255,255,255,0.05) 0 8px,transparent 8px 16px)",
          border: "1px solid rgba(255,255,255,0.09)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          fontSize: 11,
          color: "rgba(234,242,255,0.4)",
        }}
      >
        QR Code (placeholder)
      </div>

      <InfoSection title="ข้อมูลบัญชี">
        <InfoRow k="ธนาคาร" v={account.bankName || "—"} />
        <InfoRow k="เลขที่บัญชี" v={account.accountNumber ? maskAccountNumber(account.accountNumber) : "—"} />
        <InfoRow k="ชื่อบัญชี" v={account.accountHolderName || "—"} />
        <InfoRow k="PromptPay ID" v={account.promptpayId || "—"} />
        <InfoRow k="ประเภทบัญชี" v={account.accountType} />
      </InfoSection>

      <InfoSection title="ธุรกรรมล่าสุดที่ใช้บัญชีนี้">
        {recentIncome.length === 0 ? (
          <div style={{ fontSize: 13, color: "rgba(234,242,255,0.5)" }}>ยังไม่มีธุรกรรม</div>
        ) : (
          recentIncome.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.tenant}</div>
                <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)" }}>
                  {r.date} · {r.room}
                </div>
              </div>
              <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, color: "#7FF0D9" }}>{r.amount}</div>
            </div>
          ))
        )}
      </InfoSection>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => onDelete(account)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(251,113,133,0.35)",
            background: "rgba(251,113,133,0.08)",
            color: "#FDA4AF",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          ลบบัญชี
        </button>
        <button
          onClick={() => onEdit(account)}
          style={{
            flex: 1,
            padding: 12,
            borderRadius: 13,
            border: "1px solid rgba(255,255,255,0.28)",
            color: "#04121A",
            fontFamily: "inherit",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
            boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
          }}
        >
          แก้ไขข้อมูล
        </button>
      </div>
    </Drawer>
  );
}
```

- [ ] **Step 2: Create `src/components/accounts/AccountFormModal.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { FormModal, FieldsGrid, TextField, SelectField, ToggleField } from "@/components/shared/FormModal";
import { ACCOUNT_TYPE_OPTIONS, type AccountType, type PaymentAccountRecord, type AccountStatus } from "@/lib/mock";

export type AccountDraft = {
  accountName: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  promptpayId: string;
  accountType: AccountType;
  status: AccountStatus;
};

const BLANK_DRAFT: AccountDraft = {
  accountName: "",
  bankName: "",
  accountNumber: "",
  accountHolderName: "",
  promptpayId: "",
  accountType: ACCOUNT_TYPE_OPTIONS[0],
  status: "ACTIVE",
};

export function AccountFormModal({
  open,
  editing,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: PaymentAccountRecord | null;
  onClose: () => void;
  onSubmit: (draft: AccountDraft) => void;
}) {
  const [draft, setDraft] = useState<AccountDraft>(BLANK_DRAFT);

  useEffect(() => {
    if (!open) return;
    setDraft(
      editing
        ? {
            accountName: editing.accountName,
            bankName: editing.bankName,
            accountNumber: editing.accountNumber,
            accountHolderName: editing.accountHolderName,
            promptpayId: editing.promptpayId,
            accountType: editing.accountType,
            status: editing.status,
          }
        : BLANK_DRAFT
    );
  }, [open, editing]);

  return (
    <FormModal
      open={open}
      onClose={onClose}
      icon={<Icon name="account" size={18} />}
      title={editing ? "แก้ไขบัญชีรับ-จ่าย" : "เพิ่มบัญชีรับ-จ่ายใหม่"}
      subtitle="ใช้เลือกตอนบันทึกรายรับหรือจ่ายเงิน"
      onSubmit={() => onSubmit(draft)}
      submitLabel={editing ? "บันทึกการแก้ไข" : "เพิ่มบัญชี"}
    >
      <FieldsGrid>
        <TextField label="ชื่อบัญชี" value={draft.accountName} onChange={(v) => setDraft({ ...draft, accountName: v })} placeholder="บัญชีรับเงินผู้เช่า" />
        <SelectField
          label="ประเภทบัญชี"
          value={draft.accountType}
          onChange={(v) => setDraft({ ...draft, accountType: v as AccountType })}
          options={ACCOUNT_TYPE_OPTIONS.map((t) => ({ value: t, label: t }))}
        />
        <TextField label="ธนาคาร" value={draft.bankName} onChange={(v) => setDraft({ ...draft, bankName: v })} placeholder="KBank" />
        <TextField label="เลขที่บัญชี" value={draft.accountNumber} onChange={(v) => setDraft({ ...draft, accountNumber: v })} />
        <TextField label="ชื่อเจ้าของบัญชี" value={draft.accountHolderName} onChange={(v) => setDraft({ ...draft, accountHolderName: v })} />
        <TextField label="PromptPay ID" value={draft.promptpayId} onChange={(v) => setDraft({ ...draft, promptpayId: v })} />
      </FieldsGrid>
      <div>
        <div style={{ fontSize: 12, color: "rgba(234,242,255,0.6)", marginBottom: 6 }}>แนบ QR Code</div>
        <div
          style={{
            padding: 22,
            borderRadius: 14,
            border: "1.5px dashed rgba(94,234,212,0.4)",
            background: "rgba(94,234,212,0.05)",
            textAlign: "center",
            cursor: "pointer",
          }}
        >
          <div style={{ color: "#7FF0D9", display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <Icon name="upload" size={26} />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>ลากรูป QR มาวาง หรืออัปโหลด</div>
          <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)", marginTop: 3 }}>รองรับ JPG, PNG</div>
        </div>
      </div>
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
```

- [ ] **Step 3: Replace `src/app/(dashboard)/accounts/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { badge, maskAccountNumber } from "@/lib/theme";
import { AccountDrawer } from "@/components/accounts/AccountDrawer";
import { AccountFormModal, type AccountDraft } from "@/components/accounts/AccountFormModal";
import { PAYMENT_ACCOUNTS, type PaymentAccountRecord } from "@/lib/mock";

function nextAccountId(list: PaymentAccountRecord[]): number {
  return list.reduce((max, a) => Math.max(max, a.id), 0) + 1;
}

function accountNumberDisplay(a: PaymentAccountRecord): string {
  if (a.accountType === "เงินสด") return "เงินสด — ไม่มีเลขบัญชี";
  if (a.accountNumber) return `${a.bankName} · ${maskAccountNumber(a.accountNumber)}`;
  if (a.promptpayId) return `PromptPay · ${a.promptpayId}`;
  return "—";
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<PaymentAccountRecord[]>(PAYMENT_ACCOUNTS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const selected = accounts.find((a) => a.id === selectedId) ?? null;
  const editing = accounts.find((a) => a.id === editingId) ?? null;

  function openCreate() {
    setEditingId(null);
    setFormOpen(true);
  }

  function openEdit(account: PaymentAccountRecord) {
    setEditingId(account.id);
    setFormOpen(true);
  }

  function handleSubmit(draft: AccountDraft) {
    if (editingId != null) {
      setAccounts((list) => list.map((a) => (a.id === editingId ? { ...a, ...draft } : a)));
    } else {
      const id = nextAccountId(accounts);
      setAccounts((list) => [...list, { id, ...draft }]);
    }
    setFormOpen(false);
    setEditingId(null);
  }

  function handleDelete(account: PaymentAccountRecord) {
    if (!confirm(`ยืนยันลบบัญชี "${account.accountName}"?`)) return;
    setAccounts((list) => list.filter((a) => a.id !== account.id));
    setSelectedId(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={openCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 15px",
            borderRadius: 11,
            border: "1px solid rgba(255,255,255,0.28)",
            color: "#04121A",
            fontFamily: "inherit",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
            background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
            boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
          }}
        >
          <Icon name="plus" size={15} />
          เพิ่มบัญชี
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
        {accounts.map((a) => (
          <div
            key={a.id}
            onClick={() => setSelectedId(a.id)}
            style={{
              cursor: "pointer",
              padding: 18,
              borderRadius: 20,
              background: "linear-gradient(135deg,rgba(94,234,212,0.1),rgba(168,85,247,0.1))",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={badge("purple")}>{a.accountType}</span>
              <span style={badge(a.status === "ACTIVE" ? "green" : "gray")}>{a.status === "ACTIVE" ? "ใช้งานอยู่" : "ปิดใช้งาน"}</span>
            </div>
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 16, marginTop: 14 }}>{a.accountName}</div>
            <div style={{ fontSize: 12.5, color: "rgba(234,242,255,0.65)", marginTop: 4 }}>{accountNumberDisplay(a)}</div>
            <div
              style={{
                marginTop: 14,
                height: 64,
                borderRadius: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "monospace",
                fontSize: 10.5,
                color: "rgba(234,242,255,0.4)",
              }}
            >
              QR
            </div>
          </div>
        ))}
      </div>

      <AccountDrawer
        account={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(account) => {
          setSelectedId(null);
          openEdit(account);
        }}
        onDelete={handleDelete}
      />

      <AccountFormModal open={formOpen} editing={editing} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </div>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npm run build`
Expected: `✓ Compiled successfully`, `/accounts` route size grows past its placeholder size.

- [ ] **Step 5: Manual verification with Claude Code Preview tools**

1. Navigate to `/accounts`
2. `preview_snapshot` — confirm 4 cards: บัญชีรับเงินผู้เช่า (KBank · 123-•-56789), บัญชีจ่ายเจ้าของ (KBank · 123-•-56789), PromptPay ธุรกิจ (PromptPay · 088-123-4567), เงินสดสำนักงาน (เงินสด — ไม่มีเลขบัญชี)
3. Click "บัญชีรับเงินผู้เช่า" — confirm drawer's "ธุรกรรมล่าสุดที่ใช้บัญชีนี้" lists income rows with channel "โอนธนาคาร" (e.g. คุณศิริพร มงคล, คุณมณีรัตน์ ทองดี, คุณสมพงษ์ เจริญสุข)
4. Click "เงินสดสำนักงาน" — confirm its transaction list shows only channel "เงินสด" rows (คุณธนา รุ่งเรือง เงินประกัน, คุณกาญจนา ศรีสุข ค่าทำความสะอาด) — this specifically verifies the `accountType`-based matching fix, not simple name matching
5. `preview_console_logs` with `level: "error"` — expected: none

- [ ] **Step 6: Commit**

```bash
git add src/components/accounts src/app/\(dashboard\)/accounts/page.tsx
git commit -m "feat: build Payment Accounts CRUD page (bank-card grid, drawer, form modal)"
```

---

### Task 7: Final cross-page verification pass

**Files:** none (verification only)

**Interfaces:**
- Consumes: everything built in Tasks 1–6.
- Produces: nothing — this task exists to catch integration issues a per-task build can't (stale server state, cross-page number drift, console warnings that only appear after visiting multiple pages in one session).

- [ ] **Step 1: Full clean build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, `✓ Generating static pages (19/19)`, and all 4 routes (`/owners`, `/properties`, `/tenants`, `/accounts`) show a JS bundle size clearly larger than their original ~3.44 kB placeholder size.

- [ ] **Step 2: Cross-page number consistency, via Claude Code Preview tools**

Start (or reuse) the preview server, then in a single session:

1. Navigate to `/rooms`, note คุณสมชาย วัฒนโสภณ's rooms (A-1105, A-1204) and their `income`/`expense` values.
2. Navigate to `/owners`, open คุณสมชาย's drawer — confirm "ห้องทั้งหมด: 2 ห้อง" and "รายรับรวมเดือนนี้" equals the sum of the two rooms' income from step 1.
3. Navigate to `/payout`, note the 5 rows' owner/net values.
4. Back on `/owners`, confirm คุณสมชาย's "ยอดที่ต้องจ่าย" column equals his non-"จ่ายแล้ว" `PAYOUT_ROWS` nets summed (should be ฿9,135, from the A-1105 "รอตรวจสอบ" row only).
5. Navigate to `/dashboard`, read the 4 bar values in "รายรับแยกตามอาคาร" (468/352/246/182, in thousands).
6. Navigate to `/properties`, confirm the 4 cards show ฿468,000 / ฿352,000 / ฿246,000 / ฿182,000 in the same อาคาร order.
7. Navigate to `/rentals`, note คุณสุดา แสงทอง's row (`due` "฿7,500", status "ค้างชำระ").
8. Navigate to `/tenants`, open คุณสุดา's drawer — confirm ประวัติการเช่า shows the same contract code and status.

- [ ] **Step 3: Console error check across all 4 new pages**

For each of `/owners`, `/properties`, `/tenants`, `/accounts`: navigate to it, open its drawer, open its create modal, close both, then call `mcp__Claude_Preview__preview_console_logs` with `level: "error"`.
Expected: no errors on any of the 4 — in particular no "Encountered two children with the same key" (the bug class found earlier in `BarChart`), since every `.map()` call in the new components uses a unique key (`o.id`, `p.id`, `t.id`, `a.id`, or `r.no`/`r.code` for nested room/rental lists).

- [ ] **Step 4: Fix forward if anything in Step 2 or 3 disagrees**

If any cross-check in Step 2 fails, the bug is almost always in a relation helper's filter condition (exact-string mismatch between a new mock array's name field and the field it's filtered against in `ROOMS`/`PAYOUT_ROWS`/`RENTAL_ROWS`) — compare the two literal Thai strings character-by-character rather than guessing. Fix the mismatched string in `mock.ts`, re-run `npm run build`, re-check, then commit the fix separately:

```bash
git add src/lib/mock.ts
git commit -m "fix: correct mismatched relation key in mock data"
```

- [ ] **Step 5: No commit needed if Steps 1–3 all pass clean** (this task only produces verification, not new code).

---

## Self-review notes (already applied above, listed for traceability)

- **Spec coverage:** every §Per-entity design section in the spec (Owners/Properties/Tenants/Accounts — fields, list style, drawer tabs, form fields, delete guard) maps to Task 3/4/5/6 respectively; the shared-components section maps to Task 1; the mock-data-continuity section maps to Task 2.
- **Type consistency fix applied:** `incomeRowsByChannel` takes the full `PaymentAccountRecord` (not a name string) and branches on `accountType`/`promptpayId`/`bankName`, because `"เงินสดสำนักงาน" !== "เงินสด"` would have silently mis-bucketed the cash account if matched by display name.
- **Relation-key fix applied:** `PROPERTIES[].propertyName` uses the short building names that already exist on `ROOMS[].building` ("เดอะ เครสท์", not the longer "เดอะ เครสท์ สุขุมวิท" used as flavor text elsewhere), so `roomsByProperty()` actually finds rooms instead of silently returning an empty array.
- **`Drawer` shell has no `open` prop** — each entity's wrapper (`OwnerDrawer` etc.) already returns `null` early when its record is `null`, so a second gate would be dead code; this matches how `RoomDrawer` (left untouched) is written.
- **No placeholders, no "similar to Task N"** — every file in every task above is complete, pasteable code.
