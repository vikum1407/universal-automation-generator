import { Card } from "@/components/Card";
import CodeViewer from "@/components/tests/CodeViewer";

export function ErrorDetails({
  error,
}: {
  error: {
    message: string;
    stack: string;
  } | null;
}) {
  return (
    <div className="p-4">
      <Card>
        <h2 className="text-lg font-semibold mb-4">Error Details</h2>

        {!error && <div>No error information</div>}

        {error && (
          <div className="space-y-4">
            <div className="border rounded-md p-3">
              <div className="font-medium mb-2">{error.message}</div>
              <CodeViewer code={error.stack} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
