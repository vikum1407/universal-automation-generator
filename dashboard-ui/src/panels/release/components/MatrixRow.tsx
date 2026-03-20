import { useState } from "react";
import type {
  RequirementStability,
  HealingSignal,
} from "@/types/StabilitySnapshot";
import MatrixStatusBadge from "./MatrixStatusBadge";
import MatrixTrendSparkline from "./MatrixTrendSparkline";

export default function MatrixRow({
  requirement,
  healingSignals,
  index,
}: {
  requirement: RequirementStability;
  healingSignals: HealingSignal[];
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const rowBg =
    index % 2 === 0
      ? "bg-white dark:bg-slate-900"
      : "bg-slate-50 dark:bg-slate-900/60";

  const linkedHealing = healingSignals.filter((h) =>
    requirement.linkedTests.includes(h.testId)
  );

  return (
    <div className={`${rowBg} border-b border-slate-200 dark:border-slate-800`}>
      <div className="grid grid-cols-12 gap-3 px-3 py-2 text-xs items-center">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="col-span-1 text-left text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          {expanded ? "−" : "+"}
        </button>

        <div className="col-span-2 font-mono truncate">
          {requirement.requirementId}
        </div>

        <div className="col-span-3 truncate">{requirement.title}</div>

        <div className="col-span-2">
          <MatrixStatusBadge status={requirement.status} />
        </div>

        <div className="col-span-2 flex items-center gap-2">
          <span>{(requirement.passRate * 100).toFixed(1)}%</span>
          <MatrixTrendSparkline passRate={requirement.passRate} />
        </div>

        <div className="col-span-1 text-right">{requirement.recentFailures}</div>

        <div className="col-span-1 text-right">
          {requirement.linkedTests.length}
        </div>
      </div>

      {expanded && (
        <div className="px-6 pb-3 text-xs space-y-3 bg-slate-50/60 dark:bg-slate-900/80">
          <div>
            <div className="font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Linked tests
            </div>
            {requirement.linkedTests.length === 0 && (
              <div className="text-slate-500">No linked tests.</div>
            )}
            <div className="flex flex-wrap gap-2">
              {requirement.linkedTests.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Healing signals
            </div>
            {linkedHealing.length === 0 && (
              <div className="text-slate-500">
                No healing signals for this requirement.
              </div>
            )}
            <div className="space-y-2">
              {linkedHealing.map((h) => (
                <div
                  key={`${h.testId}-${h.failurePattern}`}
                  className="p-2 rounded bg-blue-50 dark:bg-blue-900/30 text-slate-700 dark:text-slate-100"
                >
                  <div className="font-mono text-[11px]">{h.testId}</div>
                  <div className="text-[11px]">{h.failurePattern}</div>
                  <div className="text-[11px] italic">{h.suggestedFix}</div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-1">
                    Confidence: {(h.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
