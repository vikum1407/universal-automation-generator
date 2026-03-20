import type { StabilitySnapshot } from "@/types/StabilitySnapshot";

export default function PredictiveStabilityPanel({
  snapshot,
}: {
  snapshot: StabilitySnapshot;
}) {
  const requirements = snapshot.requirements ?? [];
  const healing = snapshot.selfHealing ?? [];
  const executions = snapshot.executions ?? [];

  const stable = requirements.filter((r) => r.status === "stable").length;
  const unstable = requirements.filter((r) => r.status === "unstable").length;
  const risky = requirements.filter((r) => r.status === "risky").length;

  const latest = executions.length > 0 ? executions[executions.length - 1] : null;
  const previous = executions.length > 1 ? executions[executions.length - 2] : null;

  const failureMomentum =
    latest && previous
      ? latest.failed + latest.flaky - (previous.failed + previous.flaky)
      : 0;

  const passRateTrend =
    latest && previous
      ? latest.passed / (latest.passed + latest.failed + latest.flaky) -
        previous.passed / (previous.passed + previous.failed + previous.flaky)
      : 0;

  const healingDensity = healing.length / Math.max(requirements.length, 1);

  const base =
    stable / Math.max(requirements.length, 1) -
    risky * 0.15 -
    unstable * 0.05;

  const momentumAdjustment = -failureMomentum * 0.02;
  const passRateAdjustment = passRateTrend * 0.5;
  const healingAdjustment = healingDensity * 0.1;

  const projected =
    base + momentumAdjustment + passRateAdjustment + healingAdjustment;

  const projectedClamped = Math.max(0, Math.min(1, projected));

  return (
    <div className="p-4 bg-white dark:bg-slate-900 shadow rounded space-y-4">
      <div className="text-lg font-semibold">Predictive Stability</div>

      <div className="text-3xl font-bold">
        {(projectedClamped * 100).toFixed(1)}%
      </div>

      <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
        <p>
          This projection estimates the likelihood that the next run will be
          stable based on current requirement distribution, recent execution
          trends, and healing activity.
        </p>

        <p>
          Stability is influenced by <strong>{stable}</strong> stable
          requirements, <strong>{unstable}</strong> unstable ones, and{" "}
          <strong>{risky}</strong> marked as risky.
        </p>

        {latest && previous && (
          <p>
            Recent runs show{" "}
            {failureMomentum > 0
              ? `an increase of ${failureMomentum} failures`
              : failureMomentum < 0
              ? `a decrease of ${Math.abs(failureMomentum)} failures`
              : "no change in failures"}
            , and the pass rate trend is{" "}
            {passRateTrend > 0
              ? "improving"
              : passRateTrend < 0
              ? "declining"
              : "flat"}.
          </p>
        )}

        <p>
          Healing activity includes <strong>{healing.length}</strong> signals,
          contributing to early detection of recurring issues.
        </p>
      </div>
    </div>
  );
}
