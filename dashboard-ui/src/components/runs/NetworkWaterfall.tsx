import type { TimelineEvent } from "../../api/types";
import { useNetworkWaterfall } from "../../hooks/useNetworkWaterfall";

export function NetworkWaterfall({ events }: { events: TimelineEvent[] }) {
  const rows = useNetworkWaterfall(events);

  if (!rows.length) return null;

  const minStart = rows[0].start;
  const maxEnd = Math.max(...rows.map((r) => r.end));
  const total = maxEnd - minStart;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Network Waterfall</h2>

      <div className="space-y-2">
        {rows.map((r) => {
          const left = ((r.start - minStart) / total) * 100;
          const width = (r.duration / total) * 100;

          return (
            <div key={r.id} className="relative border p-2 rounded bg-white">
              <div className="text-sm font-medium">
                {r.method} {r.url}
              </div>
              <div className="text-xs text-gray-600 mb-1">
                {r.status} • {r.duration}ms
              </div>

              <div className="relative h-3 bg-gray-200 rounded">
                <div
                  className="absolute top-0 h-3 bg-blue-500 rounded"
                  style={{
                    left: `${left}%`,
                    width: `${width}%`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
