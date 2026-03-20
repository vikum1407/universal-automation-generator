import type { FlowStep } from "@/api/types/FlowStep";

interface FlowStepDetailsProps {
  step: FlowStep | null;
}

export default function FlowStepDetails({ step }: FlowStepDetailsProps) {
  if (!step) {
    return <div className="flex-1 p-4 text-gray-400">Select a step to view details.</div>;
  }

  return (
    <div className="flex-1 p-4 space-y-4">
      <div>
        <h3 className="font-semibold mb-1">Action</h3>
        <div>{step.action}</div>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Selector</h3>
        <div>{step.selector ?? "None"}</div>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Value</h3>
        <div>{step.value ?? "None"}</div>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Timestamp</h3>
        <div>{step.timestamp}</div>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Metadata</h3>
        <pre className="bg-gray-50 p-3 rounded border text-sm overflow-auto">
          {JSON.stringify(step.metadata, null, 2)}
        </pre>
      </div>
    </div>
  );
}
