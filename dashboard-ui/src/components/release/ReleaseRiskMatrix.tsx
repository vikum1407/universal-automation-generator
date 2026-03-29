import type { ReleaseRiskItem } from "../../api/types";

export function ReleaseRiskMatrix({ items }: { items: ReleaseRiskItem[] }) {
  if (!items.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Risk Matrix</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th>Category</th>
            <th>Likelihood</th>
            <th>Impact</th>
          </tr>
        </thead>

        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-b hover:bg-gray-50">
              <td>{r.category}</td>
              <td>{r.likelihood}</td>
              <td>{r.impact}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
