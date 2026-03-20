import { useEffect, useState } from "react";
import type { FlowStep } from "@/api/types/FlowStep";
import FlowStepList from "./FlowStepList";
import FlowStepDetails from "./FlowStepDetails";

interface FlowResponse {
  testId: string;
  steps: FlowStep[];
}

interface FlowExplorerProps {
  testId: string;
}

export default function FlowExplorer({ testId }: FlowExplorerProps) {
  const [data, setData] = useState<FlowResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/flows/${testId}`)
      .then((r) => r.json())
      .then((json) => setData(json as FlowResponse));
  }, [testId]);

  if (!data) return <div>Loading flow...</div>;

  const selectedStep =
    selectedIndex !== null
      ? data.steps.find((s) => s.index === selectedIndex) ?? null
      : null;

  return (
    <div className="flex h-full bg-white rounded shadow overflow-hidden">
      <FlowStepList
        steps={data.steps}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
      />

      <FlowStepDetails step={selectedStep} />
    </div>
  );
}
