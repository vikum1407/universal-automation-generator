import type {
  RequirementStability,
  HealingSignal,
  ExecutionSummary,
} from "@/types/StabilitySnapshot";

export default function RequirementDetailsDrawer({
  requirement,
  healingSignals,
  executions,
  onClose,
}: {
  requirement: RequirementStability | null;
  healingSignals: HealingSignal[];
  executions: ExecutionSummary[];
  onClose: () => void;
}) {
  if (!requirement) return null;

  const linkedHealing = healingSignals.filter((h) =>
    requirement.linkedTests.includes(h.testId)
  );

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30">
      <div className="w-[420px] h-full bg-white dark:bg-slate-900 shadow-xl p-6 overflow-y-auto">
        <button
          onClick={onClose}
          className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-4"
        >
          Close
        </button>

        <div className="space-y-6">
          <div>
            <div className="text-lg font-semibold mb-1">
              {requirement.requirementId}
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              {requirement.title}
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              Stability
            </div>
            <div className="text-sm">
              Status: {requirement.status}
              <br />
              Pass rate: {(requirement.passRate * 100).toFixed(1)}%
              <br />
              Recent failures: {requirement.recentFailures}
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              Linked tests
            </div>
            {requirement.linkedTests.length === 0 && (
              <div className="text-slate-500 text-sm">No linked tests.</div>
            )}
            <div className="flex flex-wrap gap-2">
              {requirement.linkedTests.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              Healing signals
            </div>
            {linkedHealing.length === 0 && (
              <div className="text-slate-500 text-sm">
                No healing signals for this requirement.
              </div>
            )}
            <div className="space-y-2">
              {linkedHealing.map((h) => (
                <div
                  key={`${h.testId}-${h.failurePattern}`}
                  className="p-2 rounded bg-blue-50 dark:bg-blue-900/30 text-slate-700 dark:text-slate-100 text-xs"
                >
                  <div className="font-mono">{h.testId}</div>
                  <div>{h.failurePattern}</div>
                  <div className="italic">{h.suggestedFix}</div>
                  <div className="text-blue-700 dark:text-blue-300 mt-1">
                    Confidence: {(h.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-slate-700 dark:text-slate-200">
              Execution timeline
            </div>
            <div className="space-y-1 text-xs">
              {executions.map((e) => (
                <div
                  key={e.runId}
                  className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1"
                >
                  <span className="font-mono">{e.runId}</span>
                  <span>{new Date(e.startedAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
