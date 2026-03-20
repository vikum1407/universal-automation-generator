import { Card } from "@/components/Card";
import CodeViewer from "@/components/tests/CodeViewer";

export function LogsPanel({
  logs,
}: {
  logs: {
    type: string;
    message: string;
    timestamp: string;
  }[];
}) {
  return (
    <div className="p-4">
      <Card>
        <h2 className="text-lg font-semibold mb-4">Logs</h2>

        {logs.length === 0 && <div>No logs available</div>}

        <div className="space-y-4">
          {logs.map((log, idx) => (
            <div key={idx} className="border rounded-md p-3">
              <div className="text-xs text-gray-500 mb-1">{log.timestamp}</div>
              <CodeViewer code={log.message} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
