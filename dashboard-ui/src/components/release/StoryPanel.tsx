import type { ReleaseIntelligenceResponse } from "@/api/types/ReleaseIntelligenceResponse";

interface StoryPanelProps {
  story: ReleaseIntelligenceResponse["story"];
}

export default function StoryPanel({ story }: StoryPanelProps) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">{story.title}</h2>

      <ul className="space-y-2">
        {story.items.map((item, i) => (
          <li key={i} className="text-sm">
            <strong>{item.type}:</strong> {item.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
