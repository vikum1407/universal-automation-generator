import { useEffect, useState, useCallback } from "react";
import { useColors } from "@/hooks/useColors";
import type { HistoryEvent, HistorySummary, HistoryFilters } from "@/api/history";
import {
  fetchHistory, fetchHistorySummary,
  ENTITY_ICON, ENTITY_LABEL, ENTITY_COLOR, ENTITY_TAB_LINK,
  EVENT_COLOR, EVENT_LABEL, ACTOR_COLOR, ACTOR_LABEL,
} from "@/api/history";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDateGroup(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function groupByDay(events: HistoryEvent[]) {
  const groups = new Map<string, HistoryEvent[]>();
  for (const e of events) {
    const key = fmtDateGroup(e.timestamp);
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

const ENTITY_TYPES = [
  "all", "requirement", "test", "flow", "endpoint",
  "rtm", "coverage", "suggestion", "auto-heal", "replay-run", "config", "project",
];

const EVENT_TYPES = [
  "all", "created", "updated", "deleted",
  "run-started", "run-completed", "healed", "suggested", "applied",
  "rejected", "coverage-changed", "risk-changed",
];

const ACTOR_TYPES = ["all", "user", "system", "ai", "ci"];
const IMPACT_TYPES = ["all", "coverage", "risk", "stability"];

function timeRangeToFrom(range: string): string | undefined {
  if (!range) return undefined;
  const now = Date.now();
  const map: Record<string, number> = { "24h": 86_400_000, "7d": 7 * 86_400_000, "30d": 30 * 86_400_000, "90d": 90 * 86_400_000 };
  return new Date(now - (map[range] ?? 0)).toISOString();
}

// ── Shared components ─────────────────────────────────────────────────────────

function Badge({ label, color, small }: { label: string; color: string; small?: boolean }) {
  return (
    <span style={{
      padding: small ? "1px 5px" : "2px 8px",
      borderRadius: 5, fontSize: small ? 9 : 10, fontWeight: 700,
      background: `${color}22`, color,
    }}>{label}</span>
  );
}

function ImpactBadges({ metadata }: { metadata?: Record<string, any> }) {
  const impact = metadata?.impact ?? {};
  return (
    <span style={{ display: "flex", gap: 4 }}>
      {impact.coverage && <Badge label="Coverage" color="#FF9800" small />}
      {impact.risk && <Badge label="Risk" color="#EF5350" small />}
      {impact.stability && <Badge label="Stability" color="#7B2FF7" small />}
    </span>
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function SummaryBar({ summary }: { summary: HistorySummary }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();

  const tiles = [
    { icon: "📅", label: "Last 24h", value: summary.last24h, sub: `${summary.last7d} in 7 days`, color: P },
    { icon: "🤖", label: "AI-Driven", value: summary.aiDriven, sub: `of ${summary.total} total`, color: "#7B2FF7" },
    { icon: "👤", label: "Manual", value: summary.userDriven, sub: "user actions", color: "#42A5F5" },
    { icon: "📈", label: "Coverage Impact", value: summary.coverageImpacting, sub: "events", color: "#FF9800" },
    { icon: "🔥", label: "Risk Impact", value: summary.riskImpacting, sub: "events", color: "#EF5350" },
    { icon: "🔧", label: "Stability Impact", value: summary.stabilityImpacting, sub: "events", color: "#7B2FF7" },
  ];

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
      {tiles.map(t => (
        <div key={t.label} style={{
          flex: "1 1 110px", minWidth: 0, padding: "14px 16px", borderRadius: 14,
          background: surface, border: `1px solid ${border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: 18, marginBottom: 5 }}>{t.icon}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: t.color, lineHeight: 1 }}>{t.value}</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: text, marginTop: 4 }}>{t.label}</div>
          <div style={{ fontSize: 10, color: textLight, marginTop: 2 }}>{t.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

interface ActiveFilters {
  timeRange: string;
  entityType: string;
  eventType: string;
  actorType: string;
  impact: string;
  search: string;
}

function FilterBar({ filters, onChange, total }: {
  filters: ActiveFilters;
  onChange: (f: Partial<ActiveFilters>) => void;
  total: number;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();

  const sel = (val: string, key: keyof ActiveFilters) => (
    <select value={val} onChange={e => onChange({ [key]: e.target.value })}
      style={{ padding: "7px 10px", borderRadius: 8, border: `1px solid ${border}`, background: dark ? surface : "#fff", color: text, fontSize: 12 }}>
      {key === "timeRange" && TIME_RANGES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
      {key === "entityType" && ENTITY_TYPES.map(t => <option key={t} value={t}>{t === "all" ? "All entities" : ENTITY_LABEL[t as any] ?? t}</option>)}
      {key === "eventType" && EVENT_TYPES.map(t => <option key={t} value={t}>{t === "all" ? "All events" : EVENT_LABEL[t as any] ?? t}</option>)}
      {key === "actorType" && ACTOR_TYPES.map(t => <option key={t} value={t}>{t === "all" ? "All actors" : ACTOR_LABEL[t] ?? t}</option>)}
      {key === "impact" && IMPACT_TYPES.map(t => <option key={t} value={t}>{t === "all" ? "All impact" : `${t.charAt(0).toUpperCase()}${t.slice(1)} impact`}</option>)}
    </select>
  );

  const hasActiveFilter = filters.timeRange !== "" || filters.entityType !== "all" ||
    filters.eventType !== "all" || filters.actorType !== "all" || filters.impact !== "all" || filters.search !== "";

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
      <input
        placeholder="Search events…"
        value={filters.search}
        onChange={e => onChange({ search: e.target.value })}
        style={{ flex: "1 1 160px", padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`, background: dark ? surface : "#fff", color: text, fontSize: 12, outline: "none" }}
      />
      {sel(filters.timeRange, "timeRange")}
      {sel(filters.entityType, "entityType")}
      {sel(filters.eventType, "eventType")}
      {sel(filters.actorType, "actorType")}
      {sel(filters.impact, "impact")}
      {hasActiveFilter && (
        <button onClick={() => onChange({ timeRange: "", entityType: "all", eventType: "all", actorType: "all", impact: "all", search: "" })}
          style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#EF535022", color: "#EF5350", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Clear
        </button>
      )}
      <span style={{ fontSize: 12, color: textLight, whiteSpace: "nowrap" }}>{total} event{total !== 1 ? "s" : ""}</span>
    </div>
  );
}

// ── Event item ────────────────────────────────────────────────────────────────

function EventItem({ event, selected, onClick }: {
  event: HistoryEvent;
  selected: boolean;
  onClick: () => void;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();

  const entityColor = ENTITY_COLOR[event.entityType] ?? "#90A4AE";
  const eventColor = EVENT_COLOR[event.eventType] ?? "#90A4AE";
  const actorColor = ACTOR_COLOR[event.actorType] ?? "#90A4AE";

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px",
        borderRadius: 10, cursor: "pointer", transition: "background 0.12s",
        background: selected ? (`${P}15`) : "transparent",
        borderLeft: `3px solid ${selected ? P : "transparent"}`,
        marginBottom: 2,
      }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = bg; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      {/* Timeline dot */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 2,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: `${entityColor}18`, border: `1.5px solid ${entityColor}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, flexShrink: 0,
        }}>
          {ENTITY_ICON[event.entityType] ?? "📌"}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
          <span style={{
            padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700,
            background: `${eventColor}22`, color: eventColor, flexShrink: 0,
          }}>
            {EVENT_LABEL[event.eventType] ?? event.eventType}
          </span>
          <span style={{
            padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700,
            background: `${entityColor}15`, color: entityColor, flexShrink: 0,
          }}>
            {ENTITY_LABEL[event.entityType] ?? event.entityType}
          </span>
          <ImpactBadges metadata={event.metadata} />
        </div>
        <div style={{ fontSize: 12, color: text, fontWeight: 500, lineHeight: 1.4, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {event.summary}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: textLight }}>{fmtTime(event.timestamp)}</span>
          <span style={{
            padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700,
            background: `${actorColor}18`, color: actorColor,
          }}>
            {ACTOR_LABEL[event.actorType] ?? event.actorType}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, background: border, alignSelf: "stretch", opacity: 0.4, display: selected ? "none" : undefined }} />
    </div>
  );
}

// ── Event stream (day-grouped timeline) ───────────────────────────────────────

function EventStream({ events, selectedId, onSelect, loading }: {
  events: HistoryEvent[];
  selectedId: string | null;
  onSelect: (e: HistoryEvent) => void;
  loading: boolean;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60, color: textLight, fontSize: 13 }}>
        Loading history…
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: textLight, fontSize: 13 }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
        No events match your filters.
      </div>
    );
  }

  const groups = groupByDay(events);

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${border}`, background: surface, overflow: "hidden" }}>
      {Array.from(groups.entries()).map(([day, dayEvents]) => (
        <div key={day}>
          {/* Day header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 16px",
            background: dark ? "#1a1a2e" : "#f8f4ff",
            borderBottom: `1px solid ${border}`,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: P, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {day}
            </span>
            <div style={{ flex: 1, height: 1, background: border, opacity: 0.5 }} />
            <span style={{ fontSize: 10, color: textLight }}>{dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Events */}
          <div style={{ padding: "6px 4px" }}>
            {dayEvents.map(evt => (
              <EventItem
                key={evt.id}
                event={evt}
                selected={evt.id === selectedId}
                onClick={() => onSelect(evt)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Change diff ───────────────────────────────────────────────────────────────

function ChangeDiff({ before, after }: { before: any; after: any }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();

  if (!before && !after) return null;

  const codeSx = (color: string): React.CSSProperties => ({
    padding: "8px 12px", borderRadius: 8,
    background: dark ? `${color}0d` : `${color}0a`,
    border: `1px solid ${color}30`,
    fontFamily: "monospace", fontSize: 11,
    color: text, whiteSpace: "pre-wrap", wordBreak: "break-word",
    flex: 1, minWidth: 0,
  });

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
        Change Diff
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {before && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#EF5350", marginBottom: 4 }}>Before</div>
            <pre style={codeSx("#EF5350")}>{JSON.stringify(before, null, 2)}</pre>
          </div>
        )}
        {after && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#66BB6A", marginBottom: 4 }}>After</div>
            <pre style={codeSx("#66BB6A")}>{JSON.stringify(after, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Event detail panel ────────────────────────────────────────────────────────

function EventDetailPanel({ event, allEvents, onClose, onNavigate }: {
  event: HistoryEvent | null;
  allEvents: HistoryEvent[];
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}) {
  if (!event) return null;

  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();

  const entityColor = ENTITY_COLOR[event.entityType] ?? "#90A4AE";
  const eventColor = EVENT_COLOR[event.eventType] ?? "#90A4AE";
  const actorColor = ACTOR_COLOR[event.actorType] ?? "#90A4AE";

  const related = allEvents
    .filter(e => e.id !== event.id && (e.entityId === event.entityId || e.entityType === event.entityType))
    .slice(0, 5);

  const targetTab = ENTITY_TAB_LINK[event.entityType];
  const hasDiff = event.details?.before != null || event.details?.after != null;
  const hasImpact = event.metadata?.impact && Object.values(event.metadata.impact).some(Boolean);

  const AI_REASONING: Record<string, string> = {
    "requirement": "AI analyzed the codebase and associated tests to identify this requirement gap, prioritizing based on test coverage and business risk signals.",
    "suggestion": "AI generated this test suggestion based on uncovered code paths, similar test patterns in the repository, and historical failure data.",
    "auto-heal": "AI detected a pattern mismatch between the test selector and the current DOM state, then generated a patch based on semantic similarity and element context.",
    "coverage": "AI computed coverage delta by comparing spec files against discovered flows and endpoints, weighing business priority in the risk score.",
    "test": "AI generated this test using existing test patterns as templates, ensuring consistent style and maximizing coverage of edge cases.",
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.18)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 500, zIndex: 50,
        background: surface, borderLeft: `1px solid ${border}`,
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 28px rgba(0,0,0,0.13)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: `${eventColor}22`, color: eventColor }}>
                {EVENT_LABEL[event.eventType] ?? event.eventType}
              </span>
              <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: `${entityColor}18`, color: entityColor }}>
                {ENTITY_ICON[event.entityType]} {ENTITY_LABEL[event.entityType]}
              </span>
              <span style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, fontWeight: 700, background: `${actorColor}18`, color: actorColor }}>
                {ACTOR_LABEL[event.actorType]}
              </span>
            </div>
            <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 17, color: textLight }}>✕</button>
          </div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: text, lineHeight: 1.5 }}>{event.summary}</p>
          <div style={{ fontSize: 11, color: textLight, marginTop: 5 }}>
            {new Date(event.timestamp).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
            {event.actorId && <span style={{ marginLeft: 8, fontFamily: "monospace" }}>by {event.actorId}</span>}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Quick links */}
          {targetTab && onNavigate && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Quick Links</div>
              <button
                onClick={() => { onNavigate(targetTab); onClose(); }}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  border: `1px solid ${P}44`,
                  background: `${P}12`,
                  color: P, fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Open in {ENTITY_LABEL[event.entityType]} →
              </button>
            </div>
          )}

          {/* Impact analysis */}
          {hasImpact && (
            <div style={{ padding: "12px 14px", borderRadius: 10, background: bg }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Impact Analysis</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {event.metadata?.impact?.coverage && (
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: "#FF980018", border: "1px solid #FF980030", flex: "1 1 120px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#FF9800", textTransform: "uppercase" }}>Coverage</div>
                    <div style={{ fontSize: 11, color: text, marginTop: 3 }}>This event affected test coverage metrics.</div>
                  </div>
                )}
                {event.metadata?.impact?.risk && (
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: "#EF535018", border: "1px solid #EF535030", flex: "1 1 120px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#EF5350", textTransform: "uppercase" }}>Risk</div>
                    <div style={{ fontSize: 11, color: text, marginTop: 3 }}>This event changed risk scores or exposure.</div>
                  </div>
                )}
                {event.metadata?.impact?.stability && (
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: "#7B2FF718", border: "1px solid #7B2FF730", flex: "1 1 120px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#7B2FF7", textTransform: "uppercase" }}>Stability</div>
                    <div style={{ fontSize: 11, color: text, marginTop: 3 }}>This event affected test stability or flakiness.</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Change diff */}
          {hasDiff && (
            <ChangeDiff before={event.details?.before} after={event.details?.after} />
          )}

          {/* Structured details */}
          {event.details && !hasDiff && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Details</div>
              <pre style={{
                padding: "10px 12px", borderRadius: 8, fontSize: 10, lineHeight: 1.6,
                background: dark ? "#0d0d1a" : "#f8f8ff",
                border: `1px solid ${border}`,
                color: text, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 240, overflowY: "auto",
              }}>
                {JSON.stringify(event.details, null, 2)}
              </pre>
            </div>
          )}

          {/* AI reasoning */}
          {event.actorType === "ai" && (
            <div style={{
              padding: "12px 14px", borderRadius: 10,
              background: dark ? "#13082a" : "#faf5ff",
              border: `1px solid ${dark ? "#3a1a6a" : "#e8d5ff"}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: P, textTransform: "uppercase", marginBottom: 6 }}>🧠 AI Reasoning</div>
              <div style={{ fontSize: 12, color: text, lineHeight: 1.7 }}>
                {AI_REASONING[event.entityType] ?? "This action was performed automatically by the AI engine based on pattern analysis and historical project data."}
              </div>
            </div>
          )}

          {/* Related events */}
          {related.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Related Events ({related.length})
              </div>
              {related.map(r => {
                const rc = ENTITY_COLOR[r.entityType] ?? "#90A4AE";
                const ec = EVENT_COLOR[r.eventType] ?? "#90A4AE";
                return (
                  <div key={r.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    padding: "8px 10px", marginBottom: 5, borderRadius: 8,
                    background: bg, border: `1px solid ${border}`,
                  }}>
                    <span style={{ fontSize: 14 }}>{ENTITY_ICON[r.entityType]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.summary}</div>
                      <div style={{ display: "flex", gap: 5, marginTop: 3, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: ec, background: `${ec}18`, padding: "1px 5px", borderRadius: 4 }}>
                          {EVENT_LABEL[r.eventType] ?? r.eventType}
                        </span>
                        <span style={{ fontSize: 10, color: textLight }}>{fmtTime(r.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main History component ────────────────────────────────────────────────────

export default function History({ projectId, onNavigate }: {
  projectId: string;
  onNavigate?: (tab: string) => void;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight, P, BG: bg, dark } = useColors();

  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);

  const [filters, setFilters] = useState<ActiveFilters>({
    timeRange: "", entityType: "all", eventType: "all", actorType: "all", impact: "all", search: "",
  });

  const applyFilters = useCallback(async (f: ActiveFilters) => {
    setLoading(true);
    try {
      const apiFilters: HistoryFilters = {
        from: timeRangeToFrom(f.timeRange),
        entityType: f.entityType !== "all" ? f.entityType : undefined,
        eventType: f.eventType !== "all" ? f.eventType : undefined,
        actorType: f.actorType !== "all" ? f.actorType : undefined,
        impact: f.impact !== "all" ? f.impact : undefined,
      };
      const res = await fetchHistory(projectId, { ...apiFilters, limit: 100 });
      let evts = res.events ?? [];
      if (f.search) {
        const q = f.search.toLowerCase();
        evts = evts.filter(e => e.summary.toLowerCase().includes(q) || e.entityId.toLowerCase().includes(q));
      }
      setEvents(evts);
      setTotal(evts.length);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchHistorySummary(projectId).then(setSummary).catch(() => {});
    applyFilters(filters);
  }, [projectId]);

  const handleFilterChange = (patch: Partial<ActiveFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setSelectedEvent(null);
    applyFilters(next);
  };

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: P, fontSize: 20, fontWeight: 800 }}>
          History
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: textLight }}>
          Chronological audit trail — requirements, tests, flows, coverage, AI actions, and runs.
        </p>
      </div>

      {/* Summary bar */}
      {summary && <SummaryBar summary={summary} />}

      {/* Filter bar */}
      <FilterBar filters={filters} onChange={handleFilterChange} total={total} />

      {/* Event stream */}
      <EventStream
        events={events}
        selectedId={selectedEvent?.id ?? null}
        onSelect={e => setSelectedEvent(prev => prev?.id === e.id ? null : e)}
        loading={loading}
      />

      {/* Detail panel */}
      {selectedEvent && (
        <EventDetailPanel
          event={selectedEvent}
          allEvents={events}
          onClose={() => setSelectedEvent(null)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
