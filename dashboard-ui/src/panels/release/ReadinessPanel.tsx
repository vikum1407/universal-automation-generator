import { useRequirementImpactDiff } from "../../hooks/useRequirementImpactDiff";
import { useStabilitySnapshot } from "../../hooks/useStabilitySnapshot";

type ReadinessInfo = {
  score: number;
  riskLevel: string;
  highlights?: string[];
  blockers?: string[];
};

export default function ReadinessPanel({
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

  if (loading) return <div>Loading release readiness…</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div>No readiness data available.</div>;

  const snapshotAny = data as any;
  const readiness = snapshotAny.readiness as ReadinessInfo | undefined;

  if (!readiness) return <div>No readiness score available.</div>;

  const highlights = readiness.highlights ?? [];
  const blockers = readiness.blockers ?? [];

  return (
    <div className="p-4 rounded bg-white dark:bg-slate-800 shadow space-y-6">
      <div className="text-lg font-semibold">Release Readiness</div>

      <div className="text-sm">
        Score:{" "}
        <span className="font-medium">
          {(readiness.score * 100).toFixed(1)}%
        </span>
      </div>

      <div className="text-sm">
        Risk Level:{" "}
        <span className="font-medium capitalize">{readiness.riskLevel}</span>
      </div>

      {highlights.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Highlights</div>
          <ul className="list-disc ml-5 text-sm text-green-500">
            {highlights.map((h, idx) => (
              <li key={idx}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {blockers.length > 0 && (
        <div>
          <div className="font-semibold mb-1 text-red-500">Blockers</div>
          <ul className="list-disc ml-5 text-sm text-red-400">
            {blockers.map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {impact && (
        <div className="space-y-4">
          {impact.becameUnstable.length > 0 && (
            <div>
              <div className="font-semibold mb-1 text-red-500">
                Newly Unstable Requirements
              </div>
              <ul className="list-disc ml-5 text-sm text-red-400">
                {impact.becameUnstable.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          )}

          {impact.becameStable.length > 0 && (
            <div>
              <div className="font-semibold mb-1 text-green-500">
                Recovered Requirements
              </div>
              <ul className="list-disc ml-5 text-sm text-green-500">
                {impact.becameStable.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          )}

          {impact.becameRisky.length > 0 && (
            <div>
              <div className="font-semibold mb-1 text-yellow-500">
                Newly Risky Requirements
              </div>
              <ul className="list-disc ml-5 text-sm text-yellow-500">
                {impact.becameRisky.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          )}

          {impact.recoveredFromRisk.length > 0 && (
            <div>
              <div className="font-semibold mb-1 text-green-500">
                Risk Reduced
              </div>
              <ul className="list-disc ml-5 text-sm text-green-500">
                {impact.recoveredFromRisk.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
            </div>
          )}

          {impact.healingSignals.length > 0 && (
            <div>
              <div className="font-semibold mb-1">Healing Signals</div>
              <ul className="list-disc ml-5 text-sm text-green-500">
                {impact.healingSignals.map((h: any, idx) => (
                  <li key={idx}>
                    {h.summary ??
                      h.message ??
                      h.description ??
                      JSON.stringify(h)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
