import { useEffect, useState } from "react";

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
      <h3 style={{ color: "#7B2FF7" }}>AI Suggested Tests</h3>

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
            <strong style={{ color: "#7B2FF7" }}>
              {s.requirement?.description}
            </strong>

            <p style={{ marginTop: "8px", fontSize: "12px", color: "#555" }}>
              Proposed Test: {s.proposedTestName}
            </p>

            <pre
              style={{
                background: "#fff",
                padding: "12px",
                borderRadius: "8px",
                marginTop: "12px",
                fontSize: "12px"
              }}
            >
              {s.proposedTestCode}
            </pre>

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
              Add to Project
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
