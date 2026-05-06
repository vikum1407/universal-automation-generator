import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

interface ReleaseSummary {
  id:           string;
  projectId:    string;
  displayName:  string;
  version:      string | null;
  environment:  string;
  status:       ReleaseStatus;
  statusLabel:  string;
  createdAt:    string;
  updatedAt:    string;
  plannedEnd:   string | null;
  linksCount:   number;
  readiness: {
    status:       ReadinessStatus;
    score:        number;
    color:        string;
    gatesPassed:  number;
    gatesTotal:   number;
    openCriticalInsights: number;
  };
}

interface ProjectWithReleases {
  projectId:   string;
  projectName: string;
  projectType: string;
  releases:    ReleaseSummary[];
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ReleaseStatus, { label: string; color: string; bg: string }> = {
  planned:              { label: "Planned",              color: "#6b7280", bg: "#6b728014" },
  in_progress:          { label: "In Progress",          color: "#3b82f6", bg: "#3b82f614" },
  ready_for_validation: { label: "Ready for Validation", color: "#8b5cf6", bg: "#8b5cf614" },
  validating:           { label: "Validating",           color: "#f59e0b", bg: "#f59e0b14" },
  ready_to_ship:        { label: "Ready to Ship",        color: "#22c55e", bg: "#22c55e14" },
  shipped:              { label: "Shipped",              color: "#10b981", bg: "#10b98114" },
  rolled_back:          { label: "Rolled Back",          color: "#ef4444", bg: "#ef444414" },
  cancelled:            { label: "Cancelled",            color: "#9ca3af", bg: "#9ca3af14" },
};

const ENV_COLOR: Record<string, string> = {
  prod:    "#ef4444",
  staging: "#f59e0b",
  preprod: "#8b5cf6",
  dev:     "#3b82f6",
};

const TYPE_COLOR: Record<string, string> = {
  ui:  "#7B2FF7",
  api: "#448AFF",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30)  return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, color, size = 36, stroke = 3.5 }: {
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

// ─── Release row ──────────────────────────────────────────────────────────────

function ReleaseRow({
  release,
  onNavigate,
}: {
  release:    ReleaseSummary;
  onNavigate: (projectId: string) => void;
}) {
  const { CARD, BDR, TXT, TXT2 } = useColors();
  const sc = STATUS_CFG[release.status] ?? STATUS_CFG.planned;
  const ec = ENV_COLOR[release.environment] ?? "#6b7280";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "12px 16px",
      borderRadius: 10,
      background: CARD,
      border: `1px solid ${BDR}`,
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.07)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}
    >
      {/* Score ring */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <ScoreRing score={release.readiness.score} color={release.readiness.color} />
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 900, color: release.readiness.color,
        }}>
          {release.readiness.score}
        </div>
      </div>

      {/* Name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {release.displayName}
        </div>
        <div style={{ fontSize: 11, color: TXT2, marginTop: 1 }}>{fmtRelative(release.createdAt)}</div>
      </div>

      {/* Environment */}
      <span style={{
        padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700,
        background: `${ec}14`, color: ec, flexShrink: 0,
        textTransform: "uppercase", letterSpacing: "0.05em",
      }}>
        {release.environment}
      </span>

      {/* Status */}
      <span style={{
        padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: sc.bg, color: sc.color, border: `1px solid ${sc.color}40`,
        flexShrink: 0, whiteSpace: "nowrap",
      }}>
        {sc.label}
      </span>

      {/* Planned end */}
      <span style={{ fontSize: 11, color: TXT2, width: 70, textAlign: "right", flexShrink: 0 }}>
        {fmtDate(release.plannedEnd)}
      </span>

      {/* Blockers */}
      {release.readiness.openCriticalInsights > 0 ? (
        <span style={{ fontSize: 11, color: "#ef4444", fontWeight: 700, flexShrink: 0, width: 60, textAlign: "right" }}>
          ⚠ {release.readiness.openCriticalInsights}
        </span>
      ) : (
        <span style={{ width: 60 }} />
      )}

      {/* View button */}
      <button
        onClick={() => onNavigate(release.projectId)}
        style={{
          padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700,
          border: `1px solid ${BDR}`, background: "transparent", color: TXT,
          cursor: "pointer", flexShrink: 0,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "#7B2FF7";
          (e.currentTarget as HTMLElement).style.color = "#7B2FF7";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = BDR;
          (e.currentTarget as HTMLElement).style.color = TXT;
        }}
      >
        View →
      </button>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  const { TXT2 } = useColors();
  return (
    <div style={{
      flex: 1, minWidth: 100, padding: "16px 20px", borderRadius: 10,
      background: `${color}0d`, border: `1px solid ${color}25`, textAlign: "center",
    }}>
      <div style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: TXT2, marginTop: 5, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function OrgReleasesHub() {
  const { CARD, BDR, TXT, TXT2, P } = useColors();
  const navigate = useNavigate();

  const [projects, setProjects]   = useState<ProjectWithReleases[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState<ReleaseStatus | "all">("all");
  const [expanded, setExpanded]   = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load all projects
      const projRes = await fetch(`${API}/projects`);
      if (!projRes.ok) throw new Error("Failed to load projects");
      const allProjects: any[] = await projRes.json();

      // Load releases for each project in parallel
      const withReleases = await Promise.all(
        allProjects.map(async (p: any) => {
          try {
            const relRes = await fetch(`${API}/projects/${p.id}/releases`);
            const releases: ReleaseSummary[] = relRes.ok ? await relRes.json() : [];
            return {
              projectId:   p.id,
              projectName: p.name ?? p.url ?? p.swaggerUrl ?? p.id,
              projectType: p.type ?? "ui",
              releases,
            };
          } catch {
            return { projectId: p.id, projectName: p.name ?? p.id, projectType: p.type ?? "ui", releases: [] };
          }
        })
      );

      // Only keep projects with releases
      const withAny = withReleases.filter(p => p.releases.length > 0);
      setProjects(withAny);

      // Auto-expand all initially
      setExpanded(new Set(withAny.map(p => p.projectId)));
    } catch (e: any) {
      setError(e.message ?? "Failed to load releases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleNavigateToProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const toggleProject = (pid: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      return next;
    });
  };

  // Aggregate stats across all projects
  const allReleases = projects.flatMap(p => p.releases);
  const statCounts  = {
    total:       allReleases.length,
    readyToShip: allReleases.filter(r => r.status === "ready_to_ship").length,
    inProgress:  allReleases.filter(r => r.status === "in_progress" || r.status === "validating").length,
    blocking:    allReleases.filter(r => r.readiness.openCriticalInsights > 0).length,
    shipped:     allReleases.filter(r => r.status === "shipped").length,
  };

  // Filter
  const filteredProjects = projects
    .map(p => ({
      ...p,
      releases: p.releases.filter(r => {
        if (statusFilter !== "all" && r.status !== statusFilter) return false;
        if (search && !r.displayName.toLowerCase().includes(search.toLowerCase()) &&
            !p.projectName.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    }))
    .filter(p => p.releases.length > 0);

  if (loading) return (
    <div style={{ padding: 48, textAlign: "center", color: TXT2, fontSize: 14 }}>
      Loading org releases…
    </div>
  );

  if (error) return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <div style={{ color: "#ef4444", marginBottom: 12, fontSize: 14 }}>{error}</div>
      <button onClick={load} style={{
        padding: "8px 18px", borderRadius: 8, border: `1px solid ${BDR}`,
        background: CARD, color: TXT, cursor: "pointer", fontSize: 13,
      }}>Retry</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 0 60px" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        gap: 16, marginBottom: 24, flexWrap: "wrap",
      }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: TXT }}>
            Release Management
          </h1>
          <div style={{ fontSize: 13, color: TXT2 }}>
            All releases across your projects · {allReleases.length} total
          </div>
        </div>
        <button
          onClick={load}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 16px", borderRadius: 10,
            border: `1px solid ${BDR}`, background: CARD,
            color: TXT, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          <svg width={13} height={13} viewBox="0 0 14 14" fill="none">
            <path d="M12 7A5 5 0 112 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M12 3v4h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* ── Summary stats ────────────────────────────────────────────────────── */}
      {allReleases.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          <StatCard value={statCounts.total}       label="Total Releases"   color="#7B2FF7" />
          <StatCard value={statCounts.inProgress}  label="In Progress"      color="#3b82f6" />
          <StatCard value={statCounts.readyToShip} label="Ready to Ship"    color="#22c55e" />
          <StatCard value={statCounts.shipped}     label="Shipped"          color="#10b981" />
          <StatCard value={statCounts.blocking}    label="Critical Insights" color="#ef4444" />
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        {(["all", "planned", "in_progress", "validating", "ready_to_ship", "shipped"] as const).map(s => {
          const active = statusFilter === s;
          const cfg    = s !== "all" ? STATUS_CFG[s as ReleaseStatus] : null;
          const color  = cfg?.color ?? P;
          const bg     = cfg?.bg    ?? `${P}12`;
          const label  = s === "all" ? `All (${allReleases.length})` : cfg!.label;
          const count  = s === "all" ? allReleases.length : allReleases.filter(r => r.status === s).length;
          if (s !== "all" && count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setStatus(s as ReleaseStatus | "all")}
              style={{
                padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: `1.5px solid ${active ? color : BDR}`,
                background: active ? bg : "transparent",
                color: active ? color : TXT2,
                transition: "all 0.15s",
              }}
            >
              {s === "all" ? `All (${allReleases.length})` : `${cfg!.label} (${count})`}
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 12px", borderRadius: 8,
          border: `1px solid ${BDR}`, background: CARD, minWidth: 200,
        }}>
          <svg width={13} height={13} viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke={TXT2} strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke={TXT2} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Search releases or projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: 13, color: TXT, background: "transparent", flex: 1 }}
          />
        </div>
      </div>

      {/* ── Projects + releases list ──────────────────────────────────────────── */}
      {allReleases.length === 0 ? (
        <div style={{
          padding: 60, textAlign: "center", color: TXT2,
          border: `1px dashed ${BDR}`, borderRadius: 12,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
          <div style={{ fontSize: 14 }}>No releases yet across any project.</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>
            Open a project and click "Releases" in the sidebar to create the first one.
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div style={{ padding: 48, textAlign: "center", color: TXT2, fontSize: 14 }}>
          No releases match the current filter.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredProjects.map(p => {
            const tc      = TYPE_COLOR[p.projectType] ?? "#6b7280";
            const isOpen  = expanded.has(p.projectId);
            const readyN  = p.releases.filter(r => r.status === "ready_to_ship").length;
            const blockN  = p.releases.filter(r => r.readiness.openCriticalInsights > 0).length;

            return (
              <div key={p.projectId}>
                {/* Project header */}
                <div
                  onClick={() => toggleProject(p.projectId)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 10,
                    background: CARD, border: `1px solid ${BDR}`,
                    cursor: "pointer", marginBottom: isOpen ? 6 : 0,
                    transition: "background 0.15s",
                  }}
                >
                  {/* Toggle arrow */}
                  <svg width={12} height={12} viewBox="0 0 12 12" fill="none"
                    style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>
                    <path d="M4 2l4 4-4 4" stroke={TXT2} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  {/* Project name */}
                  <span style={{
                    fontSize: 13, fontWeight: 800, color: TXT, flex: 1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {p.projectName}
                  </span>

                  {/* Type badge */}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                    background: `${tc}14`, color: tc, letterSpacing: "0.05em", textTransform: "uppercase",
                  }}>
                    {p.projectType}
                  </span>

                  {/* Release count */}
                  <span style={{ fontSize: 11, color: TXT2 }}>
                    {p.releases.length} release{p.releases.length !== 1 ? "s" : ""}
                  </span>

                  {readyN > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: "#22c55e14", color: "#22c55e", border: "1px solid #22c55e30",
                    }}>
                      {readyN} ready to ship
                    </span>
                  )}

                  {blockN > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                      background: "#ef444414", color: "#ef4444", border: "1px solid #ef444430",
                    }}>
                      ⚠ {blockN} blocking
                    </span>
                  )}

                  {/* Navigate button */}
                  <button
                    onClick={e => { e.stopPropagation(); handleNavigateToProject(p.projectId); }}
                    style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      border: `1px solid ${BDR}`, background: "transparent",
                      color: TXT2, cursor: "pointer", flexShrink: 0,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = P;
                      (e.currentTarget as HTMLElement).style.color = P;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = BDR;
                      (e.currentTarget as HTMLElement).style.color = TXT2;
                    }}
                  >
                    Open Project →
                  </button>
                </div>

                {/* Releases */}
                {isOpen && (
                  <div style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                    {/* Column headers */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "4px 16px",
                      fontSize: 10, fontWeight: 700, color: TXT2,
                      textTransform: "uppercase", letterSpacing: "0.07em",
                    }}>
                      <div style={{ width: 36 }} />
                      <div style={{ flex: 1 }}>Release</div>
                      <div style={{ width: 80 }}>Env</div>
                      <div style={{ width: 130 }}>Status</div>
                      <div style={{ width: 70, textAlign: "right" }}>Due</div>
                      <div style={{ width: 60, textAlign: "right" }}>Insights</div>
                      <div style={{ width: 70 }} />
                    </div>

                    {p.releases.map(r => (
                      <ReleaseRow
                        key={r.id}
                        release={r}
                        onNavigate={handleNavigateToProject}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
