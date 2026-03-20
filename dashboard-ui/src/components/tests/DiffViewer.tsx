import { useEffect, useState } from "react";
import CodeViewer from "./CodeViewer";

interface DiffResponse {
  previous: string | null;
  current: string | null;
  diff: string;
}

interface DiffViewerProps {
  testId: string;
}

export default function DiffViewer({ testId }: DiffViewerProps) {
  const [data, setData] = useState<DiffResponse | null>(null);

  useEffect(() => {
    fetch(`/api/tests/diff/${testId}`)
      .then((r) => r.json())
      .then((json) => setData(json as DiffResponse));
  }, [testId]);

  if (!data) return <div>Loading diff...</div>;

  return (
    <div className="p-4 bg-white rounded shadow h-full flex flex-col space-y-4">
      <h2 className="text-xl font-semibold">Diff for {testId}</h2>

      <div className="grid grid-cols-2 gap-4 h-1/2">
        <div>
          <h3 className="font-medium mb-2">Previous</h3>
          <CodeViewer code={data.previous} />
        </div>

        <div>
          <h3 className="font-medium mb-2">Current</h3>
          <CodeViewer code={data.current} />
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-medium mb-2">Unified Diff</h3>
        <pre className="p-4 bg-gray-50 border rounded overflow-auto h-full">
          <code>{data.diff || "No differences detected."}</code>
        </pre>
      </div>
    </div>
  );
}
