import type { TimelineEvent } from "../../api/types";

export function NetworkPanel({ events }: { events: TimelineEvent[] }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Network</h2>
      <div className="space-y-2">
        {events.map((e) => (
          <div key={e.id} className="p-3 border rounded bg-white shadow-sm">
            <div className="font-semibold">{e.payload?.method} {e.payload?.url}</div>
            <div className="text-sm text-gray-600">
              Status: {e.payload?.status} • {e.payload?.duration_ms}ms
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
