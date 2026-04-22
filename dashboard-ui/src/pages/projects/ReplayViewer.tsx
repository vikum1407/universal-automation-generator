import { useEffect, useState, useCallback } from "react";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { theme } from "../../theme";

const API_BASE = "http://localhost:3000";

const MOCK_STEPS = [
  { type: "load", url: "https://example.com/login", timestamp: 0 },
  {
    type: "action",
    action: "click",
    selector: 'input[name="email"]',
    value: "user@example.com",
    timestamp: 200
  },
  {
    type: "action",
    action: "click",
    selector: 'input[name="password"]',
    value: "••••••••",
    timestamp: 400
  },
  { type: "action", action: "click", selector: 'text="Log in"', timestamp: 600 },
  {
    type: "assert",
    assertion: "Dashboard is visible",
    selector: 'text="Welcome back"',
    timestamp: 900
  }
];

export default function ReplayViewer({
  projectId,
  testName
}: {
  projectId: string;
  testName: string;
}) {
  const [steps, setSteps] = useState<any[]>([]);
  const [active, setActive] = useState(0);
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

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/ui/replay/${testName}`)
      .then(res => res.json())
      .then(data => {
        setSteps(data?.length ? data : MOCK_STEPS);
        setLoading(false);
      });
  }, [projectId, testName]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") setActive(a => Math.min(a + 1, steps.length - 1));
      if (e.key === "ArrowUp") setActive(a => Math.max(a - 1, 0));
    },
    [steps.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (loading) return <Loader />;
  if (!steps.length) return <EmptyState message="No replay data available." />;

  const step = steps[active];

  const groupColor = (type: string) => {
    switch (type) {
      case "action": return theme.colors.primary;
      case "request": return "#0099FF";
      case "response": return "#00C853";
      case "assert": return theme.colors.secondary;
      case "load":
      case "domcontentloaded": return "#FF9800";
      default: return textLight;
    }
  };

  return (
    <div style={{ marginTop: theme.spacing.xl }}>
      <h3 style={{ color: theme.colors.primary }}>Replay Viewer</h3>

      <div
        style={{
          display: "flex",
          gap: theme.spacing.lg,
          marginTop: theme.spacing.md
        }}
      >
        {/* LEFT SIDEBAR — Steps */}
        <div
          style={{
            width: "300px",
            borderRight: `1px solid ${border}`,
            paddingRight: theme.spacing.md,
            overflowY: "auto",
            maxHeight: "600px"
          }}
        >
          {steps.map((s, i) => {
            const activeBg =
              theme.mode === "dark"
                ? "#2A1A40"
                : "#EDE4FF";

            return (
              <div
                key={i}
                onClick={() => setActive(i)}
                style={{
                  padding: theme.spacing.sm,
                  marginBottom: theme.spacing.sm,
                  borderRadius: theme.radii.md,
                  cursor: "pointer",
                  background: i === active ? activeBg : surface,
                  borderLeft: `4px solid ${groupColor(s.type)}`,
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  if (i !== active)
                    (e.currentTarget as HTMLDivElement).style.background =
                      theme.mode === "dark" ? "#1F1F1F" : "#F5EEFF";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    i === active ? activeBg : surface;
                }}
              >
                <strong style={{ color: groupColor(s.type) }}>
                  {s.type.toUpperCase()}
                </strong>
                <br />
                <small style={{ color: textLight }}>
                  {s.action || s.url || s.assertion || ""}
                </small>
              </div>
            );
          })}
        </div>

        {/* RIGHT PANEL — Step Details */}
        <div style={{ flex: 1 }}>
          <h4 style={{ color: theme.colors.primary }}>Step Details</h4>

          <pre
            style={{
              background: codeBg,
              padding: theme.spacing.md,
              borderRadius: theme.radii.md,
              fontSize: "12px",
              boxShadow: theme.shadow.card,
              maxHeight: "600px",
              overflowY: "auto",
              border: `1px solid ${border}`,
              color: text,
              whiteSpace: "pre-wrap"
            }}
          >
            {JSON.stringify(step, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
