interface FrameworkTabsProps {
  frameworks: string[];
  selected: string;
  onSelect: (fw: string) => void;
}

export default function FrameworkTabs({ frameworks, selected, onSelect }: FrameworkTabsProps) {
  return (
    <div className="flex space-x-4 border-b mb-4">
      {frameworks.map((fw) => (
        <button
          key={fw}
          onClick={() => onSelect(fw)}
          className={`pb-2 ${
            fw === selected
              ? "border-b-2 border-blue-600 font-semibold"
              : "text-gray-500"
          }`}
        >
          {fw}
        </button>
      ))}
    </div>
  );
}
