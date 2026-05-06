import { useState, useEffect, useCallback } from "react";
import { useColors } from "@/hooks/useColors";

const API = "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReleaseStatus =
  | "planned"
  | "in_progress"
  | "ready_for_validation"
  | "validating"
  | "ready_to_ship"
  | "shipped"
  | "rolled_back"
  | "cancelled";

type ReadinessStatus = "ready" | "at-risk" | "not-ready";

interface ReleaseReadinessSummary {
  status:               ReadinessStatus;
  score:                number;
  color:                string;
  gatesPassed:          number;
  gatesTotal:           number;
  gatesPassedPct:       number;
  openCriticalInsights: number;
}

interface ReleaseLink {
  id:        string;
  releaseId: string;
  type:      string;
  targetId:  string;
  createdAt: string;
}

interface Release {
  id:           string;
  projectId:    string;
  name:         string | null;
  version:      string | null;
  environment:  string;
  status:       ReleaseStatus;
  statusLabel:  string;
  displayName:  string;
  description:  string | null;
  createdBy:    string | null;
  notes:        string | null;
  plannedStart: string | null;
  plannedEnd:   string | null;
  actualStart:  string | null;
  actualEnd:    string | null;
  createdAt:    string;
  updatedAt:    string;
  links:        ReleaseLink[];
  linksCount:   number;
  readiness:    ReleaseReadinessSummary;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ReleaseStatus, { label: string; color: string; bg: string }> = {
  planned:              { label: "Planned",               color: "#6b7280", bg: "#6b728014" },
  in_progress:          { label: "In Progress",           color: "#3b82f6", bg: "#3b82f614" },
  ready_for_validation: { label: "Ready for Validation",  color: "#8b5cf6", bg: "#8b5cf614" },
  validating:           { label: "Validating",            color: "#f59e0b", bg: "#f59e0b14" },
  ready_to_ship:        { label: "Ready to Ship",         color: "#22c55e", bg: "#22c55e14" },
  shipped:              { label: "Shipped",               color: "#10b981", bg: "#10b98114" },
  rolled_back:          { label: "Rolled Back",           color: "#ef4444", bg: "#ef444414" },
  cancelled:            { label: "Cancelled",             color: "#9ca3af", bg: "#9ca3af14" },
};

const STATUS_ORDER: ReleaseStatus[] = [
  "planned", "in_progress", "ready_for_validation", "validating",
  "ready_to_ship", "shipped", "rolled_back", "cancelled",
];

const NEXT_STATUS: Record<ReleaseStatus, ReleaseStatus[]> = {
  planned:              ["in_progress", "cancelled"],
  in_progress:          ["ready_for_validation", "cancelled"],
  ready_for_validation: ["validating", "in_progress", "cancelled"],
  validating:           ["ready_to_ship", "in_progress", "cancelled"],
  ready_to_ship:        ["shipped", "validating", "cancelled"],
  shipped:              ["rolled_back"],
  rolled_back:          ["planned"],
  cancelled:            ["planned"],
};

const READINESS_CFG: Record<ReadinessStatus, { label: string; color: string; bg: string }> = {
  "ready":     { label: "Ready",     color: "#22c55e", bg: "#22c55e14" },
  "at-risk":   { label: "At Risk",   color: "#f59e0b", bg: "#f59e0b14" },
  "not-ready": { label: "Blocked",   color: "#ef4444", bg: "#ef444414" },
};

const ENV_COLOR: Record<string, string> = {
  prod:    "#ef4444",
  staging: "#f59e0b",
  preprod: "#8b5cf6",
  dev:     "#3b82f6",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 40, stroke = 4 }: {
  score: number; color: string; size?: number; stroke?: number;
}) {
  const { BDR } = useColors();
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={BDR} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

// ─── Gate bar ─────────────────────────────────────────────────────────────────

function GateBar({ passed, total, color }: { passed: number; total: number; color: string }) {
  const { dark } = useColors();
  const pct = total > 0 ? (passed / total) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: dark ? "#2a2a3a" : "#f3f4f6", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, whiteSpace: "nowrap" }}>{passed}/{total}</span>
    </div>
  );
}

// ─── Release card ─────────────────────────────────────────────────────────────

function ReleaseCard({
  release,
  selected,
  onSelect,
}: {
  release:  Release;
  selected: boolean;
  onSelect: () => void;
}) {
  const { CARD, BDR, TXT, TXT2, P } = useColors();
  const sc  = STATUS_CFG[release.status] ?? STATUS_CFG.planned;
  const rc  = READINESS_CFG[release.readiness.status];
  const env = release.environment ?? "staging";
  const ec  = ENV_COLOR[env] ?? "#6b7280";

  return (
    <div
      onClick={onSelect}
      style={{
        padding: "14px 16px",
        borderRadius: 10,
        background: CARD,
        border: `1.5px solid ${selected ? P : BDR}`,
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: selected ? `0 0 0 3px ${P}18` : "none",
      }}
      onMouseEnter={e => {
        if (!selected) (e.currentTarget as HTMLElement).style.borderColor = `${P}70`;
      }}
      onMouseLeave={e => {
        if (!selected) (e.currentTarget as HTMLElement).style.borderColor = BDR;
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        {/* Score ring */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ScoreRing score={release.readiness.score} color={release.readiness.color} size={38} stroke={3.5} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 800, color: release.readiness.color,
          }}>
            {release.readiness.score}
          </div>
        </div>

        {/* Name + env */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: TXT,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {release.displayName}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
              background: `${ec}14`, color: ec, letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              {env}
            </span>
            <span style={{ fontSize: 10, color: TXT2 }}>{fmtRelative(release.createdAt)}</span>
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          padding: "3px 8px", borderRadius: 20,
          background: sc.bg, border: `1px solid ${sc.color}40`,
          fontSize: 11, fontWeight: 700, color: sc.color, whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          {sc.label}
        </div>
      </div>

      {/* Gates bar */}
      <GateBar
        passed={release.readiness.gatesPassed}
        total={release.readiness.gatesTotal}
        color={release.readiness.color}
      />

      {release.readiness.openCriticalInsights > 0 && (
        <div style={{
          marginTop: 6, display: "flex", alignItems: "center", gap: 4,
          fontSize: 11, color: "#ef4444", fontWeight: 600,
        }}>
          <span>⚠</span>
          <span>{release.readiness.openCriticalInsights} critical insight{release.readiness.openCriticalInsights !== 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  );
}

// ─── Create release modal ─────────────────────────────────────────────────────

function CreateModal({
  projectId,
  onCreated,
  onClose,
}: {
  projectId: string;
  onCreated: (r: Release) => void;
  onClose: () => void;
}) {
  const { CARD, BDR, TXT, TXT2, P } = useColors();
  const [name, setName]           = useState("");
  const [version, setVersion]     = useState("");
  const [environment, setEnv]     = useState("staging");
  const [description, setDesc]    = useState("");
  const [plannedStart, setStart]  = useState("");
  const [plannedEnd, setEnd]      = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() && !version.trim()) { setError("Name or version is required"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/projects/${projectId}/releases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:        name.trim() || undefined,
          version:     version.trim() || undefined,
          environment,
          description: description.trim() || undefined,
          plannedStart: plannedStart || undefined,
          plannedEnd:   plannedEnd || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = await res.json();
      onCreated(created);
    } catch (e: any) {
      setError(e.message ?? "Failed to create release");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: `1px solid ${BDR}`, background: CARD,
    color: TXT, fontSize: 13, outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: TXT2,
    textTransform: "uppercase", letterSpacing: "0.07em",
    display: "block", marginBottom: 5,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 480, borderRadius: 14,
          background: CARD, border: `1px solid ${BDR}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          padding: "28px 28px 24px",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: TXT, marginBottom: 20 }}>
          New Release
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Checkout Revamp" />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Version</label>
              <input style={inputStyle} value={version} onChange={e => setVersion(e.target.value)}
                placeholder="e.g. v2.1.0" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Environment</label>
              <select
                style={{ ...inputStyle, appearance: "none" }}
                value={environment}
                onChange={e => setEnv(e.target.value)}
              >
                <option value="staging">staging</option>
                <option value="preprod">preprod</option>
                <option value="prod">prod</option>
                <option value="dev">dev</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="What does this release include?"
            />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Planned Start</label>
              <input style={inputStyle} type="date" value={plannedStart} onChange={e => setStart(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Planned End</label>
              <input style={inputStyle} type="date" value={plannedEnd} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "#ef4444", padding: "6px 10px", borderRadius: 6, background: "#ef444410" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: `1px solid ${BDR}`, background: "transparent", color: TXT, cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving}
              style={{
                padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: "none", background: P, color: "#fff", cursor: "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Creating…" : "Create Release"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Budget status mini-panel ─────────────────────────────────────────────────

const BSTATUS_CFG: Record<string, { color: string; icon: string }> = {
  "within-budget":    { color: "#22c55e", icon: "✓" },
  "approaching-budget": { color: "#f59e0b", icon: "⚠" },
  "exceeded":         { color: "#ef4444", icon: "✕" },
};

function ReleaseBudgetPanel({ projectId, environment }: { projectId: string; environment: string }) {
  const { CARD, BDR, TXT, TXT2 } = useColors();
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ withEval: "true" });
    if (environment) params.set("environment", environment);
    fetch(`${API}/projects/${projectId}/budgets?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, environment]);

  if (loading) return (
    <div style={{ padding: "12px 20px", borderBottom: `1px solid ${BDR}` }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Quality Budgets</div>
      <div style={{ fontSize: 12, color: TXT2 }}>Checking…</div>
    </div>
  );

  if (!data) return null;

  const all       = (data.budgets ?? []) as any[];
  const exceeded  = all.filter((b: any) => b.evaluation?.status === "exceeded");
  const hardViol  = exceeded.filter((b: any) => b.severity === "hard");
  const overallOk = exceeded.length === 0;
  const summaryColor = hardViol.length > 0 ? "#ef4444" : exceeded.length > 0 ? "#f59e0b" : "#22c55e";

  return (
    <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BDR}` }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
        Quality Budgets
      </div>

      <div style={{
        display: "flex", alignItems: "center", gap: 8, marginBottom: overallOk ? 0 : 10,
        padding: "8px 10px", borderRadius: 8,
        background: `${summaryColor}0d`, border: `1px solid ${summaryColor}30`,
      }}>
        <span style={{ fontSize: 14 }}>{hardViol.length > 0 ? "🚨" : overallOk ? "✅" : "⚠️"}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: summaryColor }}>
            {hardViol.length > 0
              ? `${hardViol.length} hard limit${hardViol.length > 1 ? "s" : ""} exceeded — release blocked`
              : overallOk
              ? "All quality budgets within limits"
              : `${exceeded.length} budget${exceeded.length > 1 ? "s" : ""} exceeded`}
          </div>
          <div style={{ fontSize: 11, color: TXT2, marginTop: 1 }}>
            {all.length} budget{all.length !== 1 ? "s" : ""} · {environment} environment
          </div>
        </div>
      </div>

      {exceeded.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {exceeded.slice(0, 4).map((b: any) => {
            const bc = BSTATUS_CFG[b.evaluation.status];
            return (
              <div key={b.id} style={{
                display: "flex", alignItems: "center", gap: 8, fontSize: 11,
                padding: "5px 8px", borderRadius: 6,
                background: CARD, border: `1px solid ${BDR}`,
              }}>
                <span style={{ color: bc.color, fontWeight: 700 }}>{bc.icon}</span>
                <span style={{ flex: 1, color: TXT }}>{b.evaluation.label}</span>
                <span style={{ color: bc.color, fontWeight: 700 }}>
                  {b.evaluation.currentValue}{b.evaluation.unit} / {b.evaluation.limit}{b.evaluation.unit}
                </span>
                {b.severity === "hard" && (
                  <span style={{ padding: "1px 5px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: "#ef444412", color: "#ef4444" }}>Hard</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

// ─── Release forecast mini-panel ──────────────────────────────────────────────

const PROJ_STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  "ready":     { label: "Likely Ready",   color: "#22c55e", bg: "#22c55e12" },
  "at-risk":   { label: "At Risk",        color: "#f59e0b", bg: "#f59e0b12" },
  "not-ready": { label: "Likely Blocked", color: "#ef4444", bg: "#ef444412" },
};

function ReleaseForecastPanel({ projectId, plannedEnd }: { projectId: string; plannedEnd: string | null }) {
  const { CARD, BDR, TXT, TXT2 } = useColors();
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ horizon: "14" });
    if (plannedEnd) params.set("releaseEnd", plannedEnd);
    fetch(`${API}/projects/${projectId}/forecast/release?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setForecast(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, plannedEnd]);

  if (loading) return (
    <div style={{ padding: "12px 20px", borderBottom: `1px solid ${BDR}` }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
        Release Forecast
      </div>
      <div style={{ fontSize: 12, color: TXT2 }}>Computing…</div>
    </div>
  );

  if (!forecast) return null;

  const ps = PROJ_STATUS_CFG[forecast.projectedReadiness?.status ?? "at-risk"];
  const score     = forecast.projectedReadiness?.score ?? 0;
  const scoreLow  = forecast.projectedReadiness?.lower ?? score - 10;
  const conf      = Math.round((forecast.projectedReadiness?.confident ?? 0.5) * 100);
  const risks     = forecast.risks ?? {};

  return (
    <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BDR}` }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
        Release Forecast
      </div>

      {/* Projected status badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{
          padding: "4px 10px", borderRadius: 20,
          background: ps.bg, border: `1px solid ${ps.color}40`,
          fontSize: 12, fontWeight: 700, color: ps.color,
        }}>
          {ps.label}
        </span>
        <span style={{ fontSize: 12, color: TXT2 }}>
          at ship date — {conf}% confidence
        </span>
      </div>

      {/* Projected readiness range */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap",
      }}>
        {[
          { label: "Readiness",   value: `${scoreLow}–${score}%`, color: ps.color },
          { label: "Regression",  value: `${risks.regressionProbability ?? "–"}%`,   color: risks.regressionProbability >= 50 ? "#ef4444" : risks.regressionProbability >= 25 ? "#f59e0b" : "#22c55e" },
          { label: "Gate Failure",value: `${risks.readinessFailureProbability ?? "–"}%`, color: risks.readinessFailureProbability >= 50 ? "#ef4444" : risks.readinessFailureProbability >= 25 ? "#f59e0b" : "#22c55e" },
          { label: "Incident",    value: `${risks.incidentProbability ?? "–"}%`,      color: risks.incidentProbability >= 50 ? "#ef4444" : risks.incidentProbability >= 25 ? "#f59e0b" : "#22c55e" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            flex: 1, minWidth: 70, textAlign: "center",
            padding: "8px 6px", borderRadius: 8,
            background: CARD, border: `1px solid ${BDR}`,
          }}>
            <div style={{ fontSize: 14, fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: 10, color: TXT2, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {forecast.recommendation && (
        <div style={{
          padding: "8px 10px", borderRadius: 7,
          background: `${ps.color}0d`, border: `1px solid ${ps.color}25`,
          fontSize: 11, color: TXT, lineHeight: 1.5,
        }}>
          {forecast.recommendation}
        </div>
      )}
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function ReleaseDetailPanel({
  release,
  projectId,
  onUpdated,
  onDeleted,
}: {
  release:   Release;
  projectId: string;
  onUpdated: (r: Release) => void;
  onDeleted: (id: string) => void;
}) {
  const { CARD, BDR, TXT, TXT2, P } = useColors();
  const [metrics, setMetrics] = useState<any>(null);
  const [assessing, setAssessing] = useState(false);
  const [transitionTo, setTransitionTo] = useState<ReleaseStatus | "">("");
  const [transitioning, setTransitioning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const sc  = STATUS_CFG[release.status] ?? STATUS_CFG.planned;
  const rc  = READINESS_CFG[release.readiness.status];
  const env = release.environment ?? "staging";
  const ec  = ENV_COLOR[env] ?? "#6b7280";

  useEffect(() => {
    fetch(`${API}/projects/${projectId}/releases/${release.id}/metrics`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setMetrics(d))
      .catch(() => {});
  }, [projectId, release.id]);

  const runAssess = async () => {
    setAssessing(true);
    try {
      const res = await fetch(`${API}/projects/${projectId}/releases/${release.id}/assess`, { method: "POST" });
      if (res.ok) {
        const result = await res.json();
        // Reload release to get updated status
        const updated = await fetch(`${API}/projects/${projectId}/releases/${release.id}`).then(r => r.json());
        onUpdated(updated);
      }
    } finally { setAssessing(false); }
  };

  const doTransition = async () => {
    if (!transitionTo) return;
    setTransitioning(true);
    try {
      const res = await fetch(`${API}/projects/${projectId}/releases/${release.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: transitionTo }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdated(updated);
        setTransitionTo("");
      }
    } finally { setTransitioning(false); }
  };

  const doDelete = async () => {
    if (!window.confirm(`Delete release "${release.displayName}"?`)) return;
    setDeleting(true);
    try {
      await fetch(`${API}/projects/${projectId}/releases/${release.id}`, { method: "DELETE" });
      onDeleted(release.id);
    } finally { setDeleting(false); }
  };

  const nextStatuses = NEXT_STATUS[release.status] ?? [];

  const sectionHead: React.CSSProperties = {
    fontSize: 11, fontWeight: 800, color: TXT2,
    textTransform: "uppercase", letterSpacing: "0.08em",
    marginBottom: 10,
  };

  const pill = (label: string, color: string, bg: string) => (
    <span style={{
      padding: "3px 9px", borderRadius: 20,
      background: bg, border: `1px solid ${color}40`,
      fontSize: 11, fontWeight: 700, color,
    }}>
      {label}
    </span>
  );

  return (
    <div style={{ padding: "0 0 40px" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "20px 20px 16px",
        borderBottom: `1px solid ${BDR}`,
        display: "flex", alignItems: "flex-start", gap: 16,
      }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <ScoreRing score={release.readiness.score} color={release.readiness.color} size={52} stroke={4.5} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 900, color: release.readiness.color,
          }}>
            {release.readiness.score}
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: TXT }}>{release.displayName}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
            {pill(sc.label, sc.color, sc.bg)}
            {pill(env.toUpperCase(), ec, `${ec}14`)}
            {pill(rc.label, rc.color, rc.bg)}
          </div>
          {release.description && (
            <div style={{ fontSize: 12, color: TXT2, marginTop: 8, lineHeight: 1.5 }}>
              {release.description}
            </div>
          )}
        </div>
      </div>

      {/* ── Readiness ───────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BDR}` }}>
        <div style={sectionHead}>Readiness</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: TXT }}>Gates</span>
            <GateBar
              passed={release.readiness.gatesPassed}
              total={release.readiness.gatesTotal}
              color={release.readiness.color}
            />
          </div>
          {release.readiness.openCriticalInsights > 0 && (
            <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>
              ⚠ {release.readiness.openCriticalInsights} critical insight{release.readiness.openCriticalInsights !== 1 ? "s" : ""} blocking
            </div>
          )}
          <button
            onClick={runAssess}
            disabled={assessing}
            style={{
              marginTop: 4,
              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: `1px solid ${P}`, background: `${P}12`, color: P, cursor: "pointer",
              opacity: assessing ? 0.6 : 1, alignSelf: "flex-start",
            }}
          >
            {assessing ? "Assessing…" : "Run Readiness Assessment"}
          </button>
        </div>
      </div>

      {/* ── Quality budgets ──────────────────────────────────────────────────── */}
      <ReleaseBudgetPanel projectId={projectId} environment={release.environment ?? "staging"} />

      {/* ── Release forecast ────────────────────────────────────────────────── */}
      {["planned", "in_progress", "ready_for_validation", "validating"].includes(release.status) && (
        <ReleaseForecastPanel projectId={projectId} plannedEnd={release.plannedEnd} />
      )}

      {/* ── Metrics delta ──────────────────────────────────────────────────── */}
      {metrics?.delta && (
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BDR}` }}>
          <div style={sectionHead}>Delta vs Previous Release</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { label: "Readiness", v: metrics.delta.readinessScore },
              { label: "Coverage",  v: metrics.delta.coverageScore },
              { label: "Stability", v: metrics.delta.stabilityScore },
              { label: "Risk",      v: metrics.delta.riskScore },
            ].map(({ label, v }) => {
              const color = v > 0 ? "#22c55e" : v < 0 ? "#ef4444" : "#6b7280";
              return (
                <div key={label} style={{
                  flex: 1, minWidth: 80, textAlign: "center",
                  padding: "10px 8px", borderRadius: 8,
                  background: `${color}0e`, border: `1px solid ${color}25`,
                }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color }}>
                    {v > 0 ? "+" : ""}{v}
                  </div>
                  <div style={{ fontSize: 10, color: TXT2, marginTop: 3 }}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Dates ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BDR}` }}>
        <div style={sectionHead}>Timeline</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "Planned Start", v: release.plannedStart },
            { label: "Planned End",   v: release.plannedEnd },
            { label: "Actual Start",  v: release.actualStart },
            { label: "Actual End",    v: release.actualEnd },
          ].map(({ label, v }) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: TXT2, fontWeight: 600, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 13, color: TXT, fontWeight: 600 }}>{fmtDate(v)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Links ───────────────────────────────────────────────────────────── */}
      {release.links.length > 0 && (
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BDR}` }}>
          <div style={sectionHead}>Linked Items ({release.links.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {release.links.map(link => (
              <div key={link.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "7px 10px", borderRadius: 7,
                background: CARD, border: `1px solid ${BDR}`,
                fontSize: 12,
              }}>
                <span style={{
                  padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                  background: `${P}14`, color: P,
                }}>
                  {link.type}
                </span>
                <span style={{ flex: 1, color: TXT2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {link.targetId}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Status transition ────────────────────────────────────────────────── */}
      {nextStatuses.length > 0 && (
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BDR}` }}>
          <div style={sectionHead}>Advance Status</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={transitionTo}
              onChange={e => setTransitionTo(e.target.value as ReleaseStatus | "")}
              style={{
                flex: 1, padding: "7px 10px", borderRadius: 8,
                border: `1px solid ${BDR}`, background: CARD,
                color: TXT, fontSize: 13, outline: "none",
              }}
            >
              <option value="">Choose next status…</option>
              {nextStatuses.map(s => (
                <option key={s} value={s}>{STATUS_CFG[s]?.label ?? s}</option>
              ))}
            </select>
            <button
              onClick={doTransition}
              disabled={!transitionTo || transitioning}
              style={{
                padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                border: "none", background: P, color: "#fff", cursor: "pointer",
                opacity: !transitionTo || transitioning ? 0.4 : 1,
              }}
            >
              {transitioning ? "…" : "Advance"}
            </button>
          </div>
        </div>
      )}

      {/* ── Danger zone ──────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px" }}>
        <button
          onClick={doDelete}
          disabled={deleting}
          style={{
            padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: "1px solid #ef444440", background: "#ef444410", color: "#ef4444",
            cursor: "pointer", opacity: deleting ? 0.5 : 1,
          }}
        >
          {deleting ? "Deleting…" : "Delete Release"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReleasesPage({ projectId }: { projectId: string }) {
  const { CARD, BDR, TXT, TXT2, P } = useColors();

  const [releases, setReleases]   = useState<Release[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [selected, setSelected]   = useState<Release | null>(null);
  const [showCreate, setCreate]   = useState(false);
  const [statusFilter, setFilter] = useState<ReleaseStatus | "all">("all");
  const [search, setSearch]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/projects/${projectId}/releases`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReleases(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    } catch (e: any) {
      setError(e.message ?? "Failed to load releases");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (r: Release) => {
    setReleases(prev => [r, ...prev]);
    setSelected(r);
    setCreate(false);
  };

  const handleUpdated = (r: Release) => {
    setReleases(prev => prev.map(x => x.id === r.id ? r : x));
    setSelected(r);
  };

  const handleDeleted = (id: string) => {
    const next = releases.filter(x => x.id !== id);
    setReleases(next);
    setSelected(next.length > 0 ? next[0] : null);
  };

  const filtered = releases.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search && !r.displayName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Status counts
  const counts: Partial<Record<ReleaseStatus, number>> = {};
  releases.forEach(r => { counts[r.status] = (counts[r.status] ?? 0) + 1; });

  // Ready-to-ship count for banner
  const readyToShip = releases.filter(r => r.status === "ready_to_ship").length;
  const blocking    = releases.filter(r => r.readiness.openCriticalInsights > 0).length;

  if (loading) return (
    <div style={{ padding: 48, textAlign: "center", color: TXT2, fontSize: 14 }}>
      Loading releases…
    </div>
  );

  if (error) return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <div style={{ color: "#ef4444", marginBottom: 12 }}>{error}</div>
      <button onClick={load} style={{
        padding: "8px 18px", borderRadius: 8,
        border: `1px solid ${BDR}`, background: CARD, color: TXT, cursor: "pointer",
      }}>
        Retry
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100%", gap: 0 }}>

      {/* ── Left panel: list ─────────────────────────────────────────────────── */}
      <div style={{
        width: 320, minWidth: 320,
        borderRight: `1px solid ${BDR}`,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "16px 16px 12px",
          borderBottom: `1px solid ${BDR}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: TXT }}>Releases</div>
            <div style={{ fontSize: 12, color: TXT2, marginTop: 2 }}>
              {releases.length} release{releases.length !== 1 ? "s" : ""}
            </div>
          </div>
          <button
            onClick={() => setCreate(true)}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: "none", background: P, color: "#fff", cursor: "pointer",
            }}
          >
            + New
          </button>
        </div>

        {/* Status banner */}
        {(readyToShip > 0 || blocking > 0) && (
          <div style={{
            padding: "8px 16px",
            background: readyToShip > 0 ? "#22c55e0e" : "#ef44440e",
            borderBottom: `1px solid ${readyToShip > 0 ? "#22c55e25" : "#ef444425"}`,
            fontSize: 12, fontWeight: 600,
            color: readyToShip > 0 ? "#22c55e" : "#ef4444",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {readyToShip > 0
              ? `${readyToShip} release${readyToShip !== 1 ? "s" : ""} ready to ship`
              : `${blocking} release${blocking !== 1 ? "s" : ""} with critical insights`}
          </div>
        )}

        {/* Search */}
        <div style={{ padding: "10px 12px", borderBottom: `1px solid ${BDR}` }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 10px", borderRadius: 8,
            border: `1px solid ${BDR}`, background: CARD,
          }}>
            <svg width={13} height={13} viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke={TXT2} strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke={TXT2} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Search releases…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: "none", outline: "none", fontSize: 12, color: TXT,
                background: "transparent", flex: 1,
              }}
            />
          </div>
        </div>

        {/* Status filter chips */}
        <div style={{
          padding: "8px 12px",
          borderBottom: `1px solid ${BDR}`,
          display: "flex", gap: 6, flexWrap: "wrap",
        }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
              border: `1.5px solid ${statusFilter === "all" ? P : BDR}`,
              background: statusFilter === "all" ? `${P}12` : "transparent",
              color: statusFilter === "all" ? P : TXT2,
            }}
          >
            All ({releases.length})
          </button>
          {STATUS_ORDER.filter(s => counts[s]).map(s => {
            const sc = STATUS_CFG[s];
            const active = statusFilter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${active ? sc.color : BDR}`,
                  background: active ? sc.bg : "transparent",
                  color: active ? sc.color : TXT2,
                }}
              >
                {sc.label} ({counts[s]})
              </button>
            );
          })}
        </div>

        {/* Release list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: TXT2, fontSize: 13 }}>
              {releases.length === 0
                ? "No releases yet. Create your first release."
                : "No releases match the current filter."}
            </div>
          ) : (
            filtered.map(r => (
              <ReleaseCard
                key={r.id}
                release={r}
                selected={selected?.id === r.id}
                onSelect={() => setSelected(r)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right panel: detail ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {selected ? (
          <ReleaseDetailPanel
            key={selected.id}
            release={selected}
            projectId={projectId}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ) : (
          <div style={{
            height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 12,
          }}>
            <div style={{ fontSize: 32 }}>📦</div>
            <div style={{ fontSize: 14, color: TXT2 }}>Select a release to view details</div>
            <button
              onClick={() => setCreate(true)}
              style={{
                padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: "none", background: P, color: "#fff", cursor: "pointer",
              }}
            >
              Create First Release
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          projectId={projectId}
          onCreated={handleCreated}
          onClose={() => setCreate(false)}
        />
      )}
    </div>
  );
}
