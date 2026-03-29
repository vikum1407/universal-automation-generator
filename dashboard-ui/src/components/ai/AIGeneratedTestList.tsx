import type { AIGeneratedTest } from "../../api/types";

export function AIGeneratedTestList({ items }: { items: AIGeneratedTest[] }) {
  if (!items.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">AI‑Generated Test Cases</h2>

      <div className="space-y-4">
        {items.map((t) => (
          <div key={t.id} className="p-3 border rounded bg-white shadow-sm">
            <div className="font-semibold mb-2">{t.title}</div>

            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
{t.code}
            </pre>

            <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
              {t.rationale}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
