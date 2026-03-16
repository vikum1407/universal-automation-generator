import { Card } from "../../../components/Card";
import type { ExecutionCompareResponse } from "../hooks/useExecutionCompare";

type Props = {
  runA: ExecutionCompareResponse["runA"];
  runB: ExecutionCompareResponse["runB"];
};

export function CompareSummaryCards({ runA, runB }: Props) {
  const passDelta = runB.passCount - runA.passCount;
  const failDelta = runB.failCount - runA.failCount;
  const durationDelta = runB.durationMs - runA.durationMs;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-slate-100">
          Pass / Fail
        </h2>
        <p className="text-sm text-gray-700 dark:text-slate-200">
          Run {runA.id}: {runA.passCount} pass / {runA.failCount} fail
        </p>
        <p className="text-sm text-gray-700 dark:text-slate-200">
          Run {runB.id}: {runB.passCount} pass / {runB.failCount} fail
        </p>
        <p className="text-xs mt-2 text-gray-500 dark:text-slate-400">
          Δ Pass: {passDelta >= 0 ? "+" : ""}
          {passDelta}, Δ Fail: {failDelta >= 0 ? "+" : ""}
          {failDelta}
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-slate-100">
          Duration
        </h2>
        <p className="text-sm text-gray-700 dark:text-slate-200">
          Run {runA.id}: {runA.durationMs} ms
        </p>
        <p className="text-sm text-gray-700 dark:text-slate-200">
          Run {runB.id}: {runB.durationMs} ms
        </p>
        <p className="text-xs mt-2 text-gray-500 dark:text-slate-400">
          Δ Duration: {durationDelta >= 0 ? "+" : ""}
          {durationDelta} ms
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-slate-100">
          Risk & Stability
        </h2>
        <p className="text-sm text-gray-700 dark:text-slate-200">
          Run {runA.id}: Risk {runA.riskScore}, Stability {runA.stabilityScore}
        </p>
        <p className="text-sm text-gray-700 dark:text-slate-200">
          Run {runB.id}: Risk {runB.riskScore}, Stability {runB.stabilityScore}
        </p>
      </Card>
    </div>
  );
}
