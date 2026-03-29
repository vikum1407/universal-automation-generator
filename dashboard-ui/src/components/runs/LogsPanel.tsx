import type { TimelineEvent } from "../../api/types";

export function LogsPanel({ events }: { events: TimelineEvent[] }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Logs</h2>
      <div className="bg-gray-900 text-gray-200 p-3 rounded h-64 overflow-auto text-sm">
        {events.map((e) => (
          <div key={e.id}>{e.payload?.message}</div>
        ))}
      </div>
    </section>
  );
}
