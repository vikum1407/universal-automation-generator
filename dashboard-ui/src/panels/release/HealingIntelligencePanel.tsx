import type { StabilitySnapshot, HealingSignal } from "@/types/StabilitySnapshot";

export default function HealingIntelligencePanel({
  snapshot,
}: {
  snapshot: StabilitySnapshot;
}) {
  const healing = snapshot.selfHealing ?? [];

  const grouped = groupByPattern(healing);

  return (
    <div className="p-4 bg-white dark:bg-slate-900 shadow rounded space-y-4">
      <div className="text-lg font-semibold">Healing Intelligence</div>

      {healing.length === 0 && (
        <div className="text-sm text-slate-500">
          No healing signals detected in this release.
        </div>
      )}

      {healing.length > 0 && (
        <div className="text-sm text-slate-500">
          {healing.length} healing signals · {Object.keys(grouped).length} patterns
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(grouped).map(([pattern, signals]) => (
          <div
            key={pattern}
            className="border border-slate-200 dark:border-slate-800 rounded p-3 space-y-2"
          >
            <div className="font-semibold text-slate-800 dark:text-slate-200">
              Pattern: <span className="font-mono">{pattern}</span>
            </div>

            <div className="text-xs text-slate-500">
              {signals.length} occurrences · avg confidence{" "}
              {averageConfidence(signals).toFixed(2)}
            </div>

            <div className="space-y-2">
              {signals.map((s, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-700"
                >
                  <div className="text-xs font-mono text-slate-700 dark:text-slate-300">
                    Test: {s.testId}
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Suggested fix: {s.suggestedFix}
                  </div>

                  <div className="text-xs text-slate-500 mt-1">
                    Confidence: {(s.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByPattern(signals: HealingSignal[]) {
  const map: Record<string, HealingSignal[]> = {};
  for (const s of signals) {
    if (!map[s.failurePattern]) map[s.failurePattern] = [];
    map[s.failurePattern].push(s);
  }
  return map;
}

function averageConfidence(signals: HealingSignal[]) {
  return signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;
}
