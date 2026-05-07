import { useState } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import { startClosureJob, type ClosureJob, type StartClosureJobDto } from "@/api/rtm";

interface Props {
  projectId:  string;
  versionId:  string;
  onClose:    () => void;
  onStarted:  (job: ClosureJob) => void;
}

const FRAMEWORKS = [
  { value: "playwright",  label: "Playwright" },
  { value: "cypress",     label: "Cypress" },
  { value: "selenium",    label: "Selenium" },
  { value: "restassured", label: "RestAssured" },
];

const LANG_FOR: Record<string, { value: string; label: string }[]> = {
  playwright:  [{ value: "typescript", label: "TypeScript" }, { value: "javascript", label: "JavaScript" }],
  cypress:     [{ value: "typescript", label: "TypeScript" }, { value: "javascript", label: "JavaScript" }],
  selenium:    [{ value: "java", label: "Java" }, { value: "python", label: "Python" }],
  restassured: [{ value: "java", label: "Java" }],
};

export function RTMClosureModal({ projectId, versionId, onClose, onStarted }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();

  const [framework,    setFramework]    = useState("playwright");
  const [language,     setLanguage]     = useState("typescript");
  const [baseUrl,      setBaseUrl]      = useState("http://localhost:3000");
  const [targetReq,    setTargetReq]    = useState(80);   // percent
  const [targetEp,     setTargetEp]     = useState<number | null>(null);
  const [targetJ,      setTargetJ]      = useState<number | null>(null);
  const [maxIter,      setMaxIter]      = useState(5);
  const [maxTests,     setMaxTests]     = useState(20);
  const [highRisk,     setHighRisk]     = useState(true);
  const [dryRun,       setDryRun]       = useState(false);
  const [starting,     setStarting]     = useState(false);

  const langs = LANG_FOR[framework] ?? [{ value: "typescript", label: "TypeScript" }];

  function handleFrameworkChange(fw: string) {
    setFramework(fw);
    const av = LANG_FOR[fw] ?? [];
    if (!av.find(l => l.value === language)) setLanguage(av[0]?.value ?? "typescript");
  }

  async function handleStart() {
    setStarting(true);
    try {
      const dto: StartClosureJobDto = {
        framework, language, baseUrl,
        targetRequirementCoverage: targetReq / 100,
        targetEndpointCoverage:    targetEp  != null ? targetEp / 100 : undefined,
        targetJourneyCoverage:     targetJ   != null ? targetJ  / 100 : undefined,
        maxIterations:             maxIter,
        maxTestsPerIteration:      maxTests,
        prioritizeHighRisk:        highRisk,
        dryRun,
      };
      const job = await startClosureJob(projectId, versionId, dto);
      toast.success(dryRun ? "Dry-run closure job started" : "Coverage closure loop started");
      onStarted(job);
      onClose();
    } catch {
      toast.error("Failed to start closure job");
    } finally {
      setStarting(false);
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
  const rowStyle: React.CSSProperties = { display: "flex", gap: 12 };

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
        padding: 28, width: 540, maxHeight: "92vh", overflowY: "auto",
        boxShadow: "0 20px 48px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: 20,
      }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: text }}>Close Coverage Gaps</div>
            <div style={{ fontSize: 11, color: muted, marginTop: 3, maxWidth: 400 }}>
              Qlitz will loop: measure gaps → generate tests → recompute coverage until the target is met.
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: 18, color: muted, cursor: "pointer" }}>×</button>
        </div>

        {/* Dry-run banner */}
        <label style={{
          display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
          padding: "10px 14px", borderRadius: 10,
          background: dryRun ? `${P}12` : "transparent",
          border: `1px solid ${dryRun ? P : border}`,
        }}>
          <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)}
            style={{ width: 14, height: 14, cursor: "pointer" }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: dryRun ? P : text }}>Dry-run mode</div>
            <div style={{ fontSize: 10, color: muted }}>Show what would be generated — no files written</div>
          </div>
        </label>

        {/* Framework + Language */}
        <div style={rowStyle}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Framework</label>
            <select value={framework} onChange={e => handleFrameworkChange(e.target.value)} style={inputStyle}>
              {FRAMEWORKS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Language</label>
            <select value={language} onChange={e => setLanguage(e.target.value)} style={inputStyle}>
              {langs.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        {/* Base URL */}
        <div>
          <label style={labelStyle}>Base URL</label>
          <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} style={inputStyle} />
        </div>

        {/* Coverage targets */}
        <div style={{ background: `${P}08`, border: `1px solid ${P}22`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Coverage Targets
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <TargetSlider label="Requirement coverage" value={targetReq} onChange={setTargetReq} color={P} />
            <TargetSlider label="Endpoint coverage (optional)" value={targetEp ?? 70} onChange={v => setTargetEp(v)}
              color="#9C27B0" optional checked={targetEp !== null} onCheck={v => setTargetEp(v ? 70 : null)} />
            <TargetSlider label="Journey coverage (optional)" value={targetJ ?? 70} onChange={v => setTargetJ(v)}
              color="#FF9800" optional checked={targetJ !== null} onCheck={v => setTargetJ(v ? 70 : null)} />
          </div>
        </div>

        {/* Loop controls */}
        <div style={rowStyle}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Max iterations</label>
            <select value={maxIter} onChange={e => setMaxIter(+e.target.value)} style={inputStyle}>
              {[1, 2, 3, 5, 10].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div style={{ fontSize: 10, color: muted, marginTop: 4 }}>Loop will stop earlier if target is met</div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Max tests / iteration</label>
            <select value={maxTests} onChange={e => setMaxTests(+e.target.value)} style={inputStyle}>
              {[5, 10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div style={{ fontSize: 10, color: muted, marginTop: 4 }}>Guardrail against test explosion</div>
          </div>
        </div>

        {/* Prioritize high-risk */}
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={highRisk} onChange={e => setHighRisk(e.target.checked)}
            style={{ width: 14, height: 14, cursor: "pointer" }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: text }}>Prioritize high-risk requirements</div>
            <div style={{ fontSize: 10, color: muted }}>Generate must-have tests first (high risk, no tests)</div>
          </div>
        </label>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", borderTop: `1px solid ${border}`, paddingTop: 16 }}>
          <button onClick={onClose} style={{
            padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: `1px solid ${border}`, background: "transparent", color: muted, cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={handleStart} disabled={starting} style={{
            padding: "9px 24px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            border: "none", cursor: starting ? "not-allowed" : "pointer",
            background: starting ? "#ccc" : dryRun ? "#607D8B" : P, color: "#fff",
          }}>
            {starting ? "Starting…" : dryRun ? "Dry Run" : "Start Loop"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TargetSlider({
  label, value, onChange, color, optional, checked, onCheck,
}: {
  label: string; value: number; onChange: (v: number) => void; color: string;
  optional?: boolean; checked?: boolean; onCheck?: (v: boolean) => void;
}) {
  const { TXT: text, TXT2: muted } = useColors();
  const disabled = optional && !checked;

  return (
    <div style={{ opacity: disabled ? 0.45 : 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        {optional && (
          <input type="checkbox" checked={!!checked} onChange={e => onCheck?.(e.target.checked)}
            style={{ width: 13, height: 13, cursor: "pointer" }} />
        )}
        <span style={{ fontSize: 11, fontWeight: 600, color: muted, flex: 1 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color, minWidth: 36, textAlign: "right" }}>{value}%</span>
      </div>
      <input
        type="range" min={50} max={100} step={5} value={value}
        disabled={disabled}
        onChange={e => onChange(+e.target.value)}
        style={{ width: "100%", accentColor: color, cursor: disabled ? "not-allowed" : "pointer" }}
      />
    </div>
  );
}
