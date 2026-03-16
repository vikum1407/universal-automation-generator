import { useParams } from "react-router-dom";
import { useStabilityScore } from "./hooks/useStabilityScore";

export function ReleaseStabilityScore() {
  const { project } = useParams();
  const { data, loading, error } = useStabilityScore(project!);

  if (loading) return <div className="p-4">Loading stability score…</div>;
  if (error || !data) return <div className="p-4 text-red-500">{error}</div>;

  const gradeColor =
    data.grade === "A"
      ? "bg-green-600"
      : data.grade === "B"
      ? "bg-blue-600"
      : data.grade === "C"
      ? "bg-yellow-600"
      : data.grade === "D"
      ? "bg-orange-600"
      : "bg-red-600";

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Stability Score</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        A unified measure of system stability based on flakiness, risk,
        healing effectiveness, and guardrail compliance.
      </p>

      <div className="flex items-center gap-4">
        <div className="text-5xl font-bold">{(data.score * 100).toFixed(0)}%</div>
        <span
          className={`px-3 py-1 text-white text-lg rounded ${gradeColor}`}
        >
          {data.grade}
        </span>
      </div>

      <div className="space-y-4">
        {data.factors.map((f, idx) => (
          <div
            key={idx}
            className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{f.label}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {(f.value * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Weight: {(f.weight * 100).toFixed(0)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
