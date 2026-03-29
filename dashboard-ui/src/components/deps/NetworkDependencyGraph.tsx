import type { NetworkDependency } from "../../api/types";

export function NetworkDependencyGraph({ deps }: { deps: NetworkDependency[] }) {
  if (!deps.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Network Dependencies</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th>URL</th>
            <th>Method</th>
            <th>Count</th>
          </tr>
        </thead>

        <tbody>
          {deps.map((d, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td>{d.url}</td>
              <td>{d.method}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
