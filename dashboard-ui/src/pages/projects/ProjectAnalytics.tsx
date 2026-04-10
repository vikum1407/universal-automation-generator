import { useEffect, useState } from "react";
import SkeletonCard from "../../components/SkeletonCard";
import EmptyState from "../../components/EmptyState";
import { theme } from "../../theme";

const API_BASE = "http://localhost:3000";

export default function ProjectAnalytics({ projectId }: { projectId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        background: theme.colors.background,
        border: `1px solid ${theme.colors.border}`,
        textAlign: "center",
        boxShadow: theme.shadow.card
      }}
    >
      <div style={{ fontSize: theme.font.body, color: theme.colors.textLight }}>
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
      : theme.colors.textLight;

  return (
    <div style={{ marginTop: theme.spacing.xl }}>
      <h3 style={{ color: theme.colors.primary }}>Project Analytics</h3>

      <div
        style={{
          marginTop: theme.spacing.md,
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
