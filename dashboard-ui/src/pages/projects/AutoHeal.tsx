import { useEffect, useState } from "react";

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
      <h3 style={{ color: "#7B2FF7" }}>Auto‑Healing Suggestions</h3>

      <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
        {suggestions.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid #eee",
              background: "#F8F4FF"
            }}
          >
            <strong style={{ color: "#7B2FF7" }}>{s.message}</strong>

            <button
              onClick={() => apply(s)}
              style={{
                marginTop: "12px",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "#7B2FF7",
                color: "white",
                border: "none",
                fontWeight: 600,
                cursor: "pointer"
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
