import type { SelectorIntelligence } from "@/api/types/SelectorIntelligence";

interface SelectorListProps {
  selectors: SelectorIntelligence[];
  selected: string | null;
  onSelect: (selector: string) => void;
}

export default function SelectorList({ selectors, selected, onSelect }: SelectorListProps) {
  return (
    <div className="w-72 border-r overflow-y-auto p-3 space-y-2">
      {selectors.map((s) => (
        <button
          key={s.selector}
          onClick={() => onSelect(s.selector)}
          className={`block w-full text-left p-2 rounded ${
            selected === s.selector ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <div className="font-medium">{s.selector}</div>
          <div className="text-xs text-gray-500">Score: {s.score}</div>
        </button>
      ))}
    </div>
  );
}
