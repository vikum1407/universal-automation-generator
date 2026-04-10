import { useEffect, useState } from "react";

const API_BASE = "http://localhost:3000";

export default function RTMTable({ projectId }: { projectId: string }) {
  const [rtm, setRtm] = useState<any | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/flow/rtm`)
      .then(res => res.json())
      .then(data => setRtm(data));
  }, [projectId]);

  if (!rtm || !rtm.requirements || !rtm.requirements.length) return null;

  return (
    <div style={{ marginTop: "32px" }}>
      <h3 style={{ color: "#7B2FF7" }}>Requirements Traceability Matrix</h3>

      <table
        style={{
          width: "100%",
          marginTop: "16px",
          borderCollapse: "collapse",
          fontSize: "13px"
        }}
      >
        <thead>
          <tr style={{ background: "#F8F4FF" }}>
            <th style={{ padding: "10px", borderBottom: "1px solid #eee" }}>ID</th>
            <th style={{ padding: "10px", borderBottom: "1px solid #eee" }}>Type</th>
            <th style={{ padding: "10px", borderBottom: "1px solid #eee" }}>Source</th>
            <th style={{ padding: "10px", borderBottom: "1px solid #eee" }}>Page / URL</th>
            <th style={{ padding: "10px", borderBottom: "1px solid #eee" }}>Selector / Method</th>
            <th style={{ padding: "10px", borderBottom: "1px solid #eee" }}>Description</th>
            <th style={{ padding: "10px", borderBottom: "1px solid #eee" }}>Covered</th>
            <th style={{ padding: "10px", borderBottom: "1px solid #eee" }}>Covered By</th>
          </tr>
        </thead>
        <tbody>
          {rtm.requirements.map((req: any) => {
            const isCovered = req.coveredBy && req.coveredBy.length > 0;

            return (
              <tr key={req.id}>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{req.id}</td>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                  {req.type?.toUpperCase()}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                  {req.source}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                  {req.page || req.url}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                  {req.selector || req.method || "—"}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                  {req.description}
                </td>
                <td
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid #eee",
                    color: isCovered ? "#0F9D58" : "#D93025",
                    fontWeight: 600
                  }}
                >
                  {isCovered ? "Yes" : "No"}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                  {req.coveredBy?.length ? req.coveredBy.join(", ") : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
