import { useParams } from "react-router-dom";
import SelectorIntelligencePanel from "@/components/selectors/SelectorIntelligencePanel";

export default function SelectorPage() {
  const { testId } = useParams();

  if (!testId) return <div>Invalid test ID</div>;

  return (
    <div className="p-6">
      <SelectorIntelligencePanel testId={testId} />
    </div>
  );
}
