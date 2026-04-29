import { useEffect, useState } from "react";
import { theme } from "@/theme";
import { useColors } from "@/hooks/useColors";
import { socket } from "@/socket";
import ProgressModal from "@/components/ProgressModal";
import type { TabId } from "@/dashboard/pages/projects/layout/ProjectSidebar";

const API = "http://localhost:3000";

// ─── Health status config ──────────────────────────────────────────────────────

const HEALTH: Record<string, { label: string; color: string; icon: string; description: string }> = {
  healthy:    { label: "Healthy",    color: "#4CAF50", icon: "✅", description: "All signals are green" },
  "at-risk":  { label: "At Risk",    color: "#FF9800", icon: "⚠️", description: "Attention needed in some areas" },
  unstable:   { label: "Unstable",   color: "#EF5350", icon: "🔴", description: "Active failures or critical gaps" },
  processing: { label: "Processing", color: "#448AFF", icon: "🔄", description: "Project is being scanned" },
  failed:     { label: "Failed",     color: "#EF5350", icon: "💥", description: "Last scan failed" },
};

const SEV_COLOR: Record<string, string> = { critical: "#EF5350", high: "#FF7043", medium: "#FFA726", low: "#66BB6A" };
const SEV_BG:    Record<string, string> = { critical: "#EF535018", high: "#FF704318", medium: "#FFA72618", low: "#66BB6A18" };

const EVENT_ICON: Record<string, string> = {
  "requirements-generated": "📋",
  "tests-generated":        "🧪",
  "test-run":               "▶️",
  "flows-discovered":       "🔀",
  "endpoints-discovered":   "🔌",
  "auto-heal":              "🩹",
  "suggestions-generated":  "💡",
  "project-created":        "🚀",
  "coverage-milestone":     "📊",
  "re-crawl":               "🔄",
};

// ─── Card wrapper ──────────────────────────────────────────────────────────────

function Card({
  title, children, action, actionLabel, style,
}: {
  title?: string; children: React.ReactNode;
  action?: () => void; actionLabel?: string;
  style?: React.CSSProperties;
}) {
  const { CARD, BDR, TXT, TXT2, P } = useColors();
  return (
    <div style={{
      background: CARD, border: `1px solid ${BDR}`, borderRadius: 14,
      padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12,
      ...style,
    }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: TXT2, textTransform: "uppercase", letterSpacing: "0.09em" }}>
            {title}
          </span>
          {action && (
            <button
              onClick={action}
              style={{
                fontSize: 11, fontWeight: 600, color: P,
                background: "transparent", border: "none", cursor: "pointer", padding: 0,
              }}
            >
              {actionLabel ?? "View all →"}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Stat row ──────────────────────────────────────────────────────────────────

function StatRow({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  const { TXT, TXT2 } = useColors();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 12, color: TXT2 }}>{label}</span>
      <div style={{ textAlign: "right" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: color ?? TXT }}>{value}</span>
        {sub && <span style={{ fontSize: 11, color: TXT2, marginLeft: 4 }}>{sub}</span>}
      </div>
    </div>
  );
}

// ─── Mini coverage bar ─────────────────────────────────────────────────────────

function CoverageBar({ label, pct, color }: { label: string; pct: number | null; color?: string }) {
  const { TXT, TXT2, BDR, P } = useColors();
  const c = color ?? P;
  const val = pct ?? 0;
  const barColor = val >= 80 ? "#4CAF50" : val >= 50 ? "#FF9800" : "#EF5350";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: TXT2 }}>{label}</span>
        {pct !== null
          ? <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{pct}%</span>
          : <span style={{ fontSize: 11, color: TXT2 }}>—</span>
        }
      </div>
      {pct !== null && (
        <div style={{ height: 5, borderRadius: 3, background: BDR, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 3, transition: "width 0.5s" }} />
        </div>
      )}
    </div>
  );
}

// ─── Severity badge ────────────────────────────────────────────────────────────

function SevBadge({ severity }: { severity: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5,
      background: SEV_BG[severity] ?? "#88888815",
      color: SEV_COLOR[severity] ?? "#888",
      textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0,
    }}>{severity}</span>
  );
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function Skeleton({ h = 14, w = "100%" }: { h?: number; w?: string }) {
  const { BDR } = useColors();
  return (
    <div style={{ height: h, width: w, borderRadius: 6, background: BDR, opacity: 0.5 }} />
  );
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function fmtAge(iso?: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0)  return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

function fmtUrl(url: string | null): string {
  if (!url) return "";
  try { return new URL(url).hostname; } catch { return url; }
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface OverviewProps {
  project: any;
  onUpdateProject: (data: any) => void;
  onNavigate?: (tab: TabId) => void;
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Overview({ project, onNavigate }: OverviewProps) {
  const { P, CARD, BDR, TXT, TXT2 } = useColors();
  const isUI = project.type === "ui";

  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState({ open: false, percent: 0, step: "Starting…" });

  // Socket for re-crawl progress
  useEffect(() => {
    socket.emit("join", project.id);
    const onStatus = (d: any) => {
      if (d.progressPercent === undefined) return;
      setProgress({ open: d.progressPercent < 100, percent: d.progressPercent, step: d.progressStep });
    };
    const onProgress = (d: any) => setProgress({ open: true, percent: d.percent, step: d.step });
    const onEvent    = ()       => setProgress({ open: false, percent: 100, step: "Completed" });
    socket.on("project-status",  onStatus);
    socket.on("recrawl-progress", onProgress);
    socket.on("recrawl-event",   onEvent);
    return () => {
      socket.off("project-status",  onStatus);
      socket.off("recrawl-progress", onProgress);
      socket.off("recrawl-event",   onEvent);
    };
  }, [project.id]);

  // Load overview data
  useEffect(() => {
    setLoading(true);
    fetch(`${API}/projects/${project.id}/overview`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [project.id]);

  const recrawl = async () => {
    setProgress({ open: true, percent: 0, step: "Starting…" });
    await fetch(`${API}/projects/${project.id}/recrawl`, { method: "POST" });
  };

  const nav = (tab: TabId) => onNavigate?.(tab);

  // ── Health status ────────────────────────────────────────────────────────────
  const health = HEALTH[data?.healthStatus ?? project.status] ?? HEALTH["at-risk"];
  const coverage    = data?.coverage    ?? {};
  const stability   = data?.stability   ?? {};
  const ai          = data?.aiAutomation ?? {};
  const insights    = data?.topInsights  ?? [];
  const activity    = data?.recentActivity ?? [];
  const nextActions = data?.nextActions ?? [];

  const url = project.type === "api" ? project.swaggerUrl : project.url;

  // ── Quick links ──────────────────────────────────────────────────────────────
  const quickLinks: { label: string; tab: TabId }[] = [
    { label: "RTM",       tab: "rtm" },
    { label: "Tests",     tab: "tests" },
    { label: "Flows",     tab: "flows" },
    { label: "Insights",  tab: "insights" },
    { label: "Settings",  tab: "settings" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: `${theme.spacing.lg} 0` }}>
      <ProgressModal open={progress.open} percent={progress.percent} step={progress.step} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: CARD, border: `1px solid ${BDR}`, borderRadius: 14,
        padding: "18px 22px", display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          {/* Name + badges */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: P }}>
              {project.name || fmtUrl(url) || "Untitled Project"}
            </h2>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
              background: `${P}18`, color: P, letterSpacing: "0.06em",
            }}>{project.type.toUpperCase()}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
              background: `${health.color}15`, color: health.color,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {health.icon} {health.label}
            </span>
          </div>

          {/* URL + env */}
          <div style={{ display: "flex", gap: 12, marginTop: 5, flexWrap: "wrap" }}>
            {url && (
              <span style={{ fontSize: 12, color: TXT2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}
                title={url}>
                {url}
              </span>
            )}
            {project.env && (
              <span style={{ fontSize: 12, color: TXT2 }}>· {project.env}</span>
            )}
            {project.createdAt && (
              <span style={{ fontSize: 12, color: TXT2 }}>· Created {fmtAge(project.createdAt)}</span>
            )}
          </div>

          {/* Quick links */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {quickLinks.map(ql => (
              <button
                key={ql.tab}
                onClick={() => nav(ql.tab)}
                style={{
                  fontSize: 12, fontWeight: 600, padding: "4px 11px", borderRadius: 7,
                  background: "transparent", border: `1px solid ${BDR}`,
                  color: TXT2, cursor: "pointer", transition: "all 0.12s",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = `${P}10`;
                  el.style.color = P;
                  el.style.borderColor = `${P}40`;
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "transparent";
                  el.style.color = TXT2;
                  el.style.borderColor = BDR;
                }}
              >{ql.label}</button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          {isUI && (
            <button
              onClick={recrawl}
              style={{
                padding: "8px 16px", borderRadius: 9, background: P, border: "none",
                color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}
            >↺ Re-Crawl</button>
          )}
          {stability.lastRun && (
            <span style={{ fontSize: 11, color: TXT2 }}>Last run {fmtAge(stability.lastRun)}</span>
          )}
        </div>
      </div>

      {/* ── ROW 1: Health · Coverage · Stability ───────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>

        {/* Health card */}
        <Card title="Project Health">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton h={40} /><Skeleton h={14} /><Skeleton h={14} />
            </div>
          ) : (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: 10,
                background: `${health.color}10`, border: `1px solid ${health.color}25`,
              }}>
                <span style={{ fontSize: 26 }}>{health.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: health.color }}>{health.label}</div>
                  <div style={{ fontSize: 11, color: TXT2, marginTop: 1 }}>{health.description}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                <StatRow
                  label="Open critical insights"
                  value={insights.filter((i: any) => i.severity === "critical").length}
                  color={insights.filter((i: any) => i.severity === "critical").length > 0 ? "#EF5350" : "#4CAF50"}
                />
                <StatRow
                  label="High-risk gaps"
                  value={coverage.highRiskUncovered ?? "—"}
                  color={(coverage.highRiskUncovered ?? 0) > 0 ? "#FF7043" : "#4CAF50"}
                />
                <StatRow
                  label="Project status"
                  value={project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                />
              </div>
            </>
          )}
        </Card>

        {/* Coverage card */}
        <Card title="Coverage" action={() => nav("coverage")} actionLabel="Coverage →">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton h={20} /><Skeleton h={20} /><Skeleton h={20} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <CoverageBar label="Requirements" pct={coverage.requirementsPct} />
              {coverage.endpointsPct !== null && (
                <CoverageBar label="Endpoints" pct={coverage.endpointsPct} />
              )}
              {coverage.flowsPct !== null && (
                <CoverageBar label="UI Flows" pct={coverage.flowsPct} />
              )}
              <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 5 }}>
                <StatRow label="Requirements" value={`${coverage.coveredRequirements ?? 0} / ${coverage.totalRequirements ?? 0}`} />
                {coverage.totalEndpoints > 0 && (
                  <StatRow label="Endpoints discovered" value={coverage.totalEndpoints} />
                )}
                {coverage.highRiskUncovered > 0 && (
                  <StatRow label="High-risk uncovered" value={coverage.highRiskUncovered} color="#EF5350" />
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Stability card */}
        <Card title="Stability" action={() => nav("tests")} actionLabel="Tests →">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton h={40} /><Skeleton h={14} /><Skeleton h={14} />
            </div>
          ) : !stability.hasResults ? (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🧪</div>
              <div style={{ fontSize: 12, color: TXT2 }}>No test runs yet</div>
              <button
                onClick={() => nav("tests")}
                style={{
                  marginTop: 10, padding: "6px 14px", borderRadius: 8, border: "none",
                  background: P, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >Run tests</button>
            </div>
          ) : (
            <>
              {/* Pass rate ring */}
              <div style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "10px 14px", borderRadius: 10,
                background: stability.passRate >= 80 ? "#4CAF5010" : stability.passRate >= 50 ? "#FF980010" : "#EF535010",
                border: `1px solid ${stability.passRate >= 80 ? "#4CAF5025" : stability.passRate >= 50 ? "#FF980025" : "#EF535025"}`,
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 22, fontWeight: 800,
                    color: stability.passRate >= 80 ? "#4CAF50" : stability.passRate >= 50 ? "#FF9800" : "#EF5350",
                  }}>
                    {stability.passRate ?? "—"}{stability.passRate !== null ? "%" : ""}
                  </div>
                  <div style={{ fontSize: 10, color: TXT2, marginTop: 1 }}>pass rate</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ fontSize: 12, color: TXT }}>
                    <strong>{stability.totalTests}</strong> spec files
                  </div>
                  <div style={{ fontSize: 12, color: "#EF5350" }}>
                    <strong>{stability.failedTests}</strong> failing
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <StatRow
                  label="Flaky tests"
                  value={stability.flakyCount ?? 0}
                  color={(stability.flakyCount ?? 0) > 0 ? "#FF9800" : "#4CAF50"}
                />
                <StatRow label="Last run" value={fmtAge(stability.lastRun)} />
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── ROW 2: Top Insights · AI & Automation ──────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Top Insights */}
        <Card title="Top Insights" action={() => nav("insights")} actionLabel="All insights →">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton h={48} /><Skeleton h={48} /><Skeleton h={48} />
            </div>
          ) : insights.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🎉</div>
              <div style={{ fontSize: 12, color: TXT2 }}>No open insights — project looks healthy</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {insights.map((ins: any) => (
                <div
                  key={ins.id}
                  onClick={() => nav("insights")}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 12px", borderRadius: 9,
                    background: `${SEV_COLOR[ins.severity] ?? "#888"}08`,
                    border: `1px solid ${SEV_COLOR[ins.severity] ?? "#888"}20`,
                    cursor: "pointer", transition: "background 0.12s",
                    borderLeft: `3px solid ${SEV_COLOR[ins.severity] ?? "#888"}`,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${SEV_COLOR[ins.severity] ?? "#888"}14`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${SEV_COLOR[ins.severity] ?? "#888"}08`; }}
                >
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{ins.type === "risk-hotspot" ? "🔥" : ins.type === "coverage-gap" ? "📭" : ins.type === "endpoint-risk" ? "🔓" : ins.type === "flaky-cluster" ? "🌀" : ins.type === "auto-heal-opportunity" ? "🩹" : ins.type === "quality-debt" ? "📉" : "💡"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: TXT, lineHeight: 1.4,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ins.title}
                    </div>
                    <div style={{ fontSize: 11, color: TXT2, marginTop: 1 }}>{ins.area}</div>
                  </div>
                  <SevBadge severity={ins.severity} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* AI & Automation */}
        <Card title="AI & Automation">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton h={60} /><Skeleton h={14} /><Skeleton h={14} /><Skeleton h={14} />
            </div>
          ) : (
            <>
              {/* Heal summary */}
              <div
                onClick={() => nav("autoheal")}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 10,
                  background: ai.pendingHeals > 0 ? "#FF980010" : "#4CAF5010",
                  border: `1px solid ${ai.pendingHeals > 0 ? "#FF980025" : "#4CAF5025"}`,
                  cursor: "pointer", transition: "opacity 0.12s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                <span style={{ fontSize: 22 }}>🩹</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TXT }}>
                    {ai.pendingHeals > 0
                      ? `${ai.pendingHeals} heal patch${ai.pendingHeals > 1 ? "es" : ""} ready`
                      : `${ai.appliedHeals ?? 0} heals applied`}
                  </div>
                  <div style={{ fontSize: 11, color: TXT2, marginTop: 1 }}>
                    {ai.healSuccessRate !== null ? `${ai.healSuccessRate}% success rate` : "No heal data yet"} · Open Auto-Heal →
                  </div>
                </div>
              </div>

              {/* Suggestions summary */}
              <div
                onClick={() => nav("suggestions")}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 10,
                  background: ai.pendingSuggestions > 0 ? `${P}0a` : "#4CAF5010",
                  border: `1px solid ${ai.pendingSuggestions > 0 ? `${P}25` : "#4CAF5025"}`,
                  cursor: "pointer", transition: "opacity 0.12s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.8"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
              >
                <span style={{ fontSize: 22 }}>💡</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TXT }}>
                    {ai.pendingSuggestions > 0
                      ? `${ai.pendingSuggestions} suggestion${ai.pendingSuggestions > 1 ? "s" : ""} pending review`
                      : "All suggestions reviewed"}
                  </div>
                  <div style={{ fontSize: 11, color: TXT2, marginTop: 1 }}>
                    {ai.appliedSuggestions ?? 0} applied · {ai.totalSuggestions ?? 0} total · Open Suggestions →
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                <StatRow label="Spec files" value={coverage.specFilesFound ?? 0} />
                <StatRow label="Total requirements" value={coverage.totalRequirements ?? "—"} />
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── ROW 3: Recent Activity · Next Actions ──────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* Recent Activity */}
        <Card title="Recent Activity" action={() => nav("history")} actionLabel="Full history →">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1,2,3,4].map(i => <Skeleton key={i} h={32} />)}
            </div>
          ) : activity.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: TXT2, fontSize: 12 }}>
              No activity recorded yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {activity.map((ev: any, i: number) => (
                <div key={ev.id ?? i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "8px 0",
                  borderBottom: i < activity.length - 1 ? `1px solid ${BDR}` : "none",
                }}>
                  <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>
                    {EVENT_ICON[ev.eventType] ?? "•"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: TXT, fontWeight: 500, lineHeight: 1.4,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.summary}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: TXT2 }}>{fmtAge(ev.timestamp)}</span>
                      {ev.actorType && (
                        <span style={{ fontSize: 10, color: TXT2,
                          background: BDR, padding: "0px 5px", borderRadius: 4 }}>
                          {ev.actorType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Next Actions */}
        <Card title="Next Actions">
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[1,2,3].map(i => <Skeleton key={i} h={44} />)}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {nextActions.map((action: any, i: number) => {
                const priorityColor = action.priority === "high" ? "#EF5350" : action.priority === "medium" ? "#FF9800" : TXT2;
                return (
                  <div
                    key={i}
                    onClick={() => nav(action.tab as TabId)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "10px 13px", borderRadius: 9, cursor: "pointer",
                      background: `${P}07`, border: `1px solid ${P}18`,
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${P}14`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${P}07`; }}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: priorityColor, flexShrink: 0,
                      boxShadow: `0 0 5px ${priorityColor}88`,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: P }}>{action.label}</div>
                      <div style={{ fontSize: 11, color: TXT2, marginTop: 1 }}>{action.description}</div>
                    </div>
                    <span style={{ color: P, fontSize: 13, flexShrink: 0 }}>→</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
