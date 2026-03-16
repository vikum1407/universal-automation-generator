import { Card } from "../../../components/Card";
import type { EvolutionTrends } from "../hooks/useReleaseEvolution";

type Props = {
  trends: EvolutionTrends;
};

const trendColor: Record<string, string> = {
  improving: "text-emerald-600 dark:text-emerald-400",
  worsening: "text-rose-600 dark:text-rose-400",
  stable: "text-slate-600 dark:text-slate-300"
};

export function EvolutionTrendsCard({ trends }: Props) {
  const items = [
    { label: "Pass rate", value: trends.passRate },
    { label: "Failure rate", value: trends.failureRate },
    { label: "Duration", value: trends.duration },
    { label: "Stability", value: trends.stability }
  ];

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-slate-100">
        Evolution Trends (last runs)
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {items.map(item => (
          <div key={item.label}>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {item.label}
            </p>
            <p className={`text-base font-semibold ${trendColor[item.value]}`}>
              {item.value.charAt(0).toUpperCase() + item.value.slice(1)}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}
