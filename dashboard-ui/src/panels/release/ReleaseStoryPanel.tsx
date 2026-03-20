import { useStabilitySnapshot } from "../../hooks/useStabilitySnapshot";
import { useRequirementImpactDiff } from "../../hooks/useRequirementImpactDiff";

export default function ReleaseStoryPanel({
  project,
  runA,
  runB,
}: {
  project: string;
  runA: string;
  runB: string;
}) {
  const { data, loading, error } = useStabilitySnapshot(project);
  const { impact } = useRequirementImpactDiff(project, runA, runB);

  if (loading) return <div>Loading release story…</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div>No release data available.</div>;

  const runs = data.executions ?? [];
  const a = runs.find((r) => r.runId === runA);
  const b = runs.find((r) => r.runId === runB);

  if (!a || !b) return <div>Missing run data for story.</div>;

  const deltaPassed = b.passed - a.passed;
  const deltaFailed = b.failed - a.failed;
  const deltaFlaky = b.flaky - a.flaky;

  const storyLines: string[] = [];

  storyLines.push(
    `The release progressed from run ${a.runId} to run ${b.runId}, executed on ${new Date(
      b.startedAt
    ).toLocaleString()}.`
  );

  if (deltaFailed > 0) {
    storyLines.push(
      `${deltaFailed} new failures were introduced, increasing overall instability.`
    );
  } else if (deltaFailed < 0) {
    storyLines.push(
      `${Math.abs(deltaFailed)} failures were resolved, improving stability.`
    );
  }

  if (deltaFlaky > 0) {
    storyLines.push(
      `${deltaFlaky} additional flaky tests were detected, indicating increased variability.`
    );
  } else if (deltaFlaky < 0) {
    storyLines.push(
      `${Math.abs(deltaFlaky)} flaky tests were stabilized, reducing noise.`
    );
  }

  if (impact) {
    if (impact.becameUnstable.length > 0) {
      storyLines.push(
        `The following requirements became unstable: ${impact.becameUnstable.join(
          ", "
        )}.`
      );
    }

    if (impact.becameStable.length > 0) {
      storyLines.push(
        `The following requirements recovered and are now stable: ${impact.becameStable.join(
          ", "
        )}.`
      );
    }

    if (impact.becameRisky.length > 0) {
      storyLines.push(
        `New risk emerged in these requirements: ${impact.becameRisky.join(
          ", "
        )}.`
      );
    }

    if (impact.recoveredFromRisk.length > 0) {
      storyLines.push(
        `Risk was reduced for: ${impact.recoveredFromRisk.join(", ")}.`
      );
    }

    if (impact.healingSignals.length > 0) {
      storyLines.push(
        `Self‑healing detected ${impact.healingSignals.length} signals addressing recurring issues.`
      );
    }
  }

  if (storyLines.length === 1) {
    storyLines.push("No significant changes were detected between these runs.");
  }

  return (
    <div className="p-4 rounded bg-white dark:bg-slate-800 shadow space-y-4">
      <div className="text-lg font-semibold">Release Story</div>

      <div className="text-sm space-y-2">
        {storyLines.map((line, idx) => (
          <p key={idx}>{line}</p>
        ))}
      </div>
    </div>
  );
}
