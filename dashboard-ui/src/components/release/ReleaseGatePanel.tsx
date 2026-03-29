import type { ReleaseGate } from "../../api/types";

export function ReleaseGatePanel({ gates }: { gates: ReleaseGate[] }) {
  if (!gates.length) return null;

  const color = (s: ReleaseGate["status"]) =>
    s === "pass" ? "bg-green-500" : s === "warn" ? "bg-yellow-500" : "bg-red-500";

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Release Gates</h2>

      <div className="space-y-3">
        {gates.map((g) => (
          <div key={g.id} className="p-3 border rounded bg-white shadow-sm">
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${color(g.status)}`} />
              <div className="font-medium">{g.name}</div>
            </div>

            <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
              {g.rationale}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
