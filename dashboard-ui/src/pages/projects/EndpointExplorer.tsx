import { useEffect, useState } from "react";

const API_BASE = "http://localhost:3000";

export default function EndpointExplorer({ projectId }: { projectId: string }) {
  const [endpoints, setEndpoints] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/api/endpoints`)
      .then(res => res.json())
      .then(setEndpoints);
  }, [projectId]);

  if (!endpoints.length) return <p>No endpoints found.</p>;

  const methodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "#2FF7D1";
      case "POST":
        return "#7B2FF7";
      case "PUT":
        return "#FFA726";
      case "DELETE":
        return "#EF5350";
      default:
        return "#90CAF9";
    }
  };

  return (
    <div style={{ marginTop: "24px" }}>
      <h3 style={{ color: "#7B2FF7" }}>API Endpoints</h3>

      <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
        {endpoints.map((ep, i) => (
          <div
            key={i}
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #eee",
              background: "#F8F4FF",
              cursor: "pointer"
            }}
            onClick={() => navigator.clipboard.writeText(`${ep.method} ${ep.path}`)}
            title="Click to copy"
          >
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  background: methodColor(ep.method),
                  fontWeight: 600
                }}
              >
                {ep.method}
              </span>

              <strong style={{ color: "#7B2FF7" }}>{ep.path}</strong>
            </div>

            {ep.summary && (
              <p style={{ marginTop: "8px", color: "#555" }}>{ep.summary}</p>
            )}

            {ep.parameters?.length > 0 && (
              <>
                <h4 style={{ marginTop: "12px", color: "#2FF7D1" }}>Parameters</h4>
                <ul>
                  {ep.parameters.map((p: any, idx: number) => (
                    <li key={idx}>
                      <strong>{p.name}</strong> ({p.in}) — {p.description}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {ep.requestBody && (
              <>
                <h4 style={{ marginTop: "12px", color: "#2FF7D1" }}>Request Body</h4>
                <pre style={{ background: "#fff", padding: "12px", borderRadius: "8px" }}>
                  {JSON.stringify(ep.requestBody, null, 2)}
                </pre>
              </>
            )}

            {ep.responses && (
              <>
                <h4 style={{ marginTop: "12px", color: "#2FF7D1" }}>Responses</h4>
                <pre style={{ background: "#fff", padding: "12px", borderRadius: "8px" }}>
                  {JSON.stringify(ep.responses, null, 2)}
                </pre>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
