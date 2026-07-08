"use client";

import { useCallback, useEffect, useState } from "react";
import { Drawer, StatBox, InfoRow, InfoSection } from "@/components/shared/Drawer";
import { Icon } from "@/components/Icon";
import { badge, fmtTHB } from "@/lib/theme";
import { apiGet, apiSend } from "@/lib/api-client";
import type { IncomeDetailDTO } from "@/lib/api-types";

export function IncomeDrawer({
  incomeId,
  onClose,
  onEdit,
  onChanged,
}: {
  incomeId: number | null;
  onClose: () => void;
  onEdit: (id: number) => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<IncomeDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (id: number) => {
    setLoading(true);
    setDetail(null);
    try {
      setDetail(await apiGet<IncomeDetailDTO>(`/api/incomes/${id}`));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (incomeId != null) void load(incomeId);
  }, [incomeId, load]);

  if (incomeId == null) return null;

  const locked = detail?.verificationStatus === "VERIFIED";

  async function handleDelete() {
    if (!detail) return;
    if (!confirm(`ยืนยันลบรายการรับเงิน ${detail.incomeCode}?`)) return;
    try {
      await apiSend(`/api/incomes/${detail.id}`, "DELETE");
      onChanged();
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <Drawer
      onClose={onClose}
      eyebrow={detail?.incomeCode ?? "กำลังโหลด…"}
      title={detail ? detail.incomeTypeLabel : "รายละเอียดรับเงิน"}
      badge={detail ? <span style={{ ...badge(detail.badge), marginTop: 8, display: "inline-flex" }}>{detail.statusLabel}</span> : undefined}
    >
      {loading || !detail ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>กำลังโหลด…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <StatBox bg="rgba(94,234,212,0.1)" border="rgba(94,234,212,0.28)" color="var(--pos)" label="จำนวนเงิน" value={fmtTHB(detail.amount)} />
            <StatBox
              bg={detail.proofFileUrl ? "rgba(52,211,153,0.1)" : "rgba(251,113,133,0.1)"}
              border={detail.proofFileUrl ? "rgba(52,211,153,0.28)" : "rgba(251,113,133,0.28)"}
              color={detail.proofFileUrl ? "var(--pos)" : "var(--neg)"}
              label="สลิป"
              value={detail.proofFileUrl ? "แนบแล้ว" : "ไม่มีสลิป"}
            />
          </div>

          <InfoSection title="ข้อมูลรายการ">
            <InfoRow k="รายการเช่า" v={detail.contractLabel} />
            <InfoRow k="ผู้เช่า" v={detail.tenant} />
            <InfoRow k="ห้อง" v={`${detail.room}${detail.building ? " · " + detail.building : ""}`} />
            <InfoRow k="ประเภทรายรับ" v={detail.incomeTypeLabel} />
            <InfoRow k="วันที่รับเงิน" v={detail.incomeDate} />
            <InfoRow k="ช่องทาง" v={detail.paymentMethodLabel} />
            {detail.transactionReference ? <InfoRow k="เลขอ้างอิง" v={detail.transactionReference} /> : null}
            <InfoRow k="สถานะ" v={detail.statusLabel} />
          </InfoSection>

          {detail.proofFileUrl ? (
            <InfoSection title="สลิปการโอน">
              {/* eslint-disable-next-line @next/next/no-img-element -- reason: object/data URL, not next/image-optimizable */}
              <img src={detail.proofFileUrl} alt="สลิป" style={{ display: "block", width: "100%", borderRadius: 12 }} />
            </InfoSection>
          ) : null}

          {detail.note ? (
            <InfoSection title="หมายเหตุ">
              <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.8)", lineHeight: 1.6 }}>{detail.note}</div>
            </InfoSection>
          ) : null}

          {locked ? (
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
              <Icon name="audit" size={15} />
              รายการนี้ตรวจสอบแล้ว (ล็อก) — หากต้องแก้ ให้สร้างรายการปรับปรุง (adjustment)
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleDelete}
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
                  cursor: "pointer",
                }}
              >
                ลบรายการ
              </button>
              {detail.verificationStatus !== "CANCELLED" ? (
                <button
                  onClick={() => onEdit(detail.id)}
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
                    cursor: "pointer",
                    background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
                    boxShadow: "0 6px 16px rgba(56,189,248,0.4)",
                  }}
                >
                  <Icon name="settings" size={15} />
                  แก้ไขรายการ
                </button>
              ) : null}
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}
