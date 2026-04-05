import { useEffect, useState } from "react";

const API_BASE = "http://localhost:3000";

const MOCK_COVERAGE = [
  {
    id: "login-flow",
    label: "Login flow (Landing → Dashboard)",
    covered: true,
    coveredBy: ["login.spec.ts"]
  },
  {
    id: "signup-flow",
    label: "Signup flow (Landing → Verify Email)",
    covered: false,
    coveredBy: []
  },
  {
    id: "healthcheck",
    label: "GET /health",
    covered: true,
    coveredBy: ["healthcheck.spec.ts"]
  }
];

export default function CoverageHeatmap({ projectId }: { projectId: string }) {
  const [coverage, setCoverage] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/flow/coverage`)
      .then(res => res.json())
      .then(data => {
        if (!data || !data.length) {
          setCoverage(MOCK_COVERAGE);
        } else {
          setCoverage(data);
        }
      });
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

          return (
            <div
              key={i}
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: bg,
                color: "#000",
                fontWeight: 600
              }}
            >
              <div>{item.label}</div>

              {item.covered ? (
                <div style={{ marginTop: "8px", fontSize: "12px" }}>
                  Covered by: {item.coveredBy.join(", ")}
                </div>
              ) : (
                <div style={{ marginTop: "8px", fontSize: "12px" }}>
                  No tests cover this requirement
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
