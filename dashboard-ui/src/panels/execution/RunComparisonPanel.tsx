import { useRunComparison } from "../../hooks/useRunComparison";

export default function RunComparisonPanel({
  project,
  runA,
  runB,
}: {
  project: string;
  runA: string;
  runB: string;
}) {
  const { comparison, loading, error } = useRunComparison(project, runA, runB);

  if (loading) return <div>Loading comparison…</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!comparison) return <div>Comparison not available.</div>;

  const { a, b, deltas, healingSignals } = comparison;

  const deltaColor = (n: number) =>
    n > 0 ? "text-red-500" : n < 0 ? "text-green-500" : "text-gray-500";

  return (
    <div className="p-4 rounded bg-white dark:bg-slate-800 shadow space-y-6">
      <div className="text-lg font-semibold">
        Comparing Run {a.runId} → Run {b.runId}
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="font-semibold mb-1">Passed</div>
          <div>{a.passed} → {b.passed}</div>
          <div className={deltaColor(deltas.passed)}>
            Δ {deltas.passed}
          </div>
        </div>

        <div>
          <div className="font-semibold mb-1">Failed</div>
          <div>{a.failed} → {b.failed}</div>
          <div className={deltaColor(deltas.failed)}>
            Δ {deltas.failed}
          </div>
        </div>

        <div>
          <div className="font-semibold mb-1">Flaky</div>
          <div>{a.flaky} → {b.flaky}</div>
          <div className={deltaColor(deltas.flaky)}>
            Δ {deltas.flaky}
          </div>
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">Duration</div>
        <div className="text-sm">
          {(a.durationMs / 1000).toFixed(0)}s → {(b.durationMs / 1000).toFixed(0)}s
        </div>
        <div className={deltaColor(deltas.durationMs)}>
          Δ {(deltas.durationMs / 1000).toFixed(0)}s
        </div>
      </div>

      {healingSignals.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Healing Signals</div>
          <ul className="list-disc ml-5 text-sm text-green-500">
            {healingSignals.map((h: any, idx: number) => (
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
