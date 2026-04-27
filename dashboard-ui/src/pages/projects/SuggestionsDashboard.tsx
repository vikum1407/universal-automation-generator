import { theme } from "@/theme";
import type { SuggestionsAnalytics, SuggestionType } from "@/api/suggestions";
import { TYPE_COLOR, TYPE_LABEL } from "@/api/suggestions";

function MetricTile({
  icon, label, value, sub, color,
}: {
  icon: string; label: string; value: number | string; sub?: string; color?: string;
}) {
  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  return (
    <div style={{
      flex: "1 1 140px", minWidth: 0, padding: "16px 18px", borderRadius: 14,
      background: surface, border: `1px solid ${border}`,
      boxShadow: theme.shadow.card,
    }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color ?? theme.colors.primary, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: text, marginTop: 5 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: textLight, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function CategoryBar({
  byCategory,
}: {
  byCategory: Partial<Record<SuggestionType, number>>;
}) {
  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  const entries = Object.entries(byCategory).filter(([, v]) => v && v > 0) as [SuggestionType, number][];
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!entries.length) return null;

  return (
    <div style={{
      padding: "14px 18px", borderRadius: 12,
      background: surface, border: `1px solid ${border}`,
      boxShadow: theme.shadow.card,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: textLight,
        textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12,
      }}>
        By Category
      </div>

      {/* Stacked bar */}
      <div style={{ display: "flex", height: 8, borderRadius: 6, overflow: "hidden", marginBottom: 14, gap: 2 }}>
        {entries.map(([type, count]) => (
          <div
            key={type}
            title={`${TYPE_LABEL[type]}: ${count}`}
            style={{
              flex: count / total,
              background: TYPE_COLOR[type],
              borderRadius: 4,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
        {entries.map(([type, count]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLOR[type], flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: textLight }}>{TYPE_LABEL[type]}</span>
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: "0px 6px", borderRadius: 8,
              background: `${TYPE_COLOR[type]}22`, color: TYPE_COLOR[type],
            }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SuggestionsDashboard({ analytics }: { analytics: SuggestionsAnalytics }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12, minWidth: 0 }}>
        <MetricTile
          icon="🧠"
          label="Total Suggestions"
          value={analytics.total}
          sub={`${analytics.applied} applied · ${analytics.dismissed} dismissed`}
        />
        <MetricTile
          icon="🔴"
          label="High Risk"
          value={analytics.highRisk}
          sub="Critical + High priority"
          color="#EF5350"
        />
        <MetricTile
          icon="⚡"
          label="Auto-Fixable"
          value={analytics.autoFixable}
          sub="One-click actions ready"
          color="#66BB6A"
        />
        <MetricTile
          icon="✅"
          label="Applied"
          value={analytics.applied}
          sub="Resolved suggestions"
          color="#448AFF"
        />
      </div>

      <CategoryBar byCategory={analytics.byCategory} />
    </div>
  );
}
