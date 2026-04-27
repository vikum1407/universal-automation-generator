import { useState, useEffect, useCallback } from "react";
import { theme } from "@/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoryMetrics {
  coveragePct: number | null;
  highRiskUncovered: number;
  stabilityPct: number | null;
  flakyCount: number;
  totalTests: number;
  aiHeals: number;
  aiSuggestions: number;
  totalRequirements: number;
  coveredRequirements: number;
}

interface StoryMoment {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
}

interface StoryChapter {
  id: string;
  title: string;
  period: { from: string; to: string };
  theme: "onboarding" | "expansion" | "stabilization" | "incident" | "release" | "recent" | "unknown";
  narrative: string;
  keyMoments: StoryMoment[];
  metrics: StoryMetrics;
  highlights: string[];
}

interface Story {
  id: string;
  projectId: string;
  title: string;
  arc: string;
  summary: string;
  generatedAt: string;
  timeRange: { from: string; to: string };
  totalDays: number;
  chapters: StoryChapter[];
  metricsStart: StoryMetrics;
  metricsNow: StoryMetrics;
  projectType: string;
}

// ─── Color helpers ────────────────────────────────────────────────────────────

const THEME_COLORS: Record<string, { bg: string; border: string; accent: string; label: string }> = {
  onboarding:    { bg: "#7B2FF708", border: "#7B2FF730", accent: "#7B2FF7", label: "Onboarding" },
  expansion:     { bg: "#448AFF08", border: "#448AFF30", accent: "#448AFF", label: "Expansion" },
  stabilization: { bg: "#00C17208", border: "#00C17230", accent: "#00C172", label: "Stabilization" },
  incident:      { bg: "#FF5A5A08", border: "#FF5A5A30", accent: "#FF5A5A", label: "Incident" },
  release:       { bg: "#FF980008", border: "#FF980030", accent: "#FF9800", label: "Release" },
  recent:        { bg: "#448AFF08", border: "#448AFF30", accent: "#448AFF", label: "Current State" },
  unknown:       { bg: "#88888808", border: "#88888830", accent: "#888888", label: "Phase" },
};

function themeColor(t: string) {
  return THEME_COLORS[t] ?? THEME_COLORS.unknown;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function MetricPill({ label, value, accent }: { label: string; value: string | number | null; accent?: string }) {
  const P = theme.colors.primary;
  const col = accent ?? P;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "12px 18px", borderRadius: 10,
      background: `${col}0e`, border: `1px solid ${col}25`,
      minWidth: 90,
    }}>
      <span style={{ fontSize: 20, fontWeight: 800, color: col, lineHeight: 1 }}>
        {value === null || value === undefined ? "—" : value}
      </span>
      <span style={{ fontSize: 11, color: theme.colors.textLight, marginTop: 4, whiteSpace: "nowrap" }}>
        {label}
      </span>
    </div>
  );
}

function MetricCompare({ label, start, now, suffix = "", accent }: {
  label: string; start: number | null; now: number | null; suffix?: string; accent?: string;
}) {
  const P = theme.colors.primary;
  const col = accent ?? P;
  const diff = (now ?? 0) - (start ?? 0);
  const up = diff > 0;
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 6,
      padding: "14px 16px", borderRadius: 10,
      background: theme.colors.background,
      border: `1px solid ${theme.colors.border}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: theme.colors.textLight, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: theme.colors.textLight, marginBottom: 2 }}>Start</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.colors.textDark }}>
            {start === null ? "—" : `${start}${suffix}`}
          </div>
        </div>
        <div style={{ flex: 1, height: 1, background: theme.colors.border, position: "relative" }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            fontSize: 10, fontWeight: 700,
            color: diff === 0 ? theme.colors.textLight : up ? "#00C172" : "#FF5A5A",
            background: theme.colors.background, padding: "1px 4px", borderRadius: 3,
            whiteSpace: "nowrap",
          }}>
            {diff === 0 ? "=" : up ? `+${diff}${suffix}` : `${diff}${suffix}`}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: theme.colors.textLight, marginBottom: 2 }}>Now</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: col }}>
            {now === null ? "—" : `${now}${suffix}`}
          </div>
        </div>
      </div>
    </div>
  );
}

function MomentDot({ moment }: { moment: StoryMoment }) {
  const TYPE_COLOR: Record<string, string> = {
    "project-created":        "#7B2FF7",
    "requirements-generated": "#448AFF",
    "tests-generated":        "#00C172",
    "test-run":               "#00C172",
    "flows-discovered":       "#FF9800",
    "endpoints-discovered":   "#FF9800",
    "auto-heal":              "#FF5A5A",
    "suggestions-generated":  "#7B2FF7",
    "coverage-milestone":     "#00C172",
    "re-crawl":               "#448AFF",
  };
  const col = TYPE_COLOR[moment.type] ?? theme.colors.primary;
  const date = new Date(moment.timestamp);
  const dateStr = `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      {/* Dot + line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, flexShrink: 0 }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: col, marginTop: 4,
          boxShadow: `0 0 0 3px ${col}25`,
        }} />
      </div>
      <div style={{ paddingBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textDark }}>{moment.title}</div>
        {moment.description && (
          <div style={{ fontSize: 12, color: theme.colors.textLight, marginTop: 2 }}>{moment.description}</div>
        )}
        <div style={{ fontSize: 11, color: theme.colors.textLight, marginTop: 3, opacity: 0.7 }}>{dateStr}</div>
      </div>
    </div>
  );
}

function HighlightChip({ text, accent }: { text: string; accent: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: `${accent}14`, color: accent,
      border: `1px solid ${accent}28`,
    }}>
      <span style={{ fontSize: 10 }}>✦</span>
      {text}
    </span>
  );
}

function ChapterCard({ chapter, index }: { chapter: StoryChapter; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const tc = themeColor(chapter.theme);
  const from = new Date(chapter.period.from);
  const to   = new Date(chapter.period.to);
  const dateRange = `${from.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${to.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${tc.border}`,
      background: theme.colors.background,
      overflow: "hidden",
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 14,
          padding: "16px 20px", border: "none", borderRadius: 0,
          background: open ? tc.bg : "transparent",
          cursor: "pointer", textAlign: "left",
          transition: "background 0.15s",
          borderLeft: `3px solid ${tc.accent}`,
        }}
      >
        {/* Chapter number */}
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
          background: `${tc.accent}18`, color: tc.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800,
        }}>
          {index + 1}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textDark }}>{chapter.title}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
              background: `${tc.accent}18`, color: tc.accent, letterSpacing: "0.06em",
            }}>
              {tc.label.toUpperCase()}
            </span>
          </div>
          <div style={{ fontSize: 12, color: theme.colors.textLight, marginTop: 2 }}>{dateRange}</div>
        </div>

        {/* Highlights preview (collapsed) */}
        {!open && chapter.highlights.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "nowrap", overflow: "hidden" }}>
            {chapter.highlights.slice(0, 2).map((h, i) => (
              <span key={i} style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 10,
                background: `${tc.accent}12`, color: tc.accent, whiteSpace: "nowrap",
              }}>{h}</span>
            ))}
          </div>
        )}

        {/* Chevron */}
        <svg width={14} height={14} viewBox="0 0 14 14" fill="none" style={{
          flexShrink: 0, transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          color: theme.colors.textLight,
        }}>
          <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Body */}
      {open && (
        <div style={{ padding: "20px 24px", borderTop: `1px solid ${tc.border}` }}>
          {/* Narrative */}
          <p style={{
            fontSize: 14, lineHeight: 1.75, color: theme.colors.textDark,
            margin: "0 0 20px",
          }}>
            {chapter.narrative}
          </p>

          {/* Highlights */}
          {chapter.highlights.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {chapter.highlights.map((h, i) => (
                <HighlightChip key={i} text={h} accent={tc.accent} />
              ))}
            </div>
          )}

          {/* Metrics row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
            gap: 10, marginBottom: 20,
          }}>
            {chapter.metrics.coveragePct !== null && (
              <MetricPill label="Coverage" value={`${chapter.metrics.coveragePct}%`} accent={tc.accent} />
            )}
            {chapter.metrics.totalTests > 0 && (
              <MetricPill label="Tests" value={chapter.metrics.totalTests} accent={tc.accent} />
            )}
            {chapter.metrics.aiHeals > 0 && (
              <MetricPill label="Auto-Heals" value={chapter.metrics.aiHeals} accent={tc.accent} />
            )}
            {chapter.metrics.aiSuggestions > 0 && (
              <MetricPill label="AI Suggestions" value={chapter.metrics.aiSuggestions} accent={tc.accent} />
            )}
            {chapter.metrics.stabilityPct !== null && (
              <MetricPill label="Stability" value={`${chapter.metrics.stabilityPct}%`} accent={tc.accent} />
            )}
          </div>

          {/* Key moments */}
          {chapter.keyMoments.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: theme.colors.textLight, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                Key Moments
              </div>
              <div style={{ borderLeft: `2px solid ${tc.border}`, paddingLeft: 16 }}>
                {chapter.keyMoments.map(m => (
                  <MomentDot key={m.id} moment={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface Props {
  projectId: string;
}

export default function StoryPage({ projectId }: Props) {
  const [story, setStory]       = useState<Story | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const P    = theme.colors.primary;
  const BG   = theme.colors.background;
  const BDR  = theme.colors.border;
  const TXT  = theme.colors.textDark;
  const TXT2 = theme.colors.textLight;
  const CARD = theme.colors.card ?? theme.colors.background;

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const endpoint = `http://localhost:3000/projects/${projectId}/story${refresh ? "/refresh" : ""}`;
      const res = await fetch(endpoint, { method: refresh ? "POST" : "GET" });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data: Story = await res.json();
      setStory(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to load story.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: TXT2, fontSize: 14 }}>
      <div style={{ marginBottom: 16, fontSize: 28 }}>📖</div>
      Generating story…
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ color: "#FF5A5A", fontSize: 14, marginBottom: 12 }}>{error}</div>
      <button onClick={() => load()} style={{
        padding: "8px 20px", borderRadius: 8, border: `1px solid ${BDR}`,
        background: BG, color: TXT, cursor: "pointer", fontSize: 13,
      }}>Retry</button>
    </div>
  );

  if (!story) return null;

  const generatedDate = new Date(story.generatedAt).toLocaleString();
  const fromDate = new Date(story.timeRange.from).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const toDate   = new Date(story.timeRange.to).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 60px", fontFamily: theme.typography?.fontFamily }}>

      {/* ── Book header ───────────────────────────────────────────────────── */}
      <div style={{
        padding: "36px 36px 32px",
        borderRadius: 16,
        background: `linear-gradient(135deg, ${P}12 0%, ${P}04 100%)`,
        border: `1px solid ${P}25`,
        marginBottom: 28,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative lines */}
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 120,
          background: `linear-gradient(90deg, transparent, ${P}08)`,
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            {/* Arc label */}
            <div style={{
              fontSize: 11, fontWeight: 700, color: P, textTransform: "uppercase",
              letterSpacing: "0.12em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                <path d="M6 1L7.5 4.5H11L8 6.7l1.2 3.5L6 8 2.8 10.2 4 6.7 1 4.5h3.5L6 1z" fill="currentColor"/>
              </svg>
              Arc
            </div>

            {/* Arc title */}
            <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 900, color: TXT, lineHeight: 1.15 }}>
              {story.arc}
            </h1>

            {/* Project title */}
            <div style={{ fontSize: 14, color: TXT2, marginBottom: 14 }}>{story.title}</div>

            {/* Time range badge */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span style={{
                fontSize: 12, padding: "4px 12px", borderRadius: 20,
                background: `${P}14`, color: P, fontWeight: 600,
              }}>
                {fromDate} → {toDate}
              </span>
              <span style={{
                fontSize: 12, padding: "4px 12px", borderRadius: 20,
                background: BG, color: TXT2, border: `1px solid ${BDR}`,
                fontWeight: 500,
              }}>
                {story.totalDays} days
              </span>
              <span style={{
                fontSize: 12, padding: "4px 12px", borderRadius: 20,
                background: BG, color: TXT2, border: `1px solid ${BDR}`,
                fontWeight: 500,
              }}>
                {story.chapters.length} chapter{story.chapters.length !== 1 ? "s" : ""}
              </span>
              <span style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 20,
                background: `${story.projectType === "api" ? "#448AFF" : "#7B2FF7"}14`,
                color: story.projectType === "api" ? "#448AFF" : "#7B2FF7",
                fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                {story.projectType}
              </span>
            </div>
          </div>

          {/* Refresh button */}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 18px", borderRadius: 10,
              border: `1px solid ${P}40`, background: `${P}12`, color: P,
              fontWeight: 700, fontSize: 13, cursor: refreshing ? "not-allowed" : "pointer",
              opacity: refreshing ? 0.6 : 1, whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            <svg width={14} height={14} viewBox="0 0 14 14" fill="none" style={{
              animation: refreshing ? "spin 1s linear infinite" : undefined,
            }}>
              <path d="M12 7A5 5 0 112 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M12 3v4h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {refreshing ? "Refreshing…" : "Refresh Story"}
          </button>
        </div>

        <div style={{ fontSize: 11, color: TXT2, marginTop: 18, opacity: 0.6 }}>
          Generated {generatedDate}
        </div>
      </div>

      {/* ── Summary quote ──────────────────────────────────────────────────── */}
      <div style={{
        padding: "20px 24px",
        borderRadius: 12,
        background: CARD,
        border: `1px solid ${BDR}`,
        borderLeft: `4px solid ${P}`,
        marginBottom: 28,
      }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.8, color: TXT }}>
          {story.summary}
        </p>
      </div>

      {/* ── Metrics: Start vs Now ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: TXT }}>
          Start vs Now
        </h2>

        {/* Top KPIs */}
        <div style={{
          display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14,
        }}>
          <MetricPill label="Coverage" value={story.metricsNow.coveragePct !== null ? `${story.metricsNow.coveragePct}%` : "—"} accent={P} />
          <MetricPill label="Tests" value={story.metricsNow.totalTests} accent="#448AFF" />
          <MetricPill label="Requirements" value={story.metricsNow.totalRequirements} accent="#7B2FF7" />
          <MetricPill label="Auto-Heals" value={story.metricsNow.aiHeals} accent="#FF9800" />
          <MetricPill label="AI Suggestions" value={story.metricsNow.aiSuggestions} accent="#7B2FF7" />
          {story.metricsNow.stabilityPct !== null && (
            <MetricPill label="Stability" value={`${story.metricsNow.stabilityPct}%`} accent="#00C172" />
          )}
        </div>

        {/* Comparison grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 10,
        }}>
          <MetricCompare
            label="Coverage %"
            start={story.metricsStart.coveragePct}
            now={story.metricsNow.coveragePct}
            suffix="%"
            accent={P}
          />
          <MetricCompare
            label="Tests"
            start={story.metricsStart.totalTests}
            now={story.metricsNow.totalTests}
            accent="#448AFF"
          />
          <MetricCompare
            label="Covered Requirements"
            start={story.metricsStart.coveredRequirements}
            now={story.metricsNow.coveredRequirements}
            accent="#00C172"
          />
          <MetricCompare
            label="High-Risk Uncovered"
            start={story.metricsStart.highRiskUncovered}
            now={story.metricsNow.highRiskUncovered}
            accent="#FF5A5A"
          />
          <MetricCompare
            label="Auto-Heals Applied"
            start={story.metricsStart.aiHeals}
            now={story.metricsNow.aiHeals}
            accent="#FF9800"
          />
          <MetricCompare
            label="AI Suggestions"
            start={story.metricsStart.aiSuggestions}
            now={story.metricsNow.aiSuggestions}
            accent="#7B2FF7"
          />
        </div>
      </div>

      {/* ── Chapters ──────────────────────────────────────────────────────── */}
      <div>
        <h2 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: TXT }}>
          Chapters
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {story.chapters.map((ch, i) => (
            <ChapterCard key={ch.id} chapter={ch} index={i} />
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
