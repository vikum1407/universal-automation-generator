import type { AIEdgeCase } from "../../api/types";

export function AIEdgeCaseList({ items }: { items: AIEdgeCase[] }) {
  if (!items.length) return null;

  const color = (r: AIEdgeCase["risk"]) =>
    r === "high" ? "bg-red-500" : r === "medium" ? "bg-yellow-500" : "bg-green-500";

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">AI‑Discovered Edge Cases</h2>

      <div className="space-y-3">
        {items.map((e) => (
          <div key={e.id} className="p-3 border rounded bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${color(e.risk)}`} />
              <div className="font-medium">{e.description}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
