import React from "react";

/**
 * Icon factory ported verbatim from the design comp.
 * Inline SVGs built from stroke primitives; color follows `currentColor`.
 */
export type IconName =
  | "dashboard"
  | "owners"
  | "building"
  | "room"
  | "tenant"
  | "rental"
  | "income"
  | "expense"
  | "payout"
  | "service"
  | "report"
  | "account"
  | "users"
  | "settings"
  | "audit"
  | "search"
  | "plus"
  | "bell"
  | "export"
  | "refresh"
  | "filter"
  | "alert"
  | "cal"
  | "upload"
  | "image"
  | "chevDown"
  | "clock"
  | "sun"
  | "moon";

export function Icon({
  name,
  size = 20,
  sw = 1.7,
}: {
  name: IconName;
  size?: number;
  sw?: number;
}) {
  const R = React.createElement;
  const base = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: sw,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const P = (d: string) => R("path", { d, ...base });
  const C = (cx: number, cy: number, r: number) => R("circle", { cx, cy, r, ...base });
  const L = (x1: number, y1: number, x2: number, y2: number) =>
    R("line", { x1, y1, x2, y2, ...base });
  const Rc = (x: number, y: number, ww: number, hh: number, rx = 2) =>
    R("rect", { x, y, width: ww, height: hh, rx, ...base });

  const sets: Record<string, React.ReactNode[]> = {
    dashboard: [Rc(3, 3, 7, 7), Rc(14, 3, 7, 7), Rc(14, 14, 7, 7), Rc(3, 14, 7, 7)],
    owners: [
      C(9, 7, 3.2),
      P("M2.5 20a6.5 6.5 0 0 1 13 0"),
      P("M16 3.6a3.2 3.2 0 0 1 0 6.2"),
      P("M18 20a6.5 6.5 0 0 0-4-6"),
    ],
    building: [
      Rc(4, 3, 10, 18),
      Rc(14, 8, 6, 13),
      L(7, 7, 7, 7.01),
      L(11, 7, 11, 7.01),
      L(7, 11, 7, 11.01),
      L(11, 11, 11, 11.01),
      L(7, 15, 7, 15.01),
      L(11, 15, 11, 15.01),
      L(17, 12, 17, 12.01),
      L(17, 16, 17, 16.01),
    ],
    room: [Rc(5, 3, 14, 18), C(15, 12, 1)],
    tenant: [C(12, 8, 4), P("M4 20a8 8 0 0 1 16 0")],
    rental: [
      P("M8 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"),
      Rc(8, 2, 8, 4, 1.5),
      L(8, 10, 16, 10),
      L(8, 14, 16, 14),
      L(8, 18, 13, 18),
    ],
    income: [C(12, 12, 9), P("M12 8v8"), P("M8.5 12.5 12 16l3.5-3.5")],
    expense: [C(12, 12, 9), P("M12 16V8"), P("M8.5 11.5 12 8l3.5 3.5")],
    payout: [C(8, 9, 4), C(16, 15, 4), P("M12 9h4"), P("M8 13v2")],
    service: [
      P("M14.5 5.5a3.5 3.5 0 0 0-4.8 4.5L4 15.7 6.3 18l5.7-5.7a3.5 3.5 0 0 0 4.5-4.8l-2.2 2.2-2-2 2.2-2.2z"),
    ],
    report: [L(4, 20, 20, 20), Rc(5, 11, 3, 7, 1), Rc(10.5, 6, 3, 12, 1), Rc(16, 13, 3, 5, 1)],
    account: [Rc(3, 6, 18, 13, 3), P("M3 10h18"), L(7, 15, 11, 15)],
    users: [P("M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"), P("M9 12l2 2 4-4")],
    settings: [
      C(12, 12, 3),
      P("M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"),
    ],
    audit: [C(12, 12, 9), P("M12 7v5l3 2")],
    search: [C(11, 11, 7), L(20, 20, 16.5, 16.5)],
    plus: [L(12, 6, 12, 18), L(6, 12, 18, 12)],
    bell: [P("M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"), P("M10 20a2 2 0 0 0 4 0")],
    export: [P("M12 15V4"), P("M8 8l4-4 4 4"), P("M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3")],
    refresh: [P("M3.5 12a8.5 8.5 0 0 1 14.5-6M20.5 12a8.5 8.5 0 0 1-14.5 6"), P("M18 3v4h-4"), P("M6 21v-4h4")],
    filter: [P("M3 5h18l-7 8v6l-4-2v-4z")],
    alert: [P("M12 3 2 20h20z"), L(12, 10, 12, 14), L(12, 17, 12, 17.01)],
    cal: [Rc(3, 5, 18, 16, 3), L(3, 9, 21, 9), L(8, 3, 8, 6), L(16, 3, 16, 6)],
    upload: [P("M12 15V4"), P("M8 8l4-4 4 4"), P("M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3")],
    image: [Rc(3, 4, 18, 16, 3), C(8.5, 9.5, 1.8), P("M3 17l5-4 4 3 3-2 6 5")],
    chevDown: [P("M6 9l6 6 6-6")],
    clock: [C(12, 12, 9), P("M12 7v5l3 2")],
    sun: [
      C(12, 12, 4.2),
      P("M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M17.4 6.6l1.7-1.7M4.9 19.1l1.7-1.7"),
    ],
    moon: [P("M20.5 14.8A8.5 8.5 0 1 1 9.2 3.5a6.6 6.6 0 0 0 11.3 11.3z")],
  };

  const els = sets[name] ?? sets.dashboard;
  return R(
    "svg",
    { viewBox: "0 0 24 24", width: size, height: size, style: { display: "block", flexShrink: 0 } },
    ...els
  );
}
