import type { ProjectFailureModelPoint } from "../../api/types";

export function ProjectFailureModelTable({ items }: { items: ProjectFailureModelPoint[] }) {
  if (!items.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Project Failure Model</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th>Test</th>
            <th>Failure Probability</th>
          </tr>
        </thead>

        <tbody>
          {items.map((i) => (
            <tr key={i.test_id} className="border-b hover:bg-gray-50">
              <td>{i.test_id}</td>
              <td>{i.probability}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
