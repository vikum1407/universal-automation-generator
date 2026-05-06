import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFramework } from "../context/FrameworkContext";
import { getNodes, validateCombination } from "../api/framework";
import type { CombinationValidation } from "../context/FrameworkContext";

// ─── Dark mode ────────────────────────────────────────────────────────────────

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FRAMEWORKS = [
  { id: "selenium",    label: "Selenium",     tagline: "Cross-browser automation",  color: "#E25C1D", langs: ["Java", "Python", "TypeScript", "C#"] },
  { id: "playwright",  label: "Playwright",   tagline: "Modern web testing",         color: "#7B5FFF", langs: ["TypeScript", "Python", "Java", "C#"] },
  { id: "cypress",     label: "Cypress",      tagline: "Fast component & E2E tests", color: "#17B26A", langs: ["TypeScript", "JavaScript"] },
  { id: "webdriverio", label: "WebdriverIO",  tagline: "Flexible WDIO automation",   color: "#E8A000", langs: ["TypeScript", "JavaScript"] },
  { id: "appium",      label: "Appium",       tagline: "Mobile & cross-platform",    color: "#2563EB", langs: ["Java", "Python", "TypeScript", "C#"] },
];

const LANGUAGES = [
  { id: "java",       label: "Java",       color: "#E76F00" },
  { id: "typescript", label: "TypeScript", color: "#3178C6" },
  { id: "javascript", label: "JavaScript", color: "#C4A000" },
  { id: "python",     label: "Python",     color: "#3B82F6" },
  { id: "csharp",     label: "C#",         color: "#9B59B6" },
];

// ─── Compatibility badge ──────────────────────────────────────────────────────

function CompatBadge({ combo }: { combo: CombinationValidation | null }) {
  if (!combo) return null;

  const map = {
    supported:   { bg: "#10B98118", border: "#10B98140", text: "#10B981", icon: "✓", label: "Fully supported" },
    partial:     { bg: "#F9731618", border: "#F9731640", text: "#F97316", icon: "⚠", label: "Partial support" },
    unsupported: { bg: "#EF444418", border: "#EF444440", text: "#EF4444", icon: "✗", label: "Not supported"   },
  };
  const s = map[combo.status];

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 14px", borderRadius: 10,
      background: s.bg, border: `1px solid ${s.border}`,
    }}>
      <span style={{ color: s.text, fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{s.icon}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: s.text }}>{s.label}</div>
        {combo.reason && (
          <div style={{ fontSize: 11, color: s.text, opacity: 0.8, marginTop: 2, maxWidth: 440 }}>
            {combo.reason}
          </div>
        )}
        {combo.alternativeLanguages && combo.alternativeLanguages.length > 0 && (
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3, color: s.text }}>
            Try: {combo.alternativeLanguages.join(", ")}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Framework card ───────────────────────────────────────────────────────────

function FrameworkCard({
  fw, selected, onSelect, S,
}: {
  fw: typeof FRAMEWORKS[0];
  selected: boolean;
  onSelect: () => void;
  S: { card: string; border: string; text: string; textMuted: string };
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        padding: "16px 18px", borderRadius: 12, cursor: "pointer",
        border: selected ? `2px solid ${fw.color}` : `1.5px solid ${hovered ? fw.color + "60" : S.border}`,
        background: selected ? `${fw.color}10` : hovered ? `${fw.color}06` : S.card,
        transition: "all 0.15s", textAlign: "left", width: "100%",
        boxShadow: selected ? `0 0 0 3px ${fw.color}18` : "none",
      }}
    >
      {/* Color dot + label */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: fw.color, flexShrink: 0 }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: selected ? fw.color : S.text }}>
          {fw.label}
        </span>
        {selected && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: fw.color,
            background: `${fw.color}18`, border: `1px solid ${fw.color}40`,
            borderRadius: 4, padding: "1px 6px", marginLeft: "auto",
          }}>
            Selected
          </span>
        )}
      </div>
      {/* Tagline */}
      <div style={{ fontSize: 11.5, color: S.textMuted, marginBottom: 8 }}>{fw.tagline}</div>
      {/* Language chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {fw.langs.map(l => (
          <span key={l} style={{
            fontSize: 10, fontWeight: 500,
            padding: "1px 6px", borderRadius: 4,
            background: `${fw.color}14`, color: fw.color,
          }}>{l}</span>
        ))}
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FrameworkStart() {
  const navigate = useNavigate();
  const dark = useDarkMode();
  const { setSelection, setResult, setLoading, setError, loading, error } = useFramework();

  const S = {
    bg:       dark ? "#0D0F14" : "#F8F9FC",
    card:     dark ? "#13151E" : "#FFFFFF",
    border:   dark ? "#1F2333" : "#E5E7EB",
    text:     dark ? "#E2E6F0" : "#111827",
    textMuted:dark ? "#6B7280" : "#6B7280",
    accent:   "#7B5FFF",
  };

  const [selectedFw,   setSelectedFw]   = useState("");
  const [selectedLang, setSelectedLang] = useState("");
  const [combo,        setCombo]        = useState<CombinationValidation | null>(null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError,   setLocalError]   = useState<string | null>(null);

  // Live compatibility check
  useEffect(() => {
    if (!selectedFw || !selectedLang) { setCombo(null); return; }
    let cancelled = false;
    validateCombination(selectedFw, selectedLang)
      .then(data => { if (!cancelled) setCombo(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [selectedFw, selectedLang]);

  const canContinue = selectedFw && selectedLang && combo?.valid !== false;

  const handleContinue = async () => {
    if (!canContinue) return;
    setLocalLoading(true);
    setLocalError(null);
    try {
      const result = await getNodes(selectedFw, selectedLang);
      setSelection({ framework: selectedFw, language: selectedLang });
      setResult(result);
      setLoading(false);
      setError(null);
      navigate("/framework/builder");
    } catch {
      setLocalError("Failed to load nodes. Is the backend running?");
    } finally {
      setLocalLoading(false);
    }
  };

  const selectedFwDef   = FRAMEWORKS.find(f => f.id === selectedFw);
  const selectedLangDef = LANGUAGES.find(l => l.id === selectedLang);

  return (
    <div style={{
      minHeight: "100vh", background: S.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{ width: "100%", maxWidth: 680 }}>

        {/* Header */}
        <div style={{ marginBottom: 36, textAlign: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 14px", borderRadius: 20,
            background: `${S.accent}14`, border: `1px solid ${S.accent}30`,
            fontSize: 11, fontWeight: 700, color: S.accent,
            textTransform: "uppercase", letterSpacing: "0.1em",
            marginBottom: 16,
          }}>
            Step 1 of 5
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: S.text, margin: 0, lineHeight: 1.2 }}>
            Framework Generator
          </h1>
          <p style={{ fontSize: 14, color: S.textMuted, marginTop: 10, lineHeight: 1.6 }}>
            Choose your test framework and language. Qlitz will surface the compatible
            building blocks for your architecture.
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: S.card, borderRadius: 18,
          border: `1px solid ${S.border}`,
          padding: "32px 32px 28px",
          boxShadow: dark ? "0 24px 64px rgba(0,0,0,0.35)" : "0 8px 40px rgba(0,0,0,0.08)",
        }}>

          {/* Framework selection */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Framework
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {FRAMEWORKS.map(fw => (
                <FrameworkCard
                  key={fw.id}
                  fw={fw}
                  selected={selectedFw === fw.id}
                  onSelect={() => { setSelectedFw(fw.id); setSelectedLang(""); setCombo(null); }}
                  S={{ card: S.card, border: S.border, text: S.text, textMuted: S.textMuted }}
                />
              ))}
            </div>
          </div>

          {/* Language selection */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
              Language
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {LANGUAGES.map(lang => {
                const selected = selectedLang === lang.id;
                const fwDef    = FRAMEWORKS.find(f => f.id === selectedFw);
                const compatible = !fwDef || fwDef.langs.some(l => l.toLowerCase() === lang.label.toLowerCase());
                const dimmed = !!selectedFw && !compatible;
                return (
                  <button
                    key={lang.id}
                    onClick={() => !dimmed && setSelectedLang(lang.id)}
                    disabled={dimmed}
                    style={{
                      padding: "8px 18px", borderRadius: 9, cursor: dimmed ? "not-allowed" : "pointer",
                      border: selected ? `2px solid ${lang.color}` : `1.5px solid ${S.border}`,
                      background: selected ? `${lang.color}15` : "transparent",
                      color: dimmed ? S.textMuted : selected ? lang.color : S.text,
                      fontSize: 13, fontWeight: selected ? 700 : 400,
                      opacity: dimmed ? 0.35 : 1,
                      transition: "all 0.13s",
                    }}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Compatibility badge */}
          {combo && (
            <div style={{ marginBottom: 24 }}>
              <CompatBadge combo={combo} />
            </div>
          )}

          {/* Error */}
          {localError && (
            <div style={{
              padding: "10px 14px", borderRadius: 8, marginBottom: 16,
              background: "#EF444415", border: "1px solid #EF444440",
              fontSize: 12, color: "#EF4444",
            }}>
              {localError}
            </div>
          )}

          {/* Selection summary + CTA */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selectedFwDef && (
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                  background: `${selectedFwDef.color}18`, color: selectedFwDef.color,
                  border: `1px solid ${selectedFwDef.color}30`,
                }}>
                  {selectedFwDef.label}
                </span>
              )}
              {selectedLangDef && (
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                  background: `${selectedLangDef.color}18`, color: selectedLangDef.color,
                  border: `1px solid ${selectedLangDef.color}30`,
                }}>
                  {selectedLangDef.label}
                </span>
              )}
              {!selectedFw && !selectedLang && (
                <span style={{ fontSize: 12, color: S.textMuted }}>Select a framework and language above</span>
              )}
            </div>

            <button
              onClick={handleContinue}
              disabled={!canContinue || localLoading}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "11px 24px", borderRadius: 10,
                background: canContinue && !localLoading ? S.accent : S.border,
                color: canContinue && !localLoading ? "#fff" : S.textMuted,
                fontSize: 14, fontWeight: 700,
                border: "none", cursor: canContinue && !localLoading ? "pointer" : "not-allowed",
                transition: "all 0.15s",
                whiteSpace: "nowrap", flexShrink: 0,
              }}
            >
              {localLoading ? "Loading nodes…" : "Continue →"}
            </button>
          </div>
        </div>

        {/* Step hint */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: S.textMuted }}>
          Next: Node Builder · Blueprint Review · Generate · Download
        </div>
      </div>
    </div>
  );
}
