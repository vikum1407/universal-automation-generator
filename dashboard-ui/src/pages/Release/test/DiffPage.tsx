import { useParams } from "react-router-dom";
import DiffViewer from "@/components/tests/DiffViewer";

export default function DiffPage() {
  const { testId } = useParams();

  if (!testId) return <div>Invalid test ID</div>;

  return (
    <div className="p-6">
      <DiffViewer testId={testId} />
    </div>
  );
}
