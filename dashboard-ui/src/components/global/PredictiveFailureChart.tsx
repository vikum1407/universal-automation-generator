import type { PredictiveFailurePoint } from "../../api/types";

export function PredictiveFailureChart({ points }: { points: PredictiveFailurePoint[] }) {
  if (!points.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Predictive Failure Modeling</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th>Test</th>
            <th>Failure Probability</th>
          </tr>
        </thead>

        <tbody>
          {points.map((p) => (
            <tr key={p.test_id} className="border-b hover:bg-gray-50">
              <td>{p.test_id}</td>
              <td>{p.probability}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
