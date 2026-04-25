import { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { theme } from "../../theme";

const API_BASE = "http://localhost:3000";

export default function TestRunner({ projectId }: { projectId: string }) {
  const [results, setResults] = useState<any>(null);
  const [files, setFiles] = useState<{ name: string; content: string }[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const surface = theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;
  const border = theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;
  const text = theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;
  const textLight = theme.mode === "dark" ? theme.colors.darkTextLight : theme.colors.textLight;
  const codeBg = theme.mode === "dark" ? theme.colors.darkBackground : "#fff";

  const loadResults = () =>
    fetch(`${API_BASE}/projects/${projectId}/tests/results`)
      .then(res => res.json())
      .then(data => setResults(data?.status !== "not-run" ? data : null))
      .catch(() => {});

  const loadFiles = () =>
    fetch(`${API_BASE}/projects/${projectId}/tests/files`)
      .then(res => res.json())
      .then((data: { name: string; content: string }[]) => {
        setFiles(Array.isArray(data) ? data : []);
        if (data?.length && !activeFile) setActiveFile(data[0].name);
      })
      .catch(() => {});

  useEffect(() => {
    Promise.all([loadResults(), loadFiles()]).finally(() => setLoading(false));
  }, [projectId]);

  const run = async () => {
    setRunning(true);
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/tests/run`, { method: "POST" });
      const data = await res.json();
      setResults(data);
    } finally {
      setRunning(false);
      await loadFiles();
    }
  };

  if (loading) return <Loader />;

  const statusColor =
    results?.status === "passed" ? theme.colors.success :
    results?.status === "failed" ? theme.colors.danger : textLight;

  const selectedFile = files.find(f => f.name === activeFile);

  return (
    <div style={{ marginTop: theme.spacing.xl }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: theme.spacing.md }}>
        <h3 style={{ color: theme.colors.primary, margin: 0 }}>Tests</h3>

        <button
          onClick={run}
          disabled={running}
          style={{
            padding: "10px 20px", borderRadius: theme.radii.md,
            background: running ? "#5F22C0" : theme.colors.primary,
            color: "white", border: "none", fontWeight: 600,
            cursor: running ? "not-allowed" : "pointer",
            fontSize: 13, transition: "background 0.15s ease"
          }}
          onMouseEnter={e => { if (!running) (e.currentTarget as HTMLButtonElement).style.background = "#6920D8"; }}
          onMouseLeave={e => { if (!running) (e.currentTarget as HTMLButtonElement).style.background = theme.colors.primary; }}
        >
          {running ? "Running…" : "▶  Run Tests"}
        </button>
      </div>

      {/* Last run results banner */}
      {results && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px", borderRadius: theme.radii.md,
          border: `1px solid ${border}`, background: surface,
          marginBottom: theme.spacing.lg
        }}>
          <span style={{
            padding: "3px 10px", borderRadius: 8,
            background: statusColor, color: "#000",
            fontWeight: 700, fontSize: 12
          }}>
            {results.status.toUpperCase()}
          </span>
          <span style={{ fontSize: 12, color: textLight }}>
            Last run: {new Date(results.timestamp).toLocaleString()}
          </span>
          {results.failures?.length > 0 && (
            <span style={{ fontSize: 12, color: theme.colors.danger }}>
              {results.failures.length} failure{results.failures.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Failure log */}
      {results?.failures?.length > 0 && (
        <details style={{ marginBottom: theme.spacing.lg }}>
          <summary style={{ cursor: "pointer", color: theme.colors.danger, fontWeight: 600, fontSize: 13 }}>
            View failure log
          </summary>
          <pre style={{
            background: codeBg, padding: theme.spacing.md,
            borderRadius: theme.radii.md, marginTop: 8,
            fontSize: 11, border: `1px solid ${border}`,
            color: text, overflowX: "auto", whiteSpace: "pre-wrap",
            maxHeight: 300
          }}>
            {results.failures[0].message}
          </pre>
        </details>
      )}

      {/* Test file browser */}
      {files.length === 0 ? (
        <EmptyState message="No test files generated yet." />
      ) : (
        <div style={{ display: "flex", gap: theme.spacing.lg, minHeight: 500 }}>

          {/* File list */}
          <div style={{
            width: 220, flexShrink: 0,
            borderRight: `1px solid ${border}`,
            paddingRight: theme.spacing.md
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              {files.length} file{files.length !== 1 ? "s" : ""}
            </div>
            {files.map(f => {
              const isActive = f.name === activeFile;
              return (
                <button
                  key={f.name}
                  onClick={() => setActiveFile(f.name)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "8px 10px", marginBottom: 4,
                    borderRadius: theme.radii.md, border: "none",
                    background: isActive
                      ? (theme.mode === "dark" ? "#2A1A40" : "#EDE4FF")
                      : "transparent",
                    color: isActive ? theme.colors.primary : text,
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer", fontSize: 12,
                    transition: "all 0.12s ease",
                    wordBreak: "break-all"
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLButtonElement).style.background =
                      theme.mode === "dark" ? "#1F1F1F" : "#F5EEFF";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = isActive
                      ? (theme.mode === "dark" ? "#2A1A40" : "#EDE4FF")
                      : "transparent";
                  }}
                >
                  📄 {f.name}
                </button>
              );
            })}
          </div>

          {/* File content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {selectedFile ? (
              <>
                <div style={{ fontSize: 12, color: textLight, marginBottom: 8 }}>
                  {selectedFile.name}
                </div>
                <pre style={{
                  background: codeBg, padding: theme.spacing.md,
                  borderRadius: theme.radii.md, fontSize: 12,
                  border: `1px solid ${border}`, color: text,
                  overflowX: "auto", whiteSpace: "pre-wrap",
                  maxHeight: 520, lineHeight: 1.6
                }}>
                  {selectedFile.content}
                </pre>
              </>
            ) : (
              <EmptyState message="Select a file to view its content." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
