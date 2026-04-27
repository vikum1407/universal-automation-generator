import { theme } from "@/theme";
import type { TestSummary } from "@/api/tests";

function Tile({
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
      flex: "1 1 130px", minWidth: 0, padding: "14px 16px", borderRadius: 14,
      background: surface, border: `1px solid ${border}`,
      boxShadow: theme.shadow.card,
    }}>
      <div style={{ fontSize: 20, marginBottom: 5 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color ?? theme.colors.primary, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: text, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: textLight, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function RunBar({
  running, onRun, lastRunAt,
}: {
  running: boolean; onRun: () => void; lastRunAt: string | null;
}) {
  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  return (
    <div style={{
      padding: "10px 16px", borderRadius: 12, marginBottom: 12,
      background: surface, border: `1px solid ${border}`,
      display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
    }}>
      <button
        onClick={onRun}
        disabled={running}
        style={{
          padding: "8px 20px", borderRadius: 9, border: "none",
          background: running ? "#9e7de0" : theme.colors.primary,
          color: "#fff", fontWeight: 700, fontSize: 13,
          cursor: running ? "not-allowed" : "pointer",
          transition: "opacity 0.12s",
          display: "flex", alignItems: "center", gap: 6,
        }}
        onMouseEnter={e => {
          if (!running) (e.currentTarget as HTMLButtonElement).style.opacity = "0.85";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        }}
      >
        <span>{running ? "⏳" : "▶"}</span>
        {running ? "Running all tests…" : "Run All Tests"}
      </button>

      {lastRunAt && (
        <span style={{ fontSize: 12, color: textLight }}>
          Last run: {new Date(lastRunAt).toLocaleString()}
        </span>
      )}

      {running && (
        <span style={{ fontSize: 12, color: theme.colors.primary, fontWeight: 500 }}>
          Executing test suite — this may take a minute…
        </span>
      )}
    </div>
  );
}

interface Props {
  summary: TestSummary;
  running: boolean;
  onRun: () => void;
}

export default function TestSummaryBar({ summary, running, onRun }: Props) {
  const stabilityColor = summary.stabilityScore >= 80 ? "#66BB6A" :
    summary.stabilityScore >= 60 ? "#FFA726" : "#EF5350";

  return (
    <div style={{ marginBottom: 20 }}>
      <RunBar running={running} onRun={onRun} lastRunAt={summary.lastRunAt} />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", minWidth: 0 }}>
        <Tile icon="🧪" label="Total Tests" value={summary.total}
          sub={`${summary.notRun} not run`} />
        <Tile icon="✅" label="Passed" value={summary.passed}
          color="#66BB6A"
          sub={summary.total ? `${Math.round((summary.passed / summary.total) * 100)}% pass rate` : undefined} />
        <Tile icon="❌" label="Failed" value={summary.failed}
          color={summary.failed > 0 ? "#EF5350" : "#66BB6A"} />
        <Tile icon="⚡" label="Coverage Impact" value={`${summary.coverageImpact}%`}
          color={summary.coverageImpact >= 70 ? "#66BB6A" : "#FFA726"} />
        <Tile icon="🛡️" label="Stability" value={`${summary.stabilityScore}%`}
          color={stabilityColor}
          sub="Avg across all tests" />
        <Tile icon="🧠" label="AI Suggestions" value={summary.aiSuggestions}
          color="#9C27B0"
          sub="Improvements available" />
      </div>
    </div>
  );
}
