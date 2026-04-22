import { useEffect, useState } from "react";
import SkeletonCard from "../../components/SkeletonCard";
import EmptyState from "../../components/EmptyState";
import { theme } from "../../theme";

const API_BASE = "http://localhost:3000";

export default function ProjectAnalytics({ projectId }: { projectId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const surface =
    theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;

  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  const text =
    theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;

  const textLight =
    theme.mode === "dark" ? theme.colors.darkTextLight : theme.colors.textLight;

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/flow/analytics`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return (
      <div
        style={{
          marginTop: theme.spacing.md,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: theme.spacing.md
        }}
      >
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!data) return <EmptyState message="No analytics available yet." />;

  const card = (label: string, value: any, color = theme.colors.primary) => (
    <div
      style={{
        padding: theme.spacing.lg,
        borderRadius: theme.radii.lg,
        background: surface,
        border: `1px solid ${border}`,
        textAlign: "center",
        boxShadow: theme.shadow.card,
        transition: "all 0.15s ease",
        cursor: "default"
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          "0 4px 12px rgba(0,0,0,0.12)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = theme.shadow.card;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      <div style={{ fontSize: theme.font.body, color: textLight }}>
        {label}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 700, color }}>{value}</div>
    </div>
  );

  const ciColor =
    data.ciStatus === "failed"
      ? theme.colors.danger
      : data.ciStatus === "passed"
      ? theme.colors.success
      : textLight;

  return (
    <div style={{ marginTop: theme.spacing.xl }}>
      <h3 style={{ color: theme.colors.primary, marginBottom: theme.spacing.md }}>
        Project Analytics
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: theme.spacing.md
        }}
      >
        {card("Total Tests", data.tests)}
        {card("Passed", data.passed, theme.colors.success)}
        {card("Failed", data.failed, theme.colors.danger)}
        {card("Coverage %", `${data.coverage}%`)}
        {card("Requirements", data.requirements)}
        {card("AI Suggestions", data.aiSuggestions)}
        {card("Auto‑Healed", data.autoHealed)}
        {card(
          "Last Run",
          data.lastRun ? new Date(data.lastRun).toLocaleString() : "—"
        )}
        {card("CI Status", data.ciStatus || "not-run", ciColor)}
      </div>
    </div>
  );
}
