import { useEffect, useState } from "react";

const API_BASE = "http://localhost:3000";

export default function CIStatus({ projectId }: { projectId: string }) {
  const [status, setStatus] = useState<any>(null);

  const load = () => {
    fetch(`${API_BASE}/projects/${projectId}/ci-status`)
      .then(res => res.json())
      .then(setStatus);
  };

  useEffect(() => {
    load();
  }, [projectId]);

  if (!status) return null;

  const color =
    status.status === "passed"
      ? "#2FF7D1"
      : status.status === "failed"
      ? "#FF4F4F"
      : "#999";

  return (
    <div style={{ marginTop: "32px" }}>
      <h3 style={{ color: "#7B2FF7" }}>CI Status</h3>

      <div
        style={{
          padding: "16px",
          borderRadius: "12px",
          border: "1px solid #eee",
          background: "#F8F4FF",
          color: color,
          fontWeight: 600
        }}
      >
        {status.status.toUpperCase()}
        <br />
        <small style={{ color: "#555" }}>{status.timestamp}</small>
      </div>
    </div>
  );
}
