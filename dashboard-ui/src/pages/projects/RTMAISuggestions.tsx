import { useEffect, useState } from "react";
import { theme } from "@/theme";

const API_BASE = "http://localhost:3000";

export default function RTMAISuggestions({ projectId }: { projectId: string }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
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
    fetch(`${API_BASE}/projects/${projectId}/rtm/ai-suggestions`)
      .then(res => res.json())
      .then(data => {
        setSuggestions(data.suggestions || []);
        setLoading(false);
      });
  }, [projectId]);

  const applySuggestion = async (id: string) => {
    await fetch(`${API_BASE}/projects/${projectId}/rtm/ai-suggestions/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suggestionId: id })
    });

    const res = await fetch(`${API_BASE}/projects/${projectId}/rtm/ai-suggestions`);
    const data = await res.json();
    setSuggestions(data.suggestions || []);
  };

  if (loading) {
    return <div style={{ color: textLight }}>Loading AI suggestions…</div>;
  }

  if (!suggestions.length) {
    return <div style={{ color: textLight }}>No AI suggestions available.</div>;
  }

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ color: theme.colors.primary }}>AI Suggestions</h3>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}
      >
        {suggestions.map((s, i) => (
          <div
            key={i}
            style={{
              padding: 16,
              borderRadius: 12,
              background: surface,
              border: `1px solid ${border}`,
              boxShadow: theme.shadow.card,
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 600, color: text }}>
              {s.title}
            </div>

            <div style={{ fontSize: 13, color: textLight }}>
              {s.description}
            </div>

            {s.impact && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  color:
                    s.impact === "high"
                      ? theme.colors.danger
                      : s.impact === "medium"
                      ? "#EAB308"
                      : theme.colors.success
                }}
              >
                Impact: {s.impact}
              </div>
            )}

            <button
              onClick={() => applySuggestion(s.id)}
              style={{
                marginTop: 8,
                padding: "6px 12px",
                borderRadius: theme.radii.sm,
                background: theme.colors.secondary,
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                alignSelf: "flex-start"
              }}
            >
              Apply Suggestion
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
