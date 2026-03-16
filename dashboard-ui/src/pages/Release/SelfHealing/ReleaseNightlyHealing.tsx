import { useParams, Link } from "react-router-dom";
import { useNightlyHealingRuns } from "./hooks/useNightlyHealingRuns";

export function ReleaseNightlyHealing() {
  const { project } = useParams();
  const { data, loading, error } = useNightlyHealingRuns(project!);

  if (loading) return <div className="p-4">Loading nightly runs…</div>;
  if (error || !data) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Nightly Autonomous Healing</h2>

      {data.runs.length === 0 && (
        <div className="text-sm text-slate-500">
          No nightly runs have been recorded yet.
        </div>
      )}

      <div className="space-y-4">
        {data.runs.map((run) => {
          const successRate = run.summary.total
            ? run.summary.merged / run.summary.total
            : 0;

          const badgeColor =
            successRate === 1
              ? "bg-green-600"
              : successRate >= 0.5
              ? "bg-yellow-600"
              : "bg-red-600";

          return (
            <div
              key={run.id}
              className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{run.id}</div>
                <span
                  className={`px-2 py-1 text-xs text-white rounded ${badgeColor}`}
                >
                  {successRate === 1
                    ? "Healthy"
                    : successRate >= 0.5
                    ? "Mixed"
                    : "Issues Found"}
                </span>
              </div>

              <div className="text-xs text-slate-500">
                {new Date(run.startedAt).toLocaleString()} →{" "}
                {new Date(run.completedAt).toLocaleString()}
              </div>

              <div className="text-sm">
                <strong>{run.summary.merged}</strong> merged,{" "}
                <strong>{run.summary.failed}</strong> failed,{" "}
                <strong>{run.summary.blocked}</strong> blocked
              </div>

              {run.pipelineId && (
                <Link
                  to={`/release/${project}/self-healing/pipeline/${run.pipelineId}`}
                  className="text-blue-600 underline text-sm"
                >
                  View Pipeline
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
