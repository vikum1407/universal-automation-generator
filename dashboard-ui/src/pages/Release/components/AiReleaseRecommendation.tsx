import { Card } from "../../../components/Card";

const severityColors: Record<string, string> = {
  high: "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300",
  medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
};

type Props = {
  status: string;
  detail: string;
  severity: string;
};

export function AiReleaseRecommendation({ status, detail, severity }: Props) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-slate-100">
        AI Release Recommendation
      </h2>

      <span
        className={`px-3 py-1 rounded text-sm font-medium ${
          severityColors[severity] ?? severityColors.medium
        }`}
      >
        {status.toUpperCase()}
      </span>

      <p className="text-sm text-gray-700 dark:text-slate-200 mt-3">
        {detail}
      </p>
    </Card>
  );
}
