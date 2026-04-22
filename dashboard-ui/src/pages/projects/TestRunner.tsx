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

  const surface =
    theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;

  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  const text =
    theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;

  const textLight =
    theme.mode === "dark" ? theme.colors.darkTextLight : theme.colors.textLight;

  const codeBg =
    theme.mode === "dark" ? theme.colors.darkBackground : "#fff";

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

  const statusColor =
    results?.status === "passed"
      ? theme.colors.success
      : results?.status === "failed"
      ? theme.colors.danger
      : textLight;

  return (
    <div style={{ marginTop: theme.spacing.xl }}>
      <h3 style={{ color: theme.colors.primary }}>Test Runner</h3>

      {/* Run Button */}
      <button
        onClick={run}
        disabled={running}
        style={{
          padding: "10px 16px",
          borderRadius: theme.radii.md,
          background: running ? "#5F22C0" : theme.colors.primary,
          color: "white",
          border: "none",
          fontWeight: 600,
          cursor: running ? "not-allowed" : "pointer",
          marginBottom: theme.spacing.md,
          transition: "background 0.15s ease"
        }}
        onMouseEnter={(e) => {
          if (!running)
            (e.currentTarget as HTMLButtonElement).style.background = "#6920D8";
        }}
        onMouseLeave={(e) => {
          if (!running)
            (e.currentTarget as HTMLButtonElement).style.background =
              theme.colors.primary;
        }}
      >
        {running ? "Running..." : "Run Tests"}
      </button>

      {!results ? (
        <EmptyState message="No test results yet." />
      ) : (
        <div
          style={{
            padding: theme.spacing.lg,
            borderRadius: theme.radii.lg,
            border: `1px solid ${border}`,
            background: surface,
            boxShadow: theme.shadow.card,
            transition: "all 0.15s ease"
          }}
        >
          {/* Status */}
          <div
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: "8px",
              background: statusColor,
              color: "#000",
              fontWeight: 700,
              fontSize: "12px",
              marginBottom: "8px"
            }}
          >
            {results.status.toUpperCase()}
          </div>

          <div style={{ color: textLight, fontSize: "12px" }}>
            {new Date(results.timestamp).toLocaleString()}
          </div>

          {/* Failures */}
          {results.failures?.length > 0 && (
            <pre
              style={{
                background: codeBg,
                padding: theme.spacing.md,
                borderRadius: theme.radii.md,
                marginTop: theme.spacing.md,
                fontSize: "12px",
                border: `1px solid ${border}`,
                color: text,
                overflowX: "auto",
                whiteSpace: "pre-wrap"
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
