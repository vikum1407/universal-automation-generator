type Props = {
  selectedCluster: string;
  setSelectedCluster: (v: string) => void;
  clusters: string[];
  onAnalyze: () => void;
};

export function ClusterControls({
  selectedCluster,
  setSelectedCluster,
  clusters,
  onAnalyze
}: Props) {
  return (
    <>
      <select
        value={selectedCluster}
        onChange={e => setSelectedCluster(e.target.value)}
        className="px-2 py-2 text-sm border rounded bg-white shadow"
      >
        <option value="">Select Cluster</option>
        {clusters.map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <button
        onClick={onAnalyze}
        className="px-3 py-2 text-sm border rounded bg-white shadow"
      >
        ✦ Analyze Cluster
      </button>
    </>
  );
}
