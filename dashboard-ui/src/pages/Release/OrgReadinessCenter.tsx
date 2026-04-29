import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useColors } from "@/hooks/useColors";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReadinessStatus = "ready" | "at-risk" | "not-ready";

interface OrgProjectSummary {
  projectId: string;
  name: string;
  type: string;
  url: string | null;
  status: ReadinessStatus;
  overallScore: number;
  gatesPassed: number;
  gatesTotal: number;
  criticalBlockers: number;
  coveragePct: number | null;
  stabilityPct: number | null;
  totalRequirements: number;
  generatedAt: string;
}

interface OrgReadinessReport {
  totalProjects: number;
  readyCount: number;
  atRiskCount: number;
  notReadyCount: number;
  averageScore: number;
  totalCriticalBlockers: number;
  projects: OrgProjectSummary[];
  generatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReadinessStatus, { label: string; color: string; bg: string; dot: string }> = {
  "ready":     { label: "Ready",    color: "#22c55e", bg: "#22c55e15", dot: "#22c55e" },
  "at-risk":   { label: "At Risk",  color: "#f59e0b", bg: "#f59e0b15", dot: "#f59e0b" },
  "not-ready": { label: "Blocked",  color: "#ef4444", bg: "#ef444415", dot: "#ef4444" },
};

const TYPE_COLOR: Record<string, string> = {
  ui:     "#7B2FF7",
  api:    "#448AFF",
  hybrid: "#FF9800",
};

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 48, stroke = 4 }: { score: number; size?: number; stroke?: number }) {
  const { BDR: trackStroke } = useColors();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackStroke} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - score / 100)}
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
    </svg>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  const { TXT2: textLight } = useColors();
  return (
    <div style={{
      flex: 1, minWidth: 120,
      padding: "20px 24px",
      borderRadius: 12,
      background: `${color}0e`,
      border: `1px solid ${color}25`,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: textLight, marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── Gate bar ─────────────────────────────────────────────────────────────────

function GateBar({ passed, total }: { passed: number; total: number }) {
  const { dark } = useColors();
  const pct = total > 0 ? (passed / total) * 100 : 0;
  const color = pct === 100 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: dark ? "#2a2a3a" : "#f3f4f6", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, whiteSpace: "nowrap" }}>{passed}/{total}</span>
    </div>
  );
}

// ─── Project row ──────────────────────────────────────────────────────────────

function ProjectRow({ project, onView }: { project: OrgProjectSummary; onView: (id: string) => void }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight } = useColors();
  const sc  = STATUS_CONFIG[project.status];
  const tc  = TYPE_COLOR[project.type] ?? "#6b7280";

  const displayName = project.name.length > 40 ? project.name.slice(0, 38) + "…" : project.name;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "16px 20px",
      borderRadius: 12,
      background: surface,
      border: `1px solid ${border}`,
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.08)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
    >
      {/* Score ring + number */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <ScoreRing score={project.overallScore} size={52} stroke={5} />
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 800,
          color: project.overallScore >= 80 ? "#22c55e" : project.overallScore >= 60 ? "#f59e0b" : "#ef4444",
        }}>
          {project.overallScore}
        </div>
      </div>

      {/* Project info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayName}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
            background: `${tc}14`, color: tc, letterSpacing: "0.06em",
            flexShrink: 0,
          }}>
            {project.type.toUpperCase()}
          </span>
        </div>
        {project.url && (
          <div style={{ fontSize: 11, color: textLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.url}
          </div>
        )}
      </div>

      {/* Status badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "5px 12px", borderRadius: 20,
        background: sc.bg, border: `1px solid ${sc.color}40`,
        flexShrink: 0,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: sc.color }}>{sc.label}</span>
      </div>

      {/* Coverage */}
      <div style={{ width: 80, flexShrink: 0, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: text }}>
          {project.coveragePct !== null ? `${project.coveragePct}%` : "—"}
        </div>
        <div style={{ fontSize: 10, color: textLight, marginTop: 2 }}>Coverage</div>
      </div>

      {/* Stability */}
      <div style={{ width: 80, flexShrink: 0, textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: text }}>
          {project.stabilityPct !== null ? `${project.stabilityPct}%` : "—"}
        </div>
        <div style={{ fontSize: 10, color: textLight, marginTop: 2 }}>Stability</div>
      </div>

      {/* Gates */}
      <div style={{ width: 100, flexShrink: 0 }}>
        <GateBar passed={project.gatesPassed} total={project.gatesTotal} />
        <div style={{ fontSize: 10, color: textLight, marginTop: 4 }}>Gates</div>
      </div>

      {/* Critical blockers */}
      {project.criticalBlockers > 0 ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 10px", borderRadius: 8,
          background: "#ef444414", border: "1px solid #ef444428",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 12 }}>⚠</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444" }}>
            {project.criticalBlockers} blocker{project.criticalBlockers !== 1 ? "s" : ""}
          </span>
        </div>
      ) : (
        <div style={{ width: 80, flexShrink: 0 }} />
      )}

      {/* View button */}
      <button
        onClick={() => onView(project.projectId)}
        style={{
          padding: "7px 14px", borderRadius: 8,
          border: `1px solid ${border}`, background: surface,
          color: text, fontSize: 12, fontWeight: 600,
          cursor: "pointer", flexShrink: 0,
          transition: "border-color 0.15s, color 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "#7B2FF7";
          (e.currentTarget as HTMLElement).style.color = "#7B2FF7";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = border;
          (e.currentTarget as HTMLElement).style.color = text;
        }}
      >
        View Project →
      </button>
    </div>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({ label, active, count, color, onClick }: {
  label: string; active: boolean; count: number; color: string; onClick: () => void;
}) {
  const { CARD: surface, BDR: border, TXT2: textLight, dark } = useColors();
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "6px 14px", borderRadius: 20,
      border: `1.5px solid ${active ? color : border}`,
      background: active ? `${color}12` : surface,
      color: active ? color : textLight,
      fontSize: 13, fontWeight: 600, cursor: "pointer",
      transition: "all 0.15s",
    }}>
      {label}
      <span style={{
        fontSize: 11, fontWeight: 800, padding: "1px 6px", borderRadius: 10,
        background: active ? `${color}25` : (dark ? "#2a2a3a" : "#f3f4f6"),
        color: active ? color : textLight,
      }}>{count}</span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OrgReadinessCenter() {
  const [report, setReport]   = useState<OrgReadinessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [filter, setFilter]   = useState<ReadinessStatus | "all">("all");
  const [search, setSearch]   = useState("");
  const navigate = useNavigate();
  const { CARD: surface, BDR: border, TXT: text, TXT2: textLight } = useColors();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:3000/org/readiness");
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setReport(await res.json());
    } catch (e: any) {
      setError(e.message ?? "Failed to load org readiness.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleView = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ padding: 48, textAlign: "center", color: textLight }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🚦</div>
      <div style={{ fontSize: 14 }}>Loading org readiness…</div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <div style={{ color: "#ef4444", marginBottom: 12, fontSize: 14 }}>{error}</div>
      <button onClick={load} style={{
        padding: "8px 20px", borderRadius: 8, border: `1px solid ${border}`,
        background: surface, color: text, cursor: "pointer", fontSize: 13,
      }}>Retry</button>
    </div>
  );

  if (!report) return null;

  const filtered = report.projects.filter(p => {
    if (filter !== "all" && p.status !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !(p.url ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const orgStatus: ReadinessStatus = report.notReadyCount > 0 ? "not-ready"
    : report.atRiskCount > 0 ? "at-risk"
    : "ready";
  const orgSc = STATUS_CONFIG[orgStatus];
  const generatedAt = new Date(report.generatedAt).toLocaleString();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 0 60px" }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 16, marginBottom: 28, flexWrap: "wrap",
      }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: text }}>
            Release Readiness Center
          </h1>
          <div style={{ fontSize: 13, color: textLight }}>
            Aggregated quality gate status across all projects · Last updated {generatedAt}
          </div>
        </div>
        <button onClick={load} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "9px 16px", borderRadius: 10,
          border: `1px solid ${border}`, background: surface,
          color: text, fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <path d="M12 7A5 5 0 112 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M12 3v4h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Org status banner ────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "18px 24px", borderRadius: 14,
        background: orgSc.bg, border: `1.5px solid ${orgSc.color}40`,
        marginBottom: 24,
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
          background: `${orgSc.color}20`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>
          {orgStatus === "ready" ? "✅" : orgStatus === "at-risk" ? "⚠️" : "🚫"}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: orgSc.color }}>
            Organisation is {orgSc.label}
          </div>
          <div style={{ fontSize: 13, color: textLight, marginTop: 2 }}>
            {report.readyCount} of {report.totalProjects} projects are ready for release
            {report.totalCriticalBlockers > 0 && ` · ${report.totalCriticalBlockers} critical blocker${report.totalCriticalBlockers !== 1 ? "s" : ""} across org`}
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: orgSc.color }}>{report.averageScore}</div>
          <div style={{ fontSize: 11, color: textLight }}>Avg Score</div>
        </div>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <StatCard value={report.totalProjects}        label="Total Projects"      color="#7B2FF7" />
        <StatCard value={report.readyCount}           label="Ready"               color="#22c55e" />
        <StatCard value={report.atRiskCount}          label="At Risk"             color="#f59e0b" />
        <StatCard value={report.notReadyCount}        label="Blocked"             color="#ef4444" />
        <StatCard value={`${report.averageScore}%`}   label="Average Score"       color="#448AFF" />
        <StatCard value={report.totalCriticalBlockers} label="Critical Blockers"  color="#ef4444" />
      </div>

      {/* ── Filters + search ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <FilterChip label="All"      active={filter === "all"}       count={report.totalProjects}  color="#7B2FF7" onClick={() => setFilter("all")} />
        <FilterChip label="Ready"    active={filter === "ready"}     count={report.readyCount}     color="#22c55e" onClick={() => setFilter("ready")} />
        <FilterChip label="At Risk"  active={filter === "at-risk"}   count={report.atRiskCount}    color="#f59e0b" onClick={() => setFilter("at-risk")} />
        <FilterChip label="Blocked"  active={filter === "not-ready"} count={report.notReadyCount}  color="#ef4444" onClick={() => setFilter("not-ready")} />

        <div style={{ flex: 1 }} />

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 14px", borderRadius: 8,
          border: `1px solid ${border}`, background: surface, minWidth: 200,
        }}>
          <svg width={14} height={14} viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke={textLight} strokeWidth="1.5"/>
            <path d="M11 11l3 3" stroke={textLight} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            placeholder="Search projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              border: "none", outline: "none", fontSize: 13, color: text,
              background: "transparent", width: "100%",
            }}
          />
        </div>
      </div>

      {/* ── Project list ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: textLight, fontSize: 14 }}>
          {report.totalProjects === 0
            ? "No projects yet. Create your first project to see readiness status here."
            : "No projects match your current filter."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {/* Column headers */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "6px 20px",
            fontSize: 11, fontWeight: 700, color: textLight,
            textTransform: "uppercase", letterSpacing: "0.07em",
          }}>
            <div style={{ width: 52 }}></div>
            <div style={{ flex: 1 }}>Project</div>
            <div style={{ width: 88 }}>Status</div>
            <div style={{ width: 80, textAlign: "center" }}>Coverage</div>
            <div style={{ width: 80, textAlign: "center" }}>Stability</div>
            <div style={{ width: 100 }}>Gates</div>
            <div style={{ width: 80 }}>Blockers</div>
            <div style={{ width: 100 }}></div>
          </div>

          {filtered.map(p => (
            <ProjectRow key={p.projectId} project={p} onView={handleView} />
          ))}
        </div>
      )}
    </div>
  );
}
