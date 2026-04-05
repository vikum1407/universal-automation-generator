import { useEffect, useState, useCallback } from "react";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { theme } from "../../theme";

const API_BASE = "http://localhost:3000";

const MOCK_STEPS = [
  {
    type: "load",
    url: "https://example.com/login",
    timestamp: 0
  },
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
  {
    type: "action",
    action: "click",
    selector: 'text="Log in"',
    timestamp: 600
  },
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

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/ui/replay/${testName}`)
      .then(res => res.json())
      .then(data => {
        if (!data || !data.length) {
          setSteps(MOCK_STEPS);
        } else {
          setSteps(data);
        }
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
      default: return theme.colors.textLight;
    }
  };

  return (
    <div style={{ marginTop: theme.spacing.xl }}>
      <h3 style={{ color: theme.colors.primary }}>Replay Viewer</h3>

      <div style={{ display: "flex", gap: theme.spacing.lg }}>
        <div
          style={{
            width: "300px",
            borderRight: `1px solid ${theme.colors.border}`,
            paddingRight: theme.spacing.md,
            overflowY: "auto",
            maxHeight: "600px"
          }}
        >
          {steps.map((s, i) => (
            <div
              key={i}
              onClick={() => setActive(i)}
              style={{
                padding: theme.spacing.sm,
                marginBottom: theme.spacing.sm,
                borderRadius: theme.radii.md,
                cursor: "pointer",
                background: i === active ? "#EDE4FF" : theme.colors.background,
                borderLeft: `4px solid ${groupColor(s.type)}`
              }}
            >
              <strong style={{ color: groupColor(s.type) }}>
                {s.type.toUpperCase()}
              </strong>
              <br />
              <small style={{ color: theme.colors.textLight }}>
                {s.action || s.url || s.assertion || ""}
              </small>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          <h4 style={{ color: theme.colors.primary }}>Step Details</h4>

          <pre
            style={{
              background: "#fff",
              padding: theme.spacing.md,
              borderRadius: theme.radii.md,
              fontSize: "12px",
              boxShadow: theme.shadow.card,
              maxHeight: "600px",
              overflowY: "auto"
            }}
          >
            {JSON.stringify(step, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
