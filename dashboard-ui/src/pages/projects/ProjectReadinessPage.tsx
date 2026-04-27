import { useEffect, useState, useCallback } from "react";
import { theme } from "@/theme";
import type { TabId } from "@/dashboard/pages/projects/layout/ProjectSidebar";

const API = "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReadinessStatus = "ready" | "at-risk" | "not-ready";

interface ScoreDimension {
  label: string;
  score: number;
  color: string;
  detail: string;
}

interface Gate {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  critical: boolean;
  value: string;
  target: string;
  tab: string;
}

interface Recommendation {
  label: string;
  detail: string;
  tab: string;
  priority: "high" | "medium" | "low";
}

interface ReadinessAssessment {
  status: ReadinessStatus;
  overallScore: number;
  dimensions: ScoreDimension[];
  gates: Gate[];
  summary: string;
  recommendations: Recommendation[];
  environment: string;
  generatedAt: string;
  coverage: { requirementsPct: number | null; endpointsPct: number | null; flowsPct: number | null };
  stability: { passRate: number | null; failedTests: number; flakyCount: number; totalTests: number };
  openCriticalInsights: number;
  openHighInsights: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReadinessStatus, { label: string; color: string; bg: string; border: string }> = {
  "ready":     { label: "Ready for Release",  color: "#4CAF50", bg: "#4CAF5012", border: "#4CAF5040" },
  "at-risk":   { label: "At Risk",            color: "#FF9800", bg: "#FF980012", border: "#FF980040" },
  "not-ready": { label: "Not Ready",          color: "#EF5350", bg: "#EF535012", border: "#EF535040" },
};

const PRIORITY_DOT: Record<string, string> = {
  high: "#EF5350", medium: "#FF9800", low: "#4CAF50",
};

const ENV_OPTIONS = ["staging", "production", "qa", "dev"];

// ─── Theme ────────────────────────────────────────────────────────────────────

function useC() {
  return {
    P:    theme.colors.primary,
    CARD: theme.colors.background,
    BDR:  theme.colors.border,
    TXT:  theme.colors.textDark,
    TXT2: theme.colors.textLight,
    BG:   theme.colors.appBackground,
  };
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 120 }: { score: number; color: string; size?: number }) {
  const r = (size / 2) - 10;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;
  const strokeW = size < 100 ? 7 : 10;

  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={`${color}1a`} strokeWidth={strokeW} />
      {/* Fill — start at top */}
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={strokeW}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.7s ease" }}
      />
      {/* Center label */}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={size < 100 ? 18 : 26}
        fontWeight="800" fill={color} dominantBaseline="middle">
        {score}
      </text>
      <text x={cx} y={cy + (size < 100 ? 12 : 16)} textAnchor="middle" fontSize={size < 100 ? 9 : 12}
        fill={color} opacity={0.7} fontWeight="600">
        /100
      </text>
    </svg>
  );
}

// ─── Gate strip ───────────────────────────────────────────────────────────────

function GateStrip({ gates, TXT2 }: { gates: Gate[]; TXT2: string }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
      {gates.map(g => (
        <div key={g.id} title={`${g.name}: ${g.value}`} style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 9px", borderRadius: 20,
          background: g.passed ? "#4CAF5015" : g.critical ? "#EF535015" : "#FF980015",
          border: `1px solid ${g.passed ? "#4CAF5030" : g.critical ? "#EF535030" : "#FF980030"}`,
          fontSize: 11, fontWeight: 600,
          color: g.passed ? "#4CAF50" : g.critical ? "#EF5350" : "#FF9800",
        }}>
          <span>{g.passed ? "✓" : "✕"}</span>
          <span style={{ color: TXT2, fontWeight: 500, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {g.name}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Dimension card ───────────────────────────────────────────────────────────

function DimCard({ dim, CARD, BDR, TXT, TXT2 }: { dim: ScoreDimension; CARD: string; BDR: string; TXT: string; TXT2: string }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BDR}`, borderRadius: 12,
      padding: "16px", display: "flex", gap: 14, alignItems: "center",
    }}>
      <ScoreRing score={dim.score} color={dim.color} size={72} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 2 }}>{dim.label}</div>
        <div style={{ fontSize: 11, color: TXT2, lineHeight: 1.4 }}>{dim.detail}</div>
        <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: `${dim.color}20` }}>
          <div style={{
            height: "100%", borderRadius: 2, background: dim.color,
            width: `${dim.score}%`, transition: "width 0.7s ease",
          }} />
        </div>
      </div>
    </div>
  );
}

// ─── Gate row ─────────────────────────────────────────────────────────────────

function GateRow({ gate, onNavigate, CARD, BDR, TXT, TXT2 }: {
  gate: Gate; onNavigate?: (tab: TabId) => void;
  CARD: string; BDR: string; TXT: string; TXT2: string;
}) {
  const statusColor = gate.passed ? "#4CAF50" : gate.critical ? "#EF5350" : "#FF9800";

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14, padding: "13px 16px",
      borderRadius: 10, background: CARD,
      border: `1px solid ${gate.passed ? BDR : `${statusColor}30`}`,
      borderLeft: `3px solid ${statusColor}`,
    }}>
      {/* Icon */}
      <div style={{
        width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
        background: `${statusColor}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: statusColor }}>
          {gate.passed ? "✓" : "✕"}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: TXT }}>{gate.name}</span>
          {gate.critical && !gate.passed && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 4,
              background: "#EF535018", color: "#EF5350", letterSpacing: "0.04em",
            }}>BLOCKER</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: TXT2, marginTop: 2, lineHeight: 1.5 }}>{gate.description}</div>
        <div style={{ display: "flex", gap: 20, marginTop: 6 }}>
          <span style={{ fontSize: 12, color: TXT2 }}>
            Measured: <strong style={{ color: TXT }}>{gate.value}</strong>
          </span>
          <span style={{ fontSize: 12, color: TXT2 }}>
            Required: <strong style={{ color: gate.passed ? "#4CAF50" : statusColor }}>{gate.target}</strong>
          </span>
        </div>
      </div>

      {/* Deep-link */}
      {onNavigate && (
        <button
          onClick={() => onNavigate(gate.tab as TabId)}
          style={{
            flexShrink: 0, fontSize: 11, padding: "5px 11px", borderRadius: 6,
            border: `1px solid ${BDR}`, background: "transparent",
            color: TXT2, cursor: "pointer",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.primary; e.currentTarget.style.color = theme.colors.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BDR; e.currentTarget.style.color = TXT2; }}
        >
          View →
        </button>
      )}
    </div>
  );
}

// ─── Recommendation item ──────────────────────────────────────────────────────

function RecItem({ rec, onNavigate, BDR, TXT, TXT2 }: {
  rec: Recommendation; onNavigate?: (tab: TabId) => void;
  BDR: string; TXT: string; TXT2: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "10px 0", borderBottom: `1px solid ${BDR}`,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 5,
        background: PRIORITY_DOT[rec.priority],
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: TXT }}>{rec.label}</div>
        <div style={{ fontSize: 11, color: TXT2, marginTop: 2 }}>{rec.detail}</div>
      </div>
      {onNavigate && (
        <button
          onClick={() => onNavigate(rec.tab as TabId)}
          style={{
            flexShrink: 0, fontSize: 11, padding: "3px 9px", borderRadius: 5,
            border: `1px solid ${BDR}`, background: "transparent",
            color: TXT2, cursor: "pointer",
          }}
        >
          Go →
        </button>
      )}
    </div>
  );
}

// ─── Coverage bar ─────────────────────────────────────────────────────────────

function CovBar({ label, pct, P }: { label: string; pct: number | null; P: string }) {
  const barColor = pct === null ? "#ccc" : pct >= 70 ? "#4CAF50" : pct >= 40 ? "#FF9800" : "#EF5350";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
        <span style={{ color: theme.colors.textLight }}>{label}</span>
        <strong style={{ color: barColor }}>{pct !== null ? `${pct}%` : "—"}</strong>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: `${P}18` }}>
        {pct !== null && (
          <div style={{ height: "100%", borderRadius: 3, background: barColor, width: `${pct}%`, transition: "width 0.6s" }} />
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
  onNavigate?: (tab: TabId) => void;
}

export default function ProjectReadinessPage({ projectId, onNavigate }: Props) {
  const { P, CARD, BDR, TXT, TXT2, BG } = useC();

  const [data, setData]       = useState<ReadinessAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [env, setEnv]         = useState("staging");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (e: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/projects/${projectId}/readiness?env=${e}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (err: any) {
      setError(err.message ?? "Failed to load readiness");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(env); }, [load, env]);

  const refresh = async () => { setRefreshing(true); await load(env); setRefreshing(false); };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
      {[240, 160, 320, 180, 260].map((w, i) => (
        <div key={i} style={{ height: 18, width: w, borderRadius: 6, background: BDR, opacity: 0.5 }} />
      ))}
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: 40, textAlign: "center", color: TXT2 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>⚠</div>
      <div style={{ fontSize: 14 }}>{error ?? "No readiness data available"}</div>
      <button onClick={refresh} style={{
        marginTop: 16, padding: "8px 22px", borderRadius: 8,
        background: P, color: "#fff", border: "none", cursor: "pointer", fontSize: 13,
      }}>Retry</button>
    </div>
  );

  const sc   = STATUS_CONFIG[data.status];
  const failedGates  = data.gates.filter(g => !g.passed);
  const passedGates  = data.gates.filter(g =>  g.passed);
  const critBlockers = failedGates.filter(g => g.critical).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "4px 0 32px" }}>

      {/* ── Hero header ───────────────────────────────────────────────────────── */}
      <div style={{
        background: CARD, border: `1px solid ${BDR}`,
        borderRadius: 14, padding: "22px 24px",
        display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap",
      }}>
        {/* Score ring */}
        <div style={{ flexShrink: 0 }}>
          <ScoreRing score={data.overallScore} color={sc.color} size={120} />
        </div>

        {/* Right side */}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Status badge */}
            <div style={{
              padding: "6px 14px", borderRadius: 20,
              background: sc.bg, border: `1.5px solid ${sc.border}`,
              fontSize: 13, fontWeight: 700, color: sc.color,
            }}>
              {data.status === "ready" ? "✓" : data.status === "not-ready" ? "✕" : "⚠"}&nbsp;&nbsp;{sc.label}
            </div>
            {/* Environment */}
            <span style={{
              padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: `${P}10`, border: `1px solid ${P}30`, color: P,
            }}>
              {data.environment}
            </span>
            {/* Generated at */}
            <span style={{ fontSize: 11, color: TXT2 }}>
              {new Date(data.generatedAt).toLocaleString()}
            </span>
          </div>

          {/* Summary */}
          <p style={{ margin: "12px 0 0", fontSize: 13, color: TXT, lineHeight: 1.7 }}>
            {data.summary}
          </p>

          {/* Gate strip */}
          <GateStrip gates={data.gates} TXT2={TXT2} />
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "flex-start" }}>
          <select
            value={env}
            onChange={e => setEnv(e.target.value)}
            style={{
              padding: "7px 10px", borderRadius: 8, border: `1px solid ${BDR}`,
              background: BG, color: TXT, fontSize: 12, cursor: "pointer",
            }}
          >
            {ENV_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <button
            onClick={refresh} disabled={refreshing}
            style={{
              padding: "7px 14px", borderRadius: 8, border: `1px solid ${BDR}`,
              background: CARD, color: TXT, fontSize: 12, cursor: "pointer",
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            {refreshing ? "…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* ── KPI bar ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[
          { label: "Overall Score",   value: `${data.overallScore}/100`, color: sc.color,    bg: sc.bg },
          { label: "Gates Passed",    value: `${passedGates.length}/${data.gates.length}`, color: "#4CAF50", bg: "#4CAF5012" },
          { label: "Critical Blockers", value: critBlockers, color: critBlockers > 0 ? "#EF5350" : "#4CAF50", bg: critBlockers > 0 ? "#EF535012" : "#4CAF5012" },
          { label: "Open Insights",   value: data.openCriticalInsights + data.openHighInsights, color: (data.openCriticalInsights + data.openHighInsights) > 0 ? "#FF9800" : "#4CAF50", bg: "#FF980012" },
        ].map(k => (
          <div key={k.label} style={{
            background: k.bg, border: `1px solid ${k.color}30`,
            borderRadius: 10, padding: "14px 16px", textAlign: "center",
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: TXT2, marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Dimension scores ──────────────────────────────────────────────────── */}
      <section>
        <div style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 12 }}>
          Score Dimensions
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {data.dimensions.map(dim => (
            <DimCard key={dim.label} dim={dim} CARD={CARD} BDR={BDR} TXT={TXT} TXT2={TXT2} />
          ))}
        </div>
      </section>

      {/* ── Quality gates ─────────────────────────────────────────────────────── */}
      <section>
        <div style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: 12 }}>
          Quality Gates
          {failedGates.length > 0 && (
            <span style={{ marginLeft: 10, fontWeight: 600, color: "#EF5350" }}>
              {failedGates.length} failing
            </span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Failed first */}
          {failedGates.map(g => <GateRow key={g.id} gate={g} onNavigate={onNavigate} CARD={CARD} BDR={BDR} TXT={TXT} TXT2={TXT2} />)}
          {passedGates.map(g => <GateRow key={g.id} gate={g} onNavigate={onNavigate} CARD={CARD} BDR={BDR} TXT={TXT} TXT2={TXT2} />)}
        </div>
      </section>

      {/* ── Bottom two-column ─────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Recommendations */}
        <div style={{
          background: CARD, border: `1px solid ${BDR}`,
          borderRadius: 12, padding: "18px 20px",
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 14 }}>
            Recommendations
            <span style={{ fontSize: 11, color: TXT2, fontWeight: 500, marginLeft: 8 }}>
              {data.recommendations.length} action{data.recommendations.length !== 1 ? "s" : ""}
            </span>
          </div>
          {data.recommendations.length === 0 ? (
            <div style={{ fontSize: 13, color: TXT2, fontStyle: "italic" }}>
              All gates are passing — no actions required.
            </div>
          ) : (
            data.recommendations.map((r, i) => (
              <RecItem key={i} rec={r} onNavigate={onNavigate} BDR={BDR} TXT={TXT} TXT2={TXT2} />
            ))
          )}
          {/* Legend */}
          <div style={{ display: "flex", gap: 14, marginTop: 14 }}>
            {(["high", "medium", "low"] as const).map(p => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: TXT2 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: PRIORITY_DOT[p] }} />
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* Coverage & stability */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Coverage */}
          <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, padding: "16px 18px", flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 12 }}>Coverage</div>
            <CovBar label="Requirements" pct={data.coverage.requirementsPct} P={P} />
            <CovBar label="Endpoints"    pct={data.coverage.endpointsPct}    P={P} />
            <CovBar label="Flows"        pct={data.coverage.flowsPct}        P={P} />
          </div>

          {/* Stability */}
          <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 12, padding: "16px 18px", flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 12 }}>Stability</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { label: "Pass Rate",    value: data.stability.passRate !== null ? `${data.stability.passRate}%` : "—",
                  color: data.stability.passRate !== null ? (data.stability.passRate >= 80 ? "#4CAF50" : "#FF9800") : TXT2 },
                { label: "Failed",       value: String(data.stability.failedTests),
                  color: data.stability.failedTests > 0 ? "#EF5350" : "#4CAF50" },
                { label: "Total Tests",  value: String(data.stability.totalTests),   color: TXT },
                { label: "Flaky",        value: String(data.stability.flakyCount),
                  color: data.stability.flakyCount > 2 ? "#FF9800" : "#4CAF50" },
              ].map(s => (
                <div key={s.label} style={{
                  background: BG, borderRadius: 8, padding: "10px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: TXT2, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
