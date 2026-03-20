import type { SelectorIntelligence } from "@/api/types/SelectorIntelligence";

interface SelectorDetailsProps {
  selector: SelectorIntelligence | null;
}

export default function SelectorDetails({ selector }: SelectorDetailsProps) {
  if (!selector) {
    return <div className="flex-1 p-4 text-gray-400">Select a selector to view details.</div>;
  }

  return (
    <div className="flex-1 p-4 space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Selector</h3>
        <div>{selector.selector}</div>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Score</h3>
        <div>{selector.score}</div>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Stability</h3>
        <div>{selector.stability}</div>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Usage</h3>
        <div>{selector.usage}</div>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Healed From</h3>
        <div>{selector.healedFrom ?? "None"}</div>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Metadata</h3>
        <pre className="bg-gray-50 p-3 rounded border text-sm overflow-auto">
          {JSON.stringify(selector.metadata, null, 2)}
        </pre>
      </div>
    </div>
  );
}
