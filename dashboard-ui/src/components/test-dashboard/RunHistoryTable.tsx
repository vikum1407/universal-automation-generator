import type { TestDashboard } from "@/types/test-dashboard";
import { Card } from "@/components/Card";
import { RiskBadge } from "@/components/RiskBadge";

export function RunHistoryTable({ runs }: { runs: TestDashboard["runs"] }) {
  return (
    <div className="p-4">
      <Card>
        <h2 className="text-lg font-semibold mb-4">Run History</h2>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left">Run ID</th>
                <th className="p-2 text-left">Started</th>
                <th className="p-2 text-right">Duration</th>
                <th className="p-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.runId} className="border-t">
                  <td className="p-2">{r.runId}</td>
                  <td className="p-2 text-xs text-gray-500">{r.startedAt}</td>
                  <td className="p-2 text-right">
                    {r.durationMs != null ? `${r.durationMs} ms` : "—"}
                  </td>
                  <td className="p-2 text-right">
                    <RiskBadge
                      priority={
                        r.status === "failed"
                          ? "P0"
                          : r.status === "running"
                          ? "P1"
                          : "P2"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
