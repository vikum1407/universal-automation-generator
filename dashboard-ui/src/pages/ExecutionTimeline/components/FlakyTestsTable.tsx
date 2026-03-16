import { Card } from "../../../components/Card";
import type { ExecutionInsights } from "../hooks/useExecutionInsights";

type Props = {
  flakyTests: ExecutionInsights["flakyTests"];
};

export function FlakyTestsTable({ flakyTests }: Props) {
  if (!flakyTests.length) return null;

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-slate-100">
        Flaky Tests
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700 text-left">
              <th className="py-2 pr-4">Test</th>
              <th className="py-2 pr-4">Flakiness</th>
              <th className="py-2 pr-4">Recent Runs</th>
            </tr>
          </thead>
          <tbody>
            {flakyTests.map(t => (
              <tr
                key={t.testId}
                className="border-b border-gray-100 dark:border-slate-800"
              >
                <td className="py-2 pr-4">{t.testId}</td>
                <td className="py-2 pr-4">
                  {(t.flakiness * 100).toFixed(0)}%
                </td>
                <td className="py-2 pr-4">
                  <span className="inline-flex gap-1">
                    {t.runs.map((r, idx) => (
                      <span
                        key={idx}
                        className={
                          r === "pass"
                            ? "px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            : "px-2 py-0.5 rounded text-xs bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300"
                        }
                      >
                        {r}
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
