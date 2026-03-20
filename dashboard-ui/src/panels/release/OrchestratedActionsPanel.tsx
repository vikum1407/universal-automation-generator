import { orchestrateFixes } from "@/engine/AutonomousFixOrchestrator";
import type { StabilitySnapshot } from "@/types/StabilitySnapshot";

export default function OrchestratedActionsPanel({
  snapshot,
}: {
  snapshot: StabilitySnapshot;
}) {
  const actions = orchestrateFixes(snapshot);

  return (
    <div className="p-4 bg-white dark:bg-slate-900 shadow rounded space-y-4">
      <div className="text-lg font-semibold">Autonomous Fix Plan</div>

      {actions.length === 0 && (
        <div className="text-sm text-slate-500">
          No automated actions required at this time.
        </div>
      )}

      <ul className="space-y-3 text-sm">
        {actions.map((a, idx) => (
          <li
            key={idx}
            className="p-3 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <div className="font-semibold capitalize">
              {a.type.replace(/-/g, " ")}
            </div>

            <div className="text-slate-600 dark:text-slate-300 mt-1">
              {a.reason}
            </div>

            {"tests" in a && a.tests.length > 0 && (
              <div className="mt-1 text-xs text-slate-500">
                Tests: {a.tests.join(", ")}
              </div>
            )}

            {"testId" in a && (
              <div className="mt-1 text-xs text-slate-500">
                Test: {a.testId}
              </div>
            )}

            {"requirementId" in a && (
              <div className="mt-1 text-xs text-slate-500">
                Requirement: {a.requirementId}
              </div>
            )}

            {"environment" in a && (
              <div className="mt-1 text-xs text-slate-500">
                Environment: {a.environment}
              </div>
            )}

            {"message" in a && (
              <div className="mt-1 text-xs text-slate-500">{a.message}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
