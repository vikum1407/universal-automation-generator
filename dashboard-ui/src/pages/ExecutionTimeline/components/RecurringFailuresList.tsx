import { Card } from "../../../components/Card";
import type { ExecutionInsights } from "../hooks/useExecutionInsights";

type Props = {
  failures: ExecutionInsights["recurringFailures"];
};

export function RecurringFailuresList({ failures }: Props) {
  if (!failures.length) return null;

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-slate-100">
        Recurring Failures
      </h2>
      <div className="space-y-3">
        {failures.map(f => (
          <div
            key={f.testId}
            className="border border-gray-200 dark:border-slate-700 rounded p-3"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-gray-900 dark:text-slate-100">
                {f.testId}
              </span>
              <span className="text-sm text-gray-600 dark:text-slate-300">
                Fails: {f.failCount}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-slate-200">
              Pattern: {f.pattern}
            </p>
            {f.suggestedFix && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Suggested fix: {f.suggestedFix}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
