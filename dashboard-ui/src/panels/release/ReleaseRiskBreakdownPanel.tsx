import type { StabilitySnapshot } from "@/types/StabilitySnapshot";

export default function ReleaseRiskBreakdownPanel({
  snapshot,
}: {
  snapshot: StabilitySnapshot;
}) {
  const requirements = snapshot.requirements ?? [];
  const executions = snapshot.executions ?? [];

  const stable = requirements.filter((r) => r.status === "stable");
  const unstable = requirements.filter((r) => r.status === "unstable");
  const risky = requirements.filter((r) => r.status === "risky");

  const latest = executions.length > 0 ? executions[executions.length - 1] : null;
  const previous = executions.length > 1 ? executions[executions.length - 2] : null;

  const riskTrend =
    latest && previous
      ? latest.failed + latest.flaky - (previous.failed + previous.flaky)
      : null;

  const topRisk = [...risky]
    .sort((a, b) => b.recentFailures - a.recentFailures)
    .slice(0, 5);

  return (
    <div className="p-4 bg-white dark:bg-slate-900 shadow rounded space-y-4">
      <div className="text-lg font-semibold">Risk Breakdown</div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 rounded bg-slate-50 dark:bg-slate-800">
          <div className="text-sm text-slate-500">Stable</div>
          <div className="text-xl font-bold text-green-600">{stable.length}</div>
        </div>

        <div className="p-3 rounded bg-slate-50 dark:bg-slate-800">
          <div className="text-sm text-slate-500">Unstable</div>
          <div className="text-xl font-bold text-yellow-600">{unstable.length}</div>
        </div>

        <div className="p-3 rounded bg-slate-50 dark:bg-slate-800">
          <div className="text-sm text-slate-500">Risky</div>
          <div className="text-xl font-bold text-red-600">{risky.length}</div>
        </div>
      </div>

      {riskTrend !== null && (
        <div className="text-sm text-slate-700 dark:text-slate-300">
          Risk trend:{" "}
          <span
            className={
              riskTrend > 0
                ? "text-red-600"
                : riskTrend < 0
                ? "text-green-600"
                : "text-slate-500"
            }
          >
            {riskTrend > 0
              ? `Increasing (+${riskTrend})`
              : riskTrend < 0
              ? `Decreasing (${riskTrend})`
              : "No change"}
          </span>
        </div>
      )}

      <div>
        <div className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
          Top risky requirements
        </div>
        {topRisk.length === 0 && (
          <div className="text-sm text-slate-500">No risky requirements.</div>
        )}
        <div className="space-y-2">
          {topRisk.map((r) => (
            <div
              key={r.requirementId}
              className="p-2 rounded bg-red-50 dark:bg-red-900/30 text-slate-700 dark:text-slate-100 text-sm"
            >
              <div className="font-mono">{r.requirementId}</div>
              <div>{r.title}</div>
              <div className="text-xs mt-1">
                Recent failures: {r.recentFailures} · Pass rate:{" "}
                {(r.passRate * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
