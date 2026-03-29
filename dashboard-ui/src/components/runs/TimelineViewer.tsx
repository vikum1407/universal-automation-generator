import type { TimelineEvent } from "../../api/types";

export function TimelineViewer({ events }: { events: TimelineEvent[] }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Timeline</h2>
      <div className="space-y-2">
        {events.map((e) => (
          <div
            key={e.id}
            className={`p-3 border rounded shadow-sm ${
              e.event_type === "assertion" ? "bg-yellow-50" :
              e.event_type === "stdout" ? "bg-blue-50" :
              e.event_type === "error" ? "bg-red-50" :
              "bg-white"
            }`}
          >
            <div className="font-semibold">{e.event_type}</div>
            <div className="text-sm text-gray-600">{e.timestamp}</div>
            <pre className="bg-gray-100 p-2 mt-2 rounded text-sm">
              {JSON.stringify(e.payload, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
