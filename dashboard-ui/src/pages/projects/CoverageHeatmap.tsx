import { useEffect, useState } from "react";

const API_BASE = "http://localhost:3000";

export default function CoverageHeatmap({ projectId }: { projectId: string }) {
  const [coverage, setCoverage] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/flow/coverage`)
      .then(res => res.json())
      .then(data => setCoverage(data || []));
  }, [projectId]);

  if (!coverage.length) return null;

  return (
    <div style={{ marginTop: "32px" }}>
      <h3 style={{ color: "#7B2FF7" }}>Coverage Heatmap</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "16px",
          marginTop: "16px"
        }}
      >
        {coverage.map((item, i) => {
          const bg = item.covered ? "#2FF7D1" : "#FF4F4F";
          const textColor = item.covered ? "#00332A" : "#3B0000";

          return (
            <div
              key={i}
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: bg,
                color: textColor,
                fontWeight: 600,
                boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                fontSize: "13px"
              }}
            >
              <div style={{ opacity: 0.8, marginBottom: 4 }}>
                {item.type === "ui" ? "UI Interaction" : "API Endpoint"}
              </div>
              <div>{item.label}</div>

              <div style={{ marginTop: "8px", fontSize: "12px" }}>
                {item.covered ? (
                  <>
                    Covered by:{" "}
                    {item.coveredBy && item.coveredBy.length
                      ? item.coveredBy.join(", ")
                      : "tests"}
                  </>
                ) : (
                  "No tests cover this yet"
                )}
              </div>

              {item.requirementId && (
                <div style={{ marginTop: "6px", fontSize: "11px", opacity: 0.8 }}>
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
