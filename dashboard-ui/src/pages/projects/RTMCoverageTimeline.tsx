import { useEffect, useState } from "react";
import { theme } from "@/theme";

const API_BASE = "http://localhost:3000";

export default function RTMCoverageTimeline({ projectId }: { projectId: string }) {
  const [events, setEvents] = useState<any[]>([]);
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
    fetch(`${API_BASE}/projects/${projectId}/rtm/timeline`)
      .then(res => res.json())
      .then(data => {
        setEvents(data.events || []);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) {
    return <div style={{ color: textLight }}>Loading timeline…</div>;
  }

  if (!events.length) {
    return <div style={{ color: textLight }}>No timeline data found.</div>;
  }

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ color: theme.colors.primary }}>Coverage Timeline</h3>

      <div
        style={{
          marginTop: 24,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          paddingLeft: 12,
          borderLeft: `2px solid ${theme.colors.primary}`
        }}
      >
        {events.map((ev, i) => {
          const statusColor =
            ev.type === "coverage_increase"
              ? theme.colors.success
              : ev.type === "coverage_drop"
              ? theme.colors.danger
              : theme.colors.textDark;

          return (
            <div
              key={i}
              style={{
                position: "relative",
                paddingLeft: 24,
                display: "flex",
                flexDirection: "column",
                gap: 6
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: -10,
                  top: 4,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: statusColor,
                  border: `2px solid ${surface}`
                }}
              />

              <div style={{ fontSize: 13, color: textLight }}>
                {new Date(ev.timestamp).toLocaleString()}
              </div>

              <div style={{ fontSize: 15, fontWeight: 600, color: text }}>
                {ev.title}
              </div>

              <div style={{ fontSize: 13, color: textLight }}>
                {ev.description}
              </div>

              {ev.delta && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 13,
                    fontWeight: 600,
                    color: statusColor
                  }}
                >
                  {ev.delta > 0 ? "+" : ""}
                  {ev.delta}% coverage
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
