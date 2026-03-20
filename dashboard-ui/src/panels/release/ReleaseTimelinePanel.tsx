import { useReleaseTimeline } from "../../hooks/useReleaseTimeline";
import { useNavigate } from "react-router-dom";

export default function ReleaseTimelinePanel({ project }: { project: string }) {
  const { timeline, loading, error } = useReleaseTimeline(project);
  const navigate = useNavigate();

  if (loading) return <div>Loading release timeline…</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!timeline || timeline.length === 0)
    return <div>No timeline available.</div>;

  return (
    <div className="p-4 rounded bg-white dark:bg-slate-800 shadow space-y-6">
      <div className="text-lg font-semibold">Release Timeline</div>

      {timeline.map((entry, idx) => {
        const {
          run,
          deltas,
          unstableCount,
          riskyCount,
          becameUnstable,
          becameRisky,
          recovered,
          healingSignals,
        } = entry;

        const prev = idx > 0 ? timeline[idx - 1].run : null;
        const next = idx < timeline.length - 1 ? timeline[idx + 1].run : null;

        return (
          <div
            key={run.runId}
            className="border-l pl-4 space-y-2 pb-4 last:pb-0"
          >
            <div className="font-semibold">
              Run {run.runId} — {new Date(run.startedAt).toLocaleString()}
            </div>

            <div className="text-sm">
              Passed: {run.passed}, Failed: {run.failed}, Flaky: {run.flaky}
            </div>

            {deltas && (
              <div className="text-xs text-gray-500">
                Δ Passed: {deltas.passed}, Δ Failed: {deltas.failed}, Δ Flaky:{" "}
                {deltas.flaky}
              </div>
            )}

            <div className="text-xs text-gray-400">
              Unstable: {unstableCount}, Risky: {riskyCount}
            </div>

            {becameUnstable.length > 0 && (
              <div className="text-xs text-red-500">
                Newly unstable: {becameUnstable.join(", ")}
              </div>
            )}

            {becameRisky.length > 0 && (
              <div className="text-xs text-yellow-500">
                Newly risky: {becameRisky.join(", ")}
              </div>
            )}

            {recovered.length > 0 && (
              <div className="text-xs text-green-500">
                Recovered: {recovered.join(", ")}
              </div>
            )}

            {healingSignals.length > 0 && (
              <div className="text-xs text-green-400">
                Healing signals: {healingSignals.length}
              </div>
            )}

            <div className="flex gap-3 mt-1">
              <button
                onClick={() =>
                  navigate(`/projects/${project}/runs/${run.runId}`)
                }
                className="text-xs text-blue-500 hover:underline"
              >
                View details
              </button>

              {prev && (
                <button
                  onClick={() =>
                    navigate(
                      `/projects/${project}/compare/${prev.runId}/${run.runId}`
                    )
                  }
                  className="text-xs text-blue-500 hover:underline"
                >
                  Compare with previous
                </button>
              )}

              {next && (
                <button
                  onClick={() =>
                    navigate(
                      `/projects/${project}/compare/${run.runId}/${next.runId}`
                    )
                  }
                  className="text-xs text-blue-500 hover:underline"
                >
                  Compare with next
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
