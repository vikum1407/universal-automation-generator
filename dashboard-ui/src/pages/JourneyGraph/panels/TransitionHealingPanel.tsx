import type { TransitionHealingResult } from "../../../ai/transition-healing";

type TransitionHealingPanelProps = {
  result: TransitionHealingResult | null;
};

export function TransitionHealingPanel({ result }: TransitionHealingPanelProps) {
  if (!result) return null;

  return (
    <div className="w-[360px]">
      <div className="font-semibold mb-2">Transition Self‑Healing</div>

      <div className="text-xs mb-3">
        Stability Score: <b>{(result.stabilityScore * 100).toFixed(1)}%</b>
      </div>

      <div className="text-xs mb-2 font-medium">Suggested Fixes</div>
      <ul className="text-xs space-y-2 max-h-[200px] overflow-auto">
        {result.suggestions.map((s, i) => (
          <li key={i} className="border-b pb-1 last:border-b-0">
            <div className="flex justify-between">
              <span>
                {s.from} → {s.to}
              </span>
              <span>{(s.severity * 100).toFixed(0)}%</span>
            </div>
            <div className="text-[10px] text-gray-500">{s.reason}</div>
          </li>
        ))}
      </ul>

      <div className="text-xs mt-3 font-medium">Diff</div>
      <div className="text-[11px] text-gray-600">
        Added: {result.diff.added.length}
        {"  "}
        Removed: {result.diff.removed.length}
        {"  "}
        Strengthened: {result.diff.strengthened.length}
      </div>
    </div>
  );
}
