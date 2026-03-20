import type { StabilitySnapshot } from "@/types/StabilitySnapshot";

export default function ReleaseSummaryPanel({
  snapshot,
}: {
  snapshot: StabilitySnapshot;
}) {
  const executions = snapshot.executions ?? [];
  const requirements = snapshot.requirements ?? [];
  const healing = snapshot.selfHealing ?? [];

  const totalRuns = executions.length;
  const latest = totalRuns > 0 ? executions[totalRuns - 1] : undefined;

  const totalReq = requirements.length;
  const healingCount = healing.length;

  const readiness =
    typeof snapshot.release === "object"
      ? snapshot.release.readinessScore
      : undefined;
  const risk =
    typeof snapshot.release === "object" ? snapshot.release.riskLevel : undefined;

  return (
    <div className="p-4 bg-white dark:bg-slate-900 shadow rounded">
      <div className="text-lg font-semibold mb-4">Release Summary</div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 rounded bg-slate-50 dark:bg-slate-800">
          <div className="text-sm text-gray-500">Total Runs</div>
          <div className="text-xl font-bold">{totalRuns}</div>
        </div>

        <div className="p-3 rounded bg-slate-50 dark:bg-slate-800">
          <div className="text-sm text-gray-500">Requirements</div>
          <div className="text-xl font-bold">{totalReq}</div>
        </div>

        <div className="p-3 rounded bg-slate-50 dark:bg-slate-800">
          <div className="text-sm text-gray-500">Healing Signals</div>
          <div className="text-xl font-bold text-blue-600">{healingCount}</div>
        </div>

        {latest && (
          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800">
            <div className="text-sm text-gray-500">Latest Run</div>
            <div className="text-xl font-bold">{latest.runId}</div>
          </div>
        )}

        {readiness !== undefined && (
          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800">
            <div className="text-sm text-gray-500">Readiness</div>
            <div className="text-xl font-bold">
              {(readiness * 100).toFixed(1)}%
            </div>
          </div>
        )}

        {risk && (
          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800">
            <div className="text-sm text-gray-500">Risk</div>
            <div className="text-xl font-bold capitalize">{risk}</div>
          </div>
        )}
      </div>
    </div>
  );
}
