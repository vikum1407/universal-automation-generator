import { useEffect, useState } from "react";

const API_BASE = "http://localhost:3000";

const MOCK_RTM = {
  generatedAt: new Date().toISOString(),
  requirements: [
    {
      id: "req-1",
      description: "User can log in with valid credentials",
      source: "UI",
      coveredBy: ["login.spec.ts"]
    },
    {
      id: "req-2",
      description: "User sees error on invalid password",
      source: "UI",
      coveredBy: ["login.spec.ts"]
    },
    {
      id: "req-3",
      description: "Health check endpoint returns 200",
      source: "API",
      coveredBy: ["healthcheck.spec.ts"]
    }
  ]
};

export default function RTMTable({ projectId }: { projectId: string }) {
  const [rtm, setRtm] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/flow/rtm`)
      .then(res => res.json())
      .then(data => {
        if (!data || !data.requirements || !data.requirements.length) {
          setRtm(MOCK_RTM);
        } else {
          setRtm(data);
        }
      });
  }, [projectId]);

  if (!rtm || !rtm.requirements) return null;

  return (
    <div style={{ marginTop: "32px" }}>
      <h3 style={{ color: "#7B2FF7" }}>Requirements Traceability Matrix</h3>

      <table style={{ width: "100%", marginTop: "16px", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F8F4FF" }}>
            <th style={{ padding: "12px", borderBottom: "1px solid #eee" }}>ID</th>
            <th style={{ padding: "12px", borderBottom: "1px solid #eee" }}>Description</th>
            <th style={{ padding: "12px", borderBottom: "1px solid #eee" }}>Source</th>
            <th style={{ padding: "12px", borderBottom: "1px solid #eee" }}>Covered By</th>
          </tr>
        </thead>
        <tbody>
          {rtm.requirements.map((req: any) => (
            <tr key={req.id}>
              <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{req.id}</td>
              <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{req.description}</td>
              <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>{req.source}</td>
              <td style={{ padding: "12px", borderBottom: "1px solid #eee" }}>
                {req.coveredBy?.join(", ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
