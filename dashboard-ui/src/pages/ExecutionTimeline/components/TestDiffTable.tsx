import { Card } from "../../../components/Card";
import type { ExecutionCompareResponse } from "../hooks/useExecutionCompare";

type Props = {
  diff: ExecutionCompareResponse["testDiff"];
};

export function TestDiffTable({ diff }: Props) {
  const hasAny =
    diff.fixed.length ||
    diff.regressed.length ||
    diff.newFailures.length ||
    diff.newPasses.length;

  if (!hasAny) return null;

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-slate-100">
        Test Changes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h3 className="font-semibold mb-1 text-emerald-700 dark:text-emerald-300">
            Fixed Tests
          </h3>
          {diff.fixed.length ? (
            <ul className="list-disc list-inside text-gray-700 dark:text-slate-200">
              {diff.fixed.map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-slate-400 text-xs">
              No fixed tests.
            </p>
          )}

          <h3 className="font-semibold mt-4 mb-1 text-emerald-700 dark:text-emerald-300">
            New Passes
          </h3>
          {diff.newPasses.length ? (
            <ul className="list-disc list-inside text-gray-700 dark:text-slate-200">
              {diff.newPasses.map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-slate-400 text-xs">
              No new passes.
            </p>
          )}
        </div>

        <div>
          <h3 className="font-semibold mb-1 text-rose-700 dark:text-rose-300">
            Regressed Tests
          </h3>
          {diff.regressed.length ? (
            <ul className="list-disc list-inside text-gray-700 dark:text-slate-200">
              {diff.regressed.map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-slate-400 text-xs">
              No regressions.
            </p>
          )}

          <h3 className="font-semibold mt-4 mb-1 text-rose-700 dark:text-rose-300">
            New Failures
          </h3>
          {diff.newFailures.length ? (
            <ul className="list-disc list-inside text-gray-700 dark:text-slate-200">
              {diff.newFailures.map(t => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-slate-400 text-xs">
              No new failures.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
