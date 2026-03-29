import type { AIAssertionSuggestion } from "../../api/types";

export function AIAssertionSuggestionList({ items }: { items: AIAssertionSuggestion[] }) {
  if (!items.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">AI‑Generated Assertions</h2>

      <div className="space-y-3">
        {items.map((a) => (
          <div key={a.id} className="p-3 border rounded bg-white shadow-sm">
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{a.assertion}
            </pre>

            <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
              {a.rationale}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
