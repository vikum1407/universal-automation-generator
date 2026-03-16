import { Card } from "../../../components/Card";

export function HeatmapLegend() {
  return (
    <Card>
      <h2 className="text-sm font-semibold mb-2 text-gray-900 dark:text-slate-100">
        Legend
      </h2>
      <div className="flex items-center gap-3 text-xs text-gray-700 dark:text-slate-200">
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-emerald-500" /> Low risk
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-amber-500" /> Medium
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-rose-500" /> High
        </span>
      </div>
    </Card>
  );
}
