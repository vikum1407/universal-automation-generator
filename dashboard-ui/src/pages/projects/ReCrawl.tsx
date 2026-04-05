import { useState } from "react";
import Button from "../../dashboard/components/Button";

const API_BASE = "http://localhost:3000";

export default function ReCrawl({ projectId }: { projectId: string }) {
  const [result, setResult] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    const res = await fetch(`${API_BASE}/projects/${projectId}/recrawl`, {
      method: "POST"
    });
    const json = await res.json();
    setResult(json);
    setRunning(false);
  };

  return (
    <div style={{ marginTop: "32px" }}>
      <h3 style={{ color: "#7B2FF7" }}>Self‑Updating Selectors</h3>

      <Button onClick={run} disabled={running}>
        {running ? "Re‑Crawling..." : "Re‑Crawl UI"}
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
          <strong>Updated: {result.updated ? "Yes" : "No"}</strong>

          {result.selectorMap && (
            <pre
              style={{
                background: "#fff",
                padding: "12px",
                borderRadius: "8px",
                marginTop: "12px",
                fontSize: "12px",
                maxHeight: "400px",
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                border: "1px solid #ddd"
              }}
            >
              {JSON.stringify(result.selectorMap, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
