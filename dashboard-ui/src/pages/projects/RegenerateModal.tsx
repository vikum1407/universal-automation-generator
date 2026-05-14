import { useState } from "react";
import { useColors } from "@/hooks/useColors";
import {
  regeneratePersistedFramework,
  type PersistedFramework,
  type FrameworkVersion,
} from "@/framework/api/framework";

// ─── Types ────────────────────────────────────────────────────────────────────

type CoverageLevel = "smoke" | "functional" | "regression";

interface RegenResult {
  versionNumber: number;
  downloadUrl:   string | null;
}

// ─── Colour maps ──────────────────────────────────────────────────────────────

const FW_COLORS: Record<string, string> = {
  selenium:    "#E25C1D",
  playwright:  "#7B5FFF",
  cypress:     "#17B26A",
  webdriverio: "#E8A000",
  restassured: "#EF4444",
  appium:      "#2563EB",
};

const LANG_COLORS: Record<string, string> = {
  java:        "#E76F00",
  typescript:  "#3178C6",
  javascript:  "#C4A000",
  python:      "#3B82F6",
  csharp:      "#9B59B6",
};

const COVERAGE_OPTIONS: { id: CoverageLevel; label: string; desc: string }[] = [
  { id: "smoke",      label: "Smoke",      desc: "Status-code verification — fast CI gate" },
  { id: "functional", label: "Functional", desc: "Full positive + negative coverage" },
  { id: "regression", label: "Regression", desc: "Positive, negative + boundary tests" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function needsWebsiteUrl(fw: PersistedFramework): boolean {
  const t = fw.frameworkType;
  if (t === "selenium" || t === "cypress" || t === "webdriverio") return true;
  if (t === "playwright") {
    const mode = fw.blueprint?.playwrightMode ?? "ui";
    return mode === "ui" || mode === "hybrid";
  }
  return false;
}

function needsSwaggerUrl(fw: PersistedFramework): boolean {
  const t = fw.frameworkType;
  if (t === "restassured") return true;
  if (t === "playwright") {
    const mode = fw.blueprint?.playwrightMode ?? "ui";
    return mode === "api" || mode === "hybrid";
  }
  return false;
}

function needsCoverage(fw: PersistedFramework): boolean {
  return needsSwaggerUrl(fw);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

// ─── Field subcomponent ───────────────────────────────────────────────────────

function Field({
  label, hint, children,
  TXT, TXT2,
}: {
  label: string; hint?: string; children: React.ReactNode;
  TXT: string; TXT2: string;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: TXT2, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 10, color: TXT2, marginTop: 4, opacity: 0.75 }}>{hint}</div>}
    </div>
  );
}

function inputCss(BDR: string, BG: string, TXT: string): React.CSSProperties {
  return {
    width: "100%", boxSizing: "border-box",
    padding: "8px 10px", borderRadius: 8,
    border: `1px solid ${BDR}`, background: BG,
    color: TXT, fontSize: 12,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RegenerateModal({
  fw,
  onClose,
  onSuccess,
}: {
  fw:        PersistedFramework;
  onClose:   () => void;
  onSuccess: () => void;
}) {
  const { P, BDR, CARD, TXT, TXT2 } = useColors();

  const isDark = document.documentElement.classList.contains("dark");
  const BG = isDark ? "#0D0F14" : "#F8F9FC";

  const bp = fw.blueprint ?? {};
  const fwColor   = FW_COLORS[fw.frameworkType] ?? P;
  const langColor = LANG_COLORS[fw.language]    ?? P;

  const showWebsite  = needsWebsiteUrl(fw);
  const showSwagger  = needsSwaggerUrl(fw);
  const showCoverage = needsCoverage(fw);

  // Form state — pre-filled from saved blueprint
  const [websiteUrl,    setWebsiteUrl]    = useState<string>(bp.websiteUrl ?? "");
  const [swaggerUrl,    setSwaggerUrl]    = useState<string>(bp.swaggerUrl ?? "");
  const [coverageLevel, setCoverageLevel] = useState<CoverageLevel>(bp.coverageLevel ?? "functional");
  const [label,         setLabel]         = useState<string>("");

  const [regenerating, setRegenerating] = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [result,       setResult]       = useState<RegenResult | null>(null);

  // Version history: newest first (already sorted by API)
  const versions: FrameworkVersion[] = fw.versions ?? [];

  const handleRegenerate = async () => {
    setRegenerating(true);
    setError(null);
    try {
      const res = await regeneratePersistedFramework(fw.id, {
        ...(showWebsite && websiteUrl.trim() && { websiteUrl: websiteUrl.trim() }),
        ...(showSwagger && swaggerUrl.trim() && { swaggerUrl: swaggerUrl.trim() }),
        ...(showCoverage && { coverageLevel }),
        ...(label.trim() && { label: label.trim() }),
      });
      setResult({
        versionNumber: res.versionNumber ?? (fw.versionNumber + 1),
        downloadUrl:   res.downloadUrl ?? null,
      });
      onSuccess();
    } catch {
      setError("Regeneration failed. Check the backend logs and try again.");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    // ── Backdrop ──────────────────────────────────────────────────────────
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* ── Dialog ──────────────────────────────────────────────────────── */}
      <div style={{
        width: "100%", maxWidth: 820, maxHeight: "90vh",
        background: CARD, borderRadius: 16,
        border: `1px solid ${BDR}`,
        boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* ── Title bar ─────────────────────────────────────────────────── */}
        <div style={{
          padding: "16px 20px", borderBottom: `1px solid ${BDR}`,
          display: "flex", alignItems: "center", gap: 10,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: TXT }}>Regenerate Framework</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 6,
            background: `${fwColor}18`, color: fwColor, border: `1px solid ${fwColor}30`,
            textTransform: "capitalize",
          }}>
            {fw.frameworkType}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 6,
            background: `${langColor}18`, color: langColor, border: `1px solid ${langColor}30`,
            textTransform: "capitalize",
          }}>
            {fw.language}
          </span>
          <span style={{ fontSize: 11, color: TXT2, marginLeft: 2 }}>
            currently v{fw.versionNumber}
          </span>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: TXT2, fontSize: 18, lineHeight: 1, padding: "0 4px" }}
          >
            ×
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* ── Left: Settings form ─────────────────────────────────────── */}
          <div style={{
            flex: 1, overflowY: "auto",
            padding: "20px 22px",
            borderRight: `1px solid ${BDR}`,
            display: "flex", flexDirection: "column", gap: 18,
          }}>

            {/* Success state */}
            {result && (
              <div style={{
                padding: "16px 18px", borderRadius: 10,
                background: "#10B98112", border: "1px solid #10B98140",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}>
                  ✓ Regenerated — now v{result.versionNumber}
                </div>
                <div style={{ fontSize: 11, color: TXT2 }}>
                  Framework has been rebuilt with the updated settings.
                </div>
                {result.downloadUrl && (
                  <a
                    href={result.downloadUrl}
                    download
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "7px 14px", borderRadius: 8,
                      background: "#10B981", color: "#fff",
                      fontWeight: 700, fontSize: 12, textDecoration: "none",
                      alignSelf: "flex-start",
                    }}
                  >
                    ↓ Download v{result.versionNumber}
                  </a>
                )}
              </div>
            )}

            {/* Form fields */}
            {!result && (
              <>
                <div style={{ fontSize: 11, color: TXT2, lineHeight: 1.6 }}>
                  Update any settings below — unchanged fields keep the saved values.
                  A new version will be created with the results.
                </div>

                {showWebsite && (
                  <Field label="Website URL" hint="Qlitz will re-crawl this URL to discover pages and generate page objects." TXT={TXT} TXT2={TXT2}>
                    <input
                      value={websiteUrl}
                      onChange={e => setWebsiteUrl(e.target.value)}
                      placeholder={bp.websiteUrl ?? "https://your-app.example.com"}
                      style={inputCss(BDR, BG, TXT)}
                    />
                  </Field>
                )}

                {showSwagger && (
                  <Field label="Swagger / OpenAPI URL" hint="Must be a publicly reachable JSON or YAML spec." TXT={TXT} TXT2={TXT2}>
                    <input
                      value={swaggerUrl}
                      onChange={e => setSwaggerUrl(e.target.value)}
                      placeholder={bp.swaggerUrl ?? "https://api.example.com/docs/openapi.json"}
                      style={inputCss(BDR, BG, TXT)}
                    />
                  </Field>
                )}

                {showCoverage && (
                  <Field label="Coverage Level" TXT={TXT} TXT2={TXT2}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {COVERAGE_OPTIONS.map(opt => (
                        <label key={opt.id} style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                          background: coverageLevel === opt.id ? `${P}0e` : BG,
                          border: `1px solid ${coverageLevel === opt.id ? P + "40" : BDR}`,
                          transition: "all 0.12s",
                        }}>
                          <input
                            type="radio"
                            name="coverage"
                            checked={coverageLevel === opt.id}
                            onChange={() => setCoverageLevel(opt.id)}
                            style={{ marginTop: 2, accentColor: P, cursor: "pointer", flexShrink: 0 }}
                          />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: TXT }}>{opt.label}</div>
                            <div style={{ fontSize: 11, color: TXT2, marginTop: 1 }}>{opt.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </Field>
                )}

                <Field label="Label (optional)" hint='Tag this version for easy reference, e.g. "pre-release v2.1" or "hotfix".' TXT={TXT} TXT2={TXT2}>
                  <input
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="e.g. sprint-34, pre-release, post-api-update"
                    style={inputCss(BDR, BG, TXT)}
                  />
                </Field>

                {/* Blueprint summary (read-only) */}
                <div style={{ padding: "12px 14px", borderRadius: 8, background: BG, border: `1px solid ${BDR}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                    Saved settings (unchanged)
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {bp.framework && (
                      <InfoChip label="Framework" value={bp.framework} TXT={TXT} TXT2={TXT2} />
                    )}
                    {bp.language && (
                      <InfoChip label="Language" value={bp.language} TXT={TXT} TXT2={TXT2} />
                    )}
                    {bp.playwrightMode && (
                      <InfoChip label="Mode" value={bp.playwrightMode} TXT={TXT} TXT2={TXT2} />
                    )}
                    {bp.architecture && (
                      <InfoChip label="Architecture" value={bp.architecture} TXT={TXT} TXT2={TXT2} />
                    )}
                  </div>
                </div>

                {error && (
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "#EF444412", border: "1px solid #EF444440",
                    color: "#EF4444", fontSize: 12,
                  }}>
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Right: Version history ───────────────────────────────────── */}
          <div style={{
            width: 230, flexShrink: 0,
            overflowY: "auto", padding: "20px 16px",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              Version History
            </div>

            {versions.length === 0 && (
              <div style={{ fontSize: 11, color: TXT2 }}>No versions recorded yet.</div>
            )}

            {versions.map((v, i) => (
              <div key={v.id} style={{
                padding: "10px 12px", borderRadius: 8,
                background: i === 0 ? `${P}0e` : BG,
                border: `1px solid ${i === 0 ? P + "30" : BDR}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: i === 0 ? P : TXT,
                  }}>
                    v{v.versionNumber}
                  </span>
                  {i === 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: `${P}20`, color: P }}>
                      current
                    </span>
                  )}
                  {v.label && (
                    <span style={{ fontSize: 9, fontWeight: 600, color: TXT2, background: BDR, padding: "1px 5px", borderRadius: 4, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {v.label}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: TXT2 }}>{formatDate(v.generatedAt)}</div>
                {v.fileCount > 0 && (
                  <div style={{ fontSize: 10, color: TXT2, marginTop: 1 }}>{v.fileCount} files</div>
                )}
              </div>
            ))}

            {/* Placeholder for the new version that will be created */}
            {!result && (
              <div style={{
                padding: "10px 12px", borderRadius: 8,
                background: "transparent",
                border: `1px dashed ${BDR}`,
                opacity: 0.5,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: TXT2 }}>v{fw.versionNumber + 1}</div>
                <div style={{ fontSize: 10, color: TXT2, marginTop: 2 }}>Next regeneration</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div style={{
          padding: "14px 20px", borderTop: `1px solid ${BDR}`,
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: 10, flexShrink: 0,
        }}>
          {result ? (
            <button
              onClick={onClose}
              style={{
                padding: "9px 22px", borderRadius: 8,
                background: P, color: "#fff",
                border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700,
              }}
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: "9px 18px", borderRadius: 8,
                  background: "transparent", color: TXT2,
                  border: `1px solid ${BDR}`, cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "9px 22px", borderRadius: 8,
                  background: regenerating ? BDR : P,
                  color: regenerating ? TXT2 : "#fff",
                  border: "none", cursor: regenerating ? "wait" : "pointer",
                  fontSize: 13, fontWeight: 700,
                  transition: "all 0.15s",
                }}
              >
                {regenerating
                  ? (<>
                      <span style={{ display: "inline-block", animation: "spin 0.8s linear infinite" }}>↺</span>
                      Regenerating…
                    </>)
                  : "↺ Regenerate"
                }
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── InfoChip ─────────────────────────────────────────────────────────────────

function InfoChip({ label, value, TXT, TXT2 }: { label: string; value: string; TXT: string; TXT2: string }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: TXT, marginTop: 1, textTransform: "capitalize" }}>{value}</div>
    </div>
  );
}
