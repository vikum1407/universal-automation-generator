import type { TestRankingItem } from "../../api/types";

export function TestRankingTable({ items }: { items: TestRankingItem[] }) {
  if (!items.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Test Ranking</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th>Test</th>
            <th>Failure Rate</th>
            <th>Flakiness</th>
            <th>Avg Duration</th>
          </tr>
        </thead>

        <tbody>
          {items.map((i) => (
            <tr key={i.test_id} className="border-b hover:bg-gray-50">
              <td>{i.test_id}</td>
              <td>{i.failure_rate}%</td>
              <td>{i.flakiness}%</td>
              <td>{i.avg_duration_ms} ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
