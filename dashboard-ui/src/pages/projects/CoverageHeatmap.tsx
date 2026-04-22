import { useEffect, useState } from "react";
import { theme } from "@/theme";

const API_BASE = "http://localhost:3000";

export default function CoverageHeatmap({ projectId }: { projectId: string }) {
  const [coverage, setCoverage] = useState<any[]>([]);

  const surface =
    theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;

  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  const text =
    theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;

  const textLight =
    theme.mode === "dark" ? theme.colors.darkTextLight : theme.colors.textLight;

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/flow/coverage`)
      .then(res => res.json())
      .then(data => setCoverage(data || []));
  }, [projectId]);

  if (!coverage.length) return null;

  return (
    <div style={{ marginTop: "32px" }}>
      <h3 style={{ color: theme.colors.primary }}>Coverage Heatmap</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "16px",
          marginTop: "16px"
        }}
      >
        {coverage.map((item, i) => {
          const bg = item.covered
            ? theme.colors.success
            : theme.colors.danger;

          const fg = item.covered
            ? "#00332A"
            : "#3B0000";

          return (
            <div
              key={i}
              style={{
                padding: "18px",
                borderRadius: "12px",
                background: bg,
                color: fg,
                fontWeight: 600,
                boxShadow: theme.shadow.card,
                fontSize: "13px",
                transition: "all 0.15s ease",
                cursor: "default"
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
            >
              <div style={{ opacity: 0.8, marginBottom: 4 }}>
                {item.type === "ui" ? "UI Interaction" : "API Endpoint"}
              </div>

              <div>{item.label}</div>

              <div
                style={{
                  marginTop: "8px",
                  fontSize: "12px",
                  opacity: 0.9
                }}
              >
                {item.covered ? (
                  <>
                    Covered by:{" "}
                    {item.coveredBy?.length
                      ? item.coveredBy.join(", ")
                      : "tests"}
                  </>
                ) : (
                  "No tests cover this yet"
                )}
              </div>

              {item.requirementId && (
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "11px",
                    opacity: 0.8
                  }}
                >
                  Requirement: {item.requirementId}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
