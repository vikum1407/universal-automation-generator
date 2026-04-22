import { useEffect, useState } from "react";
import { theme } from "@/theme";

const API_BASE = "http://localhost:3000";

export default function RTMCoverageHeatmap({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<any[]>([]);

  const surface =
    theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;

  const text =
    theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;

  const textLight =
    theme.mode === "dark" ? theme.colors.darkTextLight : theme.colors.textLight;

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/rtm/coverage`)
      .then(res => res.json())
      .then(data => setItems(data.items || []));
  }, [projectId]);

  if (!items.length) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ color: theme.colors.primary }}>Coverage Heatmap</h3>

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16
        }}
      >
        {items.map((item, i) => {
          const bg = item.covered
            ? "rgba(34,197,94,0.15)"
            : "rgba(239,68,68,0.15)";

          const border = item.covered
            ? "rgba(34,197,94,0.35)"
            : "rgba(239,68,68,0.35)";

          const labelColor = item.covered
            ? theme.colors.success
            : theme.colors.danger;

          return (
            <div
              key={i}
              style={{
                padding: 16,
                borderRadius: 12,
                background: bg,
                border: `1px solid ${border}`,
                boxShadow: theme.shadow.card,
                display: "flex",
                flexDirection: "column",
                gap: 6
              }}
            >
              <div style={{ fontSize: 12, color: textLight }}>
                {item.type === "ui" ? "UI Interaction" : "API Endpoint"}
              </div>

              <div style={{ fontSize: 15, fontWeight: 600, color: text }}>
                {item.label}
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  color: labelColor
                }}
              >
                {item.covered ? "Covered" : "Not Covered"}
              </div>

              {item.covered && (
                <div style={{ fontSize: 12, color: textLight }}>
                  Covered by:{" "}
                  {item.coveredBy?.length
                    ? item.coveredBy.join(", ")
                    : "tests"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
