import type { ReleaseBlocker } from "../../api/types";

export function ReleaseBlockerPanel({ items }: { items: ReleaseBlocker[] }) {
  if (!items.length) return null;

  const color = (s: ReleaseBlocker["severity"]) =>
    s === "critical"
      ? "bg-red-700"
      : s === "high"
      ? "bg-red-500"
      : s === "medium"
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Release Blockers</h2>

      <div className="space-y-3">
        {items.map((b) => (
          <div key={b.id} className="p-3 border rounded bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${color(b.severity)}`} />
              <div className="font-medium">{b.title}</div>
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
