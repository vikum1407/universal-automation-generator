import { useEffect, useState } from "react";

export default function EndpointExplorer({ projectId }: { projectId: string }) {
  const [endpoints, setEndpoints] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/projects/${projectId}/endpoints`)
      .then(res => res.json())
      .then(setEndpoints);
  }, [projectId]);

  if (!endpoints.length) return <p>No endpoints found.</p>;

  return (
    <div style={{ marginTop: "24px" }}>
      <h3 style={{ color: "#7B2FF7" }}>Endpoints</h3>

      <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
        {endpoints.map((ep, i) => (
          <div
            key={i}
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #eee",
              background: "#F8F4FF"
            }}
          >
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  background: "#2FF7D1",
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
