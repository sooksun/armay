"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";
import { NAV_ITEMS, PAGE_TITLES } from "@/lib/nav";

/** Shared placeholder for views that are not yet designed in detail. */
export function PlaceholderView() {
  const pathname = usePathname();
  const id = pathname.split("/")[1] || "dashboard";
  const title = (PAGE_TITLES[id] ?? PAGE_TITLES.dashboard)[0];
  const icon: IconName = (NAV_ITEMS.find((n) => n.id === id)?.icon ?? "dashboard") as IconName;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div
        style={{
          textAlign: "center",
          padding: "44px 48px",
          borderRadius: 26,
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.32)",
          maxWidth: 440,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            margin: "0 auto 18px",
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,rgba(94,234,212,0.25),rgba(168,85,247,0.25))",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#A7F3E4",
          }}
        >
          <Icon name={icon} size={30} />
        </div>
        <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 19 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: "rgba(234,242,255,0.55)", marginTop: 8, lineHeight: 1.6 }}>
          หน้านี้อยู่ในโครงร่างของระบบ Crystal Ledger
          <br />
          รอการออกแบบละเอียดในเฟสถัดไป ตามสเปกเดียวกับหน้าที่ทำแล้ว
        </div>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            marginTop: 20,
            padding: "11px 22px",
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
          กลับสู่ Dashboard
        </Link>
      </div>
    </div>
  );
}
