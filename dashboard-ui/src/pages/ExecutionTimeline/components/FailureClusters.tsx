import { Card } from "../../../components/Card";
import type { ExecutionInsights } from "../hooks/useExecutionInsights";

type Props = {
  clusters: ExecutionInsights["clusters"];
};

export function FailureClusters({ clusters }: Props) {
  if (!clusters.length) return null;

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-slate-100">
        Failure Clusters
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clusters.map(c => (
          <div
            key={c.clusterId}
            className="border border-gray-200 dark:border-slate-700 rounded p-3"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-gray-900 dark:text-slate-100">
                {c.label}
              </span>
              <span className="text-sm text-gray-600 dark:text-slate-300">
                {c.count} failures
              </span>
            </div>
            {c.rootCause && (
              <p className="text-sm text-gray-700 dark:text-slate-200 mb-1">
                Root cause: {c.rootCause}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Examples:
            </p>
            <ul className="list-disc list-inside text-xs text-gray-600 dark:text-slate-300">
              {c.examples.map((e, idx) => (
                <li key={idx}>{e}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
