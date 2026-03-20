import { useParams } from "react-router-dom";
import FlowExplorer from "@/components/flow/FlowExplorer";

export default function FlowPage() {
  const { testId } = useParams();

  if (!testId) return <div>Invalid test ID</div>;

  return (
    <div className="p-6">
      <FlowExplorer testId={testId} />
    </div>
  );
}
