"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { ListCard, TableWrap, Th } from "@/components/shared/ListCard";
import { badge } from "@/lib/theme";
import { apiGet } from "@/lib/api-client";
import type { AuditLogDTO } from "@/lib/api-types";

const ACTION_FILTERS = ["ทั้งหมด", "สร้าง", "แก้ไข", "ลบ", "อนุมัติ", "ยกเลิก", "เข้าสู่ระบบ"] as const;
type ActionFilter = (typeof ACTION_FILTERS)[number];

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ActionFilter>("ทั้งหมด");

  const load = useCallback(async () => {
    try {
      setLogs(await apiGet<AuditLogDTO[]>("/api/audit"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const rows = filter === "ทั้งหมด" ? logs : logs.filter((r) => r.action === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12.5, color: "rgba(var(--text-rgb),0.6)", marginRight: 4 }}>กรองตามการกระทำ</span>
        {ACTION_FILTERS.map((a) => {
          const active = filter === a;
          return (
            <button
              key={a}
              onClick={() => setFilter(a)}
              style={{
                padding: "7px 13px",
                borderRadius: 11,
                border: `1px solid ${active ? "rgba(94,234,212,0.4)" : "rgba(var(--surface-rgb),0.14)"}`,
                background: active ? "linear-gradient(135deg,rgba(94,234,212,0.16),rgba(56,189,248,0.12))" : "rgba(var(--surface-rgb),0.05)",
                color: active ? "var(--text)" : "rgba(var(--text-rgb),0.7)",
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
              }}
            >
              {a}
            </button>
          );
        })}
      </div>

      <ListCard
        title={`ประวัติการเปลี่ยนแปลงข้อมูล (${rows.length})`}
        actions={
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 13px",
              borderRadius: 11,
              border: "1px solid rgba(var(--surface-rgb),0.16)",
              background: "rgba(var(--surface-rgb),0.05)",
              color: "var(--text)",
              fontFamily: "inherit",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Icon name="export" size={15} />
            Export
          </button>
        }
      >
        <TableWrap minWidth={860}>
          <thead>
            <tr style={{ background: "rgba(var(--surface-rgb),0.04)" }}>
              <Th>เวลา</Th>
              <Th>ผู้ใช้งาน</Th>
              <Th>การกระทำ</Th>
              <Th>ตาราง</Th>
              <Th>รายการ</Th>
              <Th>รายละเอียด</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>
                  กำลังโหลด…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "28px 16px", textAlign: "center", color: "rgba(var(--text-rgb),0.5)" }}>
                  ไม่มีประวัติการเปลี่ยนแปลง
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid rgba(var(--surface-rgb),0.06)" }}>
                  <td style={{ padding: "13px 16px", whiteSpace: "nowrap", color: "rgba(var(--text-rgb),0.75)", fontSize: 12 }}>{r.time}</td>
                  <td style={{ padding: "13px 16px", fontWeight: 600, whiteSpace: "nowrap" }}>{r.user}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={badge(r.badge)}>{r.action}</span>
                  </td>
                  <td style={{ padding: "13px 16px", color: "rgba(var(--text-rgb),0.8)", whiteSpace: "nowrap" }}>{r.table}</td>
                  <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, color: "rgba(var(--text-rgb),0.7)", whiteSpace: "nowrap" }}>{r.record}</td>
                  <td style={{ padding: "13px 16px", color: "rgba(var(--text-rgb),0.75)" }}>{r.detail}</td>
                </tr>
              ))
            )}
          </tbody>
        </TableWrap>
      </ListCard>
    </div>
  );
}
