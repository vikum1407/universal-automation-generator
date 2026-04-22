import { useEffect, useState } from "react";
import { theme } from "@/theme";

const API_BASE = "http://localhost:3000";

const MOCK_SUGGESTIONS = [
  {
    suggestionId: "mock-1",
    requirement: {
      description: "User can reset password via email link",
      type: "ui",
      selector: 'text="Forgot password"'
    },
    proposedTestName: "reset-password.spec.ts",
    proposedTestCode: `import { test, expect } from "@playwright/test";

test("User can reset password via email link", async ({ page }) => {
  await page.goto("https://example.com/login");
  await page.click('text="Forgot password"');
  await page.fill('input[type="email"]', "user@example.com");
  await page.click('text="Send reset link"');
  await expect(page.getByText("Check your email")).toBeVisible();
});`
  }
];

export default function AISuggestions({ projectId }: { projectId: string }) {
  const [suggestions, setSuggestions] = useState<any[]>([]);

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

  const load = () => {
    fetch(`${API_BASE}/projects/${projectId}/suggestions`)
      .then(res => res.json())
      .then(data => {
        if (!data || !data.length) {
          setSuggestions(MOCK_SUGGESTIONS);
        } else {
          setSuggestions(data);
        }
      });
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const apply = async (s: any) => {
    await fetch(`${API_BASE}/projects/${projectId}/suggestions/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s)
    });

    load();
  };

  if (!suggestions.length) return null;

  return (
    <div style={{ marginTop: "32px" }}>
      <h3 style={{ color: theme.colors.primary }}>AI Suggested Tests</h3>

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
            {/* Requirement Description */}
            <strong
              style={{
                color: theme.colors.primary,
                fontSize: "15px"
              }}
            >
              {s.requirement?.description}
            </strong>

            {/* Proposed Test Name */}
            <p
              style={{
                marginTop: "8px",
                fontSize: "13px",
                color: textLight
              }}
            >
              Proposed Test: {s.proposedTestName}
            </p>

            {/* Code Block */}
            <pre
              style={{
                background: codeBg,
                padding: "14px",
                borderRadius: "8px",
                marginTop: "12px",
                fontSize: "12px",
                border: `1px solid ${border}`,
                color: text,
                overflowX: "auto",
                whiteSpace: "pre-wrap"
              }}
            >
              {s.proposedTestCode}
            </pre>

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
              Add to Project
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
