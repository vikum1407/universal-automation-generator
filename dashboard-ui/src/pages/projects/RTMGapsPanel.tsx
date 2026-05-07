import { useState, useCallback, useEffect } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import {
  fetchRTMSnapshot,
  recomputeGaps, getGapSummary, getRequirementGaps,
  getEndpointGaps, getJourneyGaps, getGenerationPlan,
  type GapSummary, type RequirementGap, type EndpointGap,
  type JourneyGap, type GenerationPlan,
} from "@/api/rtm";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RISK_COLOR:   Record<string, string> = { high: "#EF5350", critical: "#B71C1C", medium: "#FFA726", low: "#66BB6A" };
const METHOD_COLOR: Record<string, string> = { GET: "#4CAF50", POST: "#2196F3", PUT: "#FF9800", PATCH: "#9C27B0", DELETE: "#F44336" };
const PLAN_COLOR:   Record<string, string> = { must: "#EF5350", should: "#FFA726", optional: "#66BB6A" };
const TYPE_COLOR:   Record<string, string> = { ui: "#2196F3", api: "#9C27B0", hybrid: "#FF9800" };

function pct(score: number): string { return `${Math.round(score * 100)}%`; }

function Flag({ active, label }: { active: boolean; label: string }) {
  const { TXT2: muted } = useColors();
  return (
    <span style={{
      padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700,
      background: active ? "#EF535018" : "transparent",
      color: active ? "#EF5350" : muted,
      border: `1px solid ${active ? "#EF535044" : "transparent"}`,
    }}>
      {active ? "✕" : "✓"} {label}
    </span>
  );
}

function SuggestBadge({ count, label, color }: { count: number; label: string; color: string }) {
  if (count === 0) return null;
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700,
      background: `${color}18`, color, border: `1px solid ${color}44`,
    }}>
      +{count} {label}
    </span>
  );
}

// ─── Summary card strip ───────────────────────────────────────────────────────

function SummaryStrip({ s }: { s: GapSummary }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted } = useColors();
  const cards = [
    { label: "Untested Requirements",    value: s.requirementsNoTests,      color: "#EF5350" },
    { label: "Insufficient Coverage",    value: s.requirementsInsufficient,  color: "#FFA726" },
    { label: "High-Risk Gaps",           value: s.requirementsHighRiskGap,   color: "#B71C1C" },
    { label: "Untested Endpoints",       value: s.endpointsNoTests,          color: "#EF5350" },
    { label: "Untested Journeys",        value: s.journeysNoTests,           color: "#EF5350" },
  ];
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {cards.map(c => (
        <div key={c.label} style={{
          background: surface, border: `1px solid ${border}`, borderRadius: 10,
          padding: "12px 16px", flex: "1 0 140px", minWidth: 130,
        }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: c.value > 0 ? c.color : "#66BB6A" }}>
            {c.value}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, color: muted, marginTop: 2 }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Requirement gap table ────────────────────────────────────────────────────

function ReqGapTable({ rows }: { rows: RequirementGap[] }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, BG: bg } = useColors();
  if (!rows.length) return <EmptyState label="No requirement gaps found" />;

  const thStyle: React.CSSProperties = {
    padding: "8px 12px", fontSize: 10, fontWeight: 700, color: muted,
    textTransform: "uppercase", letterSpacing: "0.06em", background: bg,
    textAlign: "left", whiteSpace: "nowrap",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Requirement</th>
            <th style={thStyle}>Risk</th>
            <th style={thStyle}>Score</th>
            <th style={thStyle}>Gaps</th>
            <th style={thStyle}>Suggested</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: `1px solid ${border}` }}>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: text }}>{r.requirementKey}</div>
                <div style={{ fontSize: 11, color: muted, marginTop: 2, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.requirementTitle}
                </div>
              </td>
              <td style={{ padding: "10px 12px" }}>
                <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${RISK_COLOR[r.risk] ?? "#aaa"}18`, color: RISK_COLOR[r.risk] ?? "#aaa" }}>
                  {r.risk}
                </span>
              </td>
              <td style={{ padding: "10px 12px", fontSize: 12, color: text, fontWeight: 600 }}>
                {pct(r.coverageScore)}
              </td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {r.hasNoTests           && <Flag active label="No tests" />}
                  {r.missingUITests       && <Flag active label="UI" />}
                  {r.missingAPITests      && <Flag active label="API" />}
                  {r.missingHybridTests   && <Flag active label="Hybrid" />}
                  {r.missingNegativeTests && <Flag active label="Negative" />}
                  {r.missingBoundaryTests && <Flag active label="Boundary" />}
                  {!r.hasNoTests && !r.missingUITests && !r.missingAPITests && !r.missingHybridTests && !r.missingNegativeTests && !r.missingBoundaryTests &&
                    <span style={{ fontSize: 11, color: "#66BB6A" }}>✓ Covered</span>
                  }
                </div>
              </td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  <SuggestBadge count={r.suggestedUITests}     label="UI"     color="#2196F3" />
                  <SuggestBadge count={r.suggestedAPITests}    label="API"    color="#9C27B0" />
                  <SuggestBadge count={r.suggestedHybridTests} label="Hybrid" color="#FF9800" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Endpoint gap table ───────────────────────────────────────────────────────

function EpGapTable({ rows }: { rows: EndpointGap[] }) {
  const { BDR: border, TXT: text, TXT2: muted, BG: bg } = useColors();
  if (!rows.length) return <EmptyState label="No endpoint gaps found" />;

  const thStyle: React.CSSProperties = {
    padding: "8px 12px", fontSize: 10, fontWeight: 700, color: muted,
    textTransform: "uppercase", letterSpacing: "0.06em", background: bg, textAlign: "left",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Endpoint</th>
            <th style={thStyle}>Score</th>
            <th style={thStyle}>Gaps</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: `1px solid ${border}` }}>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: `${METHOD_COLOR[r.method ?? "GET"] ?? "#aaa"}20`, color: METHOD_COLOR[r.method ?? "GET"] ?? "#aaa" }}>
                    {r.method ?? "?"}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: text, fontFamily: "monospace" }}>{r.path ?? r.endpointKey}</span>
                </div>
              </td>
              <td style={{ padding: "10px 12px", fontSize: 12, color: text, fontWeight: 600 }}>{pct(r.coverageScore)}</td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {r.hasNoTests             && <Flag active label="No tests" />}
                  {r.missingPositiveTests   && <Flag active label="Positive" />}
                  {r.missingNegativeTests   && <Flag active label="Negative" />}
                  {r.missingBoundaryTests   && <Flag active label="Boundary" />}
                  {!r.hasNoTests && !r.missingPositiveTests && !r.missingNegativeTests && !r.missingBoundaryTests &&
                    <span style={{ fontSize: 11, color: "#66BB6A" }}>✓ Covered</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Journey gap table ────────────────────────────────────────────────────────

function JGapTable({ rows }: { rows: JourneyGap[] }) {
  const { BDR: border, TXT: text, TXT2: muted, BG: bg } = useColors();
  if (!rows.length) return <EmptyState label="No journey gaps found" />;

  const thStyle: React.CSSProperties = {
    padding: "8px 12px", fontSize: 10, fontWeight: 700, color: muted,
    textTransform: "uppercase", letterSpacing: "0.06em", background: bg, textAlign: "left",
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>Journey</th>
            <th style={thStyle}>Score</th>
            <th style={thStyle}>Gaps</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: `1px solid ${border}` }}>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: text }}>{r.journeyKey}</div>
                <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{r.journeyName}</div>
              </td>
              <td style={{ padding: "10px 12px", fontSize: 12, color: text, fontWeight: 600 }}>{pct(r.coverageScore)}</td>
              <td style={{ padding: "10px 12px" }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {r.hasNoTests               && <Flag active label="No tests" />}
                  {r.missingEndToEndFlow       && <Flag active label="E2E flow" />}
                  {r.missingAlternativePaths   && <Flag active label="Alt paths" />}
                  {!r.hasNoTests && !r.missingEndToEndFlow && !r.missingAlternativePaths &&
                    <span style={{ fontSize: 11, color: "#66BB6A" }}>✓ Covered</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Generation plan panel ────────────────────────────────────────────────────

function PlanPanel({ plan }: { plan: GenerationPlan }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted } = useColors();
  const [filter, setFilter] = useState<"all" | "must" | "should" | "optional">("all");

  const tasks = filter === "all" ? plan.tasks : plan.tasks.filter(t => t.priority === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Summary pills */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: muted }}>PLAN</span>
        {(["all", "must", "should", "optional"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: filter === f ? 700 : 500,
            border: `1px solid ${filter === f ? (PLAN_COLOR[f] ?? "#888") : border}`,
            background: filter === f ? `${PLAN_COLOR[f] ?? "#888"}18` : "transparent",
            color: filter === f ? (PLAN_COLOR[f] ?? text) : muted, cursor: "pointer",
          }}>
            {f === "all" ? `All (${plan.summary.total})` : `${f} (${plan.summary[f]})`}
          </button>
        ))}
      </div>

      {tasks.length === 0 ? (
        <EmptyState label="No tasks for this filter" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {tasks.map((t, i) => (
            <div key={i} style={{
              background: surface, border: `1px solid ${border}`, borderRadius: 8,
              padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${PLAN_COLOR[t.priority]}18`, color: PLAN_COLOR[t.priority] }}>
                {t.priority.toUpperCase()}
              </span>
              <span style={{ padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${TYPE_COLOR[t.type]}18`, color: TYPE_COLOR[t.type] }}>
                {t.type.toUpperCase()}
              </span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: text }}>{t.targetKey}</span>
                <span style={{ fontSize: 11, color: muted, marginLeft: 8 }}>({t.target})</span>
              </div>
              <div style={{ fontSize: 11, color: muted, textAlign: "right" }}>
                <span style={{ fontWeight: 600, color: text }}>+{t.suggestedCount}</span> tests
                <span style={{ marginLeft: 8, color: muted }}>· {t.reason}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  const { TXT2: muted } = useColors();
  return <div style={{ padding: "24px", textAlign: "center", fontSize: 12, color: muted }}>{label}</div>;
}

// ─── Main Gap Panel ───────────────────────────────────────────────────────────

type GapTab = "requirements" | "endpoints" | "journeys" | "plan";

interface Props {
  projectId: string;
}

export function RTMGapsPanel({ projectId }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();

  const [versionId,  setVersionId]  = useState<string | null>(null);
  const [summary,    setSummary]    = useState<GapSummary | null>(null);
  const [reqGaps,    setReqGaps]    = useState<RequirementGap[]>([]);
  const [epGaps,     setEpGaps]     = useState<EndpointGap[]>([]);
  const [jGaps,      setJGaps]      = useState<JourneyGap[]>([]);
  const [plan,       setPlan]       = useState<GenerationPlan | null>(null);
  const [activeTab,  setActiveTab]  = useState<GapTab>("requirements");
  const [loading,    setLoading]    = useState(false);
  const [computing,  setComputing]  = useState(false);
  const [loaded,     setLoaded]     = useState(false);

  // Resolve versionId from RTM snapshot on mount
  useEffect(() => {
    fetchRTMSnapshot(projectId)
      .then(snap => { if (snap) setVersionId(snap.versionId); })
      .catch(() => {});
  }, [projectId]);

  const load = useCallback(async (vid: string) => {
    setLoading(true);
    try {
      const [s, rg, eg, jg, p] = await Promise.all([
        getGapSummary(projectId, vid),
        getRequirementGaps(projectId, vid),
        getEndpointGaps(projectId, vid),
        getJourneyGaps(projectId, vid),
        getGenerationPlan(projectId, vid),
      ]);
      setSummary(s);
      setReqGaps(rg);
      setEpGaps(eg);
      setJGaps(jg);
      setPlan(p);
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const handleRecompute = async () => {
    if (!versionId) return;
    setComputing(true);
    try {
      await recomputeGaps(projectId, versionId);
      toast.success("Gap analysis complete");
      await load(versionId);
    } catch {
      toast.error("Gap analysis failed");
    } finally {
      setComputing(false);
    }
  };

  const tabStyle = (active: boolean) => ({
    padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: active ? 700 : 500,
    border: `1px solid ${active ? P : border}`,
    background: active ? `${P}1A` : "transparent",
    color: active ? P : muted, cursor: "pointer", transition: "all 0.12s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{
        background: surface, border: `1px solid ${border}`, borderRadius: 12,
        padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: text }}>Coverage Gap Analyzer</div>
          <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
            {summary?.lastComputedAt
              ? `Last computed ${new Date(summary.lastComputedAt).toLocaleString()}`
              : "Not yet computed — click Analyze"}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          {!loaded && (
            <button onClick={() => versionId && load(versionId)} disabled={loading || !versionId} style={{
              padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: `1px solid ${border}`, background: "transparent", color: loading ? muted : text,
              cursor: loading ? "not-allowed" : "pointer",
            }}>
              {loading ? "Loading…" : "Load gaps"}
            </button>
          )}
          <button onClick={handleRecompute} disabled={computing} style={{
            padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            border: "none", background: computing ? "#ccc" : P, color: "#fff",
            cursor: computing ? "not-allowed" : "pointer",
          }}>
            {computing ? "Analyzing…" : "↻ Analyze Gaps"}
          </button>
        </div>
      </div>

      {/* Summary strip */}
      {summary && <SummaryStrip s={summary} />}

      {/* Detail tables */}
      {loaded && (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setActiveTab("requirements")} style={tabStyle(activeTab === "requirements")}>
              Requirements ({reqGaps.filter(g => g.hasNoTests || g.hasInsufficientTests).length} gaps)
            </button>
            <button onClick={() => setActiveTab("endpoints")} style={tabStyle(activeTab === "endpoints")}>
              Endpoints ({epGaps.filter(g => g.hasNoTests || g.hasInsufficientTests).length} gaps)
            </button>
            <button onClick={() => setActiveTab("journeys")} style={tabStyle(activeTab === "journeys")}>
              Journeys ({jGaps.filter(g => g.hasNoTests || g.hasInsufficientTests).length} gaps)
            </button>
            <button onClick={() => setActiveTab("plan")} style={tabStyle(activeTab === "plan")}>
              Generation Plan {plan ? `(${plan.summary.total} tasks)` : ""}
            </button>
          </div>

          <div style={{ padding: "4px 0" }}>
            {activeTab === "requirements" && <ReqGapTable rows={reqGaps} />}
            {activeTab === "endpoints"    && <EpGapTable  rows={epGaps} />}
            {activeTab === "journeys"     && <JGapTable   rows={jGaps} />}
            {activeTab === "plan"         && plan && (
              <div style={{ padding: "16px" }}>
                <PlanPanel plan={plan} />
              </div>
            )}
            {activeTab === "plan" && !plan && <EmptyState label="Analyze gaps to generate a plan" />}
          </div>
        </div>
      )}

      {!loaded && !loading && (
        <div style={{
          background: `${P}08`, border: `1px solid ${P}22`, borderRadius: 12,
          padding: "28px", textAlign: "center", fontSize: 13, color: muted,
        }}>
          Click <strong style={{ color: P }}>Analyze Gaps</strong> to compute where your test coverage is missing or insufficient.
        </div>
      )}
    </div>
  );
}
