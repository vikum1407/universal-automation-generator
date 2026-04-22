import { useEffect, useState } from "react";
import { theme } from "@/theme";

const API_BASE = "http://localhost:3000";

const MOCK_AUTOHEAL = [
  {
    type: "ui-selector-fix",
    brokenSelector: "#login-btn",
    newSelector: '[data-testid="login-button"]',
    message: "Replace #login-btn with [data-testid=\"login-button\"]"
  }
];

export default function AutoHeal({ projectId }: { projectId: string }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);

  const surface =
    theme.mode === "dark" ? theme.colors.darkSurface : theme.colors.background;

  const border =
    theme.mode === "dark" ? theme.colors.darkBorder : theme.colors.border;

  const text =
    theme.mode === "dark" ? theme.colors.darkText : theme.colors.textDark;

  const textLight =
    theme.mode === "dark" ? theme.colors.darkTextLight : theme.colors.textLight;

  const load = () => {
    fetch(`${API_BASE}/projects/${projectId}/tests/autoheal`, {
      method: "POST"
    })
      .then(res => res.json())
      .then(data => {
        if (!data || !data.length) {
          setSuggestions(MOCK_AUTOHEAL);
        } else {
          setSuggestions(data);
        }
      });
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const apply = async (s: any) => {
    await fetch(`${API_BASE}/projects/${projectId}/tests/autoheal/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s)
    });

    load();
  };

  if (!suggestions.length) return null;

  return (
    <div style={{ marginTop: "32px" }}>
      <h3 style={{ color: theme.colors.primary }}>Auto‑Healing Suggestions</h3>

      <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
        {suggestions.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "18px",
              borderRadius: "12px",
              border: `1px solid ${border}`,
              background: surface,
              boxShadow: theme.shadow.card,
              transition: "all 0.15s ease"
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 6px 14px rgba(0,0,0,0.18)";
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                theme.shadow.card;
              (e.currentTarget as HTMLDivElement).style.transform =
                "translateY(0)";
            }}
          >
            {/* Message */}
            <strong
              style={{
                color: theme.colors.primary,
                fontSize: "15px"
              }}
            >
              {s.message}
            </strong>

            {/* CTA Button */}
            <button
              onClick={() => apply(s)}
              style={{
                marginTop: "14px",
                padding: "10px 16px",
                borderRadius: "8px",
                background: theme.colors.primary,
                color: "white",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "13px",
                transition: "background 0.15s ease"
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#6920D8";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  theme.colors.primary;
              }}
            >
              Apply Fix
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
