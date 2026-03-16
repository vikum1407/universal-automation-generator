export function HeatmapSelector() {
  return (
    <select
      id="heatmap-mode"
      className="px-2 py-2 text-sm border rounded bg-white shadow"
    >
      <option value="none">Heatmap: None</option>
      <option value="page-risk">Page Risk</option>
      <option value="transition-risk">Transition Risk</option>
      <option value="cluster-risk">Cluster Risk</option>
      <option value="journey-risk">Journey Risk</option>
    </select>
  );
}
