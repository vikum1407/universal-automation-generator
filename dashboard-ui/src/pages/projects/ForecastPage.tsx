import { useState, useEffect, useCallback, useMemo } from "react";
import { useColors } from "@/hooks/useColors";

const API = "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

type RiskLevel = "low" | "medium" | "high" | "critical";
type Direction = "increasing" | "decreasing" | "steady";

interface HistoryPoint  { date: string; value: number; }
interface ForecastPoint { date: string; value: number; lower: number; upper: number; confidence: number; }

interface MetricSummary {
  metric:       string;
  label:        string;
  unit:         string;
  current:      number;
  projected:    number;
  delta:        number;
  direction:    Direction;
  improving:    boolean;
  slope:        number;
  riskLevel:    RiskLevel;
  forecast:     ForecastPoint[];
}

interface EventRisk {
  probability: number;
  level:       RiskLevel;
  factors:     string[];
  recommendation?: string;
}

interface ForecastOverview {
  projectId:   string;
  generatedAt: string;
  horizonDays: number;
  overallRisk: RiskLevel;
  headline:    string;
  metrics:     MetricSummary[];
  events: {
    regressionRisk:       EventRisk;
    readinessFailureRisk: EventRisk;
    incidentRisk:         EventRisk;
    stabilityRisk:        EventRisk;
  };
}

interface MetricDetail {
  metric:        string;
  label:         string;
  unit:          string;
  improvingWhen: "up" | "down";
  statistics: {
    current:   number;
    projected: number;
    delta:     number;
    slope:     number;
    direction: Direction;
    improving: boolean;
  };
  history:  HistoryPoint[];
  forecast: ForecastPoint[];
}

interface WhatIfMetric {
  metric:   string;
  label:    string;
  unit:     string;
  baseline: { projected: number };
  scenario: { projected: number; delta: number };
  improving: boolean;
}

interface WhatIfResult {
  scenario:    { id: string; label: string; description: string };
  allScenarios: { id: string; label: string; description: string }[];
  horizonDays:  number;
  comparison: {
    baseline: { regression: number; readiness: number; incident: number };
    scenario: { regression: number; readiness: number; incident: number };
    riskReduction: { regression: number; readiness: number; incident: number };
  };
  metrics: WhatIfMetric[];
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const RISK_CFG: Record<RiskLevel, { color: string; bg: string; label: string }> = {
  low:      { color: "#22c55e", bg: "#22c55e12", label: "Low"      },
  medium:   { color: "#f59e0b", bg: "#f59e0b12", label: "Medium"   },
  high:     { color: "#ef4444", bg: "#ef444412", label: "High"     },
  critical: { color: "#dc2626", bg: "#dc262612", label: "Critical" },
};

const METRIC_COLORS: Record<string, string> = {
  failureRate:      "#ef4444",
  flakinessRate:    "#f59e0b",
  coverageOverall:  "#22c55e",
  coverageCritical: "#10b981",
  riskScore:        "#8b5cf6",
  passRate:         "#3b82f6",
  readinessScore:   "#7B2FF7",
};

const DIR_ARROW: Record<Direction, string> = {
  increasing: "↑",
  decreasing: "↓",
  steady:     "→",
};

// ─── SVG Forecast Chart ───────────────────────────────────────────────────────

function ForecastChart({
  history,
  forecast,
  color,
  height = 80,
  showBands = true,
}: {
  history:   HistoryPoint[];
  forecast:  ForecastPoint[];
  color:     string;
  height?:   number;
  showBands?: boolean;
}) {
  const { dark } = useColors();
  const W = 400;
  const H = height;
  const PAD = { top: 8, right: 8, bottom: 8, left: 8 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const allValues = [
    ...history.map(p => p.value),
    ...forecast.map(p => p.value),
    ...forecast.map(p => p.lower),
    ...forecast.map(p => p.upper),
  ];
  const minV = Math.min(...allValues);
  const maxV = Math.max(...allValues);
  const rangeV = maxV - minV || 1;

  const totalPoints = history.length + forecast.length;
  const xScale = (i: number) => PAD.left + (i / Math.max(1, totalPoints - 1)) * innerW;
  const yScale = (v: number) => PAD.top + innerH - ((v - minV) / rangeV) * innerH;

  const histPath = history
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(p.value).toFixed(1)}`)
    .join(" ");

  const foreOffset = history.length;
  const foreLinePath = forecast
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(foreOffset + i).toFixed(1)} ${yScale(p.value).toFixed(1)}`)
    .join(" ");

  const bandPath = showBands && forecast.length > 0
    ? [
        ...forecast.map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(foreOffset + i).toFixed(1)} ${yScale(p.upper).toFixed(1)}`),
        ...forecast.slice().reverse().map((p, i) => `L ${xScale(foreOffset + forecast.length - 1 - i).toFixed(1)} ${yScale(p.lower).toFixed(1)}`),
        "Z",
      ].join(" ")
    : "";

  const splitX = xScale(history.length - 1);

  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", overflow: "visible" }}>
      {/* Divider between history and forecast */}
      <line x1={splitX} y1={PAD.top} x2={splitX} y2={H - PAD.bottom}
        stroke={dark ? "#2a2a3a" : "#e5e7eb"} strokeWidth="1" strokeDasharray="3 3" />

      {/* Confidence band */}
      {bandPath && (
        <path d={bandPath} fill={color} fillOpacity="0.12" stroke="none" />
      )}

      {/* Historical line */}
      <path d={histPath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Forecast line (dashed) */}
      <path d={foreLinePath} fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="5 3" strokeOpacity="0.85" />

      {/* Connector dot at split */}
      {history.length > 0 && (
        <circle cx={splitX} cy={yScale(history[history.length - 1].value)} r="3" fill={color} />
      )}
    </svg>
  );
}

// ─── Sparkline (mini, for summary cards) ─────────────────────────────────────

function Sparkline({ points, color, height = 32 }: { points: number[]; color: string; height?: number }) {
  if (points.length < 2) return null;
  const W = 80;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const r   = max - min || 1;
  const x   = (i: number) => (i / (points.length - 1)) * W;
  const y   = (v: number) => height - ((v - min) / r) * height * 0.85 - 2;
  const d   = points.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={height} style={{ display: "block" }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Risk probability arc ─────────────────────────────────────────────────────

function ProbArc({ probability, level, size = 56 }: { probability: number; level: RiskLevel; size?: number }) {
  const { BDR } = useColors();
  const cfg  = RISK_CFG[level];
  const r    = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={BDR} strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={cfg.color} strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - probability / 100)}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

// ─── Metric summary card ──────────────────────────────────────────────────────

function MetricCard({
  summary,
  selected,
  onSelect,
}: {
  summary:  MetricSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const { CARD, BDR, TXT, TXT2, P } = useColors();
  const color = METRIC_COLORS[summary.metric] ?? P;
  const rc    = RISK_CFG[summary.riskLevel];
  const sparkValues = summary.forecast.map(p => p.value);

  const deltaColor = summary.improving
    ? "#22c55e"
    : summary.delta === 0 ? "#6b7280" : "#ef4444";

  const dirLabel = summary.direction === "increasing" ? DIR_ARROW.increasing
    : summary.direction === "decreasing" ? DIR_ARROW.decreasing
    : DIR_ARROW.steady;

  return (
    <div
      onClick={onSelect}
      style={{
        padding: "14px 16px",
        borderRadius: 10,
        background: CARD,
        border: `1.5px solid ${selected ? color : BDR}`,
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: selected ? `0 0 0 3px ${color}18` : "none",
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.borderColor = `${color}70`; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.borderColor = BDR; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {summary.label}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 3 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: TXT }}>{summary.current}{summary.unit}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: deltaColor }}>
              {dirLabel} {summary.delta > 0 ? "+" : ""}{summary.delta}{summary.unit}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{
            padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
            background: rc.bg, color: rc.color,
          }}>
            {rc.label}
          </span>
          <Sparkline points={[summary.current, ...sparkValues]} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: TXT2 }}>
        Projected in {summary.forecast.length}d: <strong style={{ color: TXT }}>{summary.projected}{summary.unit}</strong>
      </div>
    </div>
  );
}

// ─── Event risk card ──────────────────────────────────────────────────────────

function EventCard({ label, event }: { label: string; event: EventRisk }) {
  const { CARD, BDR, TXT, TXT2 } = useColors();
  const cfg = RISK_CFG[event.level];
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      padding: "14px 16px", borderRadius: 10,
      background: CARD, border: `1px solid ${BDR}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ProbArc probability={event.probability} level={event.level} size={52} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 900, color: cfg.color,
          }}>
            {event.probability}%
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TXT }}>{label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
            <span style={{
              padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
              background: cfg.bg, color: cfg.color,
            }}>
              {cfg.label} Risk
            </span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: TXT2, fontSize: 12, padding: "4px 8px",
          }}
        >
          {expanded ? "▲ Less" : "▼ More"}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 10 }}>
          {event.factors.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>
                Contributing Factors
              </div>
              {event.factors.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 3 }}>
                  <span style={{ color: cfg.color, fontSize: 12, marginTop: 1 }}>•</span>
                  <span style={{ fontSize: 12, color: TXT2 }}>{f}</span>
                </div>
              ))}
            </div>
          )}
          {event.recommendation && (
            <div style={{
              padding: "8px 10px", borderRadius: 7,
              background: `${cfg.color}0d`, border: `1px solid ${cfg.color}25`,
              fontSize: 12, color: TXT, lineHeight: 1.5,
            }}>
              <strong>Recommendation:</strong> {event.recommendation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── What-if panel ────────────────────────────────────────────────────────────

function WhatIfPanel({ projectId, horizonDays }: { projectId: string; horizonDays: number }) {
  const { CARD, BDR, TXT, TXT2, P } = useColors();
  const [scenario, setScenario]   = useState("fix-critical-insights");
  const [result, setResult]       = useState<WhatIfResult | null>(null);
  const [loading, setLoading]     = useState(false);

  const load = useCallback(async (sc: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/projects/${projectId}/forecast/what-if?scenario=${sc}&horizon=${horizonDays}`);
      if (res.ok) setResult(await res.json());
    } finally { setLoading(false); }
  }, [projectId, horizonDays]);

  useEffect(() => { load(scenario); }, [load, scenario]);

  const allScenarios = result?.allScenarios ?? [
    { id: "fix-critical-insights", label: "Fix all critical insights",    description: "" },
    { id: "add-test-coverage",     label: "Increase coverage to 80%",     description: "" },
    { id: "apply-auto-heal",       label: "Apply all Auto-Heal patches",  description: "" },
    { id: "do-nothing",            label: "No action (current trajectory)", description: "" },
  ];

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
        What-If Simulation
      </div>

      {/* Scenario selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {allScenarios.map(sc => (
          <button
            key={sc.id}
            onClick={() => { setScenario(sc.id); }}
            style={{
              padding: "6px 13px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: `1.5px solid ${scenario === sc.id ? P : BDR}`,
              background: scenario === sc.id ? `${P}12` : "transparent",
              color: scenario === sc.id ? P : TXT2,
              transition: "all 0.15s",
            }}
          >
            {sc.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: TXT2, fontSize: 13, padding: "20px 0" }}>Simulating…</div>}

      {result && !loading && (
        <>
          {/* Description */}
          {result.scenario.description && (
            <div style={{
              padding: "8px 12px", borderRadius: 8,
              background: `${P}0a`, border: `1px solid ${P}20`,
              fontSize: 12, color: TXT2, marginBottom: 14, lineHeight: 1.5,
            }}>
              {result.scenario.description}
            </div>
          )}

          {/* Risk comparison */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            {(["regression", "readiness", "incident"] as const).map(key => {
              const baseV  = result.comparison.baseline[key];
              const scenV  = result.comparison.scenario[key];
              const reduc  = result.comparison.riskReduction[key];
              const labels: Record<string, string> = {
                regression: "Regression",
                readiness:  "Readiness Failure",
                incident:   "Incident",
              };
              return (
                <div key={key} style={{
                  flex: 1, minWidth: 100, padding: "12px 14px", borderRadius: 8,
                  background: CARD, border: `1px solid ${BDR}`,
                }}>
                  <div style={{ fontSize: 10, color: TXT2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    {labels[key]} Risk
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: TXT }}>{scenV}%</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textDecoration: "line-through" }}>
                      {baseV}%
                    </span>
                  </div>
                  {reduc !== 0 && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: reduc > 0 ? "#22c55e" : "#ef4444", marginTop: 4 }}>
                      {reduc > 0 ? `−${reduc}% risk` : `+${Math.abs(reduc)}% risk`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Metric changes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {result.metrics.filter(m => m.scenario.delta !== 0).map(m => {
              const clr = m.improving ? "#22c55e" : "#ef4444";
              return (
                <div key={m.metric} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "7px 10px", borderRadius: 7,
                  background: CARD, border: `1px solid ${BDR}`,
                  fontSize: 12,
                }}>
                  <div style={{ flex: 1, color: TXT }}>{m.label}</div>
                  <div style={{ color: "#6b7280", textDecoration: "line-through", fontSize: 11 }}>
                    {m.baseline.projected}{m.unit}
                  </div>
                  <div style={{ fontWeight: 700, color: clr }}>
                    {m.improving ? "→" : "→"} {m.scenario.projected}{m.unit}
                    <span style={{ marginLeft: 6, fontSize: 11 }}>
                      ({m.scenario.delta > 0 ? "+" : ""}{m.scenario.delta}{m.unit})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main ForecastPage ────────────────────────────────────────────────────────

export default function ForecastPage({ projectId }: { projectId: string }) {
  const { CARD, BDR, TXT, TXT2, P } = useColors();

  const [overview, setOverview]       = useState<ForecastOverview | null>(null);
  const [detail, setDetail]           = useState<MetricDetail | null>(null);
  const [selectedMetric, setSelected] = useState<string>("failureRate");
  const [horizon, setHorizon]         = useState(14);
  const [loading, setLoading]         = useState(true);
  const [detailLoading, setDLoad]     = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [tab, setTab]                 = useState<"metrics" | "events" | "whatif">("metrics");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/projects/${projectId}/forecast/overview?horizon=${horizon}&historyDays=30`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setOverview(await res.json());
    } catch (e: any) {
      setError(e.message ?? "Failed to load forecast");
    } finally { setLoading(false); }
  }, [projectId, horizon]);

  const loadDetail = useCallback(async (metric: string) => {
    setDLoad(true);
    try {
      const res = await fetch(`${API}/projects/${projectId}/forecast/metrics?metric=${metric}&horizon=${horizon}&historyDays=30`);
      if (res.ok) setDetail(await res.json());
    } finally { setDLoad(false); }
  }, [projectId, horizon]);

  useEffect(() => { loadOverview(); }, [loadOverview]);
  useEffect(() => { loadDetail(selectedMetric); }, [loadDetail, selectedMetric]);

  const handleSelectMetric = (metric: string) => {
    setSelected(metric);
  };

  const overallRiskCfg = overview ? RISK_CFG[overview.overallRisk] : RISK_CFG.low;
  const sectionHead: React.CSSProperties = {
    fontSize: 11, fontWeight: 800, color: TXT2,
    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
  };

  if (loading) return (
    <div style={{ padding: 48, textAlign: "center", color: TXT2, fontSize: 14 }}>
      Computing forecast…
    </div>
  );

  if (error || !overview) return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <div style={{ color: "#ef4444", marginBottom: 12, fontSize: 14 }}>{error ?? "No forecast data"}</div>
      <button onClick={loadOverview} style={{
        padding: "8px 18px", borderRadius: 8, border: `1px solid ${BDR}`,
        background: CARD, color: TXT, cursor: "pointer", fontSize: 13,
      }}>Retry</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 16, marginBottom: 20, flexWrap: "wrap",
      }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, color: TXT }}>
            Predictive Forecast
          </h2>
          <div style={{ fontSize: 12, color: TXT2 }}>
            What is likely to happen in the next {horizon} days if the current trajectory continues
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Horizon selector */}
          <div style={{ display: "flex", gap: 6 }}>
            {[7, 14, 30].map(h => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                style={{
                  padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${horizon === h ? P : BDR}`,
                  background: horizon === h ? `${P}12` : "transparent",
                  color: horizon === h ? P : TXT2,
                }}
              >
                {h}d
              </button>
            ))}
          </div>

          <button onClick={loadOverview} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: `1px solid ${BDR}`, background: "transparent", color: TXT, cursor: "pointer",
          }}>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Overall risk banner ──────────────────────────────────────────────── */}
      <div style={{
        padding: "14px 18px", borderRadius: 10,
        background: overallRiskCfg.bg, border: `1.5px solid ${overallRiskCfg.color}40`,
        marginBottom: 20, display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
          background: `${overallRiskCfg.color}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20,
        }}>
          {overview.overallRisk === "low" ? "✅"
            : overview.overallRisk === "medium" ? "⚠️"
            : "🚨"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: overallRiskCfg.color }}>
            {overallRiskCfg.label} Risk · {horizon}-day forecast
          </div>
          <div style={{ fontSize: 12, color: TXT2, marginTop: 3, lineHeight: 1.5 }}>
            {overview.headline}
          </div>
        </div>
        <div style={{ fontSize: 10, color: TXT2, flexShrink: 0, textAlign: "right" }}>
          Generated {new Date(overview.generatedAt).toLocaleTimeString()}
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${BDR}`, paddingBottom: 0 }}>
        {(["metrics", "events", "whatif"] as const).map(t => {
          const labels = { metrics: "Metric Forecast", events: "Risk Events", whatif: "What-If" };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "8px 16px", border: "none", cursor: "pointer",
                background: "transparent",
                color: tab === t ? P : TXT2,
                fontWeight: tab === t ? 700 : 500, fontSize: 13,
                borderBottom: `2px solid ${tab === t ? P : "transparent"}`,
                marginBottom: -1,
              }}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ── Metrics tab ──────────────────────────────────────────────────────── */}
      {tab === "metrics" && (
        <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>

          {/* Left: metric cards */}
          <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
            <div style={sectionHead}>Metrics ({horizon}d horizon)</div>
            {overview.metrics.map(m => (
              <MetricCard
                key={m.metric}
                summary={m}
                selected={selectedMetric === m.metric}
                onSelect={() => handleSelectMetric(m.metric)}
              />
            ))}
          </div>

          {/* Right: detail chart */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {detailLoading ? (
              <div style={{ padding: 24, color: TXT2, fontSize: 13 }}>Loading chart…</div>
            ) : detail ? (
              <div style={{ padding: "0 4px" }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: TXT }}>{detail.label} Forecast</div>
                  <div style={{ fontSize: 12, color: TXT2, marginTop: 3 }}>
                    30-day history (solid) + {horizon}-day forecast (dashed) with 80% confidence band
                  </div>
                </div>

                {/* Key statistics */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  {[
                    { label: "Current",   value: `${detail.statistics.current}${detail.unit}`, color: TXT },
                    { label: `Day ${horizon}`,  value: `${detail.statistics.projected}${detail.unit}`, color: detail.statistics.improving ? "#22c55e" : "#ef4444" },
                    { label: "Δ",         value: `${detail.statistics.delta > 0 ? "+" : ""}${detail.statistics.delta}${detail.unit}`, color: detail.statistics.improving ? "#22c55e" : "#ef4444" },
                    { label: "Trend",     value: detail.statistics.direction, color: TXT2 },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      flex: 1, minWidth: 90, padding: "10px 14px", borderRadius: 8,
                      background: CARD, border: `1px solid ${BDR}`, textAlign: "center",
                    }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color }}>{value}</div>
                      <div style={{ fontSize: 10, color: TXT2, marginTop: 3 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Main chart */}
                <div style={{
                  padding: "16px 8px", borderRadius: 10,
                  background: CARD, border: `1px solid ${BDR}`,
                  marginBottom: 16,
                }}>
                  <ForecastChart
                    history={detail.history}
                    forecast={detail.forecast}
                    color={METRIC_COLORS[detail.metric] ?? P}
                    height={140}
                    showBands
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: TXT2, marginTop: 6, padding: "0 4px" }}>
                    <span>{detail.history[0]?.date}</span>
                    <span style={{ color: TXT2 }}>← 30d history &nbsp;|&nbsp; {horizon}d forecast →</span>
                    <span>{detail.forecast[detail.forecast.length - 1]?.date}</span>
                  </div>
                </div>

                {/* Forecast table */}
                <div style={{ marginBottom: 16 }}>
                  <div style={sectionHead}>Day-by-Day Forecast</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {detail.forecast.filter((_, i) => i % Math.ceil(detail.forecast.length / 7) === 0 || i === detail.forecast.length - 1).map(pt => {
                      const c = METRIC_COLORS[detail.metric] ?? P;
                      return (
                        <div key={pt.date} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "7px 12px", borderRadius: 7,
                          background: CARD, border: `1px solid ${BDR}`,
                          fontSize: 12,
                        }}>
                          <span style={{ width: 90, color: TXT2 }}>{pt.date}</span>
                          <span style={{ width: 70, fontWeight: 700, color: TXT }}>{pt.value}{detail.unit}</span>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: `${c}20`, overflow: "hidden" }}>
                            <div style={{
                              height: "100%", borderRadius: 2,
                              width: `${Math.min(100, pt.value)}%`,
                              background: c,
                            }} />
                          </div>
                          <span style={{ fontSize: 10, color: TXT2, width: 110, textAlign: "right" }}>
                            {pt.lower}{detail.unit} – {pt.upper}{detail.unit}
                          </span>
                          <span style={{ width: 60, textAlign: "right", fontSize: 10, color: TXT2 }}>
                            {Math.round(pt.confidence * 100)}% conf
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: 24, color: TXT2 }}>Select a metric to view its forecast chart.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Events tab ───────────────────────────────────────────────────────── */}
      {tab === "events" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          <div style={sectionHead}>Risk Events — Next {horizon} Days</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <EventCard label="Regression Risk"           event={overview.events.regressionRisk} />
            <EventCard label="Readiness Gate Failure"    event={overview.events.readinessFailureRisk} />
            <EventCard label="Post-Release Incident Risk" event={overview.events.incidentRisk} />
            <EventCard label="Test Suite Instability"    event={overview.events.stabilityRisk} />
          </div>
        </div>
      )}

      {/* ── What-If tab ──────────────────────────────────────────────────────── */}
      {tab === "whatif" && (
        <div style={{ overflowY: "auto" }}>
          <WhatIfPanel projectId={projectId} horizonDays={horizon} />
        </div>
      )}
    </div>
  );
}
