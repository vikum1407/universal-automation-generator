import { Card } from "../../../components/Card";
import type { ExecutionCompareResponse } from "../hooks/useExecutionCompare";

type Props = {
  journeys: ExecutionCompareResponse["journeyDiff"];
};

export function JourneyDiffTable({ journeys }: Props) {
  if (!journeys.length) return null;

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-slate-100">
        Journey Differences
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700 text-left">
              <th className="py-2 pr-4">Journey</th>
              <th className="py-2 pr-4">Run A Duration (ms)</th>
              <th className="py-2 pr-4">Run B Duration (ms)</th>
              <th className="py-2 pr-4">Run A Status</th>
              <th className="py-2 pr-4">Run B Status</th>
            </tr>
          </thead>
          <tbody>
            {journeys.map(j => (
              <tr
                key={j.journeyId}
                className="border-b border-gray-100 dark:border-slate-800"
              >
                <td className="py-2 pr-4">{j.journeyId}</td>
                <td className="py-2 pr-4">{j.durationA}</td>
                <td className="py-2 pr-4">{j.durationB}</td>
                <td className="py-2 pr-4 capitalize">{j.statusA}</td>
                <td className="py-2 pr-4 capitalize">{j.statusB}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
