import { ChartContainer } from "../ui/ChartContainer";
import { EmptyState } from "../ui/EmptyState";

export function TrendPanel({
  title,
  chart
}: {
  title: string;
  chart: { image_url: string } | null;
}) {
  if (!chart) return <EmptyState message="No trend data available." />;

  return (
    <ChartContainer title={title}>
      <img
        src={chart.image_url}
        className="w-full rounded-card border border-[var(--card-border)]"
      />
    </ChartContainer>
  );
}
