import { theme } from "@/theme";

interface SummaryBlock {
  label: string;
  value: number | string;
}

interface RTMDashboardProps {
  summary: {
    totalRequirements: number;
    coveredRequirements: number;
    coveragePercent: number;
  };
}

export default function RTMDashboard({ summary }: RTMDashboardProps) {
  const blocks: SummaryBlock[] = [
    { label: "Total Requirements", value: summary.totalRequirements },
    { label: "Covered Requirements", value: summary.coveredRequirements },
    { label: "Coverage %", value: `${summary.coveragePercent}%` }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg
      }}
    >
      {blocks.map((b) => (
        <div
          key={b.label}
          style={{
            padding: theme.spacing.md,
            borderRadius: theme.radii.md,
            border: `1px solid ${theme.colors.border}`,
            background: theme.colors.background,
            display: "flex",
            flexDirection: "column",
            gap: 4
          }}
        >
          <div style={{ fontSize: 13, color: theme.colors.textDark }}>
            {b.label}
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: theme.colors.primary
            }}
          >
            {b.value}
          </div>
        </div>
      ))}
    </div>
  );
}
