import { useState, useEffect, useCallback } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import {
  fetchRTMSnapshot, recomputeCoverage, getCoverageSummary,
  getRequirementCoverages, getEndpointCoverages, getJourneyCoverages,
  type RTMCoverageSummary, type RequirementCoverage,
  type EndpointCoverage, type JourneyCoverage, type GenerationResult,
} from "@/api/rtm";
import { RTMGenerateModal } from "./RTMGenerateModal";

// ─── Colour helpers ──────────────────────────────────────────────────────────

function scoreColor(pct: number): string {
  if (pct >= 80) return "#4CAF50";
  if (pct >= 50) return "#FFA726";
  return "#EF5350";
}

const PRIORITY_COLOR: Record<string, string> = {
  P0: "#EF5350", P1: "#FF7043", P2: "#FFA726", P3: "#66BB6A",
};
const RISK_COLOR: Record<string, string> = {
  high: "#EF5350", medium: "#FFA726", low: "#66BB6A",
};
const METHOD_COLOR: Record<string, string> = {
  GET: "#4CAF50", POST: "#2196F3", PUT: "#FF9800",
  PATCH: "#9C27B0", DELETE: "#F44336",
};

// ─── Gauge widget ────────────────────────────────────────────────────────────

function Gauge({ pct, label, color }: { pct: number; label: string; color: string }) {
  const { TXT: text, TXT2: muted, BDR: border, CARD: surface } = useColors();
  const r = 36, circumference = 2 * Math.PI * r;
  const progress = ((100 - pct) / 100) * circumference;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      minWidth: 100,
    }}>
      <svg width={90} height={90} viewBox="0 0 90 90">
        <circle cx={45} cy={45} r={r} fill="none" stroke={border} strokeWidth={8} />
        <circle
          cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={progress}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x={45} y={49} textAnchor="middle" fontSize={16} fontWeight={700} fill={text}>
          {pct}%
        </text>
      </svg>
      <div style={{ fontSize: 11, fontWeight: 600, color: muted, textAlign: "center" }}>{label}</div>
    </div>
  );
}

// ─── Summary card ────────────────────────────────────────────────────────────

function StatCard({ label, covered, total, pct }: { label: string; covered: number; total: number; pct: number }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted } = useColors();
  const color = scoreColor(pct);
  return (
    <div style={{
      background: surface, border: `1px solid ${border}`, borderRadius: 12,
      padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flex: 1,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, fontWeight: 900, color,
      }}>
        {pct}%
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{label}</div>
        <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
          {covered} / {total} covered
        </div>
        <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: border, width: 100, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.5s ease" }} />
        </div>
      </div>
    </div>
  );
}

// ─── Coverage score cell ──────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = scoreColor(pct);
  const { BDR: border } = useColors();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 100 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: border, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 28, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

// ─── Dimension coverage ───────────────────────────────────────────────────────

function DimCell({ covered, total }: { covered: number; total: number }) {
  const { TXT2: muted } = useColors();
  if (total === 0) return <span style={{ fontSize: 11, color: muted }}>—</span>;
  const pct = Math.round((covered / total) * 100);
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: scoreColor(pct) }}>
      {covered}/{total}
    </span>
  );
}

// ─── Requirements coverage table ─────────────────────────────────────────────

function RequirementCoverageTable({ rows, border, thStyle }: {
  rows: RequirementCoverage[];
  border: string;
  thStyle: React.CSSProperties;
}) {
  const { TXT: text, TXT2: muted, BG: bg } = useColors();

  if (!rows.length) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: muted, fontSize: 13 }}>
        No coverage data. Click "Recompute" to generate.
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${border}` }}>
            <th style={thStyle}>Key</th>
            <th style={thStyle}>Title</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Risk</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Priority</th>
            <th style={thStyle}>Coverage</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Tests</th>
            <th style={{ ...thStyle, textAlign: "center" }}>UI Flows</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Endpoints</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Journeys</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: `1px solid ${border}` }}>
              <td style={{ padding: "9px 12px", fontWeight: 700, color: muted, whiteSpace: "nowrap" }}>
                {r.requirementKey ?? r.requirementId.slice(0, 8)}
              </td>
              <td style={{ padding: "9px 12px", color: text, maxWidth: 240 }}>
                {r.requirementTitle ?? "—"}
              </td>
              <td style={{ padding: "9px 12px", textAlign: "center" }}>
                {r.risk && (
                  <span style={{
                    padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700,
                    background: `${RISK_COLOR[r.risk] ?? "#999"}22`,
                    color: RISK_COLOR[r.risk] ?? "#999",
                  }}>
                    {r.risk}
                  </span>
                )}
              </td>
              <td style={{ padding: "9px 12px", textAlign: "center" }}>
                {r.priority && (
                  <span style={{
                    padding: "2px 7px", borderRadius: 5, fontSize: 10, fontWeight: 700,
                    background: `${PRIORITY_COLOR[r.priority] ?? "#999"}22`,
                    color: PRIORITY_COLOR[r.priority] ?? "#999",
                  }}>
                    {r.priority}
                  </span>
                )}
              </td>
              <td style={{ padding: "9px 12px", minWidth: 130 }}>
                <ScoreBar score={r.coverageScore} />
              </td>
              <td style={{ padding: "9px 12px", textAlign: "center" }}>
                <span style={{ fontWeight: 600, color: r.hasTests ? "#4CAF50" : muted }}>
                  {r.totalTests > 0 ? `${r.totalTests} (${r.passedTests}✓ ${r.failedTests}✗)` : "None"}
                </span>
              </td>
              <td style={{ padding: "9px 12px", textAlign: "center" }}>
                <DimCell covered={r.uiFlowsCovered} total={r.uiFlowsTotal} />
              </td>
              <td style={{ padding: "9px 12px", textAlign: "center" }}>
                <DimCell covered={r.endpointsCovered} total={r.endpointsTotal} />
              </td>
              <td style={{ padding: "9px 12px", textAlign: "center" }}>
                <DimCell covered={r.journeysCovered} total={r.journeysTotal} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Endpoint coverage table ─────────────────────────────────────────────────

function EndpointCoverageTable({ rows, border, thStyle }: {
  rows: EndpointCoverage[];
  border: string;
  thStyle: React.CSSProperties;
}) {
  const { TXT2: muted } = useColors();
  if (!rows.length) return (
    <div style={{ textAlign: "center", padding: "20px 0", color: muted, fontSize: 13 }}>
      No endpoint coverage data.
    </div>
  );
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${border}` }}>
            <th style={thStyle}>Method</th>
            <th style={thStyle}>Path</th>
            <th style={thStyle}>Coverage</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Tests</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(e => (
            <tr key={e.id} style={{ borderBottom: `1px solid ${border}` }}>
              <td style={{ padding: "8px 12px" }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                  background: `${METHOD_COLOR[e.method ?? ""] ?? "#999"}22`,
                  color: METHOD_COLOR[e.method ?? ""] ?? "#999",
                }}>
                  {e.method ?? "—"}
                </span>
              </td>
              <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: muted }}>
                {e.path ?? e.endpointId}
              </td>
              <td style={{ padding: "8px 12px", minWidth: 130 }}>
                <ScoreBar score={e.coverageScore} />
              </td>
              <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: e.totalTests > 0 ? "#4CAF50" : muted }}>
                {e.totalTests}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Journey coverage table ───────────────────────────────────────────────────

function JourneyCoverageTable({ rows, border, thStyle }: {
  rows: JourneyCoverage[];
  border: string;
  thStyle: React.CSSProperties;
}) {
  const { TXT: text, TXT2: muted } = useColors();
  if (!rows.length) return (
    <div style={{ textAlign: "center", padding: "20px 0", color: muted, fontSize: 13 }}>
      No journey coverage data.
    </div>
  );
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${border}` }}>
            <th style={thStyle}>Key</th>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Coverage</th>
            <th style={{ ...thStyle, textAlign: "center" }}>Tests</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(j => (
            <tr key={j.id} style={{ borderBottom: `1px solid ${border}` }}>
              <td style={{ padding: "8px 12px", fontWeight: 700, color: muted }}>{j.journeyKey ?? "—"}</td>
              <td style={{ padding: "8px 12px", color: text }}>{j.journeyName ?? j.journeyId}</td>
              <td style={{ padding: "8px 12px", minWidth: 130 }}>
                <ScoreBar score={j.coverageScore} />
              </td>
              <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: j.totalTests > 0 ? "#4CAF50" : muted }}>
                {j.totalTests}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main coverage view ───────────────────────────────────────────────────────

interface Props { projectId: string }

type CoverageTab = "requirements" | "endpoints" | "journeys";

export function RTMCoverageView({ projectId }: Props) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();

  const [versionId,  setVersionId]  = useState<string | null>(null);
  const [summary,    setSummary]    = useState<RTMCoverageSummary | null>(null);
  const [reqRows,    setReqRows]    = useState<RequirementCoverage[]>([]);
  const [epRows,     setEpRows]     = useState<EndpointCoverage[]>([]);
  const [jRows,      setJRows]      = useState<JourneyCoverage[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [recomputing,   setRecomputing]   = useState(false);
  const [activeTab,     setActiveTab]     = useState<CoverageTab>("requirements");
  const [showGenModal,  setShowGenModal]  = useState(false);
  const [lastGenResult, setLastGenResult] = useState<GenerationResult | null>(null);

  const load = useCallback(async (vid: string) => {
    setLoading(true);
    try {
      const [s, rr, er, jr] = await Promise.all([
        getCoverageSummary(projectId, vid).catch(() => null),
        getRequirementCoverages(projectId, vid),
        getEndpointCoverages(projectId, vid),
        getJourneyCoverages(projectId, vid),
      ]);
      setSummary(s);
      setReqRows(rr);
      setEpRows(er);
      setJRows(jr);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchRTMSnapshot(projectId).then(snap => {
      if (snap) {
        setVersionId(snap.versionId);
        load(snap.versionId);
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, [projectId, load]);

  const handleRecompute = async () => {
    if (!versionId) return;
    setRecomputing(true);
    try {
      await recomputeCoverage(projectId, versionId);
      toast.success("Coverage recomputed");
      await load(versionId);
    } catch {
      toast.error("Recompute failed");
    } finally {
      setRecomputing(false);
    }
  };

  const thStyle: React.CSSProperties = {
    padding: "9px 12px", fontSize: 10, fontWeight: 700,
    color: muted, textTransform: "uppercase", letterSpacing: "0.06em",
    background: bg, textAlign: "left", whiteSpace: "nowrap",
  };

  const tabStyle = (active: boolean) => ({
    padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: active ? 700 : 500,
    border: `1px solid ${active ? P : border}`,
    background: active ? `${P}1A` : "transparent",
    color: active ? P : muted, cursor: "pointer", transition: "all 0.12s",
  });

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 200, color: muted, fontSize: 13 }}>
      Loading coverage…
    </div>
  );

  if (!versionId) return (
    <div style={{ textAlign: "center", color: muted, fontSize: 13, padding: "48px 0" }}>
      No RTM domain model found. Initialize RTM first.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {showGenModal && versionId && (
        <RTMGenerateModal
          projectId={projectId}
          versionId={versionId}
          onClose={() => setShowGenModal(false)}
          onSuccess={res => setLastGenResult(res)}
        />
      )}

      {/* ── Header + actions ── */}
      <div style={{
        background: surface, border: `1px solid ${border}`, borderRadius: 12,
        padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: text }}>RTM Coverage</div>
          <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
            {summary?.lastComputedAt
              ? `Last computed ${new Date(summary.lastComputedAt).toLocaleString()}`
              : "Not yet computed"}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button
            onClick={handleRecompute}
            disabled={recomputing}
            style={{
              padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: `1px solid ${border}`, background: "transparent",
              color: recomputing ? muted : text,
              cursor: recomputing ? "not-allowed" : "pointer",
            }}
          >
            {recomputing ? "Recomputing…" : "↺ Recompute"}
          </button>
          <button
            onClick={() => setShowGenModal(true)}
            style={{
              padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: "none", background: P, color: "#fff", cursor: "pointer",
            }}
          >
            ⚡ Generate Tests
          </button>
        </div>
      </div>

      {/* ── Last generation result banner ── */}
      {lastGenResult && (
        <div style={{
          background: `#4CAF5010`, border: `1px solid #4CAF5044`, borderRadius: 12,
          padding: "12px 18px", display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ fontSize: 20 }}>✓</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4CAF50" }}>
              Tests generated — {lastGenResult.totalFiles} files, {lastGenResult.totalTests} tests
            </div>
            <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
              UI: {lastGenResult.uiFiles} &nbsp;·&nbsp; API: {lastGenResult.apiFiles} &nbsp;·&nbsp; Hybrid: {lastGenResult.hybridFiles}
              &nbsp;·&nbsp; Output: <code style={{ color: text, fontSize: 11 }}>{lastGenResult.outputDir}</code>
            </div>
          </div>
          <button
            onClick={() => setLastGenResult(null)}
            style={{ marginLeft: "auto", background: "transparent", border: "none", color: muted, cursor: "pointer", fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Summary gauges ── */}
      {summary ? (
        <div style={{
          background: surface, border: `1px solid ${border}`, borderRadius: 12,
          padding: "20px 24px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 20 }}>
            Coverage Overview
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
            {/* Gauges */}
            <div style={{ display: "flex", gap: 24, flex: "0 0 auto" }}>
              <Gauge pct={summary.requirementsCoveragePercent} label="Requirements" color={scoreColor(summary.requirementsCoveragePercent)} />
              <Gauge pct={summary.endpointsCoveragePercent}   label="Endpoints"    color={scoreColor(summary.endpointsCoveragePercent)} />
              <Gauge pct={summary.journeysCoveragePercent}    label="Journeys"     color={scoreColor(summary.journeysCoveragePercent)} />
              <Gauge pct={summary.riskWeightedCoverageScore}  label="Risk-Weighted" color={scoreColor(summary.riskWeightedCoverageScore)} />
            </div>
            {/* Stat cards */}
            <div style={{ display: "flex", gap: 12, flex: 1, flexWrap: "wrap" }}>
              <StatCard label="Requirements" covered={summary.requirementsCovered} total={summary.requirementsTotal} pct={summary.requirementsCoveragePercent} />
              <StatCard label="RTM Endpoints" covered={summary.endpointsCovered}   total={summary.endpointsTotal}    pct={summary.endpointsCoveragePercent} />
              <StatCard label="Journeys"      covered={summary.journeysCovered}    total={summary.journeysTotal}     pct={summary.journeysCoveragePercent} />
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: surface, border: `1px solid ${border}`, borderRadius: 12,
          padding: "28px", textAlign: "center", color: muted, fontSize: 13,
        }}>
          Click "Recompute" to calculate coverage metrics.
        </div>
      )}

      {/* ── Detail tables ── */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
        {/* Tab bar */}
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, display: "flex", gap: 8 }}>
          <button onClick={() => setActiveTab("requirements")} style={tabStyle(activeTab === "requirements")}>
            Requirements ({reqRows.length})
          </button>
          <button onClick={() => setActiveTab("endpoints")} style={tabStyle(activeTab === "endpoints")}>
            Endpoints ({epRows.length})
          </button>
          <button onClick={() => setActiveTab("journeys")} style={tabStyle(activeTab === "journeys")}>
            Journeys ({jRows.length})
          </button>
        </div>

        {activeTab === "requirements" && (
          <RequirementCoverageTable rows={reqRows} border={border} thStyle={thStyle} />
        )}
        {activeTab === "endpoints" && (
          <EndpointCoverageTable rows={epRows} border={border} thStyle={thStyle} />
        )}
        {activeTab === "journeys" && (
          <JourneyCoverageTable rows={jRows} border={border} thStyle={thStyle} />
        )}
      </div>

      {/* ── Test tagging hint ── */}
      <div style={{
        background: `${P}0A`, border: `1px solid ${P}33`, borderRadius: 12, padding: "14px 18px",
        fontSize: 12, color: muted, lineHeight: 1.6,
      }}>
        <strong style={{ color: P }}>How to tag tests:</strong> Add annotations to your spec files:
        <code style={{ display: "block", marginTop: 6, fontFamily: "monospace", fontSize: 11, color: text }}>
          // @rtm-req  &lt;requirementId&gt;<br />
          // @rtm-flow &lt;flowId&gt;<br />
          // @rtm-endpoint &lt;endpointId&gt;<br />
          // @rtm-journey  &lt;journeyId&gt;
        </code>
        Coverage will pick these up on the next Recompute.
      </div>
    </div>
  );
}
