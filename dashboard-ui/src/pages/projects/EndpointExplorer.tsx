import { useEffect, useState } from "react";
import { theme } from "@/theme";

const API_BASE = "http://localhost:3000";

export default function EndpointExplorer({ projectId }: { projectId: string }) {
  const [endpoints, setEndpoints] = useState<any[]>([]);

  const surface =
    theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;

  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  const text =
    theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;

  const textLight =
    theme.mode === "dark" ? theme.colors.darkTextLight : theme.colors.textLight;

  // ---------------------------------------------------------
  // LOAD NEW ENDPOINT FORMAT
  // ---------------------------------------------------------
  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/endpoints`)
      .then(res => res.json())
      .then(setEndpoints)
      .catch(() => setEndpoints([]));
  }, [projectId]);

  if (!endpoints.length)
    return (
      <p style={{ color: textLight, marginTop: "16px" }}>
        No endpoints found.
      </p>
    );

  const methodColor = (method: string) => {
    switch (method) {
      case "GET":
        return theme.colors.success;
      case "POST":
        return theme.colors.primary;
      case "PUT":
        return "#FFA726";
      case "DELETE":
        return theme.colors.danger;
      default:
        return "#90CAF9";
    }
  };

  return (
    <div style={{ marginTop: "24px" }}>
      <h3 style={{ color: theme.colors.primary }}>API Endpoints</h3>

      <div
        style={{
          display: "grid",
          gap: "16px",
          marginTop: "16px"
        }}
      >
        {endpoints.map((ep, i) => (
          <div
            key={i}
            style={{
              padding: "18px",
              borderRadius: "12px",
              border: `1px solid ${border}`,
              background: surface,
              cursor: "pointer",
              transition: "all 0.15s ease",
              boxShadow: theme.shadow.card
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 6px 14px rgba(0,0,0,0.18)";
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                theme.shadow.card;
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(0)";
            }}
            onClick={() =>
              navigator.clipboard.writeText(`${ep.method} ${ep.path}`)
            }
            title="Click to copy"
          >
            {/* METHOD + PATH */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center"
              }}
            >
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "8px",
                  background: methodColor(ep.method),
                  fontWeight: 700,
                  color: "#000",
                  fontSize: "12px"
                }}
              >
                {ep.method}
              </span>

              <strong
                style={{
                  color: theme.colors.primary,
                  fontSize: "15px"
                }}
              >
                {ep.path}
              </strong>
            </div>

            {/* SUMMARY */}
            {ep.summary && (
              <p
                style={{
                  marginTop: "8px",
                  color: textLight,
                  fontSize: "13px"
                }}
              >
                {ep.summary}
              </p>
            )}

            {/* PARAMETERS */}
            {ep.parameters?.length > 0 && (
              <>
                <h4
                  style={{
                    marginTop: "14px",
                    color: theme.colors.secondary,
                    fontSize: "14px"
                  }}
                >
                  Parameters
                </h4>
                <ul style={{ marginTop: "6px", color: text }}>
                  {ep.parameters.map((p: any, idx: number) => (
                    <li key={idx} style={{ marginBottom: "4px" }}>
                      <strong>{p.name}</strong> ({p.in}) — {p.description}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* REQUEST BODY */}
            {ep.requestBody && (
              <>
                <h4
                  style={{
                    marginTop: "14px",
                    color: theme.colors.secondary,
                    fontSize: "14px"
                  }}
                >
                  Request Body
                </h4>
                <pre
                  style={{
                    background:
                      theme.mode === "dark"
                        ? theme.colors.darkBackground
                        : "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                    border: `1px solid ${border}`,
                    marginTop: "6px",
                    color: text,
                    fontSize: "12px",
                    overflowX: "auto"
                  }}
                >
                  {JSON.stringify(ep.requestBody, null, 2)}
                </pre>
              </>
            )}

            {/* RESPONSES */}
            {ep.responses && (
              <>
                <h4
                  style={{
                    marginTop: "14px",
                    color: theme.colors.secondary,
                    fontSize: "14px"
                  }}
                >
                  Responses
                </h4>
                <pre
                  style={{
                    background:
                      theme.mode === "dark"
                        ? theme.colors.darkBackground
                        : "#fff",
                    padding: "12px",
                    borderRadius: "8px",
                    border: `1px solid ${border}`,
                    marginTop: "6px",
                    color: text,
                    fontSize: "12px",
                    overflowX: "auto"
                  }}
                >
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
