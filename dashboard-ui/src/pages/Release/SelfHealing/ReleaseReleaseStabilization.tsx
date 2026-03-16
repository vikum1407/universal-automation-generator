import { useParams, Link } from "react-router-dom";
import { useReleaseStabilization } from "./hooks/useReleaseStabilization";

export function ReleaseReleaseStabilization() {
  const { project, stabilizationId } = useParams();
  const { data, loading, error } = useReleaseStabilization(project!, stabilizationId!);

  if (loading) return <div className="p-4">Running autonomous stabilization…</div>;
  if (error || !data) return <div className="p-4 text-red-500">{error}</div>;

  const statusColor =
    data.status === "completed"
      ? "bg-green-600"
      : data.status === "running"
      ? "bg-blue-600"
      : "bg-red-600";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Autonomous Release Stabilization</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Qlitz is running targeted healing actions to stabilize this release.
          </p>
        </div>
        <span className={`px-3 py-1 text-white text-lg rounded ${statusColor}`}>
          {data.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-4">
        {data.actions.map((action, idx) => (
          <div
            key={idx}
            className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800"
          >
            <div className="text-sm font-medium">{action.description}</div>
            {action.pipelineId && (
              <Link
                to={`/release/${project}/self-healing/pipeline/${action.pipelineId}`}
                className="text-blue-600 underline text-xs"
              >
                View Pipeline
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
