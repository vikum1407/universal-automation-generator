import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useColors } from "@/hooks/useColors";
import type { TimelineEvent, TimelineSummary, TimelineProject, TimelineFilters } from "@/api/timeline";
import {
  fetchTimeline, fetchTimelineSummary, fetchTimelineProjects,
  EVENT_TYPE_ICON, EVENT_TYPE_LABEL, SEVERITY_COLOR, SEVERITY_BG,
  PROJECT_TYPE_COLOR, timeRangeToFrom,
} from "@/api/timeline";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function groupByDay(events: TimelineEvent[]) {
  const groups = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    const key = fmtDate(e.timestamp);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return groups;
}

const TIME_RANGES = [
  { label: "All time", value: "" },
  { label: "Last 24h", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

const SEVERITY_LEVELS = ["all", "info", "low", "medium", "high", "critical"];

const EVENT_TYPES = [
  "all",
  "scan-completed", "tests-generated", "tests-executed",
  "auto-heal-applied", "suggestions-applied", "coverage-milestone",
  "risk-spike", "incident-detected",
];

// ── Shared components ──────────────────────────────────────────────────────

function SeverityBadge({ sev, small }: { sev: string; small?: boolean }) {
  const c = SEVERITY_COLOR[sev as any] ?? "#90A4AE";
  return (
    <span style={{
      padding: small ? "1px 6px" : "2px 9px",
      borderRadius: 5, fontSize: small ? 9 : 10, fontWeight: 700,
      background: `${c}22`, color: c, textTransform: "uppercase",
    }}>{sev}</span>
  );
}

function MetricChip({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 3,
      padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
      background: `${color}18`, color,
    }}>
      {icon} {value} {label}
    </span>
  );
}

function ProjectTypeBadge({ type }: { type: string }) {
  const c = PROJECT_TYPE_COLOR[type] ?? "#90A4AE";
  return (
    <span style={{
      padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700,
      background: `${c}22`, color: c, textTransform: "uppercase",
    }}>{type}</span>
  );
}

// ── Summary bar ────────────────────────────────────────────────────────────

function SummaryBar({ summary }: { summary: TimelineSummary }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, dark } = useColors();

  const tiles = [
    { icon: "🗂️", label: "Active Projects", value: summary.projectsActive, sub: "in workspace", color: P },
    { icon: "🔍", label: "Scans (7d)", value: summary.scansLast7d, sub: `${summary.scansLast24h} in last 24h`, color: "#42A5F5" },
    { icon: "▶️", label: "Runs (7d)", value: summary.runsLast7d, sub: `${summary.runsLast24h} in last 24h`, color: "#66BB6A" },
    { icon: "🔧", label: "Auto-Heals (7d)", value: summary.autoHealsLast7d, sub: "AI-applied fixes", color: "#7B2FF7" },
    { icon: "💡", label: "Suggestions (7d)", value: summary.suggestionsLast7d, sub: "AI improvements", color: "#26C6DA" },
    { icon: "🔥", label: "Risk Events", value: summary.riskEvents, sub: `${summary.criticalEvents} critical`, color: summary.riskEvents > 0 ? "#EF5350" : "#66BB6A" },
  ];

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        {tiles.map(t => (
          <div key={t.label} style={{
            flex: "1 1 110px", minWidth: 0, padding: "14px 16px", borderRadius: 14,
            background: surface, border: `1px solid ${border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{t.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: t.color, lineHeight: 1 }}>{t.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: text, marginTop: 4 }}>{t.label}</div>
            <div style={{ fontSize: 10, color: textLight, marginTop: 2 }}>{t.sub}</div>
          </div>
        ))}
      </div>

      {/* Coverage trend mini bar */}
      {summary.coverageTrend.length > 0 && (
        <div style={{
          padding: "14px 16px", borderRadius: 14, background: surface,
          border: `1px solid ${border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
            Coverage Trend — by Project
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {summary.coverageTrend.map(p => {
              const delta = p.after - p.before;
              const c = delta > 0 ? "#66BB6A" : delta < 0 ? "#EF5350" : "#90A4AE";
              return (
                <div key={p.projectId} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 130, fontSize: 11, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {p.label}
                  </div>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: dark ? "#333" : "#eee", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${p.after}%`, background: c, borderRadius: 3, transition: "width 0.4s" }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: c, width: 52, textAlign: "right", flexShrink: 0 }}>
                    {p.after}% {delta !== 0 && <span style={{ fontSize: 9 }}>({delta > 0 ? "+" : ""}{delta}%)</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Filter bar ─────────────────────────────────────────────────────────────

interface ActiveFilters {
  timeRange: string;
  projectId: string;
  type: string;
  severity: string;
  search: string;
}

function FilterBar({ filters, projects, onChange, total }: {
  filters: ActiveFilters;
  projects: TimelineProject[];
  onChange: (f: Partial<ActiveFilters>) => void;
  total: number;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight } = useColors();

  const ss = { padding: "7px 10px", borderRadius: 8, border: `1px solid ${border}`, background: surface, color: text, fontSize: 12 };

  const hasFilter = filters.timeRange !== "" || filters.projectId !== "all" ||
    filters.type !== "all" || filters.severity !== "all" || filters.search !== "";

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
      <input
        placeholder="Search events…" value={filters.search}
        onChange={e => onChange({ search: e.target.value })}
        style={{ flex: "1 1 160px", ...ss, outline: "none" }}
      />
      <select value={filters.timeRange} onChange={e => onChange({ timeRange: e.target.value })} style={ss}>
        {TIME_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      <select value={filters.projectId} onChange={e => onChange({ projectId: e.target.value })} style={ss}>
        <option value="all">All projects ({projects.length})</option>
        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={filters.type} onChange={e => onChange({ type: e.target.value })} style={ss}>
        <option value="all">All event types</option>
        {EVENT_TYPES.slice(1).map(t => <option key={t} value={t}>{EVENT_TYPE_LABEL[t as any] ?? t}</option>)}
      </select>
      <select value={filters.severity} onChange={e => onChange({ severity: e.target.value })} style={ss}>
        <option value="all">All severities</option>
        {SEVERITY_LEVELS.slice(1).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
      </select>
      {hasFilter && (
        <button onClick={() => onChange({ timeRange: "", projectId: "all", type: "all", severity: "all", search: "" })}
          style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#EF535022", color: "#EF5350", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Clear
        </button>
      )}
      <span style={{ fontSize: 12, color: textLight, whiteSpace: "nowrap" }}>{total} event{total !== 1 ? "s" : ""}</span>
    </div>
  );
}

// ── Event card ─────────────────────────────────────────────────────────────

function EventCard({ event, selected, onClick }: {
  event: TimelineEvent;
  selected: boolean;
  onClick: () => void;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, dark } = useColors();

  const sevColor = SEVERITY_COLOR[event.severity] ?? "#90A4AE";

  const metrics = event.metrics ?? {};

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px",
        borderRadius: 12, cursor: "pointer", transition: "background 0.12s",
        background: selected
          ? dark ? "#1e1230" : "#f0eaff"
          : surface,
        border: `1px solid ${selected ? P : border}`,
        borderLeft: `4px solid ${sevColor}`,
        marginBottom: 8,
        boxShadow: selected ? `0 0 0 1px ${P}33` : "0 2px 8px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = dark ? "#1a1a2e" : "#fafafa"; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = surface; }}
    >
      {/* Type icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: SEVERITY_BG[event.severity] ?? "#90A4AE18",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, border: `1px solid ${sevColor}30`,
      }}>
        {EVENT_TYPE_ICON[event.type] ?? "📌"}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: badges + time */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginBottom: 4 }}>
          <SeverityBadge sev={event.severity} small />
          <span style={{
            padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700,
            background: "#42A5F518", color: "#42A5F5",
          }}>
            {EVENT_TYPE_LABEL[event.type] ?? event.type}
          </span>
          <ProjectTypeBadge type={event.projectType} />
          <span style={{ marginLeft: "auto", fontSize: 10, color: textLight, whiteSpace: "nowrap" }}>
            {fmtTime(event.timestamp)}
          </span>
        </div>

        {/* Row 2: title */}
        <div style={{ fontSize: 13, fontWeight: 600, color: text, lineHeight: 1.4, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.title}
        </div>

        {/* Row 3: project name + metric chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: P, fontWeight: 600 }}>{event.projectName}</span>
          {metrics.testsAdded != null && metrics.testsAdded > 0 && (
            <MetricChip icon="🧪" value={`+${metrics.testsAdded}`} label="tests" color="#42A5F5" />
          )}
          {metrics.testsHealed != null && metrics.testsHealed > 0 && (
            <MetricChip icon="🔧" value={`+${metrics.testsHealed}`} label="healed" color="#7B2FF7" />
          )}
          {metrics.coverageDelta != null && metrics.coverageDelta > 0 && (
            <MetricChip icon="📈" value={`+${metrics.coverageDelta}%`} label="coverage" color="#66BB6A" />
          )}
          {metrics.failures != null && metrics.failures > 0 && (
            <MetricChip icon="❌" value={metrics.failures} label="fail" color="#EF5350" />
          )}
          {metrics.riskDelta != null && metrics.riskDelta > 0 && (
            <MetricChip icon="🔥" value={`+${metrics.riskDelta}`} label="risk" color="#EF5350" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Timeline stream ────────────────────────────────────────────────────────

function TimelineStream({ events, selectedId, onSelect, loading }: {
  events: TimelineEvent[];
  selectedId: string | null;
  onSelect: (e: TimelineEvent) => void;
  loading: boolean;
}) {
  const { BDR: border, TXT2: textLight, P } = useColors();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 80, color: textLight, fontSize: 13, flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 32 }}>⏳</div>
        Loading timeline…
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 80, color: textLight, fontSize: 13 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
        No timeline events match your filters.
      </div>
    );
  }

  const groups = groupByDay(events);

  return (
    <div>
      {Array.from(groups.entries()).map(([day, dayEvents]) => (
        <div key={day} style={{ marginBottom: 6 }}>
          {/* Day header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "6px 0", marginBottom: 8,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
              {day}
            </span>
            <div style={{ flex: 1, height: 1, background: border, opacity: 0.5 }} />
            <span style={{ fontSize: 10, color: textLight, whiteSpace: "nowrap" }}>{dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Cards */}
          {dayEvents.map(evt => (
            <EventCard
              key={evt.id}
              event={evt}
              selected={evt.id === selectedId}
              onClick={() => onSelect(evt)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Event detail drawer ────────────────────────────────────────────────────

function EventDetailDrawer({ event, onClose, onGoToProject }: {
  event: TimelineEvent | null;
  onClose: () => void;
  onGoToProject: (id: string) => void;
}) {
  if (!event) return null;

  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: pageBg, dark } = useColors();
  const bg = dark ? pageBg : "#f5f5f8";

  const sevColor = SEVERITY_COLOR[event.severity] ?? "#90A4AE";
  const metrics = event.metrics ?? {};

  const AI_INSIGHTS: Partial<Record<string, string>> = {
    "scan-completed": "This scan gave Qlitz full visibility into the application surface. Coverage calculations, RTM generation, and test scaffolding are now possible for all discovered artifacts.",
    "tests-generated": "AI used discovered flows and endpoints as templates, applying historical test patterns to maximize edge case coverage while minimizing duplication.",
    "tests-executed": metrics.failures
      ? `${metrics.failures} failures detected. AI recommends running Auto-Heal scan to identify selector changes or timing issues before the next deployment.`
      : "All tests passed. The suite is healthy and ready for release gate validation.",
    "auto-heal-applied": `AI analyzed DOM change patterns and selector drift to generate ${metrics.testsHealed ?? 0} targeted patches. Each patch was validated against the current application state before being applied.`,
    "suggestions-applied": "AI identified uncovered code paths and generated targeted test improvements aligned with requirement risk scores.",
    "coverage-milestone": "Coverage is increasing. AI suggests prioritizing the remaining uncovered high-risk endpoints to maximize the safety net before the next release.",
    "risk-spike": "High-priority requirements lack test coverage. These represent blast-radius areas — failures here are likely to impact user-facing features. Immediate test generation is recommended.",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.18)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 520, zIndex: 50,
        background: surface, borderLeft: `1px solid ${border}`,
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 28px rgba(0,0,0,0.13)",
      }}>
        {/* Header */}
        <div style={{
          padding: "16px 20px 14px", borderBottom: `1px solid ${border}`, flexShrink: 0,
          borderTop: `4px solid ${sevColor}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <SeverityBadge sev={event.severity} />
              <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: "#42A5F518", color: "#42A5F5" }}>
                {EVENT_TYPE_LABEL[event.type] ?? event.type}
              </span>
              <ProjectTypeBadge type={event.projectType} />
            </div>
            <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 17, color: textLight }}>✕</button>
          </div>

          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: text, lineHeight: 1.4 }}>{event.title}</h3>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: P, fontWeight: 600 }}>{event.projectName}</span>
            <span style={{ fontSize: 10, color: textLight }}>
              {new Date(event.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
            </span>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Jump to project */}
          <button
            onClick={() => { onGoToProject(event.projectId); onClose(); }}
            style={{
              padding: "10px 16px", borderRadius: 10,
              border: `1px solid ${P}44`,
              background: `${P}10`,
              color: P, fontSize: 12, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 16 }}>🗂️</span>
            <span>Open project: {event.projectName}</span>
            <span style={{ marginLeft: "auto" }}>→</span>
          </button>

          {/* Description */}
          {event.description && (
            <div style={{ fontSize: 12, color: text, lineHeight: 1.7, padding: "10px 12px", borderRadius: 8, background: bg }}>
              {event.description}
            </div>
          )}

          {/* Metrics grid */}
          {Object.values(metrics).some(v => v != null && v !== 0) && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Metrics</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {metrics.testsAdded != null && metrics.testsAdded > 0 && (
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: bg }}>
                    <div style={{ fontSize: 9, color: textLight, fontWeight: 700, textTransform: "uppercase" }}>Tests Added</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#42A5F5", marginTop: 2 }}>+{metrics.testsAdded}</div>
                  </div>
                )}
                {metrics.testsHealed != null && metrics.testsHealed > 0 && (
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: bg }}>
                    <div style={{ fontSize: 9, color: textLight, fontWeight: 700, textTransform: "uppercase" }}>Tests Healed</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#7B2FF7", marginTop: 2 }}>+{metrics.testsHealed}</div>
                  </div>
                )}
                {metrics.failures != null && (
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: bg }}>
                    <div style={{ fontSize: 9, color: textLight, fontWeight: 700, textTransform: "uppercase" }}>Failures</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: metrics.failures > 0 ? "#EF5350" : "#66BB6A", marginTop: 2 }}>{metrics.failures}</div>
                  </div>
                )}
                {metrics.coverageDelta != null && metrics.coverageDelta !== 0 && (
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: bg }}>
                    <div style={{ fontSize: 9, color: textLight, fontWeight: 700, textTransform: "uppercase" }}>Coverage Delta</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: metrics.coverageDelta > 0 ? "#66BB6A" : "#EF5350", marginTop: 2 }}>
                      {metrics.coverageDelta > 0 ? "+" : ""}{metrics.coverageDelta}%
                    </div>
                  </div>
                )}
                {metrics.flakinessDelta != null && metrics.flakinessDelta !== 0 && (
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: bg }}>
                    <div style={{ fontSize: 9, color: textLight, fontWeight: 700, textTransform: "uppercase" }}>Flakiness Change</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: metrics.flakinessDelta < 0 ? "#66BB6A" : "#EF5350", marginTop: 2 }}>
                      {metrics.flakinessDelta}
                    </div>
                  </div>
                )}
                {metrics.riskDelta != null && metrics.riskDelta > 0 && (
                  <div style={{ padding: "10px 12px", borderRadius: 8, background: bg }}>
                    <div style={{ fontSize: 9, color: textLight, fontWeight: 700, textTransform: "uppercase" }}>Risk Score Delta</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#EF5350", marginTop: 2 }}>+{metrics.riskDelta}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {event.tags.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {event.tags.map(tag => (
                <span key={tag} style={{
                  padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600,
                  background: dark ? "#2a2a3a" : "#f0f0f8",
                  color: textLight, border: `1px solid ${border}`,
                }}>#{tag}</span>
              ))}
            </div>
          )}

          {/* AI Insight */}
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: dark ? "#13082a" : "#faf5ff",
            border: `1px solid ${dark ? "#3a1a6a" : "#e8d5ff"}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: P, textTransform: "uppercase", marginBottom: 6 }}>
              🧠 AI Insight
            </div>
            <div style={{ fontSize: 12, color: text, lineHeight: 1.7 }}>
              {AI_INSIGHTS[event.type] ?? "This event was recorded as part of the cross-project quality evolution tracking. Use the project link above to view detailed context."}
            </div>
          </div>

          {/* Severity context */}
          {(event.severity === "high" || event.severity === "critical") && (
            <div style={{
              padding: "10px 12px", borderRadius: 8,
              background: dark ? "#1a0000" : "#fff5f5",
              border: `1px solid ${dark ? "#3a0000" : "#FFCDD2"}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#EF5350", textTransform: "uppercase", marginBottom: 5 }}>
                ⚠️ Action Required
              </div>
              <div style={{ fontSize: 12, color: text, lineHeight: 1.6 }}>
                {event.severity === "critical"
                  ? "This is a critical event. Immediate attention is required — check the project for active failures or unresolved incidents."
                  : "This high-severity event may require attention. Review the project's Auto-Heal and Suggestions tabs for recommended actions."}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function ExecutionTimeline() {
  const navigate = useNavigate();
  const { TXT2: textLight, P } = useColors();

  const [summary, setSummary] = useState<TimelineSummary | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [projects, setProjects] = useState<TimelineProject[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const [filters, setFilters] = useState<ActiveFilters>({
    timeRange: "", projectId: "all", type: "all", severity: "all", search: "",
  });

  const load = useCallback(async (f: ActiveFilters) => {
    setLoading(true);
    try {
      const apiFilters: any = {
        from: timeRangeToFrom(f.timeRange),
        projectId: f.projectId !== "all" ? f.projectId : undefined,
        type: f.type !== "all" ? f.type : undefined,
        severity: f.severity !== "all" ? f.severity : undefined,
        limit: 150,
      };
      const res = await fetchTimeline(apiFilters);
      let evts = res.events ?? [];
      if (f.search) {
        const q = f.search.toLowerCase();
        evts = evts.filter(e =>
          e.title.toLowerCase().includes(q) ||
          e.projectName.toLowerCase().includes(q) ||
          (e.description ?? "").toLowerCase().includes(q)
        );
      }
      setEvents(evts);
      setTotal(evts.length);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchTimelineSummary().then(setSummary).catch(() => {}),
      fetchTimelineProjects().then(setProjects).catch(() => {}),
      load(filters),
    ]);
  }, []);

  const handleFilterChange = (patch: Partial<ActiveFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setSelectedEvent(null);
    load(next);
  };

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: P }}>
          Timeline
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: textLight }}>
          Cross-project control tower — scans, runs, AI actions, coverage changes, and risk events across your entire workspace.
        </p>
      </div>

      {/* Summary */}
      {summary && <SummaryBar summary={summary} />}

      {/* Filters */}
      <FilterBar filters={filters} projects={projects} onChange={handleFilterChange} total={total} />

      {/* Stream */}
      <TimelineStream
        events={events}
        selectedId={selectedEvent?.id ?? null}
        onSelect={e => setSelectedEvent(prev => prev?.id === e.id ? null : e)}
        loading={loading}
      />

      {/* Detail drawer */}
      {selectedEvent && (
        <EventDetailDrawer
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onGoToProject={id => navigate(`/projects/${id}`)}
        />
      )}
    </div>
  );
}
