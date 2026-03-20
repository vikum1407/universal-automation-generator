import type { SyncResponse } from "@/api/types/SyncResponse";

interface SyncPanelProps {
  sync: SyncResponse;
  onSelectTest?: (id: string) => void;
}

export default function SyncPanel({ sync, onSelectTest }: SyncPanelProps) {
  const sections = [
    { title: "Missing Tests", items: sync.missing },
    { title: "Outdated Tests", items: sync.outdated },
    { title: "Drift", items: sync.drift },
    { title: "Regenerated", items: sync.regenerated },
  ];

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Framework Sync</h2>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{section.title}</h3>
              <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                {section.items.length}
              </span>
            </div>

            {section.items.length === 0 ? (
              <div className="text-gray-400 text-sm">None</div>
            ) : (
              <ul className="space-y-1">
                {section.items.map((id) => (
                  <li key={id}>
                    <button
                      onClick={() => onSelectTest?.(id)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {id}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
