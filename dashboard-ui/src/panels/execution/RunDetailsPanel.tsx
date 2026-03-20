import { useRunDetails } from "../../hooks/useRunDetails";

export default function RunDetailsPanel({
  project,
  runId,
}: {
  project: string;
  runId: string;
}) {
  const { run, healingSignals, loading, error } = useRunDetails(project, runId);

  if (loading) return <div>Loading run details…</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!run) return <div>Run not found.</div>;

  return (
    <div className="p-4 rounded bg-white dark:bg-slate-800 shadow space-y-4">
      <div>
        <div className="text-lg font-semibold">Run {run.runId}</div>
        <div className="text-sm text-gray-500">
          {new Date(run.startedAt).toLocaleString()}
        </div>
        <div className="text-sm">Environment: {run.environment}</div>
        <div className="text-sm">
          Duration: {(run.durationMs / 1000).toFixed(0)}s
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">Summary</div>
        <div className="text-sm">
          Passed: {run.passed} | Failed: {run.failed} | Flaky: {run.flaky}
        </div>
      </div>

      {healingSignals.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Healing Signals</div>
          <ul className="list-disc ml-5 text-sm text-green-500">
            {healingSignals.map((h: any, idx: number) => (
              <li key={idx}>
                {h.summary ??
                  h.message ??
                  h.description ??
                  JSON.stringify(h)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
