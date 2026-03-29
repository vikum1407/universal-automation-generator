import type { PrioritizationItem } from "../../api/types";

export function PrioritizationTable({ items }: { items: PrioritizationItem[] }) {
  if (!items.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Intelligent Prioritization</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th>Test</th>
            <th>Priority Score</th>
            <th>Rationale</th>
          </tr>
        </thead>

        <tbody>
          {items.map((i) => (
            <tr key={i.test_id} className="border-b hover:bg-gray-50">
              <td>{i.test_id}</td>
              <td>{i.priority_score}</td>
              <td className="text-sm whitespace-pre-line">{i.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
