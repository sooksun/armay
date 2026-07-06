"use client";

import { Icon } from "@/components/Icon";
import { useUI } from "@/lib/ui-context";

const chevDown = <Icon name="chevDown" size={14} />;

function Field({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "rgba(234,242,255,0.6)", marginBottom: 6 }}>{label}</div>
      <div
        style={{
          padding: "11px 13px",
          borderRadius: 12,
          border: `1px solid ${accent ? "rgba(94,234,212,0.4)" : "rgba(255,255,255,0.14)"}`,
          background: accent ? "rgba(94,234,212,0.08)" : "rgba(255,255,255,0.05)",
          fontSize: accent ? 15 : 13,
          fontFamily: accent ? "Sora,sans-serif" : "inherit",
          fontWeight: accent ? 700 : 400,
          color: accent ? "#7FF0D9" : "#EAF2FF",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function AddIncomeModal() {
  const { incomeOpen, closeIncome } = useUI();
  if (!incomeOpen) return null;

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
            <Icon name="income" size={18} />
          </span>
          <div>
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 17 }}>บันทึกรับเงิน</div>
            <div style={{ fontSize: 12, color: "rgba(234,242,255,0.5)" }}>แนบสลิปเพื่อยืนยันการโอน</div>
          </div>
          <button
            onClick={closeIncome}
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

        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column", gap: 15 }}>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 13,
              background: "rgba(56,189,248,0.1)",
              border: "1px solid rgba(56,189,248,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.6)" }}>ยอดค้างของรายการเช่าที่เลือก</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 1 }}>
                RN-2568-0142 · คุณกิตติพงษ์ · A-1105
              </div>
            </div>
            <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 18, color: "#FDA4AF" }}>฿12,500</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
            <Field label="รายการเช่า" value={<>RN-2568-0142{chevDown}</>} />
            <Field label="ประเภทรายรับ" value={<>ค่าเช่ารายเดือน{chevDown}</>} />
            <Field label="จำนวนเงิน" value="฿12,500" accent />
            <Field label="วันที่รับเงิน" value={<>6 ก.ค. 2568<Icon name="cal" size={15} /></>} />
            <Field label="ช่องทางรับเงิน" value={<>โอนผ่าน PromptPay{chevDown}</>} />
            <Field label="บัญชีที่รับเงิน" value={<>KBank · 123-4-56789{chevDown}</>} />
          </div>

          <div>
            <div style={{ fontSize: 12, color: "rgba(234,242,255,0.6)", marginBottom: 6 }}>แนบสลิปการโอน</div>
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
              <div style={{ fontSize: 13, fontWeight: 600 }}>ลากสลิปมาวาง หรือถ่ายจากกล้อง</div>
              <div style={{ fontSize: 11.5, color: "rgba(234,242,255,0.5)", marginTop: 3 }}>
                รองรับ JPG, PNG, PDF · ระบบ preview สลิปทันที
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "11px 13px",
              borderRadius: 12,
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.3)",
              fontSize: 12.5,
              color: "#FDE68A",
              display: "flex",
              alignItems: "center",
              gap: 9,
            }}
          >
            <Icon name="alert" size={16} />
            หากไม่มีสลิป ระบบจะตั้งสถานะเป็น “ต้องตรวจสอบ” โดยอัตโนมัติ
          </div>
        </div>

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
            onClick={closeIncome}
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
            onClick={closeIncome}
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
            ยืนยันการบันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
