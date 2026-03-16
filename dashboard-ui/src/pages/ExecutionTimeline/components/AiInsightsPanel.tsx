import { Card } from "../../../components/Card";
import type { ExecutionInsights } from "../hooks/useExecutionInsights";

type Props = {
  insights: ExecutionInsights["aiInsights"];
};

const severityColors: Record<string, string> = {
  high: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
};

export function AiInsightsPanel({ insights }: Props) {
  if (!insights.length) return null;

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-slate-100">
        AI Insights
      </h2>
      <div className="space-y-3">
        {insights.map((i, idx) => (
          <div
            key={idx}
            className="border border-gray-200 dark:border-slate-700 rounded p-3"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-gray-900 dark:text-slate-100">
                {i.title}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  severityColors[i.severity] ?? severityColors.medium
                }`}
              >
                {i.severity.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-slate-200">
              {i.detail}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
