"use client";

import { useState } from "react";
import { TextField } from "@/components/shared/FormModal";
import { badge } from "@/lib/theme";
import { PAYMENT_ACCOUNTS, EXPENSE_TYPE_OPTIONS } from "@/lib/mock";
import { apiSend } from "@/lib/api-client";

type DemoCounts = {
  owners: number;
  properties: number;
  rooms: number;
  tenants: number;
  contracts: number;
  incomes: number;
  expenses: number;
  payouts: number;
};

function countsSummary(c: DemoCounts): string {
  return `เจ้าของ ${c.owners} · อาคาร ${c.properties} · ห้อง ${c.rooms} · ผู้เช่า ${c.tenants} · สัญญา ${c.contracts} · รายรับ ${c.incomes} · รายจ่าย ${c.expenses} · จ่ายเจ้าของ ${c.payouts}`;
}

const INCOME_TYPES = ["ค่าเช่า", "เงินประกัน", "ค่าทำความสะอาด", "ค่าน้ำ", "ค่าไฟ", "ค่าปรับ", "อื่นๆ"];

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "20px 22px",
        borderRadius: 22,
        background: "rgba(var(--surface-rgb),0.055)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        border: "1px solid rgba(var(--surface-rgb),0.12)",
        boxShadow: "0 18px 44px rgba(0,0,0,0.3),inset 0 1px 0 rgba(var(--surface-rgb),0.14)",
      }}
    >
      <div style={{ fontWeight: 600, fontSize: 15.5 }}>{title}</div>
      {subtitle ? <div style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.5)", marginTop: 2, marginBottom: 14 }}>{subtitle}</div> : <div style={{ height: 12 }} />}
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 12px",
        borderRadius: 20,
        fontSize: 12.5,
        color: "var(--text)",
        background: "rgba(var(--surface-rgb),0.06)",
        border: "1px solid rgba(var(--surface-rgb),0.14)",
      }}
    >
      {children}
    </span>
  );
}

const primaryBtn: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: 12,
  border: "1px solid rgba(var(--surface-rgb),0.28)",
  color: "#04121A",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
  boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
};

export default function SettingsPage() {
  const [company, setCompany] = useState({ name: "บจ. คริสตัล เลดเจอร์", phone: "088-123-4567", address: "88 ถ.สุขุมวิท กรุงเทพฯ" });
  const [thresholds, setThresholds] = useState({ vacantDays: "30", contractEndDays: "7", overdueDays: "15" });
  const [saved, setSaved] = useState(false);
  const [dataBusy, setDataBusy] = useState<"" | "demo" | "reset">("");
  const [dataMsg, setDataMsg] = useState<string | null>(null);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  async function addDemo() {
    setDataBusy("demo");
    setDataMsg(null);
    try {
      const { counts } = await apiSend<{ counts: DemoCounts }>("/api/admin/demo", "POST");
      setDataMsg(`เพิ่มข้อมูลตัวอย่างแล้ว — ${countsSummary(counts)}`);
    } catch (e) {
      setDataMsg(e instanceof Error ? e.message : "เพิ่มข้อมูลไม่สำเร็จ");
    } finally {
      setDataBusy("");
    }
  }

  async function resetAll() {
    if (!confirm("ยืนยันรีเซ็ตข้อมูลทั้งหมด? รายการเช่า/รายรับ/รายจ่าย/จ่ายเจ้าของ/ห้อง/เจ้าของ/ผู้เช่า จะถูกลบแล้วสร้างชุดตัวอย่างใหม่ (ผู้ใช้และบัญชีรับ–จ่ายจะไม่ถูกลบ) — การกระทำนี้ย้อนกลับไม่ได้")) return;
    setDataBusy("reset");
    setDataMsg(null);
    try {
      const { counts } = await apiSend<{ counts: DemoCounts }>("/api/admin/reset", "POST");
      setDataMsg(`รีเซ็ตข้อมูลแล้ว — ${countsSummary(counts)}`);
    } catch (e) {
      setDataMsg(e instanceof Error ? e.message : "รีเซ็ตข้อมูลไม่สำเร็จ");
    } finally {
      setDataBusy("");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Section title="ข้อมูลกิจการ" subtitle="แสดงในหัวรายงานและเอกสาร">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
          <TextField label="ชื่อกิจการ/นายหน้า" value={company.name} onChange={(v) => setCompany({ ...company, name: v })} />
          <TextField label="เบอร์ติดต่อ" value={company.phone} onChange={(v) => setCompany({ ...company, phone: v })} />
        </div>
        <div style={{ marginTop: 13 }}>
          <TextField label="ที่อยู่" value={company.address} onChange={(v) => setCompany({ ...company, address: v })} />
        </div>
      </Section>

      <Section title="เกณฑ์การแจ้งเตือน" subtitle="ระบบจะแจ้งเตือนบน Dashboard เมื่อถึงเกณฑ์">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 13 }}>
          <TextField label="ห้องว่างเกิน (วัน)" value={thresholds.vacantDays} onChange={(v) => setThresholds({ ...thresholds, vacantDays: v.replace(/\D/g, "") })} />
          <TextField label="สัญญาใกล้หมดภายใน (วัน)" value={thresholds.contractEndDays} onChange={(v) => setThresholds({ ...thresholds, contractEndDays: v.replace(/\D/g, "") })} />
          <TextField label="ค้างชำระเกิน (วัน)" value={thresholds.overdueDays} onChange={(v) => setThresholds({ ...thresholds, overdueDays: v.replace(/\D/g, "") })} />
        </div>
      </Section>

      <Section title="ประเภทรายรับ" subtitle="ใช้ตอนบันทึกรายรับ">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {INCOME_TYPES.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      </Section>

      <Section title="ประเภทรายจ่าย" subtitle="ใช้ตอนบันทึกค่าใช้จ่ายห้อง">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {EXPENSE_TYPE_OPTIONS.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </div>
      </Section>

      <Section title="บัญชีรับ–จ่ายเริ่มต้น" subtitle="เลือกไว้ล่วงหน้าเมื่อบันทึกรายรับ/จ่ายเจ้าของ">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {PAYMENT_ACCOUNTS.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 14px",
                borderRadius: 12,
                background: "rgba(var(--surface-rgb),0.04)",
                border: "1px solid rgba(var(--surface-rgb),0.09)",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.accountName}</div>
                <div style={{ fontSize: 11.5, color: "rgba(var(--text-rgb),0.5)" }}>{a.bankName || "PromptPay / เงินสด"}</div>
              </div>
              <span style={badge("purple")}>{a.accountType}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="จัดการข้อมูลระบบ" subtitle="เครื่องมือสำหรับผู้ดูแลระบบ — ใช้เตรียมข้อมูลทดลองหรือล้างข้อมูลเริ่มใหม่">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <button onClick={addDemo} disabled={dataBusy !== ""} style={{ ...primaryBtn, cursor: dataBusy ? "wait" : "pointer", opacity: dataBusy && dataBusy !== "demo" ? 0.6 : 1 }}>
            {dataBusy === "demo" ? "กำลังเพิ่ม…" : "เพิ่มข้อมูลตัวอย่าง"}
          </button>
          <button
            onClick={resetAll}
            disabled={dataBusy !== ""}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              border: "1px solid rgba(251,113,133,0.4)",
              background: "rgba(251,113,133,0.1)",
              color: "#FB7185",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 700,
              cursor: dataBusy ? "wait" : "pointer",
              opacity: dataBusy && dataBusy !== "reset" ? 0.6 : 1,
            }}
          >
            {dataBusy === "reset" ? "กำลังรีเซ็ต…" : "รีเซ็ตข้อมูลทั้งหมด"}
          </button>
        </div>
        <div style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.5)", marginTop: 10 }}>
          “เพิ่มข้อมูลตัวอย่าง” เพิ่มชุดข้อมูลจริงจำนวนมากในคลิกเดียว (เจ้าของ/อาคาร/ห้อง/ผู้เช่า/สัญญา/รายรับ/รายจ่าย/จ่ายเจ้าของ) โดยไม่ลบของเดิม — กดซ้ำได้เรื่อย ๆ · “รีเซ็ต” ลบข้อมูลธุรกรรมทั้งหมดแล้วสร้างชุดใหม่ (ผู้ใช้และบัญชีรับ–จ่ายไม่ถูกลบ)
        </div>
        {dataMsg ? <div style={{ fontSize: 12.5, color: dataMsg.includes("ไม่สำเร็จ") ? "#FB7185" : "#6EE7B7", marginTop: 10 }}>{dataMsg}</div> : null}
      </Section>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12 }}>
        {saved ? <span style={{ fontSize: 13, color: "#6EE7B7" }}>บันทึกการตั้งค่าแล้ว</span> : null}
        <button onClick={save} style={primaryBtn}>
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}
