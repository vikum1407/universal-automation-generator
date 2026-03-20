import type { StabilitySnapshot } from "@/types/StabilitySnapshot";

export default function ReleaseActionRecommendationsPanel({
  snapshot,
}: {
  snapshot: StabilitySnapshot;
}) {
  const requirements = snapshot.requirements ?? [];
  const healing = snapshot.selfHealing ?? [];
  const executions = snapshot.executions ?? [];

  const risky = requirements.filter((r) => r.status === "risky");
  const unstable = requirements.filter((r) => r.status === "unstable");

  const latest = executions.length > 0 ? executions[executions.length - 1] : null;
  const previous = executions.length > 1 ? executions[executions.length - 2] : null;

  const failureMomentum =
    latest && previous
      ? latest.failed + latest.flaky - (previous.failed + previous.flaky)
      : 0;

  const recommendations: string[] = [];

  if (risky.length > 0) {
    recommendations.push(
      `Investigate the ${risky.length} risky requirements first, as they pose the highest impact on release stability.`
    );
  }

  if (unstable.length > 0) {
    recommendations.push(
      `Review the ${unstable.length} unstable requirements to identify patterns contributing to instability.`
    );
  }

  if (healing.length > 0) {
    recommendations.push(
      `Analyze the ${healing.length} healing signals to detect recurring failure patterns and apply suggested fixes.`
    );
  }

  if (failureMomentum > 0) {
    recommendations.push(
      `Recent runs show an increase of ${failureMomentum} failures; consider running additional tests to validate stability.`
    );
  } else if (failureMomentum < 0) {
    recommendations.push(
      `Failures have decreased by ${Math.abs(
        failureMomentum
      )}; continue monitoring to confirm improving stability.`
    );
  }

  if (latest && latest.flaky > 0) {
    recommendations.push(
      `Address the ${latest.flaky} flaky tests detected in the latest run to reduce noise in stability metrics.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "The release appears stable with no immediate actions required. Continue monitoring for any changes."
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-slate-900 shadow rounded space-y-4">
      <div className="text-lg font-semibold">Recommended Actions</div>

      <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700 dark:text-slate-300">
        {recommendations.map((rec, idx) => (
          <li key={idx}>{rec}</li>
        ))}
      </ul>
    </div>
  );
}
