interface FlowStep {
  index: number;
  action: string;
  selector: string | null;
  value: string | null;
  timestamp: string;
  metadata: Record<string, any>;
}

interface FlowStepListProps {
  steps: FlowStep[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export default function FlowStepList({ steps, selectedIndex, onSelect }: FlowStepListProps) {
  return (
    <div className="w-72 border-r overflow-y-auto p-3 space-y-2">
      {steps.map((step) => (
        <button
          key={step.index}
          onClick={() => onSelect(step.index)}
          className={`block w-full text-left p-2 rounded ${
            selectedIndex === step.index ? "bg-blue-100" : "hover:bg-gray-100"
          }`}
        >
          <div className="font-medium">{step.action}</div>
          {step.selector && <div className="text-xs text-gray-500">{step.selector}</div>}
        </button>
      ))}
    </div>
  );
}
