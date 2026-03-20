import { useEffect, useState } from "react";
import type { SelectorIntelligence } from "@/api/types/SelectorIntelligence";
import SelectorList from "./SelectorList";
import SelectorDetails from "./SelectorDetails";

interface SelectorResponse {
  testId: string;
  selectors: SelectorIntelligence[];
}

interface SelectorIntelligencePanelProps {
  testId: string;
}

export default function SelectorIntelligencePanel({ testId }: SelectorIntelligencePanelProps) {
  const [data, setData] = useState<SelectorResponse | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/selectors/${testId}`)
      .then((r) => r.json())
      .then((json) => setData(json as SelectorResponse));
  }, [testId]);

  if (!data) return <div>Loading selectors...</div>;

  const selectedSelector =
    selected ? data.selectors.find((s) => s.selector === selected) ?? null : null;

  return (
    <div className="flex h-full bg-white rounded shadow overflow-hidden">
      <SelectorList
        selectors={data.selectors}
        selected={selected}
        onSelect={setSelected}
      />

      <SelectorDetails selector={selectedSelector} />
    </div>
  );
}
