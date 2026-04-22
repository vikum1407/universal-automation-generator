import type { CSSProperties } from "react";
import { theme } from "@/theme";

interface RTMInsightsProps {
  insights: {
    uncoveredCount: number;
    flakyCount: number;
    failedCount: number;
    stableCount: number;
    highRiskEndpoints: string[];
    uiGaps: string[];
  } | null;
}

export default function RTMInsights({ insights }: RTMInsightsProps) {
  if (!insights) return null;

  const card: CSSProperties = {
    padding: theme.spacing.md,
    borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.background,
    boxShadow: theme.shadow.card,
    display: "flex",
    flexDirection: "column",
    gap: 6
  };

  const label: CSSProperties = {
    fontSize: 13,
    color: theme.colors.textDark
  };

  const value: CSSProperties = {
    fontSize: 22,
    fontWeight: 600,
    color: theme.colors.primary
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg
      }}
    >
      <div style={card}>
        <div style={label}>Uncovered Requirements</div>
        <div style={value}>{insights.uncoveredCount}</div>
      </div>

      <div style={card}>
        <div style={label}>Flaky Tests</div>
        <div style={value}>{insights.flakyCount}</div>
      </div>

      <div style={card}>
        <div style={label}>Failed Tests</div>
        <div style={value}>{insights.failedCount}</div>
      </div>

      <div style={card}>
        <div style={label}>Stable Tests</div>
        <div style={value}>{insights.stableCount}</div>
      </div>

      <div style={card}>
        <div style={label}>High‑Risk Endpoints</div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
          {insights.highRiskEndpoints.length === 0 && <li>None</li>}
          {insights.highRiskEndpoints.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </div>

      <div style={card}>
        <div style={label}>UI Coverage Gaps</div>
        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13 }}>
          {insights.uiGaps.length === 0 && <li>None</li>}
          {insights.uiGaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
