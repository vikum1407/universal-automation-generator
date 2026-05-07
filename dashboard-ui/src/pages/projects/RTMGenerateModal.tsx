import { useState } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import {
  generateRtmTests,
  type GenerateTestsDto, type GenerationResult,
} from "@/api/rtm";

interface Props {
  projectId:  string;
  versionId:  string;
  onClose:    () => void;
  onSuccess?: (result: GenerationResult) => void;
}

const FRAMEWORKS = [
  { value: "playwright",   label: "Playwright" },
  { value: "cypress",      label: "Cypress" },
  { value: "selenium",     label: "Selenium" },
  { value: "restassured",  label: "RestAssured" },
  { value: "webdriverio",  label: "WebdriverIO" },
];

const LANGUAGE_FOR: Record<string, { value: string; label: string }[]> = {
  playwright:  [{ value: "typescript", label: "TypeScript" }, { value: "javascript", label: "JavaScript" }],
  cypress:     [{ value: "typescript", label: "TypeScript" }, { value: "javascript", label: "JavaScript" }],
  selenium:    [{ value: "java", label: "Java" }, { value: "python", label: "Python" }, { value: "typescript", label: "TypeScript" }],
  restassured: [{ value: "java", label: "Java" }],
  webdriverio: [{ value: "typescript", label: "TypeScript" }],
};

const STRATEGIES: { value: GenerateTestsDto["strategy"]; label: string; desc: string }[] = [
  { value: "smoke",      label: "Smoke",      desc: "Happy path only — 1 test per requirement" },
  { value: "regression", label: "Regression", desc: "Positive + negative test cases" },
  { value: "full",       label: "Full",        desc: "Positive, negative + boundary tests" },
];

export function RTMGenerateModal({ projectId, versionId, onClose, onSuccess }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();

  const [framework,    setFramework]    = useState("playwright");
  const [language,     setLanguage]     = useState("typescript");
  const [strategy,     setStrategy]     = useState<GenerateTestsDto["strategy"]>("smoke");
  const [includeUI,    setIncludeUI]    = useState(true);
  const [includeAPI,   setIncludeAPI]   = useState(true);
  const [includeHybrid, setIncludeHybrid] = useState(true);
  const [baseUrl,      setBaseUrl]      = useState("http://localhost:3000");
  const [generating,   setGenerating]   = useState(false);
  const [result,       setResult]       = useState<GenerationResult | null>(null);

  const langs = LANGUAGE_FOR[framework] ?? [{ value: "typescript", label: "TypeScript" }];

  function handleFrameworkChange(fw: string) {
    setFramework(fw);
    const available = LANGUAGE_FOR[fw] ?? [];
    if (!available.find(l => l.value === language)) {
      setLanguage(available[0]?.value ?? "typescript");
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await generateRtmTests(projectId, versionId, {
        framework, language, strategy,
        includeUI, includeAPI, includeHybrid, baseUrl,
      });
      setResult(res);
      toast.success(`Generated ${res.totalFiles} files / ${res.totalTests} tests`);
      onSuccess?.(res);
    } catch {
      toast.error("Generation failed — check server logs");
    } finally {
      setGenerating(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px", borderRadius: 8, fontSize: 12,
    border: `1px solid ${border}`, background: bg, color: text,
    outline: "none", width: "100%", boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: muted,
    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, display: "block",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: surface, border: `1px solid ${border}`, borderRadius: 16,
        padding: 28, width: 520, maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 48px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: 20,
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: text }}>Generate RTM Tests</div>
            <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>
              Creates RTM-tagged test files from your requirement mappings
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", fontSize: 18, color: muted, cursor: "pointer", padding: "2px 6px" }}
          >
            ×
          </button>
        </div>

        {/* Result panel */}
        {result && (
          <div style={{
            background: `#4CAF5012`, border: `1px solid #4CAF5044`, borderRadius: 12,
            padding: "14px 18px", display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4CAF50" }}>
              Generation complete
            </div>
            <div style={{ fontSize: 12, color: muted }}>
              {result.totalFiles} files &nbsp;·&nbsp; {result.totalTests} tests
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              {result.uiFiles     > 0 && <Pill color="#2196F3" label={`UI: ${result.uiFiles}`} />}
              {result.apiFiles    > 0 && <Pill color="#9C27B0" label={`API: ${result.apiFiles}`} />}
              {result.hybridFiles > 0 && <Pill color="#FF9800" label={`Hybrid: ${result.hybridFiles}`} />}
            </div>
            <div style={{ fontSize: 11, color: muted, marginTop: 4, wordBreak: "break-all" }}>
              Output: <code style={{ color: text }}>{result.outputDir}</code>
            </div>
          </div>
        )}

        {/* Framework + Language */}
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Framework</label>
            <select value={framework} onChange={e => handleFrameworkChange(e.target.value)} style={inputStyle}>
              {FRAMEWORKS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} style={inputStyle}>
              {langs.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Strategy */}
        <div>
          <label style={labelStyle}>Test Strategy</label>
          <div style={{ display: "flex", gap: 8 }}>
            {STRATEGIES.map(s => (
              <button
                key={s.value}
                onClick={() => setStrategy(s.value)}
                style={{
                  flex: 1, padding: "10px 8px", borderRadius: 10, fontSize: 12, fontWeight: strategy === s.value ? 700 : 500,
                  border: `1px solid ${strategy === s.value ? P : border}`,
                  background: strategy === s.value ? `${P}1A` : "transparent",
                  color: strategy === s.value ? P : muted, cursor: "pointer", textAlign: "center",
                }}
              >
                <div style={{ fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 10, marginTop: 3, fontWeight: 400 }}>{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Test types */}
        <div>
          <label style={labelStyle}>Include test types</label>
          <div style={{ display: "flex", gap: 10 }}>
            <Toggle active={includeUI}     onChange={setIncludeUI}     label="UI tests"     color="#2196F3" />
            <Toggle active={includeAPI}    onChange={setIncludeAPI}    label="API tests"    color="#9C27B0" />
            <Toggle active={includeHybrid} onChange={setIncludeHybrid} label="Hybrid tests" color="#FF9800" />
          </div>
        </div>

        {/* Base URL */}
        <div>
          <label style={labelStyle}>Base URL</label>
          <input
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            placeholder="http://localhost:3000"
            style={inputStyle}
          />
          <div style={{ fontSize: 10, color: muted, marginTop: 4 }}>
            Used in generated goto / baseURI calls
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${border}`, paddingTop: 16 }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: `1px solid ${border}`, background: "transparent", color: muted, cursor: "pointer",
            }}
          >
            {result ? "Close" : "Cancel"}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || (!includeUI && !includeAPI && !includeHybrid)}
            style={{
              padding: "9px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: "none", cursor: generating ? "not-allowed" : "pointer",
              background: generating ? "#ccc" : P, color: "#fff",
            }}
          >
            {generating ? "Generating…" : result ? "Re-generate" : "Generate Tests"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ active, onChange, label, color }: { active: boolean; onChange: (v: boolean) => void; label: string; color: string }) {
  const { BDR: border, TXT2: muted } = useColors();
  return (
    <button
      onClick={() => onChange(!active)}
      style={{
        flex: 1, padding: "8px 10px", borderRadius: 8, fontSize: 11, fontWeight: active ? 700 : 500,
        border: `1px solid ${active ? color : border}`,
        background: active ? `${color}18` : "transparent",
        color: active ? color : muted, cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6, justifyContent: "center",
      }}
    >
      <span style={{ fontSize: 14 }}>{active ? "✓" : "○"}</span>
      {label}
    </button>
  );
}

function Pill({ color, label }: { color: string; label: string }) {
  return (
    <div style={{
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}44`,
    }}>
      {label}
    </div>
  );
}
