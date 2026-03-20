import { useTestLevelDiff } from "../../hooks/useTestLevelDiff";

export default function TestLevelDiffPanel({
  project,
  runA,
  runB,
}: {
  project: string;
  runA: string;
  runB: string;
}) {
  const { diff, loading, error } = useTestLevelDiff(project, runA, runB);

  if (loading) return <div>Loading test‑level diff…</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!diff) return <div>No diff available.</div>;

  return (
    <div className="p-4 rounded bg-white dark:bg-slate-800 shadow space-y-6">
      <div className="text-lg font-semibold">
        Test‑Level Changes Between Runs
      </div>

      {diff.becameUnstable.length > 0 && (
        <div>
          <div className="font-semibold mb-1 text-red-500">New Failures</div>
          <ul className="list-disc ml-5 text-sm text-red-400">
            {diff.becameUnstable.map((id: string) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      )}

      {diff.becameStable.length > 0 && (
        <div>
          <div className="font-semibold mb-1 text-green-500">Recovered</div>
          <ul className="list-disc ml-5 text-sm text-green-500">
            {diff.becameStable.map((id: string) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
        </div>
      )}

      {diff.healingSignals.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Healing Signals</div>
          <ul className="list-disc ml-5 text-sm text-green-500">
            {diff.healingSignals.map((h: any, idx: number) => (
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
