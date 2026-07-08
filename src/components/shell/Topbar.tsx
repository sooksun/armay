"use client";

import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { PAGE_TITLES } from "@/lib/nav";
import { useUI } from "@/lib/ui-context";
import { useTheme } from "@/lib/theme-context";

export function Topbar() {
  const pathname = usePathname();
  const id = pathname.split("/")[1] || "dashboard";
  const [title, subtitle] = PAGE_TITLES[id] ?? PAGE_TITLES.dashboard;
  const { openIncome } = useUI();
  const { theme, toggle } = useTheme();

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* clear the session client-side regardless */
    }
    window.location.href = "/login";
  }

  return (
    <header
      style={{
        flexShrink: 0,
        padding: "16px 26px",
        display: "flex",
        alignItems: "center",
        gap: 18,
        borderBottom: "1px solid rgba(var(--surface-rgb),0.09)",
        background: "rgba(var(--topbar-rgb),0.35)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        zIndex: 20,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 22, lineHeight: 1.1 }}>{title}</div>
        <div
          style={{
            fontSize: 12.5,
            color: "rgba(var(--text-rgb),0.55)",
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {subtitle}
        </div>
      </div>

      <div data-topsearch style={{ marginLeft: "auto", position: "relative", width: 280, maxWidth: "32vw" }}>
        <span
          style={{
            position: "absolute",
            left: 13,
            top: "50%",
            transform: "translateY(-50%)",
            color: "rgba(var(--text-rgb),0.45)",
            pointerEvents: "none",
          }}
        >
          <Icon name="search" size={17} />
        </span>
        <input
          placeholder="ค้นหา ห้อง ผู้เช่า เจ้าของ รายการ…"
          style={{
            width: "100%",
            padding: "10px 12px 10px 40px",
            borderRadius: 13,
            border: "1px solid rgba(var(--surface-rgb),0.14)",
            background: "rgba(var(--surface-rgb),0.06)",
            color: "var(--text)",
            fontFamily: "inherit",
            fontSize: 13.5,
            outline: "none",
          }}
        />
      </div>

      <button
        data-quickadd
        onClick={openIncome}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderRadius: 13,
          border: "1px solid rgba(var(--surface-rgb),0.28)",
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 13.5,
          fontWeight: 600,
          color: "#04121A",
          background: "linear-gradient(135deg,#5EEAD4,#38BDF8)",
          boxShadow: "0 8px 22px rgba(56,189,248,0.4),inset 0 1px 0 rgba(var(--surface-rgb),0.55)",
        }}
      >
        <span style={{ display: "flex" }}>
          <Icon name="plus" size={17} />
        </span>
        <span data-quickadd-label>รับเงิน</span>
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "สลับเป็นธีมสว่าง" : "สลับเป็นธีมมืด"}
          title={theme === "dark" ? "โหมดสว่าง" : "โหมดมืด"}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(var(--surface-rgb),0.14)",
            background: "rgba(var(--surface-rgb),0.06)",
            color: "var(--text)",
            cursor: "pointer",
          }}
        >
          <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
        </button>
        <button
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(var(--surface-rgb),0.14)",
            background: "rgba(var(--surface-rgb),0.06)",
            color: "var(--text)",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <Icon name="bell" size={18} />
          <span
            style={{
              position: "absolute",
              top: 9,
              right: 10,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#FB7185",
              boxShadow: "0 0 0 2px rgba(var(--topbar-rgb),0.9)",
            }}
          />
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "5px 10px 5px 6px",
            borderRadius: 13,
            border: "1px solid rgba(var(--surface-rgb),0.12)",
            background: "rgba(var(--surface-rgb),0.05)",
          }}
        >
          <div
            style={{
              width: 31,
              height: 31,
              borderRadius: 9,
              background: "linear-gradient(135deg,#A855F7,#38BDF8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
              color: "#fff",
            }}
          >
            น
          </div>
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>นายหน้า แอดมิน</div>
            <div style={{ fontSize: 10.5, color: "rgba(var(--text-rgb),0.5)" }}>Admin</div>
          </div>
        </div>
        <button
          onClick={logout}
          aria-label="ออกจากระบบ"
          title="ออกจากระบบ"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(251,113,133,0.3)",
            background: "rgba(251,113,133,0.08)",
            color: "#FB7185",
            cursor: "pointer",
          }}
        >
          <Icon name="logout" size={18} />
        </button>
      </div>
    </header>
  );
}
