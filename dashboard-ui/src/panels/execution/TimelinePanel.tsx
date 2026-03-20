import { useExecutionData } from "@/hooks/useExecutionData";

export default function TimelinePanel({ project }: { project: string }) {
  const { executions, loading, error } = useExecutionData(project);

  if (loading) return <div>Loading timeline…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      {executions.map((run) => (
        <div
          key={run.runId}
          className="p-4 rounded bg-white dark:bg-slate-800 shadow"
        >
          <div className="font-semibold">{run.runId}</div>
          <div className="text-sm text-gray-500">
            {new Date(run.startedAt).toLocaleString()}
          </div>

          <div className="mt-2 text-sm">
            Passed: {run.passed} | Failed: {run.failed} | Flaky: {run.flaky}
          </div>

          <div className="text-sm">
            Duration: {(run.durationMs / 1000).toFixed(0)}s
          </div>

          <div className="text-sm text-gray-500">
            Env: {run.environment}
          </div>
        </div>
      ))}
    </div>
  );
}
