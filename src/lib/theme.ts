import type { CSSProperties } from "react";

/**
 * Crystal Ledger design tokens — ported verbatim from the design comp.
 * Dark glassmorphism: navy base with teal / purple / sky radial glows.
 */
export const COLORS = {
  text: "#EAF2FF",
  teal: "#5EEAD4",
  tealSoft: "#7FF0D9",
  sky: "#38BDF8",
  skySoft: "#7DD3FC",
  purple: "#A855F7",
  purpleSoft: "#DDD6FE",
  rose: "#FB7185",
  roseSoft: "#FDA4AF",
  gold: "#FBBF24",
  goldSoft: "#FDE68A",
  mint: "#34D399",
  mintSoft: "#6EE7B7",
  orange: "#FB923C",
  orangeSoft: "#FDBA74",
  slate: "#94A3B8",
  slateSoft: "#CBD5E1",
  ink: "#04121A",
} as const;

/** Full-app background (radial glows over dark navy). */
export const APP_BACKGROUND =
  "radial-gradient(circle at 12% 8%, rgba(94,234,212,0.20), transparent 34%)," +
  "radial-gradient(circle at 88% 4%, rgba(168,85,247,0.22), transparent 38%)," +
  "radial-gradient(circle at 78% 96%, rgba(56,189,248,0.16), transparent 42%)," +
  "linear-gradient(135deg,#07111F 0%,#0B1020 46%,#06251F 100%)";

export const ACCENT_GRADIENT = "linear-gradient(135deg,#5EEAD4,#38BDF8)";
export const PURPLE_GRADIENT = "linear-gradient(135deg,#A855F7,#38BDF8)";

/** Glass panel base used by cards / tables / bars. */
export function glass(radius = 22, alpha = 0.055): CSSProperties {
  return {
    borderRadius: radius,
    background: `rgba(255,255,255,${alpha})`,
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 18px 44px rgba(0,0,0,0.3),inset 0 1px 0 rgba(255,255,255,0.14)",
  };
}

export type BadgeKind =
  | "green"
  | "gold"
  | "red"
  | "blue"
  | "purple"
  | "gray"
  | "orange";

const BADGE_MAP: Record<BadgeKind, [string, string, string]> = {
  green: ["rgba(52,211,153,0.16)", "#6EE7B7", "rgba(52,211,153,0.4)"],
  gold: ["rgba(251,191,36,0.16)", "#FDE68A", "rgba(251,191,36,0.42)"],
  red: ["rgba(251,113,133,0.16)", "#FDA4AF", "rgba(251,113,133,0.42)"],
  blue: ["rgba(56,189,248,0.16)", "#7DD3FC", "rgba(56,189,248,0.42)"],
  purple: ["rgba(168,85,247,0.18)", "#DDD6FE", "rgba(168,85,247,0.42)"],
  gray: ["rgba(148,163,184,0.16)", "#CBD5E1", "rgba(148,163,184,0.4)"],
  orange: ["rgba(251,146,60,0.16)", "#FDBA74", "rgba(251,146,60,0.42)"],
};

/** Pill badge style for statuses (verification / rental / payment / payout). */
export function badge(kind: BadgeKind): CSSProperties {
  const [bg, color, border] = BADGE_MAP[kind] ?? BADGE_MAP.gray;
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11.5,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
    whiteSpace: "nowrap",
    background: bg,
    color,
    border: `1px solid ${border}`,
  };
}

/** Rounded icon chip tinted by a hex color (uses 8-digit hex alpha). */
export function iconChip(hex: string, size = 38): CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: hex,
    background: `${hex}1f`,
    border: `1px solid ${hex}44`,
    flexShrink: 0,
  };
}

/** Baht formatter matching the design (en-US grouping). */
export function fmtTHB(n: number): string {
  return "฿" + n.toLocaleString("en-US");
}
