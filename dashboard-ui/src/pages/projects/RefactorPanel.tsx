import { useState } from "react";
import Button from "../../dashboard/components/Button";

const API_BASE = "http://localhost:3000";

export default function RefactorPanel({ projectId }: { projectId: string }) {
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    const res = await fetch(`${API_BASE}/projects/${projectId}/refactor`, {
      method: "POST"
    });
    const json = await res.json();
    setResult(json);
    setRunning(false);
  };

  return (
    <div style={{ marginTop: "32px" }}>
      <h3 style={{ color: "#7B2FF7" }}>AI Test Refactoring</h3>

      <Button onClick={run} disabled={running}>
        {running ? "Refactoring..." : "Refactor Tests"}
      </Button>

      {result && (
        <div
          style={{
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #eee",
            background: "#F8F4FF",
            marginTop: "16px"
          }}
        >
          <strong>Before: {result.before}</strong>
          <br />
          <strong>After: {result.after}</strong>
          <br />
          <strong>Generated Files: {result.files}</strong>
        </div>
      )}
    </div>
  );
}
