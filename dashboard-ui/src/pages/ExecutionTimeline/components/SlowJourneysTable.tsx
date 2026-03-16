import { Card } from "../../../components/Card";
import type { ExecutionInsights } from "../hooks/useExecutionInsights";

type Props = {
  journeys: ExecutionInsights["slowestJourneys"];
};

export function SlowJourneysTable({ journeys }: Props) {
  if (!journeys.length) return null;

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-slate-100">
        Slowest Journeys
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700 text-left">
              <th className="py-2 pr-4">Journey</th>
              <th className="py-2 pr-4">Avg Duration (ms)</th>
              <th className="py-2 pr-4">Trend</th>
            </tr>
          </thead>
          <tbody>
            {journeys.map(j => (
              <tr
                key={j.journeyId}
                className="border-b border-gray-100 dark:border-slate-800"
              >
                <td className="py-2 pr-4">{j.journeyId}</td>
                <td className="py-2 pr-4">{j.avgDurationMs}</td>
                <td className="py-2 pr-4 capitalize">{j.trend}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
