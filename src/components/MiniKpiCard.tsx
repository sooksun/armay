import { Icon } from "@/components/Icon";
import { iconChip } from "@/lib/theme";
import type { MiniKpi } from "@/lib/mock";

/** Compact KPI card used on the Income and Payout pages. */
export function MiniKpiCard({ kpi }: { kpi: MiniKpi }) {
  const valueColor = kpi.color === "#5EEAD4" || kpi.color === "#38BDF8" ? "#7FF0D9" : "#EAF2FF";
  return (
    <div
      style={{
        padding: "16px 18px",
        borderRadius: 20,
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 14px 34px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <span style={iconChip(kpi.color, 30)}>
          <Icon name={kpi.icon} size={16} />
        </span>
        <span style={{ fontSize: 12.5, color: "rgba(234,242,255,0.6)" }}>{kpi.label}</span>
      </div>
      <div style={{ fontFamily: "Sora,sans-serif", fontWeight: 700, fontSize: 22, marginTop: 10, color: valueColor }}>
        {kpi.value}
      </div>
    </div>
  );
}
