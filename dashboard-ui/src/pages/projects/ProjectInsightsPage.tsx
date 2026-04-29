import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  fetchProjectInsights, refreshProjectInsights, updateInsightStatus,
  SEVERITY_COLOR, SEVERITY_BG, TYPE_LABEL, TYPE_ICON, STATUS_LABEL, STATUS_COLOR,
  type Insight, type InsightSeverity, type InsightStatus, type InsightType,
} from "../../api/insights";
import { useColors } from "@/hooks/useColors";

// ─── Palette (respects theme) ──────────────────────────────────────────────────

// ─── Summary tile ──────────────────────────────────────────────────────────────

function SummaryTile({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  const { CARD, BDR, TXT2 } = useColors();
  return (
    <div style={{
      background: CARD, border: `1px solid ${BDR}`, borderRadius: 12,
      padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 130,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 9, flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: TXT2, marginTop: 2, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Severity badge ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: InsightSeverity }) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: SEVERITY_BG[severity], color: SEVERITY_COLOR[severity],
      textTransform: "uppercase", letterSpacing: "0.05em",
    }}>{severity}</span>
  );
}

// ─── Status chip ───────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: InsightStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
      background: `${color}15`, color,
    }}>{STATUS_LABEL[status]}</span>
  );
}

// ─── Insight card ──────────────────────────────────────────────────────────────

function InsightCard({ insight, onClick }: { insight: Insight; onClick: () => void }) {
  const { CARD, BDR, TXT, TXT2, P } = useColors();
  const color = SEVERITY_COLOR[insight.severity];
  const icon  = TYPE_ICON[insight.type] ?? "💡";

  return (
    <div
      onClick={onClick}
      style={{
        background: CARD, border: `1px solid ${BDR}`, borderRadius: 12,
        padding: "16px 18px", cursor: "pointer",
        borderLeft: `3px solid ${color}`,
        transition: "box-shadow 0.15s, transform 0.15s",
        display: "flex", flexDirection: "column", gap: 8,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = `0 4px 20px ${color}18`;
        el.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "none";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: `${color}15`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 16,
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TXT, lineHeight: 1.4 }}>
            {insight.title}
          </div>
          <div style={{ fontSize: 11, color: TXT2, marginTop: 2 }}>
            {TYPE_LABEL[insight.type]} · {insight.area}
          </div>
        </div>
        <SeverityBadge severity={insight.severity} />
      </div>

      {/* Description preview */}
      <p style={{
        fontSize: 12, color: TXT2, margin: 0, lineHeight: 1.6,
        overflow: "hidden", display: "-webkit-box",
        WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>
        {insight.description}
      </p>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <StatusChip status={insight.status} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {insight.suggestedActions?.length > 0 && (
            <span style={{ fontSize: 11, color: P, fontWeight: 600 }}>
              {insight.suggestedActions.length} action{insight.suggestedActions.length > 1 ? "s" : ""}
            </span>
          )}
          <span style={{ fontSize: 11, color: TXT2 }}>{fmtAge(insight.createdAt)}</span>
        </div>
      </div>
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
  const { CARD, BDR, TXT, TXT2, P } = useColors();
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
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={onClose} />
      <div style={{
        position: "relative", width: 460, height: "100%",
        background: CARD, borderLeft: `1px solid ${BDR}`,
        display: "flex", flexDirection: "column", overflow: "hidden", zIndex: 1,
        boxShadow: "-6px 0 32px rgba(0,0,0,0.2)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 22px", borderBottom: `1px solid ${BDR}`, display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: `${color}18`, border: `1px solid ${color}30`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>{TYPE_ICON[insight.type] ?? "💡"}</div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: TXT, lineHeight: 1.4 }}>{insight.title}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <SeverityBadge severity={insight.severity} />
              <StatusChip status={insight.status} />
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent",
            color: TXT2, cursor: "pointer", fontSize: 16, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 18 }}>

          <DSection title="What this means" TXT2={TXT2}>
            <p style={{ fontSize: 13, color: TXT2, lineHeight: 1.7, margin: 0 }}>{insight.description}</p>
          </DSection>

          {Object.keys(insight.metricsSnapshot ?? {}).length > 0 && (
            <DSection title="Metrics at detection" TXT2={TXT2}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(insight.metricsSnapshot).map(([k, v]) => (
                  <div key={k} style={{
                    padding: "5px 11px", borderRadius: 7,
                    background: `${P}08`, border: `1px solid ${BDR}`, fontSize: 12,
                  }}>
                    <span style={{ color: TXT2 }}>{fmtKey(k)}: </span>
                    <span style={{ color: TXT, fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
            </DSection>
          )}

          {hasEntities(insight) && (
            <DSection title="Linked entities" TXT2={TXT2}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {insight.linkedEntities.requirementIds?.length ? <EPill label="Requirements" count={insight.linkedEntities.requirementIds.length} color="#448AFF" BDR={BDR} TXT={TXT} /> : null}
                {insight.linkedEntities.endpointIds?.length ? <EPill label="Endpoints" count={insight.linkedEntities.endpointIds.length} color="#00BCD4" BDR={BDR} TXT={TXT} /> : null}
                {insight.linkedEntities.testIds?.length ? <EPill label="Tests" count={insight.linkedEntities.testIds.length} color="#4CAF50" BDR={BDR} TXT={TXT} /> : null}
                {insight.linkedEntities.autoHealIds?.length ? <EPill label="Auto-Heal records" count={insight.linkedEntities.autoHealIds.length} color="#FF9800" BDR={BDR} TXT={TXT} /> : null}
              </div>
            </DSection>
          )}

          {insight.suggestedActions?.length > 0 && (
            <DSection title="Suggested actions" TXT2={TXT2}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {insight.suggestedActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.type)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "10px 14px", borderRadius: 9,
                      background: `${P}0c`, border: `1px solid ${P}22`,
                      cursor: "pointer", textAlign: "left", transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${P}1a`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${P}0c`; }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: P }}>{action.label}</div>
                      {action.description && <div style={{ fontSize: 11, color: TXT2, marginTop: 2 }}>{action.description}</div>}
                    </div>
                    <span style={{ color: P, fontSize: 14 }}>→</span>
                  </button>
                ))}
              </div>
            </DSection>
          )}
        </div>

        {/* Footer: status actions */}
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${BDR}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            Update status
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {statuses.filter(s => s !== insight.status).map(s => (
              <button
                key={s}
                onClick={() => onStatusChange(insight.id, s)}
                style={{
                  padding: "6px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${STATUS_COLOR[s]}40`,
                  background: `${STATUS_COLOR[s]}12`, color: STATUS_COLOR[s],
                  cursor: "pointer", transition: "background 0.12s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${STATUS_COLOR[s]}28`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${STATUS_COLOR[s]}12`; }}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function DSection({ title, children, TXT2 }: { title: string; children: React.ReactNode; TXT2: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}

function EPill({ label, count, color, BDR, TXT }: { label: string; count: number; color: string; BDR: string; TXT: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "5px 11px", borderRadius: 8, background: `${color}10`, border: `1px solid ${color}25`, fontSize: 12,
    }}>
      <span style={{ width: 18, height: 18, borderRadius: 4, background: `${color}25`, color, fontWeight: 800, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>{count}</span>
      <span style={{ color: TXT }}>{label}</span>
    </div>
  );
}

// ─── Filter chip ───────────────────────────────────────────────────────────────

function Chip({ label, active, color, onClick }: { label: string; active: boolean; color?: string; onClick: () => void }) {
  const { P, BDR, TXT2 } = useColors();
  const c = color ?? P;
  return (
    <button
      onClick={onClick}
      style={{
        padding: "4px 11px", borderRadius: 20, fontSize: 12, fontWeight: 600,
        border: `1px solid ${active ? c : BDR}`,
        background: active ? `${c}18` : "transparent",
        color: active ? c : TXT2,
        cursor: "pointer", transition: "all 0.12s",
      }}
    >{label}</button>
  );
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function fmtAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0)  return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

function fmtKey(k: string): string {
  return k.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
}

function hasEntities(i: Insight): boolean {
  const e = i.linkedEntities ?? {};
  return !!(e.requirementIds?.length || e.endpointIds?.length || e.testIds?.length || e.autoHealIds?.length);
}

const SEVERITY_OPTIONS: InsightSeverity[] = ["critical", "high", "medium", "low"];
const STATUS_OPTIONS:   InsightStatus[]   = ["open", "in-progress", "resolved", "dismissed"];
const TYPE_OPTIONS:     InsightType[]     = [
  "risk-hotspot", "coverage-gap", "flaky-cluster", "endpoint-risk",
  "ai-impact", "auto-heal-opportunity", "quality-debt",
];

// ─── Main component ────────────────────────────────────────────────────────────

export default function ProjectInsightsPage({ projectId }: { projectId: string }) {
  const [insights,    setInsights]    = useState<Insight[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [selected,    setSelected]    = useState<Insight | null>(null);

  const [filterSev,    setFilterSev]    = useState<InsightSeverity | null>(null);
  const [filterStatus, setFilterStatus] = useState<InsightStatus | null>("open");
  const [filterType,   setFilterType]   = useState<InsightType | null>(null);

  const { P, BG, CARD, BDR, TXT, TXT2 } = useColors();

  const load = useCallback(async () => {
    try {
      const data = await fetchProjectInsights(projectId, {
        severities: filterSev    ?? undefined,
        statuses:   filterStatus ?? undefined,
        types:      filterType   ?? undefined,
      });
      setInsights(data);
    } catch {
      toast.error("Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, [projectId, filterSev, filterStatus, filterType]);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await refreshProjectInsights(projectId);
      setInsights(data.filter(i => {
        if (filterSev    && i.severity !== filterSev)    return false;
        if (filterStatus && i.status   !== filterStatus) return false;
        if (filterType   && i.type     !== filterType)   return false;
        return true;
      }));
      toast.success("Insights refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusChange = async (insightId: string, status: InsightStatus) => {
    const insight = insights.find(i => i.id === insightId);
    if (!insight) return;
    try {
      const updated = await updateInsightStatus(projectId, insightId, status);
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

  const critical = insights.filter(i => i.severity === "critical").length;
  const high     = insights.filter(i => i.severity === "high").length;
  const open     = insights.filter(i => i.status === "open").length;
  const resolved = insights.filter(i => i.status === "resolved").length;

  return (
    <div style={{ padding: "24px 0" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: TXT }}>Insights</h2>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: TXT2 }}>
            Prioritized signals — what this project needs attention on
          </p>
        </div>
        <button
          onClick={handleRefresh} disabled={refreshing}
          style={{
            padding: "8px 16px", borderRadius: 9, border: "none",
            background: refreshing ? BDR : P, color: "#fff",
            fontWeight: 700, fontSize: 12, cursor: refreshing ? "wait" : "pointer",
            opacity: refreshing ? 0.7 : 1,
          }}
        >{refreshing ? "Refreshing…" : "↻ Refresh"}</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: TXT2, padding: "60px 0", fontSize: 13 }}>
          Analyzing project data…
        </div>
      ) : (
        <>
          {/* Summary tiles */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <SummaryTile label="Open"     value={open}     color={P}                       icon="💡" />
            <SummaryTile label="Critical" value={critical} color={SEVERITY_COLOR.critical} icon="🔴" />
            <SummaryTile label="High"     value={high}     color={SEVERITY_COLOR.high}     icon="🟠" />
            <SummaryTile label="Resolved" value={resolved} color={SEVERITY_COLOR.low}      icon="✅" />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 11, color: TXT2, fontWeight: 700 }}>Severity:</span>
            {SEVERITY_OPTIONS.map(s => (
              <Chip key={s} label={s} active={filterSev === s} color={SEVERITY_COLOR[s]}
                onClick={() => setFilterSev(filterSev === s ? null : s)} />
            ))}
            <div style={{ width: 1, height: 14, background: BDR, margin: "0 3px" }} />
            <span style={{ fontSize: 11, color: TXT2, fontWeight: 700 }}>Status:</span>
            {STATUS_OPTIONS.map(s => (
              <Chip key={s} label={STATUS_LABEL[s]} active={filterStatus === s} color={STATUS_COLOR[s]}
                onClick={() => setFilterStatus(filterStatus === s ? null : s)} />
            ))}
            <div style={{ width: 1, height: 14, background: BDR, margin: "0 3px" }} />
            <span style={{ fontSize: 11, color: TXT2, fontWeight: 700 }}>Type:</span>
            {TYPE_OPTIONS.map(t => (
              <Chip key={t} label={TYPE_LABEL[t]} active={filterType === t}
                onClick={() => setFilterType(filterType === t ? null : t)} />
            ))}
          </div>

          {/* Card grid */}
          {insights.length === 0 ? (
            <div style={{
              background: CARD, border: `1px solid ${BDR}`, borderRadius: 12,
              padding: "50px 20px", textAlign: "center",
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>
                {filterStatus === "open" ? "🎉" : "🔍"}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: TXT }}>
                {filterStatus === "open" ? "No open insights" : "No insights match these filters"}
              </div>
              <div style={{ fontSize: 12, color: TXT2, marginTop: 6 }}>
                {filterStatus === "open"
                  ? "This project looks healthy — no active risks or gaps detected."
                  : "Try adjusting the filters above."}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
              {insights.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onClick={() => setSelected(selected?.id === insight.id ? null : insight)}
                />
              ))}
            </div>
          )}

          {insights.length > 0 && (
            <div style={{ fontSize: 11, color: TXT2, marginTop: 10, textAlign: "right" }}>
              {insights.length} insight{insights.length !== 1 ? "s" : ""}
            </div>
          )}
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
