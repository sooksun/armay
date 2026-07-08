"use client";

import { useCallback, useEffect, useState } from "react";
import { Drawer, StatBox, InfoRow, InfoSection } from "@/components/shared/Drawer";
import { Icon } from "@/components/Icon";
import { badge } from "@/lib/theme";
import { apiGet, apiSend } from "@/lib/api-client";
import type { RentalDetailDTO } from "@/lib/api-types";

export function RentalDrawer({
  rentalId,
  onClose,
  onEdit,
  onChanged,
}: {
  rentalId: number | null;
  onClose: () => void;
  onEdit: (detail: RentalDetailDTO) => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<RentalDetailDTO | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (id: number) => {
    setLoading(true);
    setDetail(null);
    try {
      setDetail(await apiGet<RentalDetailDTO>(`/api/rentals/${id}`));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (rentalId != null) void load(rentalId);
  }, [rentalId, load]);

  if (rentalId == null) return null;

  const dueIsZero = detail?.due === "฿0";

  async function handleDelete() {
    if (!detail) return;
    if (!confirm(`ยืนยันลบรายการเช่า ${detail.code}?`)) return;
    try {
      await apiSend(`/api/rentals/${detail.id}`, "DELETE");
      onChanged();
      onClose();
    } catch (e) {
      alert(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <Drawer
      onClose={onClose}
      eyebrow={detail?.code ?? "กำลังโหลด…"}
      title={detail?.tenant ?? "รายละเอียดการเช่า"}
      badge={detail ? <span style={{ ...badge(detail.badge), marginTop: 8, display: "inline-flex" }}>{detail.status}</span> : undefined}
    >
      {loading || !detail ? (
        <div style={{ padding: "28px 0", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>กำลังโหลด…</div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <StatBox
              bg="rgba(56,189,248,0.1)"
              border="rgba(56,189,248,0.28)"
              color="#7DD3FC"
              label="ยอดรวมสัญญา"
              value={detail.total}
            />
            <StatBox
              bg={dueIsZero ? "rgba(52,211,153,0.1)" : "rgba(251,113,133,0.1)"}
              border={dueIsZero ? "rgba(52,211,153,0.28)" : "rgba(251,113,133,0.28)"}
              color={dueIsZero ? "var(--pos)" : "var(--neg)"}
              label="ค้างชำระ"
              value={detail.due}
            />
          </div>

          <InfoSection title="ข้อมูลสัญญา">
            <InfoRow k="ห้อง" v={`${detail.room} · ${detail.building}`} />
            <InfoRow k="เจ้าของ" v={detail.owner} />
            <InfoRow k="ผู้เช่า" v={detail.tenant} />
            {detail.tenantPhone ? <InfoRow k="เบอร์ผู้เช่า" v={detail.tenantPhone} /> : null}
            <InfoRow k="ประเภทการเช่า" v={detail.rentalType} />
            <InfoRow k="ช่วงเวลา" v={detail.period} />
            {detail.bookingChannel ? <InfoRow k="ช่องทางการจอง" v={detail.bookingChannel} /> : null}
            <InfoRow k="สถานะสัญญา" v={detail.rentalStatus} />
          </InfoSection>

          <InfoSection title="รายละเอียดค่าเช่า">
            <InfoRow k="ค่าเช่า" v={detail.rent} />
            <InfoRow k="เงินประกัน" v={detail.deposit} />
            <InfoRow k="ค่าทำความสะอาด" v={detail.cleaningFee} />
            <InfoRow k="ค่าใช้จ่ายอื่น" v={detail.otherFee} />
            <InfoRow k="ส่วนลด" v={detail.discount} />
            <InfoRow k="ยอดรวม" v={detail.total} />
            <InfoRow k="รับแล้ว" v={detail.paid} />
            <InfoRow k="ค้างชำระ" v={detail.due} />
          </InfoSection>

          <InfoSection title={`ประวัติการรับเงิน (${detail.incomes.length})`}>
            {detail.incomes.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "rgba(var(--text-rgb),0.5)" }}>ยังไม่มีการรับเงินสำหรับสัญญานี้</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {detail.incomes.map((i, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 11px",
                      borderRadius: 11,
                      background: "rgba(var(--surface-rgb),0.04)",
                      border: "1px solid rgba(var(--surface-rgb),0.08)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{i.type}</div>
                      <div style={{ fontSize: 11, color: "rgba(var(--text-rgb),0.5)" }}>{i.date}</div>
                    </div>
                    <span style={{ fontFamily: "Sora,sans-serif", fontWeight: 600, color: "var(--pos)", whiteSpace: "nowrap" }}>{i.amount}</span>
                    <span style={badge(i.badge)}>{i.status}</span>
                  </div>
                ))}
              </div>
            )}
          </InfoSection>

          {detail.note ? (
            <InfoSection title="หมายเหตุ">
              <div style={{ fontSize: 13, color: "rgba(var(--text-rgb),0.8)", lineHeight: 1.6 }}>{detail.note}</div>
            </InfoSection>
          ) : null}

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
              ลบรายการเช่า
            </button>
            <button
              onClick={() => onEdit(detail)}
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
                background: "linear-gradient(135deg,#A855F7,#38BDF8)",
                boxShadow: "0 6px 16px rgba(168,85,247,0.4)",
              }}
            >
              <Icon name="settings" size={15} />
              แก้ไขรายการเช่า
            </button>
          </div>
        </>
      )}
    </Drawer>
  );
}
