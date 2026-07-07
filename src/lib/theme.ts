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
    background: `rgba(var(--surface-rgb),${alpha})`,
    backdropFilter: "blur(22px)",
    WebkitBackdropFilter: "blur(22px)",
    border: "1px solid rgba(var(--surface-rgb),0.12)",
    boxShadow: "var(--shadow),inset 0 1px 0 rgba(var(--surface-rgb),0.14)",
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

const BADGE_KINDS: Record<BadgeKind, true> = {
  green: true,
  gold: true,
  red: true,
  blue: true,
  purple: true,
  gray: true,
  orange: true,
};

/** Pill badge style for statuses (verification / rental / payment / payout). Theme-aware via CSS vars. */
export function badge(kind: BadgeKind): CSSProperties {
  const k = BADGE_KINDS[kind] ? kind : "gray";
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 11.5,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
    whiteSpace: "nowrap",
    background: `var(--badge-${k}-bg)`,
    color: `var(--badge-${k}-fg)`,
    border: `1px solid var(--badge-${k}-bd)`,
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

/** Parses a Thai-baht display string like "฿12,500" or "−฿1,750" into a signed integer. */
export function parseAmount(display: string): number {
  const normalized = display.replace(/−/g, "-");
  const digits = normalized.replace(/[^\d-]/g, "");
  const n = parseInt(digits, 10);
  return Number.isNaN(n) ? 0 : n;
}

/** Masks the middle dash-separated group(s) of an account number, keeping the first and last visible. */
export function maskAccountNumber(num: string): string {
  const parts = num.split("-");
  if (parts.length < 3) return num;
  return parts.map((p, i) => (i === 0 || i === parts.length - 1 ? p : "•".repeat(p.length))).join("-");
}
