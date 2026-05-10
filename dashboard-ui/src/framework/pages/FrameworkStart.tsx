import { useState, useEffect, useRef } from "react";
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
  { id: "selenium",    label: "Selenium",     tagline: "Cross-browser UI automation",   color: "#E25C1D", langs: ["Java", "Python", "TypeScript", "C#"], apiOnly: false },
  { id: "playwright",  label: "Playwright",   tagline: "Modern web testing",             color: "#7B5FFF", langs: ["TypeScript", "Python", "Java", "C#"], apiOnly: false },
  { id: "cypress",     label: "Cypress",      tagline: "Fast component & E2E tests",     color: "#17B26A", langs: ["TypeScript", "JavaScript"],           apiOnly: false },
  { id: "webdriverio", label: "WebdriverIO",  tagline: "Flexible WDIO automation",       color: "#E8A000", langs: ["TypeScript", "JavaScript"],           apiOnly: false },
  { id: "appium",      label: "Appium",       tagline: "Mobile & cross-platform",        color: "#2563EB", langs: ["Java", "Python", "TypeScript", "C#"], apiOnly: false },
  { id: "restassured", label: "REST Assured", tagline: "Swagger-driven API test suite",  color: "#10B981", langs: ["Java"],                              apiOnly: true  },
];

const LANGUAGES = [
  { id: "java",       label: "Java",       color: "#E76F00" },
  { id: "typescript", label: "TypeScript", color: "#3178C6" },
  { id: "javascript", label: "JavaScript", color: "#C4A000" },
  { id: "python",     label: "Python",     color: "#3B82F6" },
  { id: "csharp",     label: "C#",         color: "#9B59B6" },
];

const COVERAGE_OPTIONS: { id: "smoke" | "functional"; label: string; desc: string }[] = [
  { id: "smoke",      label: "Smoke",      desc: "Status code verification for every endpoint — fast, CI-friendly gate check." },
  { id: "functional", label: "Functional", desc: "Status + schema + auth failure + empty-body validation — full regression suite." },
];

const DATA_OPTIONS: { id: "faker" | "custom" | "csv" | "json"; label: string; desc: string; forFw?: string[] }[] = [
  { id: "faker",  label: "Faker (auto-generate)",    desc: "Qlitz generates realistic test data automatically using Faker." },
  { id: "custom", label: "Custom (inject your own)", desc: "After generating, replace the rows in testdata/ with your own bulk CSV data before running.", forFw: ["restassured"] },
  { id: "csv",    label: "CSV (bulk test data)",      desc: "Tests load data from testdata/*.csv — drop in your own rows and re-run for bulk coverage.", forFw: ["playwright"] },
  { id: "json",   label: "JSON (structured data)",   desc: "Tests load data from testdata/*.json — ideal for nested or complex request bodies.", forFw: ["playwright"] },
];

const PW_MODES: { id: "ui" | "api" | "hybrid"; label: string; icon: string; desc: string }[] = [
  { id: "ui",     icon: "🖥",  label: "UI Automation",     desc: "Crawls your website URL and generates Page Object classes + full positive/negative test coverage for every page." },
  { id: "api",    icon: "⚡",  label: "API Automation",    desc: "Swagger-driven — generates typed API tests with 100% positive and negative functional coverage per endpoint." },
  { id: "hybrid", icon: "🔀",  label: "Hybrid (UI + API)", desc: "Both in one project — shared auth fixture, separate test directories, single playwright.config.ts." },
];

// ─── Compatibility badge ───────────────────────────────────────────────────────

function CompatBadge({ combo }: { combo: CombinationValidation | null }) {
  if (!combo) return null;
  const map = {
    supported:   { bg: "#10B98118", border: "#10B98140", text: "#10B981", icon: "✓", label: "Fully supported" },
    partial:     { bg: "#F9731618", border: "#F9731640", text: "#F97316", icon: "⚠", label: "Partial support" },
    unsupported: { bg: "#EF444418", border: "#EF444440", text: "#EF4444", icon: "✗", label: "Not supported"   },
  };
  const s = map[combo.status];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 10, background: s.bg, border: `1px solid ${s.border}` }}>
      <span style={{ color: s.text, fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>{s.icon}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: s.text }}>{s.label}</div>
        {combo.reason && <div style={{ fontSize: 11, color: s.text, opacity: 0.8, marginTop: 2, maxWidth: 440 }}>{combo.reason}</div>}
        {combo.alternativeLanguages?.length ? (
          <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3, color: s.text }}>Try: {combo.alternativeLanguages.join(", ")}</div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Framework card ───────────────────────────────────────────────────────────

function FrameworkCard({ fw, selected, onSelect, S }: {
  fw: typeof FRAMEWORKS[0]; selected: boolean; onSelect: () => void;
  S: { card: string; border: string; text: string; textMuted: string };
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onSelect} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{
      display: "flex", flexDirection: "column", alignItems: "flex-start",
      padding: "14px 16px", borderRadius: 12, cursor: "pointer",
      border: selected ? `2px solid ${fw.color}` : `1.5px solid ${hovered ? fw.color + "60" : S.border}`,
      background: selected ? `${fw.color}10` : hovered ? `${fw.color}06` : S.card,
      transition: "all 0.15s", textAlign: "left", width: "100%",
      boxShadow: selected ? `0 0 0 3px ${fw.color}18` : "none", position: "relative",
    }}>
      {fw.apiOnly && (
        <span style={{ position: "absolute", top: 8, right: 8, fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: `${fw.color}18`, color: fw.color, border: `1px solid ${fw.color}30` }}>API</span>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: fw.color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: selected ? fw.color : S.text }}>{fw.label}</span>
      </div>
      <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 7 }}>{fw.tagline}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {fw.langs.map(l => <span key={l} style={{ fontSize: 9, fontWeight: 500, padding: "1px 5px", borderRadius: 3, background: `${fw.color}14`, color: fw.color }}>{l}</span>)}
      </div>
    </button>
  );
}

// ─── Spec validation result panel ─────────────────────────────────────────────

interface SpecIssue { severity: "error" | "warning" | "info"; code: string; message: string; endpoint?: string; }
interface ValidationResult {
  valid: boolean; canGenerate: boolean;
  errors: SpecIssue[]; warnings: SpecIssue[]; info: SpecIssue[];
  stats?: { totalEndpoints: number; endpointsCovered: number; missingStatus: number; missingBodySchema: number; missingParamTypes: number };
  summary?: { baseUrl: string; title: string; version: string } | null;
}

function SpecValidationPanel({ result, api, dark, S }: { result: ValidationResult; api: string; dark: boolean; S: any }) {
  const [expandWarnings, setExpandWarnings] = useState(false);
  const [expandInfo,     setExpandInfo]     = useState(false);

  const statusColor = result.errors.length > 0 ? "#EF4444" : result.warnings.length > 0 ? "#F97316" : "#10B981";
  const statusIcon  = result.errors.length > 0 ? "✗" : result.warnings.length > 0 ? "⚠" : "✓";
  const statusLabel = result.errors.length > 0 ? "Cannot generate — fix errors first" : result.warnings.length > 0 ? "Ready with warnings" : "Spec validated — ready to generate";

  return (
    <div style={{ borderRadius: 10, border: `1.5px solid ${statusColor}30`, overflow: "hidden", background: dark ? "#0D0F14" : "#F9FAFB" }}>
      {/* Status bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: `${statusColor}10`, borderBottom: `1px solid ${statusColor}20` }}>
        <span style={{ fontSize: 16, color: statusColor }}>{statusIcon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{statusLabel}</div>
          {result.summary && (
            <div style={{ fontSize: 11, color: S.textMuted, marginTop: 1 }}>
              {result.summary.title} v{result.summary.version} · {result.stats?.totalEndpoints ?? 0} endpoints · Base URL: {result.summary.baseUrl}
            </div>
          )}
        </div>
        {result.stats && (
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#EF444420", color: "#EF4444" }}>{result.errors.length} error{result.errors.length !== 1 ? "s" : ""}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#F9731620", color: "#F97316" }}>{result.warnings.length} warning{result.warnings.length !== 1 ? "s" : ""}</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "#3B82F620", color: "#3B82F6" }}>{result.info.length} info</span>
          </div>
        )}
      </div>

      {/* Issues */}
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {result.errors.map((e, i) => (
          <IssueRow key={i} issue={e} S={S} />
        ))}

        {result.warnings.length > 0 && (
          <>
            <button onClick={() => setExpandWarnings(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, color: "#F97316", fontSize: 11, fontWeight: 700 }}>
              <span>{expandWarnings ? "▾" : "▸"}</span> {result.warnings.length} warning{result.warnings.length !== 1 ? "s" : ""} — tests generated with TODO comments where spec is incomplete
            </button>
            {expandWarnings && result.warnings.map((w, i) => <IssueRow key={i} issue={w} S={S} />)}
          </>
        )}

        {result.info.length > 0 && (
          <>
            <button onClick={() => setExpandInfo(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, color: "#3B82F6", fontSize: 11, fontWeight: 700 }}>
              <span>{expandInfo ? "▾" : "▸"}</span> {result.info.length} suggestion{result.info.length !== 1 ? "s" : ""}
            </button>
            {expandInfo && result.info.map((info, i) => <IssueRow key={i} issue={info} S={S} />)}
          </>
        )}

        {result.errors.length === 0 && result.warnings.length === 0 && result.info.length === 0 && (
          <div style={{ fontSize: 12, color: "#10B981" }}>Spec is fully documented. Generated tests will have precise assertions.</div>
        )}
      </div>
    </div>
  );
}

function IssueRow({ issue, S }: { issue: SpecIssue; S: any }) {
  const colMap = { error: "#EF4444", warning: "#F97316", info: "#3B82F6" };
  const color = colMap[issue.severity];
  return (
    <div style={{ display: "flex", gap: 8, padding: "7px 10px", borderRadius: 7, background: `${color}08`, border: `1px solid ${color}20` }}>
      <span style={{ fontSize: 10, fontWeight: 700, color, flexShrink: 0, paddingTop: 1 }}>{issue.severity.toUpperCase()}</span>
      <div>
        {issue.endpoint && <div style={{ fontSize: 10, fontWeight: 700, color: S.textMuted, marginBottom: 2 }}>{issue.endpoint}</div>}
        <div style={{ fontSize: 11, color: S.text }}>{issue.message}</div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FrameworkStart() {
  const navigate    = useNavigate();
  const dark        = useDarkMode();
  const { setSelection, setResult } = useFramework();

  const S = {
    bg:        dark ? "#0D0F14" : "#F8F9FC",
    card:      dark ? "#13151E" : "#FFFFFF",
    border:    dark ? "#1F2333" : "#E5E7EB",
    text:      dark ? "#E2E6F0" : "#111827",
    textMuted: dark ? "#6B7280" : "#6B7280",
    input:     dark ? "#0D0F14" : "#F9FAFB",
    accent:    "#7B5FFF",
    api:       "#10B981",
  };

  const [selectedFw,   setSelectedFw]   = useState("");
  const [selectedLang, setSelectedLang] = useState("");
  const [combo,        setCombo]        = useState<CombinationValidation | null>(null);

  // Shared API fields (REST Assured + Playwright API/Hybrid)
  const [specSource,         setSpecSource]         = useState<"url" | "file">("url");
  const [swaggerUrl,         setSwaggerUrl]         = useState("");
  const [swaggerFileContent, setSwaggerFileContent] = useState<string | null>(null);
  const [swaggerFileName,    setSwaggerFileName]    = useState<string | null>(null);
  const [coverageLevel,      setCoverageLevel]      = useState<"smoke" | "functional">("functional");
  const [testDataStrategy,   setTestDataStrategy]   = useState<"faker" | "custom" | "csv" | "json">("faker");

  // Playwright-specific fields
  const [playwrightMode, setPlaywrightMode] = useState<"ui" | "api" | "hybrid">("ui");
  const [websiteUrl,     setWebsiteUrl]     = useState("");

  // Validation state
  const [validating,        setValidating]        = useState(false);
  const [validationResult,  setValidationResult]  = useState<ValidationResult | null>(null);
  const [validationError,   setValidationError]   = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isApiFramework        = selectedFw === "restassured";
  const isPlaywrightFramework = selectedFw === "playwright";
  const pwNeedsSwagger        = isPlaywrightFramework && (playwrightMode === "api" || playwrightMode === "hybrid");
  const pwNeedsWebsite        = isPlaywrightFramework && (playwrightMode === "ui" || playwrightMode === "hybrid");
  const needsSwagger          = isApiFramework || pwNeedsSwagger;

  // Auto-select Java for REST Assured; TypeScript for Playwright
  useEffect(() => { if (isApiFramework) setSelectedLang("java"); }, [isApiFramework]);
  useEffect(() => { if (isPlaywrightFramework && !selectedLang) setSelectedLang("typescript"); }, [isPlaywrightFramework, selectedLang]);

  // Reset validation when spec source changes
  useEffect(() => { setValidationResult(null); setValidationError(null); }, [specSource, swaggerUrl, swaggerFileContent]);

  // Live compatibility check for non-API frameworks (skip Playwright — always compatible)
  useEffect(() => {
    if (!selectedFw || !selectedLang || isApiFramework || isPlaywrightFramework) { setCombo(null); return; }
    let cancelled = false;
    validateCombination(selectedFw, selectedLang).then(data => { if (!cancelled) setCombo(data); }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedFw, selectedLang, isApiFramework, isPlaywrightFramework]);

  const fwDef   = FRAMEWORKS.find(f => f.id === selectedFw);
  const langDef = LANGUAGES.find(l => l.id === selectedLang);

  const hasSpec      = specSource === "url" ? !!swaggerUrl.trim() : !!swaggerFileContent;
  const canValidate  = needsSwagger && hasSpec && !validating;
  const pwCanContinue = isPlaywrightFramework && !!selectedLang && (
    (playwrightMode === "ui"     && !!websiteUrl.trim()) ||
    (playwrightMode === "api"    && (validationResult?.canGenerate ?? false)) ||
    (playwrightMode === "hybrid" && !!websiteUrl.trim() && (validationResult?.canGenerate ?? false))
  );
  const canContinue = isApiFramework
    ? (validationResult?.canGenerate ?? false)
    : isPlaywrightFramework
      ? pwCanContinue
      : !!selectedFw && !!selectedLang && combo?.valid !== false;

  // ── File upload handler ─────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(json|yaml|yml)$/i)) {
      setValidationError("Only .json, .yaml, or .yml files are supported.");
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      setSwaggerFileContent(ev.target?.result as string ?? null);
      setSwaggerFileName(file.name);
    };
    reader.readAsText(file);
  };

  // ── Spec validator ─────────────────────────────────────────────────────────

  const handleValidate = async () => {
    setValidating(true);
    setValidationResult(null);
    setValidationError(null);
    try {
      const body = specSource === "url"
        ? { url: swaggerUrl.trim() }
        : { content: swaggerFileContent };
      const res = await fetch("http://localhost:3000/framework/swagger/validate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Validation request failed (${res.status})`);
      const data: ValidationResult = await res.json();
      setValidationResult(data);
    } catch (err: any) {
      setValidationError(err?.message ?? "Validation request failed. Is the backend running?");
    } finally {
      setValidating(false);
    }
  };

  // ── Continue ────────────────────────────────────────────────────────────────

  const handleContinue = async () => {
    if (!canContinue) return;
    setLoading(true);
    setError(null);
    try {
      const fw   = isApiFramework ? "restassured" : selectedFw;
      const lang = isApiFramework ? "java" : selectedLang;
      const result = await getNodes(fw, lang);
      setSelection({
        framework: fw,
        language:  lang,
        ...(isApiFramework && {
          swaggerUrl:       specSource === "url"  ? swaggerUrl.trim() : undefined,
          swaggerFile:      specSource === "file" ? swaggerFileContent ?? undefined : undefined,
          coverageLevel,
          testDataStrategy,
        }),
        ...(isPlaywrightFramework && {
          playwrightMode,
          coverageLevel,
          websiteUrl:       pwNeedsWebsite ? websiteUrl.trim() : undefined,
          swaggerUrl:       pwNeedsSwagger && specSource === "url"  ? swaggerUrl.trim() : undefined,
          swaggerFile:      pwNeedsSwagger && specSource === "file" ? swaggerFileContent ?? undefined : undefined,
          testDataStrategy: pwNeedsSwagger ? testDataStrategy : undefined,
        }),
      });
      setResult(result);
      navigate("/framework/builder");
    } catch (err: any) {
      setError(err?.message ?? "Failed to load nodes. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
      <div style={{ width: "100%", maxWidth: 720 }}>

        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, background: `${S.accent}14`, border: `1px solid ${S.accent}30`, fontSize: 11, fontWeight: 700, color: S.accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
            Step 1 of 5
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: S.text, margin: 0, lineHeight: 1.2 }}>Framework Generator</h1>
          <p style={{ fontSize: 13, color: S.textMuted, marginTop: 8, lineHeight: 1.6 }}>
            {isApiFramework
              ? "REST Assured — Swagger-driven API test suite. One download, one mvn test, 100% coverage."
              : isPlaywrightFramework
                ? "Playwright — modern automation. Choose UI (crawler-driven), API (Swagger-driven), or Hybrid."
                : "Choose your test framework and language. Qlitz surfaces the compatible building blocks for your architecture."}
          </p>
        </div>

        {/* Card */}
        <div style={{ background: S.card, borderRadius: 18, border: `1px solid ${S.border}`, padding: "28px 28px 24px", boxShadow: dark ? "0 24px 64px rgba(0,0,0,0.35)" : "0 8px 40px rgba(0,0,0,0.08)" }}>

          {/* Framework selection */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Framework</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {FRAMEWORKS.map(fw => (
                <FrameworkCard key={fw.id} fw={fw} selected={selectedFw === fw.id}
                  onSelect={() => { setSelectedFw(fw.id); if (!fw.apiOnly) setSelectedLang(""); setCombo(null); setValidationResult(null); }}
                  S={{ card: S.card, border: S.border, text: S.text, textMuted: S.textMuted }} />
              ))}
            </div>
          </div>

          {/* Language — hidden for REST Assured; TS/JS only for Playwright */}
          {!isApiFramework && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Language</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {LANGUAGES.map(lang => {
                  const selected   = selectedLang === lang.id;
                  const pwOnly     = isPlaywrightFramework && !["typescript", "javascript"].includes(lang.id);
                  const compatible = !fwDef || fwDef.langs.some(l => l.toLowerCase() === lang.label.toLowerCase());
                  const dimmed     = !!selectedFw && (!compatible || pwOnly);
                  return (
                    <button key={lang.id} onClick={() => !dimmed && setSelectedLang(lang.id)} disabled={dimmed} style={{
                      padding: "7px 16px", borderRadius: 9, cursor: dimmed ? "not-allowed" : "pointer",
                      border: selected ? `2px solid ${lang.color}` : `1.5px solid ${S.border}`,
                      background: selected ? `${lang.color}15` : "transparent",
                      color: dimmed ? S.textMuted : selected ? lang.color : S.text,
                      fontSize: 12, fontWeight: selected ? 700 : 400, opacity: dimmed ? 0.35 : 1, transition: "all 0.13s",
                    }}>{lang.label}</button>
                  );
                })}
              </div>
              {isPlaywrightFramework && (
                <div style={{ fontSize: 11, color: S.textMuted, marginTop: 6 }}>Playwright supports TypeScript and JavaScript only.</div>
              )}
            </div>
          )}

          {/* Compatibility badge */}
          {!isApiFramework && !isPlaywrightFramework && combo && <div style={{ marginBottom: 22 }}><CompatBadge combo={combo} /></div>}

          {/* ─── Playwright fields ────────────────────────────────────────────── */}
          {isPlaywrightFramework && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Mode selector */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Automation Mode</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {PW_MODES.map(m => (
                    <label key={m.id} onClick={() => setPlaywrightMode(m.id)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", borderRadius: 10, cursor: "pointer", background: playwrightMode === m.id ? `${S.accent}0a` : S.bg, border: `1.5px solid ${playwrightMode === m.id ? S.accent + "60" : S.border}`, transition: "all 0.15s" }}>
                      <input type="radio" name="pwMode" checked={playwrightMode === m.id} onChange={() => setPlaywrightMode(m.id)} style={{ marginTop: 3, accentColor: S.accent, cursor: "pointer" }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: playwrightMode === m.id ? S.accent : S.text }}>{m.icon} {m.label}</div>
                        <div style={{ fontSize: 11, color: S.textMuted, marginTop: 3 }}>{m.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Website URL — shown for UI + Hybrid */}
              {pwNeedsWebsite && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Website URL</div>
                  <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                    placeholder="https://your-app.com"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${websiteUrl ? S.accent + "60" : S.border}`, background: S.input, color: S.text, fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }} />
                  <div style={{ fontSize: 11, color: S.textMuted, marginTop: 5 }}>
                    Qlitz will crawl this URL (up to 20 pages) to discover pages, forms, and elements, then generate Page Objects and 100% functional test coverage.
                  </div>
                </div>
              )}

              {/* Swagger spec — shown for API + Hybrid */}
              {pwNeedsSwagger && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>API Specification (Swagger / OpenAPI)</div>

                  <div style={{ display: "flex", gap: 0, marginBottom: 12, borderRadius: 8, overflow: "hidden", border: `1px solid ${S.border}`, width: "fit-content" }}>
                    {(["url", "file"] as const).map(tab => (
                      <button key={tab} onClick={() => setSpecSource(tab)} style={{
                        padding: "7px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
                        background: specSource === tab ? S.accent : "transparent",
                        color: specSource === tab ? "#fff" : S.textMuted,
                        transition: "all 0.15s",
                      }}>
                        {tab === "url" ? "Spec URL" : "Upload File"}
                      </button>
                    ))}
                  </div>

                  {specSource === "url" && (
                    <>
                      <input type="url" value={swaggerUrl} onChange={e => setSwaggerUrl(e.target.value)}
                        placeholder="https://api.example.com/v3/api-docs"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${swaggerUrl ? S.accent + "60" : S.border}`, background: S.input, color: S.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                      <div style={{ fontSize: 11, color: S.textMuted, marginTop: 5 }}>Accepts OpenAPI 3.x or Swagger 2.0 — JSON or YAML.</div>
                    </>
                  )}
                  {specSource === "file" && (
                    <>
                      <input ref={fileInputRef} type="file" accept=".json,.yaml,.yml" onChange={handleFileUpload} style={{ display: "none" }} />
                      <button onClick={() => fileInputRef.current?.click()} style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "14px 16px", borderRadius: 9,
                        border: `1.5px dashed ${swaggerFileContent ? S.accent + "80" : S.border}`,
                        background: swaggerFileContent ? `${S.accent}08` : S.input, cursor: "pointer",
                        color: swaggerFileContent ? S.accent : S.textMuted, fontSize: 12, textAlign: "left",
                      }}>
                        <span style={{ fontSize: 20 }}>📄</span>
                        <div>
                          <div style={{ fontWeight: 600 }}>{swaggerFileName ?? "Click to upload .json, .yaml or .yml"}</div>
                          <div style={{ fontSize: 10, marginTop: 2 }}>{swaggerFileContent ? "File loaded — click Validate Spec" : "OpenAPI 3.x or Swagger 2.0"}</div>
                        </div>
                      </button>
                    </>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                    <button onClick={handleValidate} disabled={!canValidate} style={{
                      padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: canValidate ? "pointer" : "not-allowed",
                      background: canValidate ? `${S.accent}15` : S.border, color: canValidate ? S.accent : S.textMuted,
                      border: `1px solid ${canValidate ? S.accent + "40" : S.border}`, transition: "all 0.15s",
                    }}>
                      {validating ? "Validating…" : "Validate Spec"}
                    </button>
                  </div>

                  {validationError && (
                    <div style={{ marginTop: 10, padding: "9px 12px", borderRadius: 8, background: "#EF444415", border: "1px solid #EF444430", fontSize: 11, color: "#EF4444" }}>{validationError}</div>
                  )}
                  {validationResult && (
                    <div style={{ marginTop: 12 }}><SpecValidationPanel result={validationResult} api={S.accent} dark={dark} S={S} /></div>
                  )}
                </div>
              )}

              {/* Coverage Level — shown for ALL Playwright modes */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Coverage Level</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {COVERAGE_OPTIONS.map(opt => (
                    <label key={opt.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 8, cursor: "pointer", background: coverageLevel === opt.id ? `${S.accent}0a` : S.bg, border: `1px solid ${coverageLevel === opt.id ? S.accent + "44" : S.border}` }}>
                      <input type="radio" name="coverage" checked={coverageLevel === opt.id} onChange={() => setCoverageLevel(opt.id)} style={{ marginTop: 2, accentColor: S.accent, cursor: "pointer" }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: S.text }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Data Strategy — shown for API + Hybrid only (UI tests use faker inline) */}
              {pwNeedsSwagger && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Test Data Strategy</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {DATA_OPTIONS.filter(o => !o.forFw || o.forFw.includes("playwright")).map(opt => (
                      <label key={opt.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 8, cursor: "pointer", background: testDataStrategy === opt.id ? `${S.accent}0a` : S.bg, border: `1px solid ${testDataStrategy === opt.id ? S.accent + "44" : S.border}` }}>
                        <input type="radio" name="testdata" checked={testDataStrategy === opt.id} onChange={() => setTestDataStrategy(opt.id as any)} style={{ marginTop: 2, accentColor: S.accent, cursor: "pointer" }} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: S.text }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── REST Assured fields ───────────────────────────────────────────── */}
          {isApiFramework && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Spec source: URL vs File toggle */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  API Specification
                </div>

                {/* Tab toggle */}
                <div style={{ display: "flex", gap: 0, marginBottom: 12, borderRadius: 8, overflow: "hidden", border: `1px solid ${S.border}`, width: "fit-content" }}>
                  {(["url", "file"] as const).map(tab => (
                    <button key={tab} onClick={() => setSpecSource(tab)} style={{
                      padding: "7px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
                      background: specSource === tab ? S.api : "transparent",
                      color: specSource === tab ? "#fff" : S.textMuted,
                      transition: "all 0.15s",
                    }}>
                      {tab === "url" ? "Spec URL" : "Upload File"}
                    </button>
                  ))}
                </div>

                {/* URL input */}
                {specSource === "url" && (
                  <>
                    <input type="url" value={swaggerUrl} onChange={e => setSwaggerUrl(e.target.value)}
                      placeholder="https://api.example.com/v3/api-docs"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 9, border: `1.5px solid ${swaggerUrl ? S.api + "60" : S.border}`, background: S.input, color: S.text, fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }} />
                    <div style={{ fontSize: 11, color: S.textMuted, marginTop: 5 }}>
                      Accepts OpenAPI 3.x or Swagger 2.0 — JSON or YAML.
                    </div>
                  </>
                )}

                {/* File upload */}
                {specSource === "file" && (
                  <>
                    <input ref={fileInputRef} type="file" accept=".json,.yaml,.yml" onChange={handleFileUpload} style={{ display: "none" }} />
                    <button onClick={() => fileInputRef.current?.click()} style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "14px 16px", borderRadius: 9,
                      border: `1.5px dashed ${swaggerFileContent ? S.api + "80" : S.border}`,
                      background: swaggerFileContent ? `${S.api}08` : S.input, cursor: "pointer",
                      color: swaggerFileContent ? S.api : S.textMuted, fontSize: 12, textAlign: "left",
                    }}>
                      <span style={{ fontSize: 20 }}>📄</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{swaggerFileName ?? "Click to upload .json, .yaml or .yml"}</div>
                        <div style={{ fontSize: 10, marginTop: 2 }}>{swaggerFileContent ? "File loaded — click Validate Spec to check it" : "OpenAPI 3.x or Swagger 2.0"}</div>
                      </div>
                    </button>
                  </>
                )}

                {/* Validate Spec button */}
                <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                  <button onClick={handleValidate} disabled={!canValidate} style={{
                    padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: canValidate ? "pointer" : "not-allowed",
                    background: canValidate ? `${S.api}15` : S.border, color: canValidate ? S.api : S.textMuted,
                    border: `1px solid ${canValidate ? S.api + "40" : S.border}`, transition: "all 0.15s",
                  }}>
                    {validating ? "Validating…" : "Validate Spec"}
                  </button>
                  {validating && <span style={{ fontSize: 11, color: S.textMuted }}>Fetching and parsing spec…</span>}
                </div>

                {/* Validation error */}
                {validationError && (
                  <div style={{ marginTop: 10, padding: "9px 12px", borderRadius: 8, background: "#EF444415", border: "1px solid #EF444430", fontSize: 11, color: "#EF4444" }}>
                    {validationError}
                  </div>
                )}

                {/* Validation result */}
                {validationResult && (
                  <div style={{ marginTop: 12 }}>
                    <SpecValidationPanel result={validationResult} api={S.api} dark={dark} S={S} />
                  </div>
                )}
              </div>

              {/* Coverage level */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Coverage Level</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {COVERAGE_OPTIONS.map(opt => (
                    <label key={opt.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 8, cursor: "pointer", background: coverageLevel === opt.id ? `${S.api}0a` : S.bg, border: `1px solid ${coverageLevel === opt.id ? S.api + "44" : S.border}` }}>
                      <input type="radio" name="coverage" checked={coverageLevel === opt.id} onChange={() => setCoverageLevel(opt.id)} style={{ marginTop: 2, accentColor: S.api, cursor: "pointer" }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: S.text }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Test data strategy */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: S.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Test Data Strategy</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {DATA_OPTIONS.filter(o => !o.forFw || o.forFw.includes("restassured")).map(opt => (
                    <label key={opt.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 8, cursor: "pointer", background: testDataStrategy === opt.id ? `${S.api}0a` : S.bg, border: `1px solid ${testDataStrategy === opt.id ? S.api + "44" : S.border}` }}>
                      <input type="radio" name="testdata" checked={testDataStrategy === opt.id} onChange={() => setTestDataStrategy(opt.id as any)} style={{ marginTop: 2, accentColor: S.api, cursor: "pointer" }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: S.text }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: S.textMuted, marginTop: 2 }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 8, marginTop: 16, background: "#EF444415", border: "1px solid #EF444440", fontSize: 12, color: "#EF4444" }}>
              {error}
            </div>
          )}

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 24 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {fwDef && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 5, background: `${fwDef.color}18`, color: fwDef.color, border: `1px solid ${fwDef.color}30` }}>{fwDef.label}</span>}
              {langDef && !isApiFramework && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 5, background: `${langDef.color}18`, color: langDef.color, border: `1px solid ${langDef.color}30` }}>{langDef.label}</span>}
              {isApiFramework && coverageLevel && <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 5, background: `${S.api}18`, color: S.api, border: `1px solid ${S.api}30` }}>{coverageLevel} coverage</span>}
              {isApiFramework && !validationResult && <span style={{ fontSize: 11, color: S.textMuted }}>Validate your spec before continuing</span>}
              {!selectedFw && <span style={{ fontSize: 12, color: S.textMuted }}>Select a framework above</span>}
            </div>

            <button onClick={handleContinue} disabled={!canContinue || loading} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 10, whiteSpace: "nowrap", flexShrink: 0,
              background: canContinue && !loading ? (isApiFramework ? S.api : S.accent) : S.border,
              color: canContinue && !loading ? "#fff" : S.textMuted,
              fontSize: 13, fontWeight: 700, border: "none",
              cursor: canContinue && !loading ? "pointer" : "not-allowed", transition: "all 0.15s",
            }}>
              {loading ? "Loading nodes…" : "Continue →"}
            </button>
          </div>
        </div>

        {/* Step hint */}
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 11, color: S.textMuted }}>
          Next: Node Builder · Blueprint Review · Generate · Download
        </div>
      </div>
    </div>
  );
}
