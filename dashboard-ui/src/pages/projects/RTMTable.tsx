import { useEffect, useState, useMemo } from "react";
import { theme } from "@/theme";
import { fetchRTM, regenerateRTM, exportRTMUrl } from "@/api/rtm";
import type { RTMEnterpriseResponse, RTMRequirement } from "@/api/rtm";

import RTMDashboard from "./RTMDashboard";
import RTMTableHeader from "./RTMTableHeader";
import RTMTableRow from "./RTMTableRow";
import RTMDeepView from "./RTMDeepView";
import RTMInsights from "./RTMInsights";
import RTMRegenerateModal from "./RTMRegenerateModal";
import Loader from "../../components/Loader";

type ViewMode = "matrix" | "insights";

// ─────────────────────────────────────────────────────────────
// Filter toolbar
// ─────────────────────────────────────────────────────────────
function Toolbar({
  search, onSearch,
  typeFilter, onType,
  priorityFilter, onPriority,
  riskFilter, onRisk,
  coverageFilter, onCoverage,
  viewMode, onViewMode,
  totalShown, totalAll,
  projectId,
  onBulkRegen,
}: {
  search: string; onSearch: (v: string) => void;
  typeFilter: string; onType: (v: string) => void;
  priorityFilter: string; onPriority: (v: string) => void;
  riskFilter: string; onRisk: (v: string) => void;
  coverageFilter: string; onCoverage: (v: string) => void;
  viewMode: ViewMode; onViewMode: (v: ViewMode) => void;
  totalShown: number; totalAll: number;
  projectId: string;
  onBulkRegen: () => void;
}) {
  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  const selStyle = (active: boolean) => ({
    padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: active ? 700 : 400,
    border: `1px solid ${active ? theme.colors.primary : border}`,
    background: active ? `${theme.colors.primary}22` : "transparent",
    color: active ? theme.colors.primary : textLight,
    cursor: "pointer", transition: "all 0.12s ease"
  });

  return (
    <div style={{
      padding: "12px 16px", borderRadius: 12, marginBottom: 14,
      background: surface, border: `1px solid ${border}`,
      display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap"
    }}>
      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => onSearch(e.target.value)}
        placeholder="Search requirements…"
        style={{
          flex: "1 1 200px", padding: "7px 12px", borderRadius: 8,
          border: `1px solid ${border}`, background: isDark ? "#111" : "#fff",
          color: text, fontSize: 13, outline: "none"
        }}
      />

      {/* Type filter */}
      <select
        value={typeFilter}
        onChange={e => onType(e.target.value)}
        style={{
          padding: "7px 10px", borderRadius: 8, border: `1px solid ${border}`,
          background: isDark ? "#111" : "#fff", color: text, fontSize: 12, cursor: "pointer"
        }}
      >
        <option value="all">All Types</option>
        <option value="api">API</option>
        <option value="ui">UI</option>
        <option value="hybrid">Hybrid</option>
        <option value="performance">Performance</option>
        <option value="security">Security</option>
        <option value="business">Business</option>
      </select>

      {/* Priority */}
      <select
        value={priorityFilter}
        onChange={e => onPriority(e.target.value)}
        style={{
          padding: "7px 10px", borderRadius: 8, border: `1px solid ${border}`,
          background: isDark ? "#111" : "#fff", color: text, fontSize: 12, cursor: "pointer"
        }}
      >
        <option value="all">All Priorities</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Risk */}
      <select
        value={riskFilter}
        onChange={e => onRisk(e.target.value)}
        style={{
          padding: "7px 10px", borderRadius: 8, border: `1px solid ${border}`,
          background: isDark ? "#111" : "#fff", color: text, fontSize: 12, cursor: "pointer"
        }}
      >
        <option value="all">All Risk</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Coverage */}
      <div style={{ display: "flex", gap: 4 }}>
        {[
          { v: "all", label: "All" },
          { v: "covered", label: "✓ Covered" },
          { v: "uncovered", label: "✗ Gaps" },
        ].map(({ v, label }) => (
          <button key={v} onClick={() => onCoverage(v)} style={selStyle(coverageFilter === v)}>
            {label}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
        <button onClick={() => onViewMode("matrix")} style={selStyle(viewMode === "matrix")}>
          Matrix
        </button>
        <button onClick={() => onViewMode("insights")} style={selStyle(viewMode === "insights")}>
          AI Insights
        </button>
      </div>

      {/* Export + Bulk regen */}
      <a
        href={exportRTMUrl(projectId)}
        download
        style={{
          padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          border: `1px solid ${border}`, color: textLight, textDecoration: "none",
          display: "flex", alignItems: "center", gap: 4, transition: "all 0.12s"
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = theme.colors.primary;
          (e.currentTarget as HTMLAnchorElement).style.color = theme.colors.primary;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLAnchorElement).style.borderColor = border;
          (e.currentTarget as HTMLAnchorElement).style.color = textLight;
        }}
      >
        ↓ Export JSON
      </a>

      <button
        onClick={onBulkRegen}
        style={{
          padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          border: "none", background: theme.colors.primary, color: "#fff",
          cursor: "pointer", transition: "opacity 0.12s"
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      >
        ↺ Regen All
      </button>

      {/* Result count */}
      <div style={{ fontSize: 11, color: textLight, whiteSpace: "nowrap" }}>
        {totalShown} / {totalAll}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main RTMTable component
// ─────────────────────────────────────────────────────────────
export default function RTMTable({ projectId }: { projectId: string }) {
  const [data, setData] = useState<RTMEnterpriseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [coverageFilter, setCoverageFilter] = useState("all");

  // View
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [selectedReq, setSelectedReq] = useState<RTMRequirement | null>(null);

  // Modals
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenTarget, setRegenTarget] = useState<{ id: string; title: string } | null>(null);

  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  const load = () => {
    setLoading(true);
    fetchRTM(projectId)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, [projectId]);

  // Filtered requirements
  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    return data.requirements.filter(r => {
      if (q && !r.title.toLowerCase().includes(q) &&
          !r.id.toLowerCase().includes(q) &&
          !r.description.toLowerCase().includes(q) &&
          !r.tags.some(t => t.toLowerCase().includes(q))) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (priorityFilter !== "all" && r.businessPriority !== priorityFilter) return false;
      if (riskFilter !== "all" && r.riskLevel !== riskFilter) return false;
      if (coverageFilter === "covered" && !r.covered) return false;
      if (coverageFilter === "uncovered" && r.covered) return false;
      return true;
    });
  }, [data, search, typeFilter, priorityFilter, riskFilter, coverageFilter]);

  const openRegen = (req: RTMRequirement) => {
    setRegenTarget({ id: req.id, title: req.title });
    setRegenOpen(true);
  };

  const doRegen = async (reqId: string) => {
    await regenerateRTM(projectId, [reqId]);
    setRegenOpen(false);
    setRegenTarget(null);
    load();
  };

  const doBulkRegen = async () => {
    await regenerateRTM(projectId, []);
    load();
  };

  if (loading) return <div style={{ marginTop: 32 }}><Loader /></div>;

  if (error || !data) {
    return (
      <div style={{ marginTop: 32, textAlign: "center", color: textLight, padding: "48px 0" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: text, marginBottom: 6 }}>No RTM data yet</div>
        <div style={{ fontSize: 13 }}>Generate a project to build the Requirements Traceability Matrix.</div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 24, width: "100%", minWidth: 0 }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ color: theme.colors.primary, margin: 0 }}>
          Requirements Traceability Matrix
        </h3>
        <div style={{ fontSize: 12, color: textLight, marginTop: 4 }}>
          Enterprise intelligence system · {data.requirements.length} requirements ·
          Generated {new Date(data.generatedAt).toLocaleString()}
        </div>
      </div>

      {/* ── Intelligence Summary ── */}
      <RTMDashboard analytics={data.analytics} />

      {/* ── Toolbar ── */}
      <Toolbar
        search={search} onSearch={setSearch}
        typeFilter={typeFilter} onType={setTypeFilter}
        priorityFilter={priorityFilter} onPriority={setPriorityFilter}
        riskFilter={riskFilter} onRisk={setRiskFilter}
        coverageFilter={coverageFilter} onCoverage={setCoverageFilter}
        viewMode={viewMode} onViewMode={setViewMode}
        totalShown={filtered.length} totalAll={data.requirements.length}
        projectId={projectId}
        onBulkRegen={doBulkRegen}
      />

      {/* ── Matrix view ── */}
      {viewMode === "matrix" && (
        <>
          {/* Full-width table card */}
          <div style={{
            border: `1px solid ${border}`,
            borderRadius: 12,
            background: surface,
            boxShadow: theme.shadow.card,
            overflow: "hidden",
            width: "100%",
          }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: textLight }}>
                No requirements match the current filters.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 680 }}>
                  <RTMTableHeader />
                  <tbody>
                    {filtered.map((req, idx) => (
                      <RTMTableRow
                        key={req.id}
                        req={req}
                        idx={idx}
                        isSelected={selectedReq?.id === req.id}
                        onSelect={() => setSelectedReq(
                          selectedReq?.id === req.id ? null : req
                        )}
                        onRegenerate={() => openRegen(req)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Deep view — fixed right-side drawer, slides over content */}
          {selectedReq && (
            <>
              {/* dim backdrop — click anywhere outside panel to close */}
              <div
                onClick={() => setSelectedReq(null)}
                style={{
                  position: "fixed", inset: 0, zIndex: 40,
                  background: "rgba(0,0,0,0.18)", backdropFilter: "blur(1px)",
                }}
              />
              <div style={{
                position: "fixed", top: 0, right: 0, bottom: 0,
                width: 400, zIndex: 50,
                boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
                overflowY: "auto",
                display: "flex", flexDirection: "column",
              }}>
                <RTMDeepView
                  req={selectedReq}
                  onClose={() => setSelectedReq(null)}
                  onRegenerate={id => {
                    const r = data.requirements.find(x => x.id === id);
                    if (r) openRegen(r);
                  }}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* ── AI Insights view ── */}
      {viewMode === "insights" && (
        <RTMInsights
          insights={data.insights}
          onSelectReq={req => {
            setViewMode("matrix");
            setSelectedReq(req);
          }}
        />
      )}

      {/* ── Regenerate modal ── */}
      <RTMRegenerateModal
        open={regenOpen}
        onClose={() => { setRegenOpen(false); setRegenTarget(null); }}
        onRegenerate={doRegen}
        requirement={regenTarget}
      />
    </div>
  );
}
