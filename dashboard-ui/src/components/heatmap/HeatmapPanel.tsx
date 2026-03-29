import { ChartContainer } from "../ui/ChartContainer";
import { EmptyState } from "../ui/EmptyState";

export function HeatmapPanel({ heatmap }: { heatmap: { image_url: string } | null }) {
  if (!heatmap) return <EmptyState message="No heatmap data available." />;

  return (
    <ChartContainer title="Flakiness Heatmap">
      <img
        src={heatmap.image_url}
        className="w-full rounded-card border border-[var(--card-border)]"
      />
    </ChartContainer>
  );
}
