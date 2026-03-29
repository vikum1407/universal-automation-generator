import type { TimelineEvent } from "../../api/types";

export function AttachmentViewer({ events }: { events: TimelineEvent[] }) {
  const attachments = events.filter((e) => e.event_type === "attachment");

  if (!attachments.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Attachments</h2>

      <div className="space-y-2">
        {attachments.map((a) => (
          <div key={a.id} className="p-3 border rounded bg-white shadow-sm">
            <div className="font-medium">{a.payload?.name}</div>
            <a
              href={a.payload?.url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline text-sm"
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
