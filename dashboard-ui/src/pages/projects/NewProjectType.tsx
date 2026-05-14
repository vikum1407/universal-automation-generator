import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ─── Dark mode ────────────────────────────────────────────────────────────────

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark"))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconUI({ color }: { color: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="3" y="5" width="30" height="20" rx="3" stroke={color} strokeWidth="2" fill={color + "14"} />
      <rect x="8" y="10" width="20" height="3" rx="1.5" fill={color} opacity="0.5" />
      <rect x="8" y="15" width="14" height="3" rx="1.5" fill={color} opacity="0.35" />
      <path d="M14 25v4M10 29h16" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconAPI({ color }: { color: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="13" stroke={color} strokeWidth="2" fill={color + "14"} />
      <path d="M13 13l4 5-4 5M19 23h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Project type definitions ──────────────────────────────────────────────────

const PROJECT_TYPES = [
  {
    id:          "ui",
    route:       "/projects/new/ui",
    color:       "#7B5FFF",
    label:       "UI Automation",
    tagline:     "Crawl your website, generate Page Objects and full test coverage.",
    description: "Qlitz launches a headless browser, crawls up to 20 pages, discovers forms and interactions, then scaffolds a complete test framework with real selectors.",
    icon:        (c: string) => <IconUI color={c} />,
    frameworks:  ["Selenium", "Playwright", "Cypress", "WebdriverIO"],
    tag:         "Website · Page Objects · E2E",
  },
  {
    id:          "api",
    route:       "/projects/new/api",
    color:       "#10B981",
    label:       "API Automation",
    tagline:     "Feed a Swagger spec, get 100% endpoint coverage — positive and negative.",
    description: "Point Qlitz at your OpenAPI 3.x or Swagger 2.0 spec and it generates typed API tests for every endpoint, including schema validation and error-path assertions.",
    icon:        (c: string) => <IconAPI color={c} />,
    frameworks:  ["REST Assured", "Playwright"],
    tag:         "Swagger · OpenAPI · REST",
  },
];

// ─── Card ─────────────────────────────────────────────────────────────────────

function TypeCard({
  type, dark, onClick,
}: {
  type: typeof PROJECT_TYPES[0];
  dark: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const S = {
    card:      dark ? "#13151E" : "#FFFFFF",
    border:    dark ? "#1F2333" : "#E5E7EB",
    text:      dark ? "#E2E6F0" : "#111827",
    textMuted: dark ? "#6B7280" : "#6B7280",
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        padding: "28px 28px 24px", borderRadius: 16, textAlign: "left",
        width: "100%", cursor: "pointer",
        border: hovered ? `1.5px solid ${type.color}60` : `1.5px solid ${S.border}`,
        background: hovered ? `${type.color}07` : S.card,
        boxShadow: hovered
          ? `0 8px 32px ${type.color}18`
          : dark ? "0 2px 12px rgba(0,0,0,0.25)" : "0 2px 12px rgba(0,0,0,0.06)",
        transition: "all 0.18s",
      }}
    >
      {/* Category tag */}
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        color: type.color, marginBottom: 16,
        padding: "3px 10px", borderRadius: 20,
        background: `${type.color}14`, border: `1px solid ${type.color}28`,
      }}>
        {type.tag}
      </div>

      {/* Icon + title row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 60, height: 60, borderRadius: 14,
          background: `${type.color}10`, border: `1.5px solid ${type.color}28`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {type.icon(type.color)}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: S.text, lineHeight: 1.2 }}>
            {type.label}
          </div>
          <div style={{ fontSize: 12, color: type.color, fontWeight: 600, marginTop: 3 }}>
            {type.tagline}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: 13, color: S.textMuted, lineHeight: 1.7, marginBottom: 20 }}>
        {type.description}
      </div>

      {/* Framework pills + arrow */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {type.frameworks.map(fw => (
            <span key={fw} style={{
              fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 5,
              background: `${type.color}12`, color: type.color,
              border: `1px solid ${type.color}25`,
            }}>
              {fw}
            </span>
          ))}
        </div>
        <span style={{
          fontSize: 18, color: hovered ? type.color : S.textMuted,
          fontWeight: 700, transition: "color 0.15s", flexShrink: 0, marginLeft: 12,
        }}>
          →
        </span>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewProjectType() {
  const navigate = useNavigate();
  const dark     = useDarkMode();

  const S = {
    bg:        dark ? "#0D0F14" : "#F8F9FC",
    text:      dark ? "#E2E6F0" : "#111827",
    textMuted: dark ? "#6B7280" : "#6B7280",
    accent:    "#7B5FFF",
  };

  return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ width: "100%", maxWidth: 800 }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "4px 12px", borderRadius: 20, marginBottom: 12,
            background: `${S.accent}12`, border: `1px solid ${S.accent}28`,
            fontSize: 10, fontWeight: 700, color: S.accent,
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            New Project
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: S.text, margin: "0 0 10px", lineHeight: 1.2 }}>
            What are you testing?
          </h1>
          <p style={{ fontSize: 14, color: S.textMuted, lineHeight: 1.7, margin: 0 }}>
            Choose a project type. Qlitz will crawl or parse your spec, then let you pick a framework and generate the full test scaffold.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {PROJECT_TYPES.map(type => (
            <TypeCard
              key={type.id}
              type={type}
              dark={dark}
              onClick={() => navigate(type.route)}
            />
          ))}
        </div>

        {/* Footer hint */}
        <div style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: S.textMuted }}>
          You can also go straight to the{" "}
          <button
            onClick={() => navigate("/framework/start")}
            style={{ background: "none", border: "none", cursor: "pointer", color: S.accent, fontWeight: 600, fontSize: 12, padding: 0 }}
          >
            ⬡ Framework Generator
          </button>
          {" "}to scaffold a framework without a project scan.
        </div>

      </div>
    </div>
  );
}
