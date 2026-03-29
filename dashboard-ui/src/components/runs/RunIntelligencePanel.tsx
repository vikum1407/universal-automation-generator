import type { RunIntelligence } from "../../api/types";

export function RunIntelligencePanel({ intel }: { intel: RunIntelligence | null }) {
  if (!intel) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">Run Intelligence</h2>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-3 border rounded bg-white shadow-sm">
          <div className="text-sm text-gray-600">Risk Score</div>
          <div className="text-2xl font-bold">{intel.risk_score}</div>
        </div>

        <div className="p-3 border rounded bg-white shadow-sm">
          <div className="text-sm text-gray-600">Stability Index</div>
          <div className="text-2xl font-bold">{intel.stability_index}</div>
        </div>

        <div className="p-3 border rounded bg-white shadow-sm">
          <div className="text-sm text-gray-600">Failure Probability</div>
          <div className="text-2xl font-bold">{intel.failure_probability}%</div>
        </div>
      </div>

      <div className="mt-4 p-3 border rounded bg-gray-50 text-sm whitespace-pre-line">
        {intel.summary}
      </div>
    </section>
  );
}
