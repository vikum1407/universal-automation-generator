type Props = {
  mode: string;
  setMode: (m: string) => void;
};

export function EvolutionHeatmapSelector({ mode, setMode }: Props) {
  return (
    <select
      value={mode}
      onChange={e => setMode(e.target.value)}
      className="px-2 py-2 text-sm border rounded bg-white shadow"
    >
      <option value="none">Heatmap: None</option>
      <option value="change-intensity">Change Intensity</option>
      <option value="risk-volatility">Risk Volatility</option>
      <option value="cluster-drift">Cluster Drift</option>
      <option value="transition-fluctuation">Transition Fluctuation</option>
    </select>
  );
}
