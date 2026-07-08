"use client";

import { useCallback, useEffect, useState } from "react";
import { Drawer, StatBox, InfoRow, InfoSection } from "@/components/shared/Drawer";
import { Icon } from "@/components/Icon";
import { badge } from "@/lib/theme";
import { apiGet, apiSend } from "@/lib/api-client";
import type { PayoutDetailDTO } from "@/lib/api-types";

export function PayoutDrawer({
  payoutId,
  onClose,
  onChanged,
}: {
  payoutId: number | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<PayoutDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (id: number) => {
    setLoading(true);
    setDetail(null);
    try {
      setDetail(await apiGet<PayoutDetailDTO>(`/api/payouts/${id}`));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (payoutId != null) void load(payoutId);
  }, [payoutId, load]);

  if (payoutId == null) return null;

  const isPaid = detail?.statusValue === "PAID";
  const isCancelled = detail?.statusValue === "CANCELLED";

  async function handleApprove() {
    if (!detail) return;
    if (!confirm(`ยืนยันจ่ายเงินเจ้าของ ${detail.net} สำหรับ ${detail.payoutCode}?`)) return;
    setBusy(true);
    try {
      await apiSend(`/api/payouts/${detail.id}/approve`, "POST");
      onChanged();
      await load(detail.id);
    } catch (e) {
      alert(e instanceof Error ? e.message : "อนุมัติจ่ายไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!detail) return;
    if (!confirm(`ยืนยันลบรายการจ่าย ${detail.payoutCode}?`)) return;
    setBusy(true);
    try {
      await apiSend(`/api/payouts/${detail.id}`, "DELETE");
      onChanged();
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer
      onClose={onClose}
      eyebrow={detail?.payoutCode ?? "กำลังโหลด…"}
      title={detail ? detail.owner : "รายละเอียดการจ่ายเจ้าของ"}
      badge={detail ? <span style={{ ...badge(detail.badge), marginTop: 8, display: "inline-flex" }}>{detail.status}</span> : undefined}
    >
      {loading || !detail ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>กำลังโหลด…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <StatBox bg="rgba(56,189,248,0.1)" border="rgba(56,189,248,0.28)" color="#7DD3FC" label="รายรับรวม" value={detail.gross} />
            <StatBox bg="rgba(94,234,212,0.1)" border="rgba(94,234,212,0.28)" color="var(--pos)" label="ยอดจ่ายสุทธิ" value={detail.net} />
          </div>

          <InfoSection title="ข้อมูลการจ่าย">
            <InfoRow k="เจ้าของ" v={detail.owner} />
            <InfoRow k="ห้อง" v={detail.room} />
            <InfoRow k="วันที่จ่าย" v={detail.payoutDate} />
            {detail.ownerBankAccount ? <InfoRow k="บัญชีเจ้าของ" v={detail.ownerBankAccount} /> : null}
            <InfoRow k="ช่องทางจ่าย" v={detail.paymentMethod} />
            {detail.transactionReference ? <InfoRow k="เลขอ้างอิง" v={detail.transactionReference} /> : null}
            <InfoRow k="สถานะ" v={detail.status} />
            <InfoRow k="จ่ายแล้ว" v={detail.paid} />
          </InfoSection>

          <InfoSection title={`ที่มาการหัก (${detail.items.length} รายการ)`}>
            <InfoRow k="รายรับรวม (gross)" v={detail.gross} />
            {detail.items.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "rgba(var(--text-rgb),0.5)", padding: "7px 0" }}>ไม่มีรายการหัก</div>
            ) : (
              detail.items.map((it, i) => <InfoRow key={i} k={`− ${it.label}`} v={it.amount} />)
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 2px", fontSize: 14, fontWeight: 700 }}>
              <span>ยอดจ่ายสุทธิ</span>
              <span style={{ color: "var(--pos)" }}>{detail.net}</span>
            </div>
          </InfoSection>

          {detail.note ? (
            <InfoSection title="หมายเหตุ">
              <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.8)", lineHeight: 1.6 }}>{detail.note}</div>
            </InfoSection>
          ) : null}

          {isPaid ? (
            <div
              style={{
                padding: "11px 13px",
                borderRadius: 12,
                background: "rgba(52,211,153,0.09)",
                border: "1px solid rgba(52,211,153,0.28)",
                fontSize: 12.5,
                color: "var(--pos)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Icon name="payout" size={15} />
              จ่ายเจ้าของครบแล้ว — รายการถูกล็อกเป็นหลักฐาน
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleDelete}
                disabled={busy}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 13,
                  border: "1px solid rgba(251,113,133,0.4)",
                  background: "rgba(251,113,133,0.08)",
                  color: "var(--neg)",
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: busy ? "wait" : "pointer",
                  opacity: busy ? 0.7 : 1,
                }}
              >
                ลบรายการ
              </button>
              {!isCancelled ? (
                <button
                  onClick={handleApprove}
                  disabled={busy}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    padding: 12,
                    borderRadius: 13,
                    border: "1px solid rgba(var(--surface-rgb),0.28)",
                    color: "#04121A",
                    fontFamily: "inherit",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: busy ? "wait" : "pointer",
                    opacity: busy ? 0.7 : 1,
                    background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
                    boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
                  }}
                >
                  <Icon name="payout" size={15} />
                  ยืนยันจ่ายเงินเจ้าของ
                </button>
              ) : null}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}
