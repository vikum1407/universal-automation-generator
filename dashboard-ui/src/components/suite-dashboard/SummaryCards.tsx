import type { SuiteDashboard } from "../../types/suite-dashboard";

export default function SummaryCards({ summary }: { summary: SuiteDashboard["summary"] }) {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <Card title="Total Runs" value={summary.totalRuns} />
      <Card title="Success Rate" value={(summary.successRate * 100).toFixed(1) + "%"} />
      <Card title="Failure Rate" value={(summary.failureRate * 100).toFixed(1) + "%"} />
      <Card title="Avg Duration" value={summary.averageDurationMs + " ms"} />
    </div>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
      <div style={{ fontSize: 14, color: "#666" }}>{title}</div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
    </div>
  );
}
