import { useColors } from "@/hooks/useColors";
import type { RTMAnalytics } from "@/api/rtm";

const SCORE_COLOR = (v: number) => v >= 75 ? "#00C853" : v >= 50 ? "#FFA726" : "#EF5350";
const RISK_LABEL = (v: number) => v <= 25 ? "Low" : v <= 50 ? "Moderate" : v <= 75 ? "High" : "Critical";

function MetricTile({
  label, value, sub, valueColor, icon,
}: {
  label: string; value: string | number; sub?: string;
  valueColor?: string; icon: string;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P } = useColors();

  return (
    <div style={{
      flex: "1 1 140px", padding: "16px 18px", borderRadius: 14,
      background: surface, border: `1px solid ${border}`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)", minWidth: 0,
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: valueColor ?? P, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: text, marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: textLight, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function TrendBadge({ label, count, color }: { label: string; count: number; color: string }) {
  const { TXT2: textLight } = useColors();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{
        padding: "2px 9px", borderRadius: 10, fontSize: 12, fontWeight: 700,
        background: `${color}22`, color
      }}>{count}</span>
      <span style={{ fontSize: 12, color: textLight }}>{label}</span>
    </div>
  );
}

export default function RTMDashboard({ analytics }: { analytics: RTMAnalytics }) {
  const { CARD: surface, BDR: border, TXT2: textLight } = useColors();

  const coveragePct = analytics.coveragePercent;
  const uncoveredCount = analytics.totalRequirements - analytics.coveredRequirements;

  return (
    <div style={{ marginBottom: 24 }}>

      {/* Main metric tiles */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16, minWidth: 0 }}>
        <MetricTile
          icon="📋"
          label="Total Requirements"
          value={analytics.totalRequirements}
          sub={`${analytics.coveredRequirements} covered · ${uncoveredCount} gaps`}
        />
        <MetricTile
          icon="✅"
          label="Coverage"
          value={`${coveragePct}%`}
          valueColor={SCORE_COLOR(coveragePct)}
          sub={`${analytics.specFilesFound} spec file${analytics.specFilesFound !== 1 ? "s" : ""} found`}
        />
        <MetricTile
          icon="🔥"
          label="Risk Score"
          value={`${analytics.riskScore}`}
          valueColor={SCORE_COLOR(100 - analytics.riskScore)}
          sub={RISK_LABEL(analytics.riskScore)}
        />
        <MetricTile
          icon="🛡️"
          label="Stability Score"
          value={`${analytics.stabilityScore}`}
          valueColor={SCORE_COLOR(analytics.stabilityScore)}
          sub="Based on coverage + confidence"
        />
        <MetricTile
          icon="🤖"
          label="AI Confidence"
          value={`${analytics.aiConfidenceScore}%`}
          valueColor={SCORE_COLOR(analytics.aiConfidenceScore)}
          sub="Avg across all requirements"
        />
      </div>

      {/* Trending strip */}
      <div style={{
        padding: "12px 18px", borderRadius: 12,
        background: surface, border: `1px solid ${border}`,
        display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap"
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Trending
        </div>
        <TrendBadge label="new requirements" count={analytics.trending.new} color="#448AFF" />
        <TrendBadge label="updated" count={analytics.trending.updated} color="#FFA726" />
        <TrendBadge label="high-risk uncovered" count={analytics.trending.risky} color="#EF5350" />
      </div>
    </div>
  );
}
