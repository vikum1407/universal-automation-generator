import type { TimelineEvent } from "../../api/types";

export function HarLikeViewer({ events }: { events: TimelineEvent[] }) {
  const network = events.filter((e) => e.event_type === "network");

  if (!network.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">HAR‑like Details</h2>

      <div className="space-y-4">
        {network.map((e) => (
          <div key={e.id} className="p-3 border rounded bg-white shadow-sm">
            <div className="font-semibold">
              {e.payload.method} {e.payload.url}
            </div>

            <div className="text-sm text-gray-600">
              Status: {e.payload.status} • {e.payload.duration_ms}ms
            </div>

            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Request Body</summary>
              <pre className="bg-gray-100 p-2 rounded text-sm mt-1">
                {JSON.stringify(e.payload.request_body, null, 2)}
              </pre>
            </details>

            <details className="mt-2">
              <summary className="cursor-pointer font-medium">Response Body</summary>
              <pre className="bg-gray-100 p-2 rounded text-sm mt-1">
                {JSON.stringify(e.payload.response_body, null, 2)}
              </pre>
            </details>
          </div>
        ))}
      </div>
    </section>
  );
}
