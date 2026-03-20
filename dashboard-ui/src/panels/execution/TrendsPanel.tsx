import { useExecutionTrends } from "../../hooks/useExecutionTrends";

export default function TrendsPanel({ project }: { project: string }) {
  const { trendPoints, loading, error } = useExecutionTrends(project);

  if (loading) return <div>Loading trends…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      {trendPoints.map((p) => (
        <div
          key={p.timestamp}
          className="p-4 rounded bg-white dark:bg-slate-800 shadow"
        >
          <div className="font-semibold">
            {new Date(p.timestamp).toLocaleString()}
          </div>

          <div className="text-sm mt-1">
            Pass rate: {(p.passRate * 100).toFixed(1)}%
          </div>

          <div className="text-sm">Failures: {p.failures}</div>
          <div className="text-sm">Flaky: {p.flaky}</div>
          <div className="text-sm">
            Duration: {(p.durationMs / 1000).toFixed(0)}s
          </div>
        </div>
      ))}
    </div>
  );
}
