import { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { theme } from "../../theme";

const API_BASE = "http://localhost:3000";

const METHOD_COLOR: Record<string, string> = {
  GET: "#00C853",
  POST: "#448AFF",
  PUT: "#FFA726",
  PATCH: "#AB47BC",
  DELETE: "#EF5350",
};

export default function APIReplayViewer({ projectId }: { projectId: string }) {
  const [steps, setSteps] = useState<any[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  const surface = theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;
  const border = theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;
  const text = theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;
  const textLight = theme.mode === "dark" ? theme.colors.darkTextLight : theme.colors.textLight;
  const codeBg = theme.mode === "dark" ? theme.colors.darkBackground : "#fff";

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/api/replay`)
      .then(res => res.json())
      .then(data => {
        setSteps(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") setActive(a => Math.min(a + 1, steps.length - 1));
      if (e.key === "ArrowUp") setActive(a => Math.max(a - 1, 0));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [steps.length]);

  if (loading) return <Loader />;
  if (!steps.length) return <EmptyState message="No API endpoints found. Generate a project first." />;

  const step = steps[active];
  const methodColor = METHOD_COLOR[step?.method] ?? textLight;

  const statusBadge = (status: string) => {
    const color =
      status === "passed" ? "#00C853" :
      status === "failed" ? "#EF5350" : textLight;
    return (
      <span style={{
        padding: "2px 8px", borderRadius: 6,
        background: color, color: "#000",
        fontSize: 11, fontWeight: 700
      }}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div style={{ marginTop: theme.spacing.xl }}>
      <h3 style={{ color: theme.colors.primary, marginBottom: theme.spacing.md }}>
        API Replay Viewer
      </h3>

      <p style={{ fontSize: 13, color: textLight, marginBottom: theme.spacing.lg }}>
        {steps.length} endpoint{steps.length !== 1 ? "s" : ""} discovered · use ↑↓ to navigate
      </p>

      <div style={{ display: "flex", gap: theme.spacing.lg }}>

        {/* LEFT — endpoint list */}
        <div style={{
          width: 320, flexShrink: 0,
          borderRight: `1px solid ${border}`,
          paddingRight: theme.spacing.md,
          overflowY: "auto", maxHeight: 620
        }}>
          {steps.map((s, i) => {
            const isActive = i === active;
            const mc = METHOD_COLOR[s.method] ?? textLight;
            return (
              <div
                key={i}
                onClick={() => setActive(i)}
                style={{
                  padding: "10px 12px", marginBottom: 6,
                  borderRadius: theme.radii.md, cursor: "pointer",
                  background: isActive
                    ? (theme.mode === "dark" ? "#2A1A40" : "#EDE4FF")
                    : surface,
                  borderLeft: `4px solid ${mc}`,
                  transition: "all 0.12s ease"
                }}
                onMouseEnter={e => {
                  if (!isActive)
                    (e.currentTarget as HTMLDivElement).style.background =
                      theme.mode === "dark" ? "#1F1F1F" : "#F5EEFF";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.background =
                    isActive
                      ? (theme.mode === "dark" ? "#2A1A40" : "#EDE4FF")
                      : surface;
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{
                    padding: "2px 7px", borderRadius: 5,
                    background: mc, color: "#000",
                    fontSize: 11, fontWeight: 700
                  }}>
                    {s.method}
                  </span>
                  <span style={{ fontSize: 12, color: text, wordBreak: "break-all" }}>
                    {s.url}
                  </span>
                </div>
                {s.summary && s.summary !== `${s.method} ${s.url}` && (
                  <div style={{ fontSize: 11, color: textLight, marginTop: 3 }}>
                    {s.summary}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT — details panel */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center",
            gap: 12, marginBottom: theme.spacing.md,
            padding: "14px 18px",
            borderRadius: theme.radii.lg,
            border: `1px solid ${border}`,
            background: surface
          }}>
            <span style={{
              padding: "4px 12px", borderRadius: 8,
              background: methodColor, color: "#000",
              fontWeight: 700, fontSize: 13
            }}>
              {step.method}
            </span>
            <span style={{ fontWeight: 600, fontSize: 15, color: text, wordBreak: "break-all" }}>
              {step.url}
            </span>
            {statusBadge(step.lastStatus)}
          </div>

          {/* Summary */}
          {step.summary && step.summary !== `${step.method} ${step.url}` && (
            <p style={{ fontSize: 13, color: textLight, marginBottom: theme.spacing.md }}>
              {step.summary}
            </p>
          )}

          {/* Tags */}
          {step.tags?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: theme.spacing.md }}>
              {step.tags.map((t: string, i: number) => (
                <span key={i} style={{
                  padding: "2px 10px", borderRadius: 12,
                  background: theme.mode === "dark" ? "#2A1A40" : "#EDE4FF",
                  color: theme.colors.primary, fontSize: 11, fontWeight: 600
                }}>{t}</span>
              ))}
            </div>
          )}

          {/* Parameters */}
          {step.parameters?.length > 0 && (
            <Section title="Parameters" border={border} surface={surface} text={text} textLight={textLight}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ color: textLight }}>
                    <Th>Name</Th><Th>In</Th><Th>Required</Th><Th>Description</Th>
                  </tr>
                </thead>
                <tbody>
                  {step.parameters.map((p: any, i: number) => (
                    <tr key={i}>
                      <Td color={theme.colors.primary}><strong>{p.name}</strong></Td>
                      <Td color={textLight}>{p.in}</Td>
                      <Td color={p.required ? "#EF5350" : textLight}>{p.required ? "yes" : "no"}</Td>
                      <Td color={text}>{p.description || "—"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Request Body */}
          {step.requestBody && (
            <Section title="Request Body" border={border} surface={surface} text={text} textLight={textLight}>
              <pre style={{
                background: codeBg, padding: 12, borderRadius: 8,
                border: `1px solid ${border}`, fontSize: 12, color: text,
                overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: 250
              }}>
                {JSON.stringify(step.requestBody, null, 2)}
              </pre>
            </Section>
          )}

          {/* Expected Responses */}
          {step.responses && Object.keys(step.responses).length > 0 && (
            <Section title="Expected Responses" border={border} surface={surface} text={text} textLight={textLight}>
              {Object.entries(step.responses).map(([code, resp]: [string, any]) => (
                <div key={code} style={{ marginBottom: 8 }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 6,
                    background: code.startsWith("2") ? "#00C853" : "#EF5350",
                    color: "#000", fontSize: 11, fontWeight: 700, marginRight: 8
                  }}>{code}</span>
                  <span style={{ fontSize: 12, color: textLight }}>
                    {resp?.description || ""}
                  </span>
                </div>
              ))}
            </Section>
          )}

          {/* Expected test status */}
          <div style={{
            marginTop: theme.spacing.md, padding: "10px 14px",
            borderRadius: theme.radii.md,
            border: `1px solid ${border}`,
            background: surface, fontSize: 12, color: textLight
          }}>
            Expected test assertion: <strong style={{ color: text }}>
              expect(response.status()).toBe({step.expectedStatus})
            </strong>
          </div>

        </div>
      </div>
    </div>
  );
}

function Section({ title, border, surface, text, textLight, children }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: textLight, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {title}
      </div>
      <div style={{ padding: 12, borderRadius: 8, border: `1px solid ${border}`, background: surface }}>
        {children}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 600 }}>{children}</th>;
}

function Td({ children, color }: { children: React.ReactNode; color: string }) {
  return <td style={{ padding: "4px 8px", color }}>{children}</td>;
}
