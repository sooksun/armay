"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";
import { BOTTOM_NAV } from "@/lib/nav";

export function BottomNav() {
  const pathname = usePathname();
  const id = pathname.split("/")[1] || "dashboard";

  return (
    <nav
      data-shell-bottomnav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        padding: "10px 8px calc(10px + env(safe-area-inset-bottom))",
        justifyContent: "space-around",
        alignItems: "center",
        background: "rgba(11,16,32,0.82)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {BOTTOM_NAV.map((b) => {
        const active = id === b.id;
        return (
          <Link
            key={b.id}
            href={b.href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              padding: "5px 8px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              color: active ? "#7FF0D9" : "rgba(234,242,255,0.55)",
            }}
          >
            <span style={{ display: "flex" }}>
              <Icon name={b.icon} size={21} />
            </span>
            <span style={{ fontSize: 10 }}>{b.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
