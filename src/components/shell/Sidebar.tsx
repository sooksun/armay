"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { NAV_ITEMS } from "@/lib/nav";

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      data-shell-sidebar
      style={{
        width: 266,
        flexShrink: 0,
        height: "100vh",
        position: "sticky",
        top: 0,
        padding: "22px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        background: "linear-gradient(180deg,rgba(var(--surface-rgb),0.08),rgba(var(--surface-rgb),0.03))",
        backdropFilter: "blur(26px)",
        WebkitBackdropFilter: "blur(26px)",
        borderRight: "1px solid rgba(var(--surface-rgb),0.12)",
        boxShadow: "inset -1px 0 0 rgba(var(--surface-rgb),0.06)",
      }}
    >
      {/* logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 8px 4px" }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "conic-gradient(from 210deg,#5EEAD4,#38BDF8,#A855F7,#5EEAD4)",
            boxShadow: "0 8px 22px rgba(56,189,248,0.45),inset 0 1px 0 rgba(var(--surface-rgb),0.5)",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              transform: "rotate(45deg)",
              background: "rgba(7,17,31,0.55)",
              border: "1.5px solid rgba(var(--surface-rgb),0.8)",
              borderRadius: 3,
            }}
          />
        </div>
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: 0.2 }}>
            Crystal Ledger
          </div>
          <div style={{ fontSize: 11, color: "rgba(var(--text-rgb),0.55)", marginTop: 2 }}>
            ระบบควบคุมรายรับ–รายจ่าย
          </div>
        </div>
      </div>

      {/* nav */}
      <nav
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          overflowY: "auto",
          margin: "0 -4px",
          padding: "2px 4px",
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                textAlign: "left",
                transition: "all .15s",
                border: `1px solid ${active ? "rgba(94,234,212,0.35)" : "transparent"}`,
                color: active ? "var(--text)" : "rgba(var(--text-rgb),0.66)",
                background: active
                  ? "linear-gradient(135deg,rgba(94,234,212,0.18),rgba(56,189,248,0.14))"
                  : "transparent",
                boxShadow: active
                  ? "0 6px 18px rgba(56,189,248,0.18),inset 0 1px 0 rgba(var(--surface-rgb),0.14)"
                  : "none",
              }}
            >
              <span style={{ display: "flex", color: active ? "var(--pos)" : "rgba(var(--text-rgb),0.6)" }}>
                <Icon name={item.icon} size={18} />
              </span>
              <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
              {item.badge ? (
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: "1px 7px",
                    borderRadius: 20,
                    background: "rgba(251,113,133,0.22)",
                    color: "var(--neg)",
                    border: "1px solid rgba(251,113,133,0.4)",
                  }}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* net balance card */}
      <div
        style={{
          padding: 13,
          borderRadius: 18,
          background: "linear-gradient(135deg,rgba(94,234,212,0.14),rgba(168,85,247,0.14))",
          border: "1px solid rgba(var(--surface-rgb),0.14)",
        }}
      >
        <div style={{ fontSize: 12, color: "rgba(var(--text-rgb),0.62)" }}>ยอดสุทธินายหน้า · ก.ค. 2568</div>
        <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 22, marginTop: 3, color: "var(--pos)" }}>
          ฿862,300
        </div>
        <div style={{ fontSize: 11, color: "rgba(var(--text-rgb),0.5)", marginTop: 2 }}>
          หลังหักจ่ายเจ้าของและค่าใช้จ่าย
        </div>
      </div>
    </aside>
  );
}
