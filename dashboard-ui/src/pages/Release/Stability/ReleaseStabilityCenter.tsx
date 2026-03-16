import { useParams, Link } from "react-router-dom";
import { useStabilityGuardrails } from "./hooks/useStabilityGuardrails";
import { useStabilityScore } from "./hooks/useStabilityScore";
import { useReleaseReadiness } from "./hooks/useReleaseReadiness";

export function ReleaseStabilityCenter() {
  const { project } = useParams();

  const {
    data: guardrails,
    loading: guardrailsLoading,
    error: guardrailsError
  } = useStabilityGuardrails(project!);

  const {
    data: score,
    loading: scoreLoading,
    error: scoreError
  } = useStabilityScore(project!);

  const {
    data: readiness,
    loading: readinessLoading,
    error: readinessError
  } = useReleaseReadiness(project!);

  const loading = guardrailsLoading || scoreLoading || readinessLoading;
  const error = guardrailsError || scoreError || readinessError;

  if (loading) return <div className="p-4">Loading Stability Center…</div>;
  if (error || !guardrails || !score || !readiness) {
    return <div className="p-4 text-red-500">{error || "Failed to load stability data."}</div>;
  }

  const readinessColor =
    readiness.status === "safe"
      ? "bg-green-600"
      : readiness.status === "risky"
      ? "bg-yellow-600"
      : "bg-red-600";

  const gradeColor =
    score.grade === "A"
      ? "bg-green-600"
      : score.grade === "B"
      ? "bg-blue-600"
      : score.grade === "C"
      ? "bg-yellow-600"
      : score.grade === "D"
      ? "bg-orange-600"
      : "bg-red-600";

  const criticalCount = guardrails.violations.length;
  const warningCount = guardrails.warnings.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header + readiness verdict */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stability Center</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            A unified view of release stability, guardrails, and recommended actions.
          </p>
        </div>
        <span
          className={`px-3 py-1 text-white text-lg rounded ${readinessColor}`}
        >
          {readiness.status.toUpperCase()}
        </span>
      </div>

      {/* Stability score + quick metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800 space-y-2">
          <div className="text-sm font-medium">Stability Score</div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">
              {(score.score * 100).toFixed(0)}%
            </div>
            <span
              className={`px-2 py-1 text-white text-sm rounded ${gradeColor}`}
            >
              {score.grade}
            </span>
          </div>
          <Link
            to={`/release/${project}/stability/score`}
            className="text-xs text-blue-600 underline"
          >
            View score breakdown
          </Link>
        </div>

        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800 space-y-2">
          <div className="text-sm font-medium">Guardrails</div>
          <div className="text-sm">
            <span className="font-semibold">{criticalCount}</span> critical
            violations,{" "}
            <span className="font-semibold">{warningCount}</span> warnings
          </div>
          {(guardrails.violations[0] || guardrails.warnings[0]) && (
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {(guardrails.violations[0] || guardrails.warnings[0]).message}
            </div>
          )}
          <Link
            to={`/release/${project}/stability/guardrails`}
            className="text-xs text-blue-600 underline"
          >
            View all guardrails
          </Link>
        </div>

        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-800 space-y-3">
          <div className="text-sm font-medium">Autonomous Stabilization</div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            If this release is risky or blocked, Qlitz can run targeted healing
            pipelines to stabilize it.
          </p>
          {readiness.status !== "safe" ? (
            <Link
              to={`/release/${project}/stability/stabilization`}
              className="inline-block px-3 py-2 bg-blue-600 text-white text-xs rounded"
            >
              Run Autonomous Stabilization
            </Link>
          ) : (
            <span className="text-xs text-green-700">
              Release is safe. No stabilization required.
            </span>
          )}
        </div>
      </div>

      {/* Reasons + recommended actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Why this release is {readiness.status}</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
            {readiness.reasons.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Recommended next actions</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
            {readiness.recommendations.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Deep links */}
      <div className="border-t pt-4 text-xs text-slate-600 dark:text-slate-300 space-x-4">
        <Link
          to={`/release/${project}/self-healing/insights`}
          className="text-blue-600 underline"
        >
          Healing Insights
        </Link>
        <Link
          to={`/release/${project}/self-healing/recommendations`}
          className="text-blue-600 underline"
        >
          Stability Recommendations
        </Link>
        <Link
          to={`/release/${project}/self-healing/nightly`}
          className="text-blue-600 underline"
        >
          Nightly Healing
        </Link>
        <Link
          to={`/release/${project}/stability/readiness`}
          className="text-blue-600 underline"
        >
          Detailed Readiness
        </Link>
      </div>
    </div>
  );
}
