import { useRequirementImpactDiff } from "../../hooks/useRequirementImpactDiff";

export default function RequirementImpactDiffPanel({
  project,
  runA,
  runB,
}: {
  project: string;
  runA: string;
  runB: string;
}) {
  const { impact, loading, error } = useRequirementImpactDiff(project, runA, runB);

  if (loading) return <div>Loading requirement impact…</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!impact) return <div>No requirement impact available.</div>;

  return (
    <div className="p-4 rounded bg-white dark:bg-slate-800 shadow space-y-6">
      <div className="text-lg font-semibold">
        Requirement Impact Between Runs
      </div>

      {impact.becameUnstable.length > 0 && (
        <div>
          <div className="font-semibold mb-1 text-red-500">Newly Unstable</div>
          <ul className="list-disc ml-5 text-sm text-red-400">
            {impact.becameUnstable.map((id: string) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      )}

      {impact.becameStable.length > 0 && (
        <div>
          <div className="font-semibold mb-1 text-green-500">Recovered</div>
          <ul className="list-disc ml-5 text-sm text-green-500">
            {impact.becameStable.map((id: string) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      )}

      {impact.becameRisky.length > 0 && (
        <div>
          <div className="font-semibold mb-1 text-yellow-500">Newly Risky</div>
          <ul className="list-disc ml-5 text-sm text-yellow-500">
            {impact.becameRisky.map((id: string) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      )}

      {impact.recoveredFromRisk.length > 0 && (
        <div>
          <div className="font-semibold mb-1 text-green-500">Risk Reduced</div>
          <ul className="list-disc ml-5 text-sm text-green-500">
            {impact.recoveredFromRisk.map((id: string) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      )}

      {impact.healingSignals.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Healing Signals</div>
          <ul className="list-disc ml-5 text-sm text-green-500">
            {impact.healingSignals.map((h: any, idx: number) => (
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
  );
}
