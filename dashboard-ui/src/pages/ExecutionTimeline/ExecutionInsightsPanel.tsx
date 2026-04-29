import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useColors } from "@/hooks/useColors";
import {
  fetchOrgInsights, fetchOrgInsightSummary, updateInsightStatus,
  SEVERITY_COLOR, SEVERITY_BG, TYPE_LABEL, TYPE_ICON, STATUS_LABEL, STATUS_COLOR,
  type Insight, type InsightSeverity, type InsightStatus, type InsightType, type OrgInsightSummary,
} from "../../api/insights";

// ─── Summary tile ──────────────────────────────────────────────────────────────

function SummaryTile({
  label, value, color, icon,
}: { label: string; value: number; color: string; icon: string }) {
  const { CARD: surface, BDR: border, TXT2: textLight } = useColors();
  return (
    <div style={{
      background: surface, border: `1px solid ${border}`, borderRadius: 12,
      padding: "18px 22px", display: "flex", alignItems: "center", gap: 14, flex: 1,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: textLight, marginTop: 3, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Severity badge ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: InsightSeverity }) {
  const color = SEVERITY_COLOR[severity];
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: SEVERITY_BG[severity], color,
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>
      {severity}
    </span>
  );
}

// ─── Status chip ───────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: InsightStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: `${color}15`, color,
    }}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── Insight row ───────────────────────────────────────────────────────────────

function InsightRow({
  insight, active, onClick,
}: { insight: Insight; active: boolean; onClick: () => void }) {
  const { TXT: text, TXT2: textLight, P } = useColors();
  const icon  = TYPE_ICON[insight.type] ?? "💡";
  const label = TYPE_LABEL[insight.type] ?? insight.type;
  const color = SEVERITY_COLOR[insight.severity];

  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "36px 1fr 120px 110px 100px 90px",
        alignItems: "center", gap: 12,
        padding: "13px 18px",
        background: active ? `${P}0d` : "transparent",
        borderLeft: active ? `3px solid ${P}` : "3px solid transparent",
        cursor: "pointer",
        transition: "background 0.12s",
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = `${P}07`; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: color, boxShadow: `0 0 6px ${color}88`,
        margin: "0 auto",
      }} />

      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: text, lineHeight: 1.4 }}>
          {insight.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
          <span style={{ fontSize: 12 }}>{icon}</span>
          <span style={{ fontSize: 11, color: textLight }}>{label}</span>
          {insight.area && <span style={{ fontSize: 11, color: textLight }}>· {insight.area}</span>}
        </div>
      </div>

      <div style={{ fontSize: 12, color: textLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {insight.projectName ?? "—"}
      </div>

      <div><SeverityBadge severity={insight.severity} /></div>
      <div><StatusChip status={insight.status} /></div>

      <div style={{ fontSize: 11, color: textLight }}>{fmtAge(insight.createdAt)}</div>
    </div>
  );
}

// ─── Detail drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({
  insight, onClose, onStatusChange,
}: {
  insight: Insight;
  onClose: () => void;
  onStatusChange: (id: string, status: InsightStatus) => void;
}) {
  const navigate = useNavigate();
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, BG: pageBg, P, dark } = useColors();
  const metricBg = dark ? "#1a1a2e" : "#f0f0f8";

  const icon  = TYPE_ICON[insight.type] ?? "💡";
  const color = SEVERITY_COLOR[insight.severity];
  const statuses: InsightStatus[] = ["open", "in-progress", "resolved", "dismissed"];

  const handleAction = (actionType: string) => {
    const pid = insight.projectId;
    const routes: Record<string, string> = {
      "open-rtm":           `/projects/${pid}?tab=rtm`,
      "open-flows":         `/projects/${pid}?tab=flows`,
      "open-endpoints":     `/projects/${pid}?tab=flows`,
      "open-replay":        `/projects/${pid}?tab=replay`,
      "apply-auto-heal":    `/projects/${pid}?tab=autoheal`,
      "generate-tests":     `/projects/${pid}?tab=tests`,
      "create-suggestion":  `/projects/${pid}?tab=suggestions`,
    };
    navigate(routes[actionType] ?? `/projects/${pid}`);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div style={{
        position: "relative", width: 480, height: "100%",
        background: surface, borderLeft: `1px solid ${border}`,
        display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1,
        boxShadow: "-8px 0 40px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, flexShrink: 0,
            background: `${color}18`, border: `1px solid ${color}30`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
          }}>{icon}</div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: text, lineHeight: 1.4 }}>{insight.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <SeverityBadge severity={insight.severity} />
              <StatusChip status={insight.status} />
              <span style={{ fontSize: 11, color: textLight }}>{TYPE_LABEL[insight.type]}</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6, border: "none",
            background: "transparent", color: textLight, cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          <DrawerSection title="What this means">
            <p style={{ fontSize: 13, color: textLight, lineHeight: 1.7, margin: 0 }}>{insight.description}</p>
          </DrawerSection>

          {Object.keys(insight.metricsSnapshot ?? {}).length > 0 && (
            <DrawerSection title="Metrics at detection">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(insight.metricsSnapshot).map(([k, v]) => (
                  <div key={k} style={{
                    padding: "6px 12px", borderRadius: 8,
                    background: metricBg, border: `1px solid ${border}`, fontSize: 12,
                  }}>
                    <span style={{ color: textLight }}>{fmtMetricKey(k)}: </span>
                    <span style={{ color: text, fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
            </DrawerSection>
          )}

          {hasLinkedEntities(insight) && (
            <DrawerSection title="Linked entities">
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {insight.linkedEntities.requirementIds?.length ? <EntityPill label="Requirements" count={insight.linkedEntities.requirementIds.length} color="#448AFF" /> : null}
                {insight.linkedEntities.endpointIds?.length ? <EntityPill label="Endpoints" count={insight.linkedEntities.endpointIds.length} color="#00BCD4" /> : null}
                {insight.linkedEntities.testIds?.length ? <EntityPill label="Tests" count={insight.linkedEntities.testIds.length} color="#4CAF50" /> : null}
                {insight.linkedEntities.autoHealIds?.length ? <EntityPill label="Auto-Heal records" count={insight.linkedEntities.autoHealIds.length} color="#FF9800" /> : null}
              </div>
            </DrawerSection>
          )}

          {insight.suggestedActions?.length > 0 && (
            <DrawerSection title="Suggested actions">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {insight.suggestedActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.type)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "11px 14px", borderRadius: 10,
                      background: `${P}0d`, border: `1px solid ${P}25`,
                      cursor: "pointer", textAlign: "left",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${P}1a`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${P}0d`; }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: P }}>{action.label}</div>
                      {action.description && <div style={{ fontSize: 11, color: textLight, marginTop: 2 }}>{action.description}</div>}
                    </div>
                    <span style={{ color: P, fontSize: 14 }}>→</span>
                  </button>
                ))}
              </div>
            </DrawerSection>
          )}

          {insight.projectName && (
            <DrawerSection title="Project">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: `${P}18`, color: P }}>
                  {insight.projectType?.toUpperCase() ?? "PROJECT"}
                </span>
                <span style={{ fontSize: 13, color: text }}>{insight.projectName}</span>
              </div>
            </DrawerSection>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Update status
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {statuses.filter(s => s !== insight.status).map(s => (
              <button
                key={s}
                onClick={() => onStatusChange(insight.id, s)}
                style={{
                  padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${STATUS_COLOR[s]}40`,
                  background: `${STATUS_COLOR[s]}15`, color: STATUS_COLOR[s],
                  cursor: "pointer", transition: "background 0.12s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${STATUS_COLOR[s]}28`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${STATUS_COLOR[s]}15`; }}
              >
                Mark as {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { TXT2: textLight } = useColors();
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function EntityPill({ label, count, color }: { label: string; count: number; color: string }) {
  const { TXT: text } = useColors();
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 12px", borderRadius: 8, background: `${color}10`, border: `1px solid ${color}25`, fontSize: 12,
    }}>
      <span style={{ width: 20, height: 20, borderRadius: 5, background: `${color}25`, color, fontWeight: 800, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>{count}</span>
      <span style={{ color: text }}>{label}</span>
    </div>
  );
}

// ─── Filters ───────────────────────────────────────────────────────────────────

const SEVERITY_OPTIONS: InsightSeverity[] = ["critical", "high", "medium", "low"];
const STATUS_OPTIONS: InsightStatus[]     = ["open", "in-progress", "resolved", "dismissed"];
const TYPE_OPTIONS: InsightType[]         = [
  "risk-hotspot", "coverage-gap", "flaky-cluster", "endpoint-risk",
  "ai-impact", "auto-heal-opportunity", "quality-debt",
];

function FilterChip({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  const { BDR: border, TXT2: textLight, P } = useColors();
  const c = color ?? P;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
        border: `1px solid ${active ? c : border}`,
        background: active ? `${c}18` : "transparent",
        color: active ? c : textLight,
        cursor: "pointer", transition: "all 0.12s",
      }}
    >{label}</button>
  );
}

// ─── Top projects ──────────────────────────────────────────────────────────────

function TopProjectsWidget({ projects }: { projects: OrgInsightSummary["topProjects"] }) {
  const navigate = useNavigate();
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight } = useColors();
  const max = projects[0]?.total ?? 1;
  return (
    <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 20px" }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
        Top projects by open insights
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {projects.map(p => (
          <div key={p.id} style={{ cursor: "pointer" }} onClick={() => navigate(`/projects/${p.id}`)}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{
                fontSize: 12, color: text, fontWeight: 500,
                flex: 1, minWidth: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {shortenUrl(p.name)}
              </span>
              <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
                {p.critical > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: SEVERITY_COLOR.critical, whiteSpace: "nowrap" }}>
                    {p.critical}c
                  </span>
                )}
                <span style={{ fontSize: 11, color: textLight, whiteSpace: "nowrap" }}>{p.total}</span>
              </div>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: border, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                width: `${Math.round((p.total / max) * 100)}%`,
                background: p.critical > 0 ? SEVERITY_COLOR.critical : SEVERITY_COLOR.high,
                transition: "width 0.4s",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function shortenUrl(name: string): string {
  try {
    const u = new URL(name);
    return u.hostname + (u.pathname !== "/" ? u.pathname.replace(/\/[^/]+\.[^/]+$/, "") : "");
  } catch {
    return name;
  }
}

function fmtAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

function fmtMetricKey(k: string): string {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
}

function hasLinkedEntities(insight: Insight): boolean {
  const e = insight.linkedEntities ?? {};
  return !!(e.requirementIds?.length || e.endpointIds?.length || e.testIds?.length || e.autoHealIds?.length);
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function ExecutionInsightsPanel() {
  const [insights, setInsights]   = useState<Insight[]>([]);
  const [summary, setSummary]     = useState<OrgInsightSummary | null>(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected]   = useState<Insight | null>(null);

  const [filterSeverity, setFilterSeverity] = useState<InsightSeverity | null>(null);
  const [filterStatus,   setFilterStatus]   = useState<InsightStatus | null>("open");
  const [filterType,     setFilterType]     = useState<InsightType | null>(null);

  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, BG: bg, P } = useColors();

  const load = useCallback(async () => {
    try {
      const [ins, sum] = await Promise.all([
        fetchOrgInsights({
          severities: filterSeverity ?? undefined,
          statuses:   filterStatus   ?? undefined,
          types:      filterType     ?? undefined,
        }),
        fetchOrgInsightSummary(),
      ]);
      setInsights(ins);
      setSummary(sum);
    } catch {
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterStatus, filterType]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await load(); toast.success("Insights refreshed"); }
    finally { setRefreshing(false); }
  };

  const handleStatusChange = async (insightId: string, status: InsightStatus) => {
    const insight = insights.find(i => i.id === insightId);
    if (!insight) return;
    try {
      const updated = await updateInsightStatus(insight.projectId, insightId, status);
      setInsights(prev => prev.map(i => i.id === insightId ? { ...i, ...updated } : i));
      if (selected?.id === insightId) setSelected(prev => prev ? { ...prev, ...updated } : null);
      toast.success(`Marked as ${STATUS_LABEL[status]}`);
      if (filterStatus && status !== filterStatus) {
        setInsights(prev => prev.filter(i => i.id !== insightId));
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "system-ui, -apple-system, sans-serif", padding: "28px 32px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: text }}>Insights</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: textLight }}>
            Prioritized signals across all projects — what to care about right now
          </p>
        </div>
        <button
          onClick={handleRefresh} disabled={refreshing}
          style={{
            padding: "9px 18px", borderRadius: 10, border: "none",
            background: refreshing ? border : P, color: "#fff",
            fontWeight: 700, fontSize: 13, cursor: refreshing ? "wait" : "pointer",
            opacity: refreshing ? 0.7 : 1,
          }}
        >
          {refreshing ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: textLight, paddingTop: 80, fontSize: 14 }}>
          Analyzing all projects…
        </div>
      ) : (
        <>
          {/* Summary tiles */}
          <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
            <SummaryTile label="Total open insights"  value={summary?.total    ?? 0} color={P}                       icon="💡" />
            <SummaryTile label="Critical"             value={summary?.critical ?? 0} color={SEVERITY_COLOR.critical} icon="🔴" />
            <SummaryTile label="High"                 value={summary?.high     ?? 0} color={SEVERITY_COLOR.high}     icon="🟠" />
            <SummaryTile label="Medium"               value={summary?.medium   ?? 0} color={SEVERITY_COLOR.medium}   icon="🟡" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

            {/* Main column */}
            <div>
              {/* Filters */}
              <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: textLight, fontWeight: 600 }}>Severity:</span>
                {SEVERITY_OPTIONS.map(s => (
                  <FilterChip key={s} label={s} active={filterSeverity === s} color={SEVERITY_COLOR[s]}
                    onClick={() => setFilterSeverity(filterSeverity === s ? null : s)} />
                ))}
                <div style={{ width: 1, height: 16, background: border, margin: "0 4px" }} />
                <span style={{ fontSize: 12, color: textLight, fontWeight: 600 }}>Status:</span>
                {STATUS_OPTIONS.map(s => (
                  <FilterChip key={s} label={STATUS_LABEL[s]} active={filterStatus === s} color={STATUS_COLOR[s]}
                    onClick={() => setFilterStatus(filterStatus === s ? null : s)} />
                ))}
                <div style={{ width: 1, height: 16, background: border, margin: "0 4px" }} />
                <span style={{ fontSize: 12, color: textLight, fontWeight: 600 }}>Type:</span>
                {TYPE_OPTIONS.map(t => (
                  <FilterChip key={t} label={TYPE_LABEL[t]} active={filterType === t}
                    onClick={() => setFilterType(filterType === t ? null : t)} />
                ))}
              </div>

              {/* Table */}
              <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "36px 1fr 120px 110px 100px 90px",
                  gap: 12, padding: "10px 18px", borderBottom: `1px solid ${border}`,
                  fontSize: 11, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em",
                }}>
                  <div /><div>Insight</div><div>Project</div><div>Severity</div><div>Status</div><div>Age</div>
                </div>

                {insights.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center", color: textLight, fontSize: 13 }}>
                    {filterStatus === "open"
                      ? "No open insights — your projects look healthy 🎉"
                      : "No insights match the current filters"}
                  </div>
                ) : insights.map(insight => (
                  <div key={insight.id} style={{ borderBottom: `1px solid ${border}` }}>
                    <InsightRow
                      insight={insight}
                      active={selected?.id === insight.id}
                      onClick={() => setSelected(selected?.id === insight.id ? null : insight)}
                    />
                  </div>
                ))}
              </div>

              {insights.length > 0 && (
                <div style={{ fontSize: 11, color: textLight, marginTop: 8, textAlign: "right" }}>
                  {insights.length} insight{insights.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {summary?.topProjects?.length ? <TopProjectsWidget projects={summary.topProjects} /> : null}

              <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                  By type
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {TYPE_OPTIONS.map(type => {
                    const count = insights.filter(i => i.type === type).length;
                    if (!count) return null;
                    return (
                      <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                        onClick={() => setFilterType(filterType === type ? null : type)}>
                        <span style={{ fontSize: 14 }}>{TYPE_ICON[type]}</span>
                        <span style={{ fontSize: 12, color: text, flex: 1 }}>{TYPE_LABEL[type]}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: P, background: `${P}15`, padding: "1px 7px", borderRadius: 10 }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {selected && (
        <DetailDrawer
          insight={selected}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
