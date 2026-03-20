import type { ReleaseIntelligenceResponse } from "@/api/types/ReleaseIntelligenceResponse";

interface SummaryPanelProps {
  summary: ReleaseIntelligenceResponse["summary"];
}

export default function SummaryPanel({ summary }: SummaryPanelProps) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Summary</h2>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>Total tests: {summary.totalTests}</div>
        <div>Changed tests: {summary.changedTests}</div>
        <div>Drift: {summary.drift}</div>
        <div>Stability: {summary.stability.toFixed(2)}</div>
      </div>
    </div>
  );
}
