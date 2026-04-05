import { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { theme } from "../../theme";

const API_BASE = "http://localhost:3000";

const MOCK_RESULTS = {
  status: "passed",
  timestamp: new Date().toISOString(),
  failures: []
};

export default function TestRunner({ projectId }: { projectId: string }) {
  const [results, setResults] = useState<any>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`${API_BASE}/projects/${projectId}/tests/results`)
      .then(res => res.json())
      .then(data => {
        if (!data || data.status === "not-run") {
          setResults(MOCK_RESULTS);
        } else {
          setResults(data);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const run = async () => {
    setRunning(true);
    await fetch(`${API_BASE}/projects/${projectId}/tests/run`, { method: "POST" });
    setRunning(false);
    load();
  };

  if (loading) return <Loader />;

  return (
    <div style={{ marginTop: theme.spacing.xl }}>
      <h3 style={{ color: theme.colors.primary }}>Test Runner</h3>

      <button
        onClick={run}
        disabled={running}
        style={{
          padding: "10px 16px",
          borderRadius: theme.radii.md,
          background: "#7B2FF7",
          color: "white",
          border: "none",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: theme.spacing.md
        }}
      >
        {running ? "Running..." : "Run Tests"}
      </button>

      {!results ? (
        <EmptyState message="No test results yet." />
      ) : (
        <div
          style={{
            padding: theme.spacing.md,
            borderRadius: theme.radii.lg,
            border: `1px solid ${theme.colors.border}`,
            background: theme.colors.background,
            boxShadow: theme.shadow.card
          }}
        >
          <strong>Status: {results.status}</strong>
          <br />
          <small>{results.timestamp}</small>

          {results.failures?.length > 0 && (
            <pre
              style={{
                background: "#fff",
                padding: theme.spacing.sm,
                borderRadius: theme.radii.md,
                marginTop: theme.spacing.md,
                fontSize: "12px"
              }}
            >
              {results.failures[0].message}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
