import { useExecutionInsights } from "../../hooks/useExecutionInsights";

export default function InsightsPanel({ project }: { project: string }) {
  const { insights, loading, error } = useExecutionInsights(project);

  if (loading) return <div>Loading insights…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-3">
      {insights.map((i) => (
        <div
          key={i.label}
          className="p-4 rounded bg-white dark:bg-slate-800 shadow"
        >
          <div className="font-semibold">{i.label}</div>
          <div className="text-sm text-gray-500">{i.value}</div>
        </div>
      ))}

      {insights.length === 0 && (
        <div className="text-gray-500 text-sm">No insights available.</div>
      )}
    </div>
  );
}
