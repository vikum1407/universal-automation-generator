import type { FailureCluster } from "../../api/types";

export function FailureClusterView({ clusters }: { clusters: FailureCluster[] }) {
  if (!clusters.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Failure Clusters</h2>

      <div className="space-y-4">
        {clusters.map((c) => (
          <div key={c.cluster_id} className="p-3 border rounded bg-white shadow-sm">
            <div className="font-semibold">
              Cluster {c.cluster_id} • {c.count} failures
            </div>

            <pre className="bg-gray-100 p-2 rounded text-sm mt-2">
              {c.signature}
            </pre>

            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Examples</summary>
              <ul className="list-disc ml-6 mt-2 text-sm">
                {c.examples.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </div>
    </section>
  );
}
