import { Card } from "../../../components/Card";

type Props = {
  readinessScore: number;
  riskScore: number;
  stabilityScore: number;
  coverageScore: number;
  aiSummary: string;
};

export function ReleaseSummaryCard({
  readinessScore,
  riskScore,
  stabilityScore,
  coverageScore,
  aiSummary
}: Props) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-slate-100">
        Release Summary
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">Readiness</p>
          <p className="text-3xl font-bold">{readinessScore}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">Risk</p>
          <p className="text-3xl font-bold">{riskScore}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">Stability</p>
          <p className="text-3xl font-bold">{stabilityScore}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-400">Coverage</p>
          <p className="text-3xl font-bold">{coverageScore}</p>
        </div>
      </div>

      <p className="text-sm text-gray-700 dark:text-slate-200">{aiSummary}</p>
    </Card>
  );
}
