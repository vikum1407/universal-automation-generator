import { useParams } from "react-router-dom";
import { useSelfHealingPipeline } from "./hooks/useSelfHealingPipeline";
import { PRStatusBlock } from "../../../components/ui/PRStatusBlock";

export function ReleaseSelfHealingPipeline() {
  const { project, pipelineId } = useParams();
  const { pipeline, loading, error } = useSelfHealingPipeline(
    project!,
    pipelineId!
  );

  if (loading) return <div className="p-4">Loading pipeline…</div>;
  if (error || !pipeline)
    return <div className="p-4 text-red-500">{error}</div>;

  const modeColor =
    pipeline.mode === "parallel"
      ? "bg-green-600"
      : pipeline.mode === "sequential"
      ? "bg-blue-600"
      : "bg-purple-600";

  const statusColor =
    pipeline.status === "running"
      ? "bg-yellow-600"
      : pipeline.status === "completed"
      ? "bg-green-600"
      : pipeline.status === "failed"
      ? "bg-red-600"
      : "bg-orange-600";

  return (
    <div className="p-6 space-y-8">
      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="text-xl font-semibold">Self‑Healing Pipeline</h2>

        <div className="flex items-center gap-4">
          <span className={`px-2 py-1 text-xs text-white rounded ${modeColor}`}>
            {pipeline.mode.toUpperCase()}
          </span>

          <span
            className={`px-2 py-1 text-xs text-white rounded ${statusColor}`}
          >
            {pipeline.status.toUpperCase()}
          </span>
        </div>

        <div className="text-sm text-slate-600">
          Pipeline ID: {pipeline.pipelineId}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {pipeline.steps.map((step) => (
          <div
            key={step.suggestionId}
            className="border rounded-lg p-4 space-y-3 bg-slate-50 dark:bg-slate-800"
          >
            <div className="text-sm font-medium">
              Suggestion #{step.suggestionId}
            </div>

            {/* PR Status */}
            {step.prUrl ? (
              <PRStatusBlock
                pr={{
                  prUrl: step.prUrl,
                  status: step.status === "open"
                    ? "open"
                    : step.status === "merged"
                    ? "merged"
                    : "closed",
                  branch: `qlitz/self-healing/${step.suggestionId}`,
                  commit: "—"
                }}
              />
            ) : (
              <div className="text-sm text-slate-500">
                Waiting for PR creation…
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
