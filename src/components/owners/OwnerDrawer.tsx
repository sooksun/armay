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
