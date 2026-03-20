import type { EvolutionResponse } from "@/api/types/EvolutionResponse";

interface EvolutionPanelProps {
  evolution: EvolutionResponse;
  onSelectTest?: (id: string) => void;
}

export default function EvolutionPanel({ evolution, onSelectTest }: EvolutionPanelProps) {
  const sections = [
    { title: "Updated Tests", items: evolution.updated },
    { title: "Added Tests", items: evolution.added },
    { title: "Removed Tests", items: evolution.removed },
  ];

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Test Evolution</h2>

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
