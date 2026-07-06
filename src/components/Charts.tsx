import React from "react";

/**
 * Hand-built SVG charts ported verbatim from the design comp.
 * Kept in React.createElement form to preserve exact geometry.
 */
const R = React.createElement;

export function LineChart() {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  const inc = [0.82, 0.91, 0.88, 1.02, 0.97, 1.12, 1.08, 1.18, 1.15, 1.21, 1.18, 1.25];
  const exp = [0.31, 0.34, 0.3, 0.36, 0.33, 0.38, 0.35, 0.4, 0.37, 0.41, 0.39, 0.386];
  const W = 720, H = 250, mL = 34, mR = 14, mT = 14, mB = 30, maxV = 1.4;
  const px = (i: number) => mL + i * ((W - mL - mR) / (months.length - 1));
  const py = (v: number) => mT + (1 - v / maxV) * (H - mT - mB);
  const path = (arr: number[]) => arr.map((v, i) => (i ? "L" : "M") + px(i).toFixed(1) + " " + py(v).toFixed(1)).join(" ");
  const area = (arr: number[]) =>
    path(arr) + " L" + px(arr.length - 1).toFixed(1) + " " + (H - mB) + " L" + px(0).toFixed(1) + " " + (H - mB) + " Z";
  const grid = [0, 0.35, 0.7, 1.05, 1.4];
  return R(
    "svg",
    { viewBox: `0 0 ${W} ${H}`, style: { width: "100%", height: "auto", display: "block" } },
    R(
      "defs",
      {},
      R(
        "linearGradient",
        { id: "clInc", x1: 0, y1: 0, x2: 0, y2: 1 },
        R("stop", { offset: "0%", stopColor: "#38BDF8", stopOpacity: 0.35 }),
        R("stop", { offset: "100%", stopColor: "#38BDF8", stopOpacity: 0 })
      ),
      R(
        "linearGradient",
        { id: "clExp", x1: 0, y1: 0, x2: 0, y2: 1 },
        R("stop", { offset: "0%", stopColor: "#FB7185", stopOpacity: 0.22 }),
        R("stop", { offset: "100%", stopColor: "#FB7185", stopOpacity: 0 })
      )
    ),
    ...grid.map((g) =>
      R("line", { key: "g" + g, x1: mL, y1: py(g), x2: W - mR, y2: py(g), stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 })
    ),
    ...grid.map((g) =>
      R("text", { key: "t" + g, x: mL - 7, y: py(g) + 3.5, textAnchor: "end", fontSize: 9.5, fill: "rgba(234,242,255,0.4)" }, g.toFixed(1))
    ),
    R("path", { d: area(inc), fill: "url(#clInc)" }),
    R("path", { d: area(exp), fill: "url(#clExp)" }),
    R("path", { d: path(exp), fill: "none", stroke: "#FB7185", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" }),
    R("path", { d: path(inc), fill: "none", stroke: "#38BDF8", strokeWidth: 2.8, strokeLinecap: "round", strokeLinejoin: "round" }),
    ...inc.map((v, i) =>
      R("circle", { key: "d" + i, cx: px(i), cy: py(v), r: i === inc.length - 1 ? 4 : 2.6, fill: "#0B1020", stroke: "#38BDF8", strokeWidth: 2 })
    ),
    ...months.map((m, i) =>
      R("text", { key: "m" + i, x: px(i), y: H - 9, textAnchor: "middle", fontSize: 9.5, fill: "rgba(234,242,255,0.45)" }, m)
    )
  );
}

export function DonutChart() {
  const data = [
    { l: "ค่านายหน้า (หัก)", v: 38, c: "#A855F7" },
    { l: "ค่าซ่อมแซม", v: 22, c: "#FB7185" },
    { l: "ค่าแม่บ้าน", v: 18, c: "#FBBF24" },
    { l: "ค่าส่วนกลาง", v: 14, c: "#38BDF8" },
    { l: "ค่าอื่น ๆ", v: 8, c: "#5EEAD4" },
  ];
  const r = 52, cx = 70, cy = 70, circ = 2 * Math.PI * r;
  let off = 0;
  const segs = data.map((d, i) => {
    const len = (d.v / 100) * circ;
    const el = R("circle", {
      key: i,
      cx,
      cy,
      r,
      fill: "none",
      stroke: d.c,
      strokeWidth: 18,
      strokeDasharray: `${len} ${circ - len}`,
      strokeDashoffset: -off,
      transform: `rotate(-90 ${cx} ${cy})`,
      strokeLinecap: "butt",
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
      R("circle", { cx, cy, r, fill: "none", stroke: "rgba(255,255,255,0.06)", strokeWidth: 18 }),
      ...segs,
      R("text", { x: cx, y: cy - 3, textAnchor: "middle", fontSize: 15, fontWeight: 700, fill: "#EAF2FF", style: { fontFamily: "Sora, sans-serif" } }, "฿386K"),
      R("text", { x: cx, y: cy + 14, textAnchor: "middle", fontSize: 9.5, fill: "rgba(234,242,255,0.5)" }, "รวมรายจ่าย")
    ),
    R(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 120 } },
      ...data.map((d, i) =>
        R(
          "div",
          { key: i, style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12 } },
          R("span", { style: { width: 10, height: 10, borderRadius: 3, background: d.c, flexShrink: 0 } }),
          R("span", { style: { color: "rgba(234,242,255,0.75)", flex: 1 } }, d.l),
          R("span", { style: { fontWeight: 600, fontFamily: "Sora, sans-serif" } }, d.v + "%")
        )
      )
    )
  );
}

export function BarChart() {
  const data = [
    { l: "เดอะ เครสท์", v: 468, c: "#38BDF8" },
    { l: "บ้านสวน พัทยา", v: 352, c: "#5EEAD4" },
    { l: "แฟลตรุ่งเรือง", v: 246, c: "#A855F7" },
    { l: "ศุภาลัย เรส", v: 182, c: "#FBBF24" },
  ];
  const W = 340, H = 200, mB = 34, mT = 10, maxV = 500, bw = 42;
  const gap = (W - data.length * bw) / (data.length + 1);
  const by = (v: number) => mT + (1 - v / maxV) * (H - mT - mB);
  return R(
    "svg",
    { viewBox: `0 0 ${W} ${H}`, style: { width: "100%", height: "auto", display: "block" } },
    ...[0, 0.5, 1].map((g) =>
      R("line", { key: "grid" + g, x1: 0, y1: by(maxV * g), x2: W, y2: by(maxV * g), stroke: "rgba(255,255,255,0.07)", strokeWidth: 1 })
    ),
    ...data.map((d, i) => {
      const x = gap + i * (bw + gap), y = by(d.v), h = H - mB - y;
      return R(
        "g",
        { key: "bar" + i },
        R("rect", { x, y, width: bw, height: h, rx: 8, fill: d.c, opacity: 0.85 }),
        R("rect", { x, y, width: bw, height: Math.min(h, 10), rx: 8, fill: "#fff", opacity: 0.25 }),
        R("text", { x: x + bw / 2, y: y - 6, textAnchor: "middle", fontSize: 11, fontWeight: 700, fill: "#EAF2FF", style: { fontFamily: "Sora, sans-serif" } }, d.v),
        R("text", { x: x + bw / 2, y: H - 12, textAnchor: "middle", fontSize: 9, fill: "rgba(234,242,255,0.55)" }, d.l)
      );
    })
  );
}

export function HBarChart() {
  const data = [
    { l: "A-1105 · เดอะ เครสท์", v: 38500, c: "#38BDF8" },
    { l: "B-802 · บ้านสวน พัทยา", v: 32000, c: "#5EEAD4" },
    { l: "A-1204 · เดอะ เครสท์", v: 29500, c: "#A855F7" },
    { l: "C-305 · แฟลตรุ่งเรือง", v: 24000, c: "#FBBF24" },
    { l: "B-410 · ศุภาลัย เรส", v: 19800, c: "#7FF0D9" },
  ];
  const max = 40000;
  return R(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: 13 } },
    ...data.map((d, i) =>
      R(
        "div",
        { key: i },
        R(
          "div",
          { style: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 } },
          R("span", { style: { color: "rgba(234,242,255,0.8)" } }, d.l),
          R("span", { style: { fontWeight: 600, fontFamily: "Sora, sans-serif", color: d.c } }, "฿" + d.v.toLocaleString())
        ),
        R(
          "div",
          { style: { height: 9, borderRadius: 20, background: "rgba(255,255,255,0.06)", overflow: "hidden" } },
          R("div", { style: { width: (d.v / max) * 100 + "%", height: "100%", borderRadius: 20, background: `linear-gradient(90deg, ${d.c}, ${d.c}cc)`, boxShadow: `0 0 12px ${d.c}66` } })
        )
      )
    )
  );
}
