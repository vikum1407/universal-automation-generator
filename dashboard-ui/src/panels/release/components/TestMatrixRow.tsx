import type { TestStability, HealingSignal } from "@/types/StabilitySnapshot";
import MatrixStatusBadge from "./MatrixStatusBadge";
import MatrixTrendSparkline from "./MatrixTrendSparkline";

export default function TestMatrixRow({
  test,
  healingSignals,
  index,
}: {
  test: TestStability;
  healingSignals: HealingSignal[];
  index: number;
}) {
  const rowBg =
    index % 2 === 0
      ? "bg-white dark:bg-slate-900"
      : "bg-slate-50 dark:bg-slate-900/60";

  const linkedHealing = healingSignals.filter((h) => h.testId === test.testId);

  return (
    <div className={`${rowBg} border-b border-slate-200 dark:border-slate-800`}>
      <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs items-center">
        <div className="col-span-3 font-mono truncate">{test.testId}</div>

        <div className="col-span-3 truncate">{test.title}</div>

        <div className="col-span-2">
          <MatrixStatusBadge status={test.status} />
        </div>

        <div className="col-span-2 flex items-center gap-2">
          <span>{(test.passRate * 100).toFixed(1)}%</span>
          <MatrixTrendSparkline passRate={test.passRate} />
        </div>

        <div className="col-span-1 text-right">{test.recentFailures}</div>

        <div className="col-span-1 text-right">
          {linkedHealing.length > 0 ? linkedHealing.length : "–"}
        </div>
      </div>
    </div>
  );
}
