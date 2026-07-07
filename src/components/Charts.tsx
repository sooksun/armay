import React from "react";
import type { ChartPointDTO } from "@/lib/api-types";

/**
 * Hand-built SVG charts ported from the design comp.
 * Each accepts optional real data; falls back to sample geometry when omitted.
 */
const R = React.createElement;

const compact = (v: number) =>
  v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M" : v >= 1000 ? Math.round(v / 1000) + "k" : String(Math.round(v));

const DEFAULT_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export function LineChart({ months, inc, exp }: { months?: string[]; inc?: number[]; exp?: number[] } = {}) {
  const mo = months && months.length ? months : DEFAULT_MONTHS;
  const incArr = inc && inc.length ? inc : [0.82, 0.91, 0.88, 1.02, 0.97, 1.12, 1.08, 1.18, 1.15, 1.21, 1.18, 1.25];
  const expArr = exp && exp.length ? exp : [0.31, 0.34, 0.3, 0.36, 0.33, 0.38, 0.35, 0.4, 0.37, 0.41, 0.39, 0.386];
  const maxV = Math.max(1, ...incArr, ...expArr) * 1.15;
  const W = 720, H = 250, mL = 40, mR = 14, mT = 14, mB = 30;
  const n = Math.max(2, mo.length);
  const px = (i: number) => mL + i * ((W - mL - mR) / (n - 1));
  const py = (v: number) => mT + (1 - v / maxV) * (H - mT - mB);
  const path = (arr: number[]) => arr.map((v, i) => (i ? "L" : "M") + px(i).toFixed(1) + " " + py(v).toFixed(1)).join(" ");
  const area = (arr: number[]) =>
    path(arr) + " L" + px(arr.length - 1).toFixed(1) + " " + (H - mB) + " L" + px(0).toFixed(1) + " " + (H - mB) + " Z";
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxV);
  return R(
    "svg",
    { viewBox: `0 0 ${W} ${H}`, style: { width: "100%", height: "auto", display: "block" } },
    R(
      "defs",
      {},
      R("linearGradient", { id: "clInc", x1: 0, y1: 0, x2: 0, y2: 1 },
        R("stop", { offset: "0%", stopColor: "#38BDF8", stopOpacity: 0.35 }),
        R("stop", { offset: "100%", stopColor: "#38BDF8", stopOpacity: 0 })),
      R("linearGradient", { id: "clExp", x1: 0, y1: 0, x2: 0, y2: 1 },
        R("stop", { offset: "0%", stopColor: "#FB7185", stopOpacity: 0.22 }),
        R("stop", { offset: "100%", stopColor: "#FB7185", stopOpacity: 0 }))
    ),
    ...grid.map((g, i) =>
      R("line", { key: "g" + i, x1: mL, y1: py(g), x2: W - mR, y2: py(g), stroke: "rgba(var(--surface-rgb),0.08)", strokeWidth: 1 })
    ),
    ...grid.map((g, i) =>
      R("text", { key: "t" + i, x: mL - 7, y: py(g) + 3.5, textAnchor: "end", fontSize: 9.5, fill: "rgba(var(--text-rgb),0.4)" }, compact(g))
    ),
    R("path", { d: area(incArr), fill: "url(#clInc)" }),
    R("path", { d: area(expArr), fill: "url(#clExp)" }),
    R("path", { d: path(expArr), fill: "none", stroke: "#FB7185", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" }),
    R("path", { d: path(incArr), fill: "none", stroke: "#38BDF8", strokeWidth: 2.8, strokeLinecap: "round", strokeLinejoin: "round" }),
    ...incArr.map((v, i) =>
      R("circle", { key: "d" + i, cx: px(i), cy: py(v), r: i === incArr.length - 1 ? 4 : 2.6, fill: "var(--panel)", stroke: "#38BDF8", strokeWidth: 2 })
    ),
    ...mo.map((m, i) =>
      R("text", { key: "m" + i, x: px(i), y: H - 9, textAnchor: "middle", fontSize: 9.5, fill: "rgba(var(--text-rgb),0.45)" }, m)
    )
  );
}

const DEFAULT_DONUT: ChartPointDTO[] = [
  { label: "ค่านายหน้า (หัก)", value: 38, color: "#A855F7" },
  { label: "ค่าซ่อมแซม", value: 22, color: "#FB7185" },
  { label: "ค่าแม่บ้าน", value: 18, color: "#FBBF24" },
  { label: "ค่าส่วนกลาง", value: 14, color: "#38BDF8" },
  { label: "ค่าอื่น ๆ", value: 8, color: "#5EEAD4" },
];

export function DonutChart({ data }: { data?: ChartPointDTO[] } = {}) {
  const rows = data && data.length ? data : DEFAULT_DONUT;
  const total = rows.reduce((s, d) => s + d.value, 0) || 1;
  const r = 52, cx = 70, cy = 70, circ = 2 * Math.PI * r;
  let off = 0;
  const segs = rows.map((d, i) => {
    const len = (d.value / total) * circ;
    const el = R("circle", {
      key: i, cx, cy, r, fill: "none", stroke: d.color, strokeWidth: 18,
      strokeDasharray: `${len} ${circ - len}`, strokeDashoffset: -off,
      transform: `rotate(-90 ${cx} ${cy})`, strokeLinecap: "butt",
    });
    off += len;
    return el;
  });
  return R(
    "div",
    { style: { display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" } },
    R(
      "svg",
      { viewBox: "0 0 140 140", style: { width: 140, height: 140, flexShrink: 0 } },
      R("circle", { cx, cy, r, fill: "none", stroke: "rgba(var(--surface-rgb),0.06)", strokeWidth: 18 }),
      ...segs,
      R("text", { x: cx, y: cy - 3, textAnchor: "middle", fontSize: 15, fontWeight: 700, fill: "var(--text)", style: { fontFamily: "Sora, sans-serif" } }, "฿" + compact(total)),
      R("text", { x: cx, y: cy + 14, textAnchor: "middle", fontSize: 9.5, fill: "rgba(var(--text-rgb),0.5)" }, "รวมรายจ่าย")
    ),
    R(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 120 } },
      ...rows.map((d, i) =>
        R(
          "div",
          { key: i, style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 } },
          R("span", { style: { width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 } }),
          R("span", { style: { color: "rgba(var(--text-rgb),0.75)", flex: 1 } }, d.label),
          R("span", { style: { fontWeight: 600, fontFamily: "Sora, sans-serif" } }, Math.round((d.value / total) * 100) + "%")
        )
      )
    )
  );
}

const DEFAULT_BAR: ChartPointDTO[] = [
  { label: "เดอะ เครสท์", value: 468, color: "#38BDF8" },
  { label: "บ้านสวน พัทยา", value: 352, color: "#5EEAD4" },
  { label: "แฟลตรุ่งเรือง", value: 246, color: "#A855F7" },
  { label: "ศุภาลัย เรส", value: 182, color: "#FBBF24" },
];

export function BarChart({ data }: { data?: ChartPointDTO[] } = {}) {
  const rows = data && data.length ? data : DEFAULT_BAR;
  const W = 340, H = 200, mB = 34, mT = 10, bw = 42;
  const maxV = Math.max(1, ...rows.map((d) => d.value)) * 1.15;
  const gap = (W - rows.length * bw) / (rows.length + 1);
  const by = (v: number) => mT + (1 - v / maxV) * (H - mT - mB);
  return R(
    "svg",
    { viewBox: `0 0 ${W} ${H}`, style: { width: "100%", height: "auto", display: "block" } },
    ...[0, 0.5, 1].map((g) =>
      R("line", { key: "grid" + g, x1: 0, y1: by(maxV * g), x2: W, y2: by(maxV * g), stroke: "rgba(var(--surface-rgb),0.07)", strokeWidth: 1 })
    ),
    ...rows.map((d, i) => {
      const x = gap + i * (bw + gap), y = by(d.value), h = H - mB - y;
      return R(
        "g",
        { key: "bar" + i },
        R("rect", { x, y, width: bw, height: h, rx: 8, fill: d.color, opacity: 0.85 }),
        R("rect", { x, y, width: bw, height: Math.min(h, 10), rx: 8, fill: "#fff", opacity: 0.25 }),
        R("text", { x: x + bw / 2, y: y - 6, textAnchor: "middle", fontSize: 11, fontWeight: 700, fill: "var(--text)", style: { fontFamily: "Sora, sans-serif" } }, compact(d.value)),
        R("text", { x: x + bw / 2, y: H - 12, textAnchor: "middle", fontSize: 9, fill: "rgba(var(--text-rgb),0.55)" }, d.label)
      );
    })
  );
}

const DEFAULT_HBAR: ChartPointDTO[] = [
  { label: "A-1105 · เดอะ เครสท์", value: 38500, color: "#38BDF8" },
  { label: "B-802 · บ้านสวน พัทยา", value: 32000, color: "#5EEAD4" },
  { label: "A-1204 · เดอะ เครสท์", value: 29500, color: "#A855F7" },
  { label: "C-305 · แฟลตรุ่งเรือง", value: 24000, color: "#FBBF24" },
  { label: "B-410 · ศุภาลัย เรส", value: 19800, color: "var(--pos)" },
];

export function HBarChart({ data }: { data?: ChartPointDTO[] } = {}) {
  const rows = data && data.length ? data : DEFAULT_HBAR;
  const max = Math.max(1, ...rows.map((d) => d.value));
  return R(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 13 } },
    ...rows.map((d, i) =>
      R(
        "div",
        { key: i },
        R(
          "div",
          { style: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 } },
          R("span", { style: { color: "rgba(var(--text-rgb),0.8)" } }, d.label),
          R("span", { style: { fontWeight: 600, fontFamily: "Sora, sans-serif", color: d.color } }, "฿" + d.value.toLocaleString())
        ),
        R(
          "div",
          { style: { height: 9, borderRadius: 20, background: "rgba(var(--surface-rgb),0.06)", overflow: "hidden" } },
          R("div", { style: { width: (d.value / max) * 100 + "%", height: "100%", borderRadius: 20, background: `linear-gradient(90deg, ${d.color}, ${d.color}cc)`, boxShadow: `0 0 12px ${d.color}66` } })
        )
      )
    )
  );
}
