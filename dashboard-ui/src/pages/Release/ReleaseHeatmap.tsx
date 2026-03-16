import { useReleaseHeatmap } from "./hooks/useReleaseHeatmap";
import { HeatmapGrid } from "./components/HeatmapGrid";
import { HeatmapLegend } from "./components/HeatmapLegend";

export default function ReleaseHeatmap() {
  const project = "qlitz-demo";
  const { data, loading } = useReleaseHeatmap(project);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!data) {
    return <p>No heatmap data available.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-slate-100">
        Release Heatmap
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-3">
          <HeatmapGrid data={data} />
        </div>
        <div className="lg:col-span-1">
          <HeatmapLegend />
        </div>
      </div>
    </div>
  );
}
