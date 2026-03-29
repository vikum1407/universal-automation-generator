import type { StabilityLeaderboardItem } from "../../api/types";

export function StabilityLeaderboard({ items }: { items: StabilityLeaderboardItem[] }) {
  if (!items.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Stability Leaderboard</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th>Test</th>
            <th>Stability Index</th>
          </tr>
        </thead>

        <tbody>
          {items.map((i) => (
            <tr key={i.test_id} className="border-b hover:bg-gray-50">
              <td>{i.test_id}</td>
              <td>{i.stability_index}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
