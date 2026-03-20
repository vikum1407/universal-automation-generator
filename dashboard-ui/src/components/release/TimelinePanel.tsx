import type { ReleaseIntelligenceResponse } from "@/api/types/ReleaseIntelligenceResponse";

interface TimelinePanelProps {
  timeline: ReleaseIntelligenceResponse["timeline"];
}

export default function TimelinePanel({ timeline }: TimelinePanelProps) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Timeline</h2>

      <ul className="space-y-3">
        {timeline.map((t, i) => (
          <li key={i} className="text-sm">
            <div className="font-medium">{t.event}</div>
            <div className="text-gray-500">{t.timestamp}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
