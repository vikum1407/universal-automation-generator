import { useParams } from "react-router-dom";
import MultiFrameworkTestViewer from "@/components/tests/MultiFrameworkTestViewer";
import { useEffect, useState } from "react";

export default function TestPage() {
  const { testId } = useParams();
  const [frameworks, setFrameworks] = useState<any>(null);

  useEffect(() => {
    if (!testId) return;

    fetch(`/api/tests/generate/${testId}`)
      .then((r) => r.json())
      .then((json) => setFrameworks(json.frameworks));
  }, [testId]);

  if (!testId) return <div>Invalid test ID</div>;
  if (!frameworks) return <div>Loading test...</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Test: {testId}</h1>

      <MultiFrameworkTestViewer testId={testId} frameworks={frameworks} />
    </div>
  );
}
