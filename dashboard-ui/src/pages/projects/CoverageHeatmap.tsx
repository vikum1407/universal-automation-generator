import { useEffect, useState } from "react";
import { theme } from "@/theme";
import type { TabId } from "@/dashboard/pages/projects/layout/ProjectSidebar";

const API_BASE = "http://localhost:3000";

const RISK_COLOR: Record<string, string> = {
  high: "#EF5350", medium: "#FFA726", low: "#66BB6A",
};
const PRIORITY_COLOR: Record<string, string> = {
  critical: "#EF5350", high: "#FF7043", medium: "#FFA726", low: "#66BB6A",
};
const METHOD_COLOR: Record<string, string> = {
  GET: "#00C853", POST: "#448AFF", PUT: "#FFA726", PATCH: "#AB47BC", DELETE: "#EF5350",
};
const TYPE_COLOR: Record<string, string> = {
  api: "#448AFF", ui: "#9C27B0", hybrid: "#FF7043",
};

type GapView = "all" | "endpoints" | "flows" | "requirements" | "high-risk";

// ─── Tile ─────────────────────────────────────────────────────────────────────
function SummaryTile({
  label, covered, total, pct, active, onClick, disabled,
}: {
  label: string; covered: number; total: number; pct: number;
  active: boolean; onClick: () => void; disabled: boolean;
}) {
  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  const scoreColor = pct >= 80 ? "#00C853" : pct >= 50 ? "#FFA726" : "#EF5350";
  const r = 30, cx = 38, cy = 38, sw = 6;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;

  if (disabled) return null;

  return (
    <button
      onClick={onClick}
      style={{
        flex: "1 1 160px", minWidth: 140, padding: "18px 16px",
        borderRadius: 16, cursor: "pointer", border: active
          ? `2px solid ${scoreColor}`
          : `1px solid ${border}`,
        background: active
          ? (isDark ? `${scoreColor}18` : `${scoreColor}10`)
          : surface,
        boxShadow: active ? `0 0 0 3px ${scoreColor}30` : theme.shadow.card,
        transition: "all 0.18s ease",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      }}
    >
      <svg width={76} height={76}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={isDark ? "#333" : "#eee"} strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={scoreColor} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`} />
        <text x={cx} y={cy + 5} textAnchor="middle"
          fontSize={14} fontWeight={700} fill={scoreColor}>
          {pct}%
        </text>
      </svg>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{label}</div>
        <div style={{ fontSize: 11, color: textLight, marginTop: 2 }}>
          {covered} / {total} covered
        </div>
      </div>
    </button>
  );
}

// ─── Stacked bar chart ────────────────────────────────────────────────────────
function StackedTypeChart({ rows }: { rows: { type: string; total: number; covered: number; uncovered: number; pct: number }[] }) {
  const isDark = theme.mode === "dark";
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;

  if (!rows.length) return null;

  return (
    <div style={{
      padding: "20px 24px", borderRadius: 14,
      border: `1px solid ${border}`, background: surface, marginBottom: 24
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 16 }}>
        Coverage by Requirement Type
      </div>

      {/* Bars */}
      <div style={{ marginBottom: 20 }}>
        {rows.map(row => (
          <div key={row.type} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: TYPE_COLOR[row.type] ?? text, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {row.type}
              </span>
              <span style={{ color: textLight }}>{row.covered}/{row.total} ({row.pct}%)</span>
            </div>
            <div style={{ height: 10, borderRadius: 6, overflow: "hidden", background: isDark ? "#333" : "#eee", display: "flex" }}>
              <div style={{ width: `${row.pct}%`, background: TYPE_COLOR[row.type] ?? theme.colors.primary, transition: "width 0.5s ease" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${border}` }}>
            {["Type", "Total", "Covered", "Uncovered", "Coverage %"].map(h => (
              <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: textLight, fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const scoreColor = row.pct >= 80 ? "#00C853" : row.pct >= 50 ? "#FFA726" : "#EF5350";
            return (
              <tr key={row.type} style={{ borderBottom: `1px solid ${border}20` }}>
                <td style={{ padding: "8px 8px" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                    background: `${TYPE_COLOR[row.type] ?? "#888"}22`,
                    color: TYPE_COLOR[row.type] ?? text,
                    textTransform: "uppercase"
                  }}>
                    {row.type}
                  </span>
                </td>
                <td style={{ padding: "8px 8px", color: text }}>{row.total}</td>
                <td style={{ padding: "8px 8px", color: "#00C853", fontWeight: 600 }}>{row.covered}</td>
                <td style={{ padding: "8px 8px", color: "#EF5350", fontWeight: 600 }}>{row.uncovered}</td>
                <td style={{ padding: "8px 8px" }}>
                  <span style={{ color: scoreColor, fontWeight: 700 }}>{row.pct}%</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────
function ActionBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        padding: "5px 12px", borderRadius: 8, border: `1px solid ${theme.colors.primary}`,
        background: "transparent", color: theme.colors.primary,
        fontSize: 11, fontWeight: 600, cursor: "pointer",
        transition: "all 0.12s ease", flexShrink: 0
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = theme.colors.primary;
        (e.currentTarget as HTMLButtonElement).style.color = "#fff";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = theme.colors.primary;
      }}
    >
      {label}
    </button>
  );
}

// ─── Gap row — uncovered requirement ─────────────────────────────────────────
function RequirementGapRow({ req, onGenerate }: { req: any; onGenerate: () => void }) {
  const isDark = theme.mode === "dark";
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;

  return (
    <div style={{
      padding: "14px 16px", borderRadius: 12, marginBottom: 8,
      border: `1px solid ${border}`, background: surface,
      display: "flex", alignItems: "flex-start", gap: 12
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{
            padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
            background: `${TYPE_COLOR[req.type] ?? "#888"}22`,
            color: TYPE_COLOR[req.type] ?? text, textTransform: "uppercase"
          }}>{req.type}</span>
          {req.riskLevel && (
            <span style={{
              padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: `${RISK_COLOR[req.riskLevel]}22`, color: RISK_COLOR[req.riskLevel]
            }}>⚠ {req.riskLevel} risk</span>
          )}
          {req.businessPriority && req.businessPriority !== "medium" && (
            <span style={{
              padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: `${PRIORITY_COLOR[req.businessPriority] ?? "#888"}22`,
              color: PRIORITY_COLOR[req.businessPriority] ?? text
            }}>⚡ {req.businessPriority}</span>
          )}
          <span style={{ fontSize: 13, color: text, fontWeight: 500 }}>{req.title}</span>
        </div>
        {req.description && req.description !== req.title && (
          <div style={{ fontSize: 12, color: textLight, marginBottom: 6 }}>{req.description}</div>
        )}
        {req.suggestedTestFile && (
          <code style={{ fontSize: 11, color: textLight, background: isDark ? "#111" : "#F5F5F5", padding: "2px 7px", borderRadius: 5 }}>
            {req.suggestedTestFile}
          </code>
        )}
        {req.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
            {req.tags.map((t: string, i: number) => (
              <span key={i} style={{
                padding: "1px 7px", borderRadius: 10, fontSize: 11,
                background: isDark ? "#2A1A40" : "#EDE4FF", color: theme.colors.primary
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>
      <ActionBtn label="Generate Tests →" onClick={onGenerate} />
    </div>
  );
}

// ─── Gap row — untested endpoint ──────────────────────────────────────────────
function EndpointGapRow({ ep, onGenerate }: { ep: any; onGenerate: () => void }) {
  const isDark = theme.mode === "dark";
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const mc = METHOD_COLOR[ep.method] ?? textLight;

  return (
    <div style={{
      padding: "14px 16px", borderRadius: 12, marginBottom: 8,
      border: `1px solid ${border}`, background: surface,
      display: "flex", alignItems: "center", gap: 12
    }}>
      <span style={{
        padding: "3px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700,
        background: mc, color: "#000", flexShrink: 0
      }}>{ep.method}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: text, fontWeight: 600, wordBreak: "break-all" }}>{ep.path}</div>
        {ep.summary && ep.summary !== `${ep.method} ${ep.path}` && (
          <div style={{ fontSize: 11, color: textLight, marginTop: 2 }}>{ep.summary}</div>
        )}
        {ep.suggestedTestFile && (
          <code style={{ fontSize: 11, color: textLight, background: isDark ? "#111" : "#F5F5F5", padding: "2px 7px", borderRadius: 5, marginTop: 4, display: "inline-block" }}>
            {ep.suggestedTestFile}
          </code>
        )}
        {ep.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5 }}>
            {ep.tags.map((t: string, i: number) => (
              <span key={i} style={{
                padding: "1px 7px", borderRadius: 10, fontSize: 11,
                background: isDark ? "#2A1A40" : "#EDE4FF", color: theme.colors.primary
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>
      <ActionBtn label="Generate API Tests →" onClick={onGenerate} />
    </div>
  );
}

// ─── Gap row — untested flow ──────────────────────────────────────────────────
function FlowGapRow({ flow, onGenerate }: { flow: any; onGenerate: () => void }) {
  const isDark = theme.mode === "dark";
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;

  return (
    <div style={{
      padding: "14px 16px", borderRadius: 12, marginBottom: 8,
      border: `1px solid ${border}`, background: surface,
      display: "flex", alignItems: "center", gap: 12
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: text, fontWeight: 500 }}>{flow.label}</div>
        <div style={{ fontSize: 11, color: textLight, marginTop: 2 }}>
          {flow.from} → {flow.to}
          {flow.action && <span> · <em>{flow.action}</em></span>}
        </div>
        {flow.suggestedTestFile && (
          <code style={{ fontSize: 11, color: textLight, background: isDark ? "#111" : "#F5F5F5", padding: "2px 7px", borderRadius: 5, marginTop: 4, display: "inline-block" }}>
            {flow.suggestedTestFile}
          </code>
        )}
      </div>
      <ActionBtn label="Generate UI Tests →" onClick={onGenerate} />
    </div>
  );
}

// ─── Navigation brain banner ──────────────────────────────────────────────────
function NavigationBrain({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const isDark = theme.mode === "dark";
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;

  const links: { label: string; tab: TabId; icon: string; desc: string }[] = [
    { label: "Tests", tab: "tests", icon: "▶", desc: "Run all generated tests" },
    { label: "Suggestions", tab: "suggestions", icon: "💡", desc: "AI-powered test ideas" },
    { label: "Auto-Heal", tab: "autoheal", icon: "🔧", desc: "Fix broken tests" },
    { label: "Replay", tab: "replay", icon: "⏪", desc: "Inspect test runs" },
  ];

  return (
    <div style={{
      padding: "16px 20px", borderRadius: 14,
      border: `1px solid ${border}`, background: surface, marginBottom: 24
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
        Jump to
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {links.map(l => (
          <button
            key={l.tab}
            onClick={() => onNavigate(l.tab)}
            style={{
              padding: "10px 16px", borderRadius: 10, border: `1px solid ${border}`,
              background: "transparent", cursor: "pointer", textAlign: "left",
              transition: "all 0.12s ease", minWidth: 120,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = isDark ? "#2A1A40" : "#EDE4FF";
              (e.currentTarget as HTMLButtonElement).style.borderColor = theme.colors.primary;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.borderColor = border;
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 3 }}>{l.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.colors.primary }}>{l.label}</div>
            <div style={{ fontSize: 11, color: textLight, marginTop: 1 }}>{l.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CoverageHeatmap({
  projectId,
  onNavigate,
}: {
  projectId: string;
  onNavigate?: (tab: TabId) => void;
}) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTile, setActiveTile] = useState<"requirements" | "api" | "ui" | "hybrid" | null>(null);
  const [gapView, setGapView] = useState<GapView>("all");

  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  useEffect(() => {
    fetch(`${API_BASE}/projects/${projectId}/coverage`)
      .then(res => res.json())
      .then(data => { setReport(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            height: 160, borderRadius: 16,
            background: isDark ? "#1a1a2e" : "#f3f4f6",
            animation: "pulse 1.5s infinite"
          }} />
        ))}
      </div>
    );
  }

  if (!report?.summary) {
    return (
      <div style={{ marginTop: 32, textAlign: "center", color: textLight, padding: "48px 0" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 6 }}>No coverage data yet</div>
        <div style={{ fontSize: 13 }}>Generate a project first to compute coverage.</div>
      </div>
    );
  }

  const { summary, byRequirementType, uncoveredRequirements, gaps, projectType } = report;
  const navigate = onNavigate ?? (() => {});

  // ── Filtered gaps based on active tile + gap view ──
  const filteredGapsEndpoints = (() => {
    if (activeTile === "requirements" || activeTile === "ui" || activeTile === "hybrid") return [];
    return gaps.untestedEndpoints ?? [];
  })();

  const filteredGapsFlows = (() => {
    if (activeTile === "requirements" || activeTile === "api") return [];
    return gaps.untestedFlows ?? [];
  })();

  const filteredGapsRequirements = (() => {
    if (activeTile === "api") return [];
    if (activeTile === "ui") return (uncoveredRequirements ?? []).filter((r: any) => r.type === "ui");
    if (activeTile === "hybrid") return (uncoveredRequirements ?? []).filter((r: any) => r.type === "hybrid");
    if (activeTile === "requirements") return uncoveredRequirements ?? [];
    return uncoveredRequirements ?? [];
  })();

  // Gap view sub-filter
  const showEndpoints = gapView === "all" || gapView === "endpoints";
  const showFlows = gapView === "all" || gapView === "flows";
  const showRequirements = gapView === "all" || gapView === "requirements";
  const showHighRisk = gapView === "high-risk";

  const highRisk = gaps.highRiskUncovered ?? [];

  const totalGaps =
    filteredGapsEndpoints.length + filteredGapsFlows.length + filteredGapsRequirements.length;

  // Breakdown table rows (filter by active tile)
  const typeRows: any[] = activeTile === "api"
    ? byRequirementType.filter((r: any) => r.type === "api")
    : activeTile === "ui"
    ? byRequirementType.filter((r: any) => r.type === "ui")
    : activeTile === "hybrid"
    ? byRequirementType.filter((r: any) => r.type === "hybrid")
    : byRequirementType;

  const scoreColor = (pct: number) =>
    pct >= 80 ? "#00C853" : pct >= 50 ? "#FFA726" : "#EF5350";

  return (
    <div style={{ marginTop: 24 }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ color: theme.colors.primary, margin: 0 }}>Coverage Dashboard</h3>
        <div style={{ fontSize: 12, color: textLight, marginTop: 4 }}>
          <span>Project type: <strong style={{ color: text }}>{projectType?.toUpperCase() ?? "—"}</strong></span>
          <span style={{ margin: "0 8px" }}>·</span>
          <span>{summary.specFilesFound ?? 0} spec file{summary.specFilesFound !== 1 ? "s" : ""} found</span>
          <span style={{ margin: "0 8px" }}>·</span>
          <span>Updated {new Date(report.generatedAt).toLocaleString()}</span>
          {activeTile && (
            <>
              <span style={{ margin: "0 8px" }}>·</span>
              <button
                onClick={() => setActiveTile(null)}
                style={{ fontSize: 12, color: theme.colors.primary, background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 600 }}
              >
                Clear filter ✕
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Summary Tiles ── */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <SummaryTile
          label="Requirement Coverage"
          covered={summary.requirementsCovered}
          total={summary.requirementsTotal}
          pct={summary.requirementsCoveragePct}
          active={activeTile === "requirements"}
          onClick={() => setActiveTile(activeTile === "requirements" ? null : "requirements")}
          disabled={false}
        />
        <SummaryTile
          label="API Endpoint Coverage"
          covered={summary.apiEndpointsCovered ?? 0}
          total={summary.apiEndpointsTotal ?? 0}
          pct={summary.apiCoveragePct ?? 0}
          active={activeTile === "api"}
          onClick={() => setActiveTile(activeTile === "api" ? null : "api")}
          disabled={summary.apiEndpointsTotal === null}
        />
        <SummaryTile
          label="UI Flow Coverage"
          covered={summary.uiFlowsCovered ?? 0}
          total={summary.uiFlowsTotal ?? 0}
          pct={summary.uiCoveragePct ?? 0}
          active={activeTile === "ui"}
          onClick={() => setActiveTile(activeTile === "ui" ? null : "ui")}
          disabled={summary.uiFlowsTotal === null}
        />
        <SummaryTile
          label="Hybrid Scenarios"
          covered={summary.hybridScenariosCovered ?? 0}
          total={summary.hybridScenariosTotal ?? 0}
          pct={summary.hybridCoveragePct ?? 0}
          active={activeTile === "hybrid"}
          onClick={() => setActiveTile(activeTile === "hybrid" ? null : "hybrid")}
          disabled={summary.hybridScenariosTotal === null}
        />
      </div>

      {/* ── Navigation Brain ── */}
      <NavigationBrain onNavigate={navigate} />

      {/* ── Breakdown by type ── */}
      {typeRows.length > 0 && <StackedTypeChart rows={typeRows} />}

      {/* ── Gaps section ── */}
      <div style={{
        padding: "20px 24px", borderRadius: 14,
        border: `1px solid ${border}`, background: surface
      }}>
        {/* Gaps header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: text }}>
              Coverage Gaps
              {totalGaps > 0 && (
                <span style={{
                  marginLeft: 10, padding: "2px 9px", borderRadius: 10,
                  background: "#EF5350", color: "#fff", fontSize: 12, fontWeight: 700
                }}>{totalGaps}</span>
              )}
              {totalGaps === 0 && (
                <span style={{
                  marginLeft: 10, padding: "2px 9px", borderRadius: 10,
                  background: "#00C853", color: "#000", fontSize: 12, fontWeight: 700
                }}>All covered!</span>
              )}
            </div>
            <div style={{ fontSize: 12, color: textLight, marginTop: 3 }}>
              Items missing test coverage — click "Generate Tests →" to create them
            </div>
          </div>

          {/* Gap view filter */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {([
              { v: "all", label: "All" },
              { v: "endpoints", label: "Endpoints" },
              { v: "flows", label: "UI Flows" },
              { v: "requirements", label: "Requirements" },
              { v: "high-risk", label: "🔴 High Risk" },
            ] as { v: GapView; label: string }[]).map(({ v, label }) => {
              const isActive = gapView === v;
              return (
                <button
                  key={v}
                  onClick={() => setGapView(v)}
                  style={{
                    padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: isActive ? 700 : 400,
                    border: `1px solid ${border}`, cursor: "pointer",
                    background: isActive
                      ? (v === "high-risk" ? "#EF535022" : `${theme.colors.primary}22`)
                      : "transparent",
                    color: isActive
                      ? (v === "high-risk" ? "#EF5350" : theme.colors.primary)
                      : textLight,
                    transition: "all 0.12s ease"
                  }}
                >{label}</button>
              );
            })}
          </div>
        </div>

        {/* High-risk view */}
        {showHighRisk && (
          highRisk.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: textLight }}>
              🎉 No high-risk uncovered requirements.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: textLight, marginBottom: 10 }}>
                {highRisk.length} high-risk or critical-priority item{highRisk.length !== 1 ? "s" : ""} with no test coverage
              </div>
              {highRisk.map((r: any) => (
                <RequirementGapRow key={r.id} req={r} onGenerate={() => navigate("tests")} />
              ))}
            </>
          )
        )}

        {/* Untested endpoints */}
        {showEndpoints && filteredGapsEndpoints.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              🔌 Untested API Endpoints ({filteredGapsEndpoints.length})
            </div>
            {filteredGapsEndpoints.map((ep: any) => (
              <EndpointGapRow key={`${ep.method}_${ep.path}`} ep={ep} onGenerate={() => navigate("tests")} />
            ))}
          </div>
        )}

        {/* Untested requirements */}
        {showRequirements && filteredGapsRequirements.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              📋 Uncovered Requirements ({filteredGapsRequirements.length})
            </div>
            {filteredGapsRequirements.map((r: any) => (
              <RequirementGapRow key={r.id} req={r} onGenerate={() => navigate("suggestions")} />
            ))}
          </div>
        )}

        {/* Untested flows */}
        {showFlows && filteredGapsFlows.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              🔀 Untested UI Flows ({filteredGapsFlows.length})
            </div>
            {filteredGapsFlows.map((f: any) => (
              <FlowGapRow key={f.id} flow={f} onGenerate={() => navigate("tests")} />
            ))}
          </div>
        )}

        {/* All clear */}
        {!showHighRisk && totalGaps === 0 && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: scoreColor(100) }}>Full coverage achieved!</div>
            <div style={{ fontSize: 13, color: textLight, marginTop: 6 }}>Every requirement, endpoint, and flow has a test.</div>
          </div>
        )}

        {/* Filtered but empty */}
        {!showHighRisk && totalGaps > 0 &&
          ((gapView === "endpoints" && filteredGapsEndpoints.length === 0) ||
           (gapView === "flows" && filteredGapsFlows.length === 0) ||
           (gapView === "requirements" && filteredGapsRequirements.length === 0)) && (
          <div style={{ textAlign: "center", padding: "24px 0", color: textLight }}>
            No {gapView} gaps{activeTile ? ` for the selected filter` : ""}.
          </div>
        )}
      </div>
    </div>
  );
}
