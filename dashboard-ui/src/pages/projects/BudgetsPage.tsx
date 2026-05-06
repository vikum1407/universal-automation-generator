import { useState, useEffect, useCallback } from "react";
import { useColors } from "@/hooks/useColors";

const API = "http://localhost:3000";

// ─── Types ────────────────────────────────────────────────────────────────────

type BudgetSeverity = "soft" | "hard";
type BudgetStatus   = "within-budget" | "approaching-budget" | "exceeded";

type BudgetMetric =
  | "coverageOverall"
  | "coverageCritical"
  | "highRiskUncovered"
  | "failureRate"
  | "flakinessCount"
  | "unstableCriticalFlows"
  | "unstableCriticalEndpoints"
  | "openCriticalInsights"
  | "unresolvedAISuggestions";

interface MetricMeta {
  key:            BudgetMetric;
  label:          string;
  unit:           string;
  description:    string;
  higherIsBetter: boolean;
  defaultLimit:   number;
  defaultSeverity: BudgetSeverity;
}

interface BudgetEvaluation {
  budgetId:       string;
  metric:         BudgetMetric;
  label:          string;
  unit:           string;
  description:    string;
  limit:          number;
  target?:        number;
  severity:       BudgetSeverity;
  environment?:   string;
  higherIsBetter: boolean;
  currentValue:   number;
  status:         BudgetStatus;
  headroom:       number;
  pctUsed:        number;
  evaluatedAt:    string;
}

interface BudgetWithEval {
  id:           string;
  metric:       BudgetMetric;
  limit:        number;
  target?:      number;
  severity:     BudgetSeverity;
  environment?: string;
  enabled:      boolean;
  createdAt:    string;
  evaluation:   BudgetEvaluation;
}

interface EvalResponse {
  projectId:    string;
  overallStatus: "passing" | "warning" | "failing";
  evaluatedAt:  string;
  summary: {
    total:          number;
    withinBudget:   number;
    approaching:    number;
    exceeded:       number;
    hardViolations: number;
  };
  budgets:     BudgetWithEval[];
  counts: {
    withinBudget:   number;
    approaching:    number;
    exceeded:       number;
    hardViolations: number;
  };
  ciGate: {
    pass:     boolean;
    message:  string;
    violated: { metric: string; label: string; current: number; limit: number }[];
  };
}

interface Violation {
  id:          string;
  metric:      BudgetMetric;
  value:       number;
  limit:       number;
  severity:    BudgetSeverity;
  occurredAt:  string;
  resolvedAt?: string;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<BudgetStatus, { color: string; bg: string; label: string; icon: string }> = {
  "within-budget":    { color: "#22c55e", bg: "#22c55e12", label: "Within Budget", icon: "✓" },
  "approaching-budget": { color: "#f59e0b", bg: "#f59e0b12", label: "Approaching",   icon: "⚠" },
  "exceeded":         { color: "#ef4444", bg: "#ef444412", label: "Exceeded",       icon: "✕" },
};

const OVERALL_CFG: Record<string, { color: string; bg: string; label: string }> = {
  passing: { color: "#22c55e", bg: "#22c55e12", label: "All Budgets Pass" },
  warning: { color: "#f59e0b", bg: "#f59e0b12", label: "Budget Warnings"  },
  failing: { color: "#ef4444", bg: "#ef444412", label: "Hard Budgets Exceeded" },
};

const SEV_CFG: Record<BudgetSeverity, { color: string; bg: string; label: string }> = {
  soft: { color: "#f59e0b", bg: "#f59e0b12", label: "Soft" },
  hard: { color: "#ef4444", bg: "#ef444412", label: "Hard" },
};

// ─── Budget gauge bar ─────────────────────────────────────────────────────────

function BudgetBar({ pctUsed, status, higherIsBetter }: {
  pctUsed: number;
  status:  BudgetStatus;
  higherIsBetter: boolean;
}) {
  const { BDR } = useColors();
  const cfg = STATUS_CFG[status];
  const fill = Math.min(100, Math.max(0, higherIsBetter ? pctUsed : pctUsed));
  return (
    <div style={{ height: 5, borderRadius: 3, background: BDR, overflow: "hidden", width: "100%" }}>
      <div style={{
        height: "100%", width: `${fill}%`,
        background: cfg.color, borderRadius: 3,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

// ─── Budget row card ──────────────────────────────────────────────────────────

function BudgetRow({
  item,
  onEdit,
  onDelete,
  onToggle,
}: {
  item:     BudgetWithEval;
  onEdit:   (item: BudgetWithEval) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const { CARD, BDR, TXT, TXT2 } = useColors();
  const ev  = item.evaluation;
  const sc  = STATUS_CFG[ev.status];
  const sev = SEV_CFG[item.severity];
  const [expanded, setExpanded] = useState(false);

  const direction = ev.higherIsBetter
    ? `≥ ${ev.limit}${ev.unit} required`
    : `≤ ${ev.limit}${ev.unit} allowed`;

  return (
    <div style={{
      borderRadius: 10, background: CARD,
      border: `1.5px solid ${ev.status === "exceeded" ? sc.color + "60" : BDR}`,
      overflow: "hidden",
    }}>
      {/* Main row */}
      <div style={{
        padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        {/* Status dot */}
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: sc.color, flexShrink: 0,
          boxShadow: ev.status === "exceeded" ? `0 0 6px ${sc.color}` : "none",
        }} />

        {/* Metric info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: TXT }}>{ev.label}</span>
            <span style={{
              padding: "1px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700,
              background: sev.bg, color: sev.color,
            }}>{sev.label}</span>
            {item.environment && (
              <span style={{
                padding: "1px 7px", borderRadius: 10, fontSize: 10, fontWeight: 600,
                background: `#448aff14`, color: "#448aff",
              }}>{item.environment}</span>
            )}
          </div>
          <BudgetBar pctUsed={ev.pctUsed} status={ev.status} higherIsBetter={ev.higherIsBetter} />
        </div>

        {/* Values */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 900, color: sc.color }}>
            {ev.currentValue}{ev.unit}
          </div>
          <div style={{ fontSize: 11, color: TXT2 }}>{direction}</div>
        </div>

        {/* Status badge */}
        <div style={{
          padding: "3px 9px", borderRadius: 20,
          background: sc.bg, border: `1px solid ${sc.color}30`,
          fontSize: 11, fontWeight: 700, color: sc.color,
          whiteSpace: "nowrap", flexShrink: 0,
        }}>
          {sc.icon} {sc.label}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: TXT2, fontSize: 12, padding: "2px 6px" }}
          >{expanded ? "▲" : "▼"}</button>
          <button
            onClick={() => onEdit(item)}
            style={{ background: "none", border: "none", cursor: "pointer", color: TXT2, fontSize: 12, padding: "2px 6px" }}
          >Edit</button>
          <button
            onClick={() => onToggle(item.id, !item.enabled)}
            style={{ background: "none", border: "none", cursor: "pointer", color: TXT2, fontSize: 11, padding: "2px 6px" }}
          >{item.enabled ? "Disable" : "Enable"}</button>
          <button
            onClick={() => onDelete(item.id)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 11, padding: "2px 6px" }}
          >✕</button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: "10px 16px 14px 38px",
          borderTop: `1px solid ${BDR}`,
          background: `${sc.color}04`,
        }}>
          <div style={{ fontSize: 12, color: TXT2, marginBottom: 8, lineHeight: 1.5 }}>{ev.description}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { label: "Current",  value: `${ev.currentValue}${ev.unit}`,  color: sc.color },
              { label: "Limit",    value: `${ev.limit}${ev.unit}`,          color: TXT2 },
              ev.target !== undefined ? { label: "Target", value: `${ev.target}${ev.unit}`, color: "#22c55e" } : null,
              { label: "Headroom", value: `${ev.headroom}${ev.unit}`,       color: ev.headroom > 0 ? "#22c55e" : "#ef4444" },
              { label: "Used",     value: `${ev.pctUsed}%`,                 color: ev.pctUsed > 100 ? "#ef4444" : ev.pctUsed > 80 ? "#f59e0b" : TXT },
            ].filter(Boolean).map((stat: any) => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: TXT2, marginTop: 2 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add/Edit budget modal ────────────────────────────────────────────────────

function BudgetModal({
  projectId,
  metricList,
  editing,
  onSaved,
  onClose,
}: {
  projectId:  string;
  metricList: MetricMeta[];
  editing:    BudgetWithEval | null;
  onSaved:    () => void;
  onClose:    () => void;
}) {
  const { CARD, BDR, TXT, TXT2, P } = useColors();
  const [metric, setMetric]       = useState<BudgetMetric>(editing?.metric ?? "failureRate");
  const [limit, setLimit]         = useState(String(editing?.evaluation.limit ?? ""));
  const [target, setTarget]       = useState(String(editing?.evaluation.target ?? ""));
  const [severity, setSeverity]   = useState<BudgetSeverity>(editing?.severity ?? "soft");
  const [environment, setEnv]     = useState(editing?.environment ?? "");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const selectedMeta = metricList.find(m => m.key === metric);

  const submit = async () => {
    const limitVal = parseFloat(limit);
    if (isNaN(limitVal)) { setError("Limit must be a number"); return; }
    setSaving(true);
    setError(null);
    try {
      const url    = editing
        ? `${API}/projects/${projectId}/budgets/${editing.id}`
        : `${API}/projects/${projectId}/budgets`;
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metric:      editing ? undefined : metric,
          limit:       limitVal,
          target:      target ? parseFloat(target) : undefined,
          severity,
          environment: environment || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      onSaved();
    } catch (e: any) {
      setError(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: `1px solid ${BDR}`, background: CARD,
    color: TXT, fontSize: 13, outline: "none", boxSizing: "border-box",
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
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 460, borderRadius: 14,
          background: CARD, border: `1px solid ${BDR}`,
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          padding: "28px 28px 24px",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: TXT, marginBottom: 20 }}>
          {editing ? "Edit Budget" : "Add Quality Budget"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {!editing && (
            <div>
              <label style={labelStyle}>Metric</label>
              <select style={{ ...inputStyle, appearance: "none" }} value={metric}
                onChange={e => {
                  setMetric(e.target.value as BudgetMetric);
                  const m = metricList.find(x => x.key === e.target.value);
                  if (m) setLimit(String(m.defaultLimit));
                }}>
                {metricList.map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
              {selectedMeta && (
                <div style={{ fontSize: 11, color: TXT2, marginTop: 5, lineHeight: 1.5 }}>
                  {selectedMeta.description}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>
                {selectedMeta?.higherIsBetter ? "Minimum" : "Maximum"} Limit{selectedMeta ? ` (${selectedMeta.unit || "%"})` : ""}
              </label>
              <input style={inputStyle} type="number" value={limit}
                onChange={e => setLimit(e.target.value)} placeholder="e.g. 10" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Target (optional)</label>
              <input style={inputStyle} type="number" value={target}
                onChange={e => setTarget(e.target.value)} placeholder="Goal" />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Severity</label>
              <select style={{ ...inputStyle, appearance: "none" }} value={severity}
                onChange={e => setSeverity(e.target.value as BudgetSeverity)}>
                <option value="soft">Soft — warn only</option>
                <option value="hard">Hard — blocks release / CI</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Environment (optional)</label>
              <select style={{ ...inputStyle, appearance: "none" }} value={environment}
                onChange={e => setEnv(e.target.value)}>
                <option value="">All environments</option>
                <option value="dev">dev</option>
                <option value="staging">staging</option>
                <option value="preprod">preprod</option>
                <option value="prod">prod</option>
              </select>
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "#ef4444", padding: "6px 10px", borderRadius: 6, background: "#ef444410" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={onClose} style={{
              padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: `1px solid ${BDR}`, background: "transparent", color: TXT, cursor: "pointer",
            }}>Cancel</button>
            <button onClick={submit} disabled={saving} style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: "none", background: P, color: "#fff", cursor: "pointer",
              opacity: saving ? 0.6 : 1,
            }}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Budget"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Summary bar ──────────────────────────────────────────────────────────────

function SummaryBar({ data }: { data: EvalResponse }) {
  const { CARD, BDR, TXT, TXT2 } = useColors();
  const cfg = OVERALL_CFG[data.overallStatus] ?? OVERALL_CFG.passing;
  const s   = data.counts ?? data.summary;

  return (
    <div style={{
      padding: "14px 18px", borderRadius: 10,
      background: cfg.bg, border: `1.5px solid ${cfg.color}40`,
      display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      marginBottom: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
        <div style={{ fontSize: 22 }}>
          {data.overallStatus === "passing" ? "✅" : data.overallStatus === "failing" ? "🚨" : "⚠️"}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: cfg.color }}>{cfg.label}</div>
          <div style={{ fontSize: 11, color: TXT2, marginTop: 1 }}>
            {s.withinBudget ?? 0} within · {s.approaching ?? 0} approaching · {s.exceeded ?? 0} exceeded
          </div>
        </div>
      </div>

      {/* CI gate */}
      <div style={{
        padding: "8px 14px", borderRadius: 8,
        background: CARD, border: `1px solid ${BDR}`,
        display: "flex", flexDirection: "column", alignItems: "center", minWidth: 100,
      }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: data.ciGate.pass ? "#22c55e" : "#ef4444" }}>
          {data.ciGate.pass ? "CI PASS" : "CI FAIL"}
        </div>
        <div style={{ fontSize: 10, color: TXT2, marginTop: 2, textAlign: "center" }}>
          {(s.hardViolations ?? 0)} hard violation{(s.hardViolations ?? 0) !== 1 ? "s" : ""}
        </div>
      </div>

      <div style={{ fontSize: 10, color: TXT2, flexShrink: 0 }}>
        Last evaluated {new Date(data.evaluatedAt).toLocaleTimeString()}
      </div>
    </div>
  );
}

// ─── Violations log ───────────────────────────────────────────────────────────

function ViolationsLog({ projectId }: { projectId: string }) {
  const { CARD, BDR, TXT, TXT2 } = useColors();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/projects/${projectId}/budgets/violations`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setViolations(d?.violations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div style={{ fontSize: 12, color: TXT2, padding: "12px 0" }}>Loading…</div>;
  if (violations.length === 0) return (
    <div style={{ textAlign: "center", padding: "24px 0", color: TXT2, fontSize: 13 }}>
      No violations recorded yet.
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {violations.map(v => {
        const sev = SEV_CFG[v.severity];
        const resolved = !!v.resolvedAt;
        return (
          <div key={v.id} style={{
            padding: "9px 14px", borderRadius: 8,
            background: CARD, border: `1px solid ${resolved ? BDR : sev.color + "30"}`,
            display: "flex", alignItems: "center", gap: 12,
            opacity: resolved ? 0.6 : 1,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: resolved ? "#6b7280" : sev.color, flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: TXT }}>{v.metric}</span>
              <span style={{ fontSize: 12, color: TXT2, marginLeft: 8 }}>
                {v.value} exceeded limit of {v.limit}
              </span>
            </div>
            <span style={{
              padding: "1px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700,
              background: sev.bg, color: sev.color,
            }}>{sev.label}</span>
            <span style={{ fontSize: 11, color: TXT2, whiteSpace: "nowrap" }}>
              {resolved ? `Resolved ${new Date(v.resolvedAt!).toLocaleDateString()}` : new Date(v.occurredAt).toLocaleDateString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main BudgetsPage ─────────────────────────────────────────────────────────

export default function BudgetsPage({ projectId }: { projectId: string }) {
  const { CARD, BDR, TXT, TXT2, P } = useColors();

  const [data, setData]         = useState<EvalResponse | null>(null);
  const [metricList, setMetrics] = useState<MetricMeta[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [showModal, setModal]   = useState(false);
  const [editing, setEditing]   = useState<BudgetWithEval | null>(null);
  const [tab, setTab]           = useState<"budgets" | "violations">("budgets");
  const [envFilter, setEnvFilter] = useState("");
  const [statusFilter, setStatus] = useState<BudgetStatus | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [evalRes, metaRes] = await Promise.all([
        fetch(`${API}/projects/${projectId}/budgets?withEval=true${envFilter ? `&environment=${envFilter}` : ""}`),
        fetch(`${API}/projects/${projectId}/budgets/metrics`),
      ]);
      if (!evalRes.ok) throw new Error(`HTTP ${evalRes.status}`);

      const evalData = await evalRes.json();
      const metaData = metaRes.ok ? await metaRes.json() : [];

      // Normalise to EvalResponse shape
      setData({
        projectId,
        overallStatus: evalData.counts
          ? (evalData.counts.hardViolations > 0 ? "failing" : evalData.counts.exceeded > 0 ? "warning" : evalData.counts.approaching > 0 ? "warning" : "passing")
          : "passing",
        evaluatedAt: evalData.evaluatedAt ?? new Date().toISOString(),
        summary:  evalData.counts ?? { total: 0, withinBudget: 0, approaching: 0, exceeded: 0, hardViolations: 0 },
        counts:   evalData.counts ?? { withinBudget: 0, approaching: 0, exceeded: 0, hardViolations: 0 },
        budgets:  evalData.budgets ?? [],
        ciGate:   {
          pass: (evalData.counts?.hardViolations ?? 0) === 0,
          message: (evalData.counts?.hardViolations ?? 0) === 0
            ? "All hard budgets are within limits."
            : `${evalData.counts?.hardViolations} hard budget(s) exceeded.`,
          violated: (evalData.budgets ?? [])
            .filter((b: BudgetWithEval) => b.evaluation.status === "exceeded" && b.severity === "hard")
            .map((b: BudgetWithEval) => ({ metric: b.metric, label: b.evaluation.label, current: b.evaluation.currentValue, limit: b.evaluation.limit })),
        },
      });
      setMetrics(metaData);
    } catch (e: any) {
      setError(e.message ?? "Failed to load budgets");
    } finally {
      setLoading(false);
    }
  }, [projectId, envFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    await fetch(`${API}/projects/${projectId}/budgets/${id}`, { method: "DELETE" });
    load();
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await fetch(`${API}/projects/${projectId}/budgets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    load();
  };

  const handleReset = async () => {
    if (!window.confirm("Reset all budgets to defaults?")) return;
    await fetch(`${API}/projects/${projectId}/budgets/reset`, { method: "POST" });
    load();
  };

  const filtered = (data?.budgets ?? []).filter(b => {
    if (statusFilter !== "all" && b.evaluation.status !== statusFilter) return false;
    return true;
  });

  const sectionHead: React.CSSProperties = {
    fontSize: 11, fontWeight: 800, color: TXT2,
    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
  };

  if (loading) return (
    <div style={{ padding: 48, textAlign: "center", color: TXT2, fontSize: 14 }}>
      Evaluating budgets…
    </div>
  );

  if (error || !data) return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <div style={{ color: "#ef4444", marginBottom: 12, fontSize: 13 }}>{error ?? "No budget data"}</div>
      <button onClick={load} style={{
        padding: "8px 18px", borderRadius: 8, border: `1px solid ${BDR}`,
        background: CARD, color: TXT, cursor: "pointer", fontSize: 13,
      }}>Retry</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, height: "100%" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 900, color: TXT }}>Quality Budgets</h2>
          <div style={{ fontSize: 12, color: TXT2 }}>
            Enforceable limits for risk, failures, flakiness, and coverage gaps
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={envFilter}
            onChange={e => setEnvFilter(e.target.value)}
            style={{
              padding: "6px 10px", borderRadius: 8, fontSize: 12,
              border: `1px solid ${BDR}`, background: CARD, color: TXT2, outline: "none",
            }}
          >
            <option value="">All Environments</option>
            <option value="dev">dev</option>
            <option value="staging">staging</option>
            <option value="preprod">preprod</option>
            <option value="prod">prod</option>
          </select>
          <button onClick={load} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: `1px solid ${BDR}`, background: "transparent", color: TXT, cursor: "pointer",
          }}>Refresh</button>
          <button onClick={handleReset} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: `1px solid ${BDR}`, background: "transparent", color: TXT2, cursor: "pointer",
          }}>Reset Defaults</button>
          <button onClick={() => { setEditing(null); setModal(true); }} style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700,
            border: "none", background: P, color: "#fff", cursor: "pointer",
          }}>+ Add Budget</button>
        </div>
      </div>

      {/* ── Summary bar ─────────────────────────────────────────────────────── */}
      <SummaryBar data={data} />

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${BDR}`, paddingBottom: 0 }}>
        {(["budgets", "violations"] as const).map(t => {
          const labels = { budgets: "Budgets", violations: "Violations" };
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 16px", border: "none", cursor: "pointer",
              background: "transparent",
              color: tab === t ? P : TXT2,
              fontWeight: tab === t ? 700 : 500, fontSize: 13,
              borderBottom: `2px solid ${tab === t ? P : "transparent"}`,
              marginBottom: -1,
            }}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ── Budgets tab ──────────────────────────────────────────────────────── */}
      {tab === "budgets" && (
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* Status filter pills */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
            {(["all", "within-budget", "approaching-budget", "exceeded"] as const).map(s => {
              const label = s === "all" ? "All" : STATUS_CFG[s]?.label ?? s;
              const active = statusFilter === s;
              return (
                <button key={s} onClick={() => setStatus(s)} style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: `1.5px solid ${active ? (s === "all" ? P : STATUS_CFG[s as BudgetStatus]?.color ?? P) : BDR}`,
                  background: active ? `${s === "all" ? P : STATUS_CFG[s as BudgetStatus]?.color ?? P}14` : "transparent",
                  color: active ? (s === "all" ? P : STATUS_CFG[s as BudgetStatus]?.color ?? P) : TXT2,
                }}>
                  {label}
                  {s !== "all" && (
                    <span style={{ marginLeft: 6, fontSize: 11 }}>
                      ({(data.budgets ?? []).filter(b => b.evaluation.status === s).length})
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: TXT2, fontSize: 13 }}>
              No budgets match the current filter.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {/* Hard budgets first */}
              {filtered.some(b => b.severity === "hard") && (
                <div style={{ ...sectionHead, marginTop: 4 }}>Hard Budgets</div>
              )}
              {filtered.filter(b => b.severity === "hard").map(item => (
                <BudgetRow key={item.id} item={item}
                  onEdit={b => { setEditing(b); setModal(true); }}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
              {filtered.some(b => b.severity === "soft") && (
                <div style={{ ...sectionHead, marginTop: 12 }}>Soft Budgets</div>
              )}
              {filtered.filter(b => b.severity === "soft").map(item => (
                <BudgetRow key={item.id} item={item}
                  onEdit={b => { setEditing(b); setModal(true); }}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}

          {/* CI gate detail */}
          {data.ciGate.violated.length > 0 && (
            <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 10, background: "#ef444408", border: "1px solid #ef444430" }}>
              <div style={sectionHead}>CI Gate — Hard Violations</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {data.ciGate.violated.map(v => (
                  <div key={v.metric} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                    <span style={{ color: "#ef4444" }}>✕</span>
                    <span style={{ flex: 1, color: TXT }}>{v.label}</span>
                    <span style={{ color: "#ef4444", fontWeight: 700 }}>{v.current} / {v.limit} limit</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, padding: "8px 10px", borderRadius: 7, background: "#ef444410", fontSize: 11, color: TXT2, lineHeight: 1.5 }}>
                <strong style={{ color: "#ef4444" }}>CI recommendation:</strong> {data.ciGate.message}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Violations tab ───────────────────────────────────────────────────── */}
      {tab === "violations" && (
        <div style={{ flex: 1, overflowY: "auto" }}>
          <ViolationsLog projectId={projectId} />
        </div>
      )}

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {showModal && (
        <BudgetModal
          projectId={projectId}
          metricList={metricList}
          editing={editing}
          onSaved={() => { setModal(false); setEditing(null); load(); }}
          onClose={() => { setModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
