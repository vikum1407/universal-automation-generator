import type { StabilitySnapshot } from "@/types/StabilitySnapshot";

export default function ReleaseIntelligenceSummary({
  snapshot,
}: {
  snapshot: StabilitySnapshot;
}) {
  const requirements = snapshot.requirements ?? [];
  const healing = snapshot.selfHealing ?? [];
  const executions = snapshot.executions ?? [];

  const unstable = requirements.filter((r) => r.status !== "stable");
  const risky = requirements.filter((r) => r.status === "risky");

  const latest = executions.length > 0 ? executions[executions.length - 1] : null;

  const readiness =
    typeof snapshot.release === "object"
      ? snapshot.release.readinessScore
      : undefined;

  const riskLevel =
    typeof snapshot.release === "object"
      ? snapshot.release.riskLevel
      : undefined;

  return (
    <div className="p-4 bg-white dark:bg-slate-900 shadow rounded space-y-3">
      <div className="text-lg font-semibold">Release Intelligence Summary</div>

      <div className="text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
        <p>
          The release currently shows{" "}
          <strong>{unstable.length}</strong> unstable requirements, including{" "}
          <strong>{risky.length}</strong> marked as risky. This indicates that
          several areas may still need attention before the release can be
          considered fully stable.
        </p>

        {latest && (
          <p>
            The latest run (<span className="font-mono">{latest.runId}</span>)
            completed with <strong>{latest.failed}</strong> failures and{" "}
            <strong>{latest.flaky}</strong> flaky tests. These results suggest
            that stability is still fluctuating and may require additional
            investigation.
          </p>
        )}

        <p>
          A total of <strong>{healing.length}</strong> healing signals were
          detected. These signals highlight patterns in recurring failures and
          provide suggestions that could help improve stability.
        </p>

        {readiness !== undefined && (
          <p>
            The overall readiness score is{" "}
            <strong>{(readiness * 100).toFixed(1)}%</strong>, indicating that
            the release is{" "}
            {readiness > 0.8
              ? "approaching readiness"
              : readiness > 0.5
              ? "partially ready"
              : "not yet ready"}{" "}
            for deployment.
          </p>
        )}

        {riskLevel && (
          <p>
            The release is currently assessed as{" "}
            <strong className="capitalize">{riskLevel}</strong> risk. This
            reflects the combined impact of unstable requirements, recent
            failures, and healing activity.
          </p>
        )}
      </div>
    </div>
  );
}
