import type { SuiteDashboard } from "@/types/suite-dashboard";
import { Card } from "@/components/Card";

export default function Leaderboards({
  leaderboards,
}: {
  leaderboards: SuiteDashboard["leaderboards"];
}) {
  return (
    <div className="p-4">
      <Card>
        <h2 className="text-lg font-semibold mb-4">Leaderboards</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LeaderboardTable title="Fastest Runs" rows={leaderboards.fastestRuns} />
          <LeaderboardTable title="Slowest Runs" rows={leaderboards.slowestRuns} />
          <TestStatsTable title="Most Failed Tests" rows={leaderboards.mostFailedTests} />
          <TestStatsTable title="Most Passed Tests" rows={leaderboards.mostPassedTests} />
        </div>
      </Card>
    </div>
  );
}

function LeaderboardTable({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div>
      <h3 className="font-medium mb-2">{title}</h3>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.runId} className="border-b last:border-none">
                <td className="p-2">{r.runId}</td>
                <td className="p-2 text-right">{r.duration} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TestStatsTable({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div>
      <h3 className="font-medium mb-2">{title}</h3>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <tbody>
            {rows.map((r) => (
              <tr key={r.testId} className="border-b last:border-none">
                <td className="p-2">{r.testId}</td>
                <td className="p-2 text-right">Pass: {r.passes}</td>
                <td className="p-2 text-right">Fail: {r.fails}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
