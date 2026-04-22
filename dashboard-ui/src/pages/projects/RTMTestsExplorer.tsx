import { useEffect, useState } from "react";
import { theme } from "@/theme";

const API_BASE = "http://localhost:3000";

export default function RTMTestsExplorer({ projectId }: { projectId: string }) {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const surface =
    theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;

  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  const text =
    theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;

  const textLight =
    theme.mode === "dark" ? theme.colors.darkTextLight : theme.colors.textLight;

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/rtm/tests`)
      .then(res => res.json())
      .then(data => {
        setTests(data.tests || []);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return <div style={{ color: textLight }}>Loading tests…</div>;
  }

  if (!tests.length) {
    return <div style={{ color: textLight }}>No tests found.</div>;
  }

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ color: theme.colors.primary }}>Tests Explorer</h3>

      <div
        style={{
          marginTop: 16,
          border: `1px solid ${border}`,
          borderRadius: 12,
          overflow: "hidden",
          background: surface,
          boxShadow: theme.shadow.card
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13
          }}
        >
          <thead>
            <tr style={{ background: theme.mode === "dark" ? "#1F1F1F" : "#F2ECFF" }}>
              {["Test Name", "File", "Status", "Linked Requirements"].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "12px",
                    borderBottom: `1px solid ${border}`,
                    textAlign: "left",
                    color: theme.colors.primary,
                    fontWeight: 600,
                    fontSize: 12,
                    letterSpacing: "0.03em"
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {tests.map((t, idx) => {
              const bg =
                idx % 2 === 0
                  ? surface
                  : theme.mode === "dark"
                  ? "#1A1A1A"
                  : "#FAF7FF";

              const statusColor =
                t.status === "passed"
                  ? theme.colors.success
                  : t.status === "failed"
                  ? theme.colors.danger
                  : t.status === "flaky"
                  ? "#EAB308"
                  : textLight;

              return (
                <tr
                  key={t.file + t.name}
                  style={{
                    background: bg,
                    transition: "background 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      theme.mode === "dark" ? "#2A2A2A" : "#F0E8FF";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = bg;
                  }}
                >
                  <td style={{ padding: "12px", borderBottom: `1px solid ${border}`, color: text }}>
                    {t.name}
                  </td>

                  <td style={{ padding: "12px", borderBottom: `1px solid ${border}`, color: text }}>
                    {t.file}
                  </td>

                  <td
                    style={{
                      padding: "12px",
                      borderBottom: `1px solid ${border}`,
                      fontWeight: 600,
                      color: statusColor
                    }}
                  >
                    {t.status}
                  </td>

                  <td style={{ padding: "12px", borderBottom: `1px solid ${border}`, color: text }}>
                    {t.requirements?.length ? (
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {t.requirements.map((r: string) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
