import type { Bottleneck } from "../../api/types";

export function BottleneckPanel({ items }: { items: Bottleneck[] }) {
  if (!items.length) return null;

  const color = (s: Bottleneck["severity"]) =>
    s === "high" ? "bg-red-500" : s === "medium" ? "bg-yellow-500" : "bg-green-500";

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Bottlenecks</h2>

      <div className="space-y-3">
        {items.map((b) => (
          <div key={b.id} className="p-3 border rounded bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${color(b.severity)}`} />
              <div className="font-semibold">{b.location}</div>
            </div>

            <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
              {b.description}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
