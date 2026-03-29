import type { HealingSuggestion } from "../../api/types";

export function HealingSuggestionPanel({ items }: { items: HealingSuggestion[] }) {
  if (!items.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">AI Healing Suggestions</h2>

      <div className="space-y-3">
        {items.map((s, i) => (
          <div key={i} className="p-3 border rounded bg-white shadow-sm">
            <div className="font-semibold">
              {s.original} → {s.suggestion}
            </div>

            <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
              {s.rationale}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
