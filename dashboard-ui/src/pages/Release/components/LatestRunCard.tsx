import { Card } from "../../../components/Card";

type Props = {
  id: string;
  passCount: number;
  failCount: number;
  durationMs: number;
  newFailures: string[];
  fixedTests: string[];
  highRiskJourneys: string[];
};

export function LatestRunCard({
  id,
  passCount,
  failCount,
  durationMs,
  newFailures,
  fixedTests,
  highRiskJourneys
}: Props) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-slate-100">
        Latest Run ({id})
      </h2>

      <p className="text-sm text-gray-700 dark:text-slate-200">
        {passCount} passed / {failCount} failed
      </p>
      <p className="text-sm text-gray-700 dark:text-slate-200 mb-3">
        Duration: {durationMs} ms
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="font-semibold text-rose-600 dark:text-rose-400">
            New Failures
          </p>
          <ul className="list-disc list-inside">
            {newFailures.map(f => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
            Fixed Tests
          </p>
          <ul className="list-disc list-inside">
            {fixedTests.map(f => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-semibold text-amber-600 dark:text-amber-400">
            High Risk Journeys
          </p>
          <ul className="list-disc list-inside">
            {highRiskJourneys.map(j => (
              <li key={j}>{j}</li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
