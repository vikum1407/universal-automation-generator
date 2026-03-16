import type { FlowEvolutionPoint } from "../../../ai/flow-evolution";

export function FlowEvolutionPanel({ points }: { points: FlowEvolutionPoint[] }) {
  if (!points || points.length === 0) return null;

  return (
    <div className="w-[340px]">
      <div className="font-semibold mb-2">Flow Evolution</div>
      <ul className="text-xs space-y-2">
        {points.map(p => (
          <li key={p.index} className="border-b pb-1 last:border-b-0">
            <div className="flex justify-between">
              <span className="font-medium">{p.label}</span>
              <span>Severity: {p.severity.toFixed(1)}</span>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
              <span>+Pages: {p.addedPages}</span>
              <span>-Pages: {p.removedPages}</span>
              <span>+Trans: {p.addedTransitions}</span>
              <span>-Trans: {p.removedTransitions}</span>
              <span>Risk Δ: {p.riskChanges}</span>
              <span>Cluster Δ: {p.clusterChanges}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
