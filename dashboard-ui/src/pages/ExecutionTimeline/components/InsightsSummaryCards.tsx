import { Card } from "../../../components/Card";

type Props = {
  riskScore: number;
  stabilityScore: number;
  coverageScore: number;
  highlights: string[];
};

export function InsightsSummaryCards({
  riskScore,
  stabilityScore,
  coverageScore,
  highlights
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-slate-100">
          Risk Score
        </h2>
        <p className="text-3xl font-bold">{riskScore}</p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Higher means more risk in current runs.
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-slate-100">
          Stability Score
        </h2>
        <p className="text-3xl font-bold">{stabilityScore}</p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Higher means more stable executions.
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-slate-100">
          Coverage Score
        </h2>
        <p className="text-3xl font-bold">{coverageScore}</p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Approximate functional coverage of key journeys.
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-slate-100">
          Highlights
        </h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-slate-200">
          {highlights.map((h, idx) => (
            <li key={idx}>{h}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
