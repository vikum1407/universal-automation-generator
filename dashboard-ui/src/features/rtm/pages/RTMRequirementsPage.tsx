import { useState, useEffect, useMemo } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import {
  fetchRTMSnapshot, getRequirementCoverages, getRequirementGaps,
  getRequirementMappings, generateRtmTests, scoreAllRequirementRisk,
  type RtmDomainRequirement, type RequirementCoverage, type RequirementGap,
  type RequirementMappingSummary, type AIRiskScore,
} from "@/api/rtm";
import { RTMWorkspaceLayout } from "../components/RTMWorkspaceLayout";
import { ExtractRequirementsModal }  from "../ai/ExtractRequirementsModal";
import { ClusterRequirementsView }   from "../ai/ClusterRequirementsView";
import { RewriteRequirementModal }   from "../ai/RewriteRequirementModal";
import { RiskExplanationTooltip }    from "../ai/RiskExplanationTooltip";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_COLOR: Record<string, string> = { critical: "#EF4444", high: "#F97316", medium: "#FFA726", low: "#4CAF50" };
const PRI_COLOR:  Record<string, string> = { P0: "#EF4444", P1: "#F97316", P2: "#FFA726", P3: "#9E9E9E" };

function badge(label: string, color: string) {
  return (
    <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}44` }}>
      {label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#4CAF50" : score >= 50 ? "#FFA726" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 52, height: 5, borderRadius: 3, background: "#e0e0e0", overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{Math.round(score)}%</span>
    </div>
  );
}

// ─── Detail drawer ────────────────────────────────────────────────────────────

function RequirementDetail({
  req, versionId, projectId, onClose, aiScore, onRewriteAccepted,
}: {
  req: RtmDomainRequirement;
  versionId: string;
  projectId: string;
  onClose: () => void;
  aiScore?: AIRiskScore;
  onRewriteAccepted: () => void;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();
  const [cov,         setCov]         = useState<RequirementCoverage | null>(null);
  const [gap,         setGap]         = useState<RequirementGap | null>(null);
  const [mappings,    setMappings]    = useState<RequirementMappingSummary | null>(null);
  const [genLoading,  setGenLoading]  = useState(false);
  const [section,     setSection]     = useState<"overview" | "mappings" | "coverage" | "gaps">("overview");
  const [rewriteOpen, setRewriteOpen] = useState(false);

  useEffect(() => {
    getRequirementCoverages(projectId, versionId)
      .then(list => setCov(list.find(c => c.requirementId === req.id) ?? null))
      .catch(() => {});
    getRequirementGaps(projectId, versionId)
      .then(list => setGap(list.find(g => g.requirementId === req.id) ?? null))
      .catch(() => {});
    getRequirementMappings(projectId, versionId, req.id)
      .then(setMappings)
      .catch(() => {});
  }, [req.id, projectId, versionId]);

  async function handleGenerate() {
    setGenLoading(true);
    try {
      await generateRtmTests(projectId, versionId, {
        framework: "playwright", language: "typescript",
        strategy: "regression", includeUI: true, includeAPI: true, includeHybrid: false,
        baseUrl: "http://localhost:3000",
      });
      toast.success("Tests generation started");
    } catch { toast.error("Generation failed"); }
    finally { setGenLoading(false); }
  }

  const secBtn = (id: typeof section, label: string) => (
    <button
      onClick={() => setSection(id)}
      style={{
        padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: section === id ? 700 : 500,
        border: `1px solid ${section === id ? P : border}`,
        background: section === id ? `${P}1A` : "transparent",
        color: section === id ? P : muted, cursor: "pointer",
      }}
    >
      {label}
    </button>
  );

  return (
    <>
      {rewriteOpen && (
        <RewriteRequirementModal
          req={req}
          projectId={projectId}
          versionId={versionId}
          onClose={() => setRewriteOpen(false)}
          onAccepted={onRewriteAccepted}
        />
      )}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.15)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 420, zIndex: 50,
        background: surface, borderLeft: `1px solid ${border}`,
        display: "flex", flexDirection: "column", overflowY: "auto",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: P }}>{req.key}</span>
              {badge(req.risk, RISK_COLOR[req.risk] ?? "#9E9E9E")}
              {badge(req.priority, PRI_COLOR[req.priority] ?? "#9E9E9E")}
              {badge(req.status, "#607D8B")}
              {aiScore && <RiskExplanationTooltip score={aiScore} />}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: text, lineHeight: 1.4 }}>{req.title}</div>
            <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>{req.type}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: muted, cursor: "pointer", padding: 4 }}>×</button>
        </div>

        {/* Section nav */}
        <div style={{ padding: "10px 20px", borderBottom: `1px solid ${border}`, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {secBtn("overview", "Overview")}
          {secBtn("mappings", "Mappings")}
          {secBtn("coverage", "Coverage")}
          {secBtn("gaps", "Gaps")}
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

          {section === "overview" && (
            <>
              {req.description && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Description</div>
                  <div style={{ fontSize: 12, color: text, lineHeight: 1.6 }}>{req.description}</div>
                </div>
              )}
              {req.tags?.length > 0 && (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {req.tags.map(t => (
                    <span key={t} style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, background: `${P}12`, color: P }}>{t}</span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <button
                  onClick={handleGenerate}
                  disabled={genLoading}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", background: P, color: "#fff", cursor: genLoading ? "wait" : "pointer" }}
                >
                  {genLoading ? "Generating…" : "⚡ Generate Tests"}
                </button>
                <button
                  onClick={() => setRewriteOpen(true)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    border: `1px solid ${border}`, background: "transparent", color: muted, cursor: "pointer",
                  }}
                >
                  ✦ Rewrite with AI
                </button>
              </div>
            </>
          )}

          {section === "mappings" && (
            <>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>UI Flows</div>
                {mappings?.uiFlows?.length ? mappings.uiFlows.map(f => (
                  <div key={f.id} style={{ padding: "6px 10px", borderRadius: 6, background: bg, border: `1px solid ${border}`, marginBottom: 5, fontSize: 12, color: text, display: "flex", justifyContent: "space-between" }}>
                    <span>{f.name}</span>
                    <span style={{ fontSize: 10, color: muted }}>{f.strength}</span>
                  </div>
                )) : <div style={{ fontSize: 11, color: muted }}>No UI flows mapped</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Endpoints</div>
                {mappings?.endpoints?.length ? mappings.endpoints.map(ep => (
                  <div key={ep.id} style={{ padding: "6px 10px", borderRadius: 6, background: bg, border: `1px solid ${border}`, marginBottom: 5, fontSize: 12, color: text, display: "flex", justifyContent: "space-between" }}>
                    <span><strong>{ep.method}</strong> {ep.path}</span>
                    <span style={{ fontSize: 10, color: muted }}>{ep.strength}</span>
                  </div>
                )) : <div style={{ fontSize: 11, color: muted }}>No endpoints mapped</div>}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Journeys</div>
                {mappings?.journeys?.length ? mappings.journeys.map(j => (
                  <div key={j.id} style={{ padding: "6px 10px", borderRadius: 6, background: bg, border: `1px solid ${border}`, marginBottom: 5, fontSize: 12, color: text }}>
                    {j.name}
                  </div>
                )) : <div style={{ fontSize: 11, color: muted }}>No journeys mapped</div>}
              </div>
            </>
          )}

          {section === "coverage" && (
            <>
              {cov ? (
                <>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[
                      { label: "Overall", score: cov.coverageScore * 100 },
                      { label: "Risk-weighted", score: cov.riskWeightedScore * 100 },
                    ].map(({ label, score }) => (
                      <div key={label} style={{ flex: 1, minWidth: 100, background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: muted, marginBottom: 6 }}>{label}</div>
                        <ScoreBar score={score} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[
                      { label: "UI Flows", cov: cov.uiFlowsCovered, total: cov.uiFlowsTotal },
                      { label: "Endpoints", cov: cov.endpointsCovered, total: cov.endpointsTotal },
                      { label: "Journeys", cov: cov.journeysCovered, total: cov.journeysTotal },
                    ].map(({ label, cov: c, total }) => (
                      <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: muted }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: text, marginTop: 4 }}>{c}/{total}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: muted, marginBottom: 4 }}>Tests</div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {[
                        { label: "Total", v: cov.totalTests, color: text },
                        { label: "Passed", v: cov.passedTests, color: "#4CAF50" },
                        { label: "Failed", v: cov.failedTests, color: "#EF4444" },
                        { label: "Skipped", v: cov.skippedTests, color: "#9E9E9E" },
                      ].map(({ label, v, color }) => (
                        <div key={label} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color }}>{v}</div>
                          <div style={{ fontSize: 9, color: muted }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: muted }}>No coverage data yet. Recompute coverage first.</div>
              )}
            </>
          )}

          {section === "gaps" && (
            <>
              {gap ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { label: "No Tests",       active: gap.hasNoTests },
                      { label: "Missing UI",     active: gap.missingUITests },
                      { label: "Missing API",    active: gap.missingAPITests },
                      { label: "Missing Hybrid", active: gap.missingHybridTests },
                      { label: "Missing Negative", active: gap.missingNegativeTests },
                      { label: "Missing Boundary", active: gap.missingBoundaryTests },
                    ].map(({ label, active }) => (
                      <div key={label} style={{
                        padding: "8px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: active ? "#EF535014" : "#4CAF5014",
                        border: `1px solid ${active ? "#EF535044" : "#4CAF5044"}`,
                        color: active ? "#EF5350" : "#4CAF50",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        {active ? "✗" : "✓"} {label}
                      </div>
                    ))}
                  </div>
                  <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: muted, marginBottom: 6 }}>Suggested tests to generate</div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {[
                        { label: "UI", v: gap.suggestedUITests },
                        { label: "API", v: gap.suggestedAPITests },
                        { label: "Hybrid", v: gap.suggestedHybridTests },
                      ].map(({ label, v }) => (
                        <div key={label} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: text }}>{v}</div>
                          <div style={{ fontSize: 10, color: muted }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={genLoading}
                    style={{ padding: "9px 0", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", background: P, color: "#fff", cursor: genLoading ? "wait" : "pointer" }}
                  >
                    {genLoading ? "Generating…" : "⚡ Generate Missing Tests"}
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 12, color: muted }}>No gap data. Run gap analysis first.</div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

interface PageProps { projectId: string }

function RequirementsContent({ projectId, versionId }: { projectId: string; versionId: string }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P } = useColors();

  const [reqs,         setReqs]         = useState<RtmDomainRequirement[]>([]);
  const [coverages,    setCoverages]    = useState<RequirementCoverage[]>([]);
  const [gaps,         setGaps]         = useState<RequirementGap[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedReq,  setSelectedReq]  = useState<RtmDomainRequirement | null>(null);

  const [search,       setSearch]       = useState("");
  const [riskFilter,   setRiskFilter]   = useState("all");
  const [priFilter,    setPriFilter]    = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [covFilter,    setCovFilter]    = useState("all");

  // AI state
  const [aiScores,      setAiScores]      = useState<Map<string, AIRiskScore>>(new Map());
  const [scoringAll,    setScoringAll]    = useState(false);
  const [extractOpen,   setExtractOpen]   = useState(false);
  const [clusterOpen,   setClusterOpen]   = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchRTMSnapshot(projectId),
      getRequirementCoverages(projectId, versionId).catch(() => []),
      getRequirementGaps(projectId, versionId).catch(() => []),
    ]).then(([snap, covs, gps]) => {
      setReqs(snap?.requirements ?? []);
      setCoverages(covs);
      setGaps(gps);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [projectId, versionId]);

  async function handleScoreAllRisk() {
    setScoringAll(true);
    try {
      const scores = await scoreAllRequirementRisk(projectId, versionId);
      setAiScores(new Map(scores.map(s => [s.requirementId, s])));
      toast.success(`AI risk scored ${scores.length} requirements`);
    } catch {
      toast.error("Risk scoring failed. Check AI service configuration.");
    } finally {
      setScoringAll(false);
    }
  }

  const covMap = useMemo(() => new Map(coverages.map(c => [c.requirementId, c])), [coverages]);
  const gapMap = useMemo(() => new Map(gaps.map(g => [g.requirementId, g])), [gaps]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return reqs.filter(r => {
      if (q && !r.key.toLowerCase().includes(q) && !r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      if (riskFilter !== "all" && r.risk !== riskFilter) return false;
      if (priFilter !== "all" && r.priority !== priFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (covFilter === "covered") { const c = covMap.get(r.id); if (!c || c.coverageScore < 0.5) return false; }
      if (covFilter === "uncovered") { const c = covMap.get(r.id); if (c && c.coverageScore >= 0.5) return false; }
      if (covFilter === "has-gaps") { if (!gapMap.has(r.id)) return false; }
      return true;
    });
  }, [reqs, search, riskFilter, priFilter, statusFilter, covFilter, covMap, gapMap]);

  const selStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 10px", borderRadius: 7, fontSize: 11, fontWeight: active ? 700 : 500,
    border: `1px solid ${active ? P : border}`,
    background: active ? `${P}1A` : "transparent",
    color: active ? P : muted, cursor: "pointer",
  });

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: muted, fontSize: 13 }}>Loading requirements…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {extractOpen && (
        <ExtractRequirementsModal
          projectId={projectId}
          versionId={versionId}
          onClose={() => setExtractOpen(false)}
          onImported={loadData}
        />
      )}
      {clusterOpen && (
        <ClusterRequirementsView
          projectId={projectId}
          versionId={versionId}
          requirements={reqs}
          onClose={() => setClusterOpen(false)}
        />
      )}
      {selectedReq && (
        <RequirementDetail
          req={selectedReq}
          versionId={versionId}
          projectId={projectId}
          onClose={() => setSelectedReq(null)}
          aiScore={aiScores.get(selectedReq.id)}
          onRewriteAccepted={loadData}
        />
      )}

      {/* Filter bar */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search requirements…"
          style={{ flex: "1 1 180px", padding: "6px 10px", borderRadius: 7, border: `1px solid ${border}`, background: surface, color: text, fontSize: 12, outline: "none" }}
        />
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={{ padding: "6px 9px", borderRadius: 7, border: `1px solid ${border}`, background: surface, color: text, fontSize: 11, cursor: "pointer" }}>
          <option value="all">All Risk</option>
          {["critical","high","medium","low"].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={priFilter} onChange={e => setPriFilter(e.target.value)} style={{ padding: "6px 9px", borderRadius: 7, border: `1px solid ${border}`, background: surface, color: text, fontSize: 11, cursor: "pointer" }}>
          <option value="all">All Priority</option>
          {["P0","P1","P2","P3"].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: "6px 9px", borderRadius: 7, border: `1px solid ${border}`, background: surface, color: text, fontSize: 11, cursor: "pointer" }}>
          <option value="all">All Status</option>
          {["draft","approved","deprecated"].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { v: "all", label: "All" },
            { v: "covered", label: "Covered" },
            { v: "uncovered", label: "Uncovered" },
            { v: "has-gaps", label: "Has Gaps" },
          ].map(({ v, label }) => (
            <button key={v} onClick={() => setCovFilter(v)} style={selStyle(covFilter === v)}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
          <button
            onClick={() => setExtractOpen(true)}
            style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, border: `1px solid ${P}44`, background: `${P}0a`, color: P, cursor: "pointer", whiteSpace: "nowrap" }}
          >
            ✦ Import with AI
          </button>
          <button
            onClick={() => setClusterOpen(true)}
            disabled={reqs.length === 0}
            style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, border: `1px solid ${border}`, background: "transparent", color: muted, cursor: reqs.length === 0 ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
          >
            ◈ Cluster
          </button>
          <button
            onClick={handleScoreAllRisk}
            disabled={scoringAll || reqs.length === 0}
            style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, border: `1px solid ${border}`, background: "transparent", color: muted, cursor: scoringAll || reqs.length === 0 ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}
          >
            {scoringAll ? "Scoring…" : "⚑ Score Risk"}
          </button>
          <span style={{ fontSize: 11, color: muted }}>{filtered.length} / {reqs.length}</span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: muted, fontSize: 13 }}>
            No requirements match the current filters.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {["Key","Title","Type","Priority","Risk","Status","Coverage","Gaps","AI Risk"].map(h => (
                    <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                  <th style={{ padding: "9px 12px", width: 50 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((req, i) => {
                  const cov = covMap.get(req.id);
                  const gap = gapMap.get(req.id);
                  const isSelected = selectedReq?.id === req.id;
                  return (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedReq(isSelected ? null : req)}
                      style={{
                        borderBottom: `1px solid ${border}`, cursor: "pointer",
                        background: isSelected ? `${P}09` : i % 2 === 0 ? "transparent" : `${border}30`,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = `${P}06`; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "transparent" : `${border}30`; }}
                    >
                      <td style={{ padding: "9px 12px", fontWeight: 800, color: P, whiteSpace: "nowrap" }}>{req.key}</td>
                      <td style={{ padding: "9px 12px", color: text, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.title}</td>
                      <td style={{ padding: "9px 12px", color: muted }}>{req.type}</td>
                      <td style={{ padding: "9px 12px" }}>{badge(req.priority, PRI_COLOR[req.priority] ?? "#9E9E9E")}</td>
                      <td style={{ padding: "9px 12px" }}>{badge(req.risk, RISK_COLOR[req.risk] ?? "#9E9E9E")}</td>
                      <td style={{ padding: "9px 12px" }}>{badge(req.status, "#607D8B")}</td>
                      <td style={{ padding: "9px 12px" }}>
                        {cov ? <ScoreBar score={cov.coverageScore * 100} /> : <span style={{ color: muted, fontSize: 10 }}>–</span>}
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        {gap ? (
                          <div style={{ display: "flex", gap: 3 }}>
                            {gap.hasNoTests && <span title="No tests" style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "#EF535018", color: "#EF5350" }}>NO TESTS</span>}
                            {gap.missingNegativeTests && <span title="Missing negative tests" style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "#FFA72618", color: "#FFA726" }}>NEG</span>}
                            {gap.missingBoundaryTests && <span title="Missing boundary tests" style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: "#FFA72618", color: "#FFA726" }}>BOUND</span>}
                          </div>
                        ) : <span style={{ color: muted, fontSize: 10 }}>–</span>}
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        {aiScores.has(req.id) ? (
                          <RiskExplanationTooltip score={aiScores.get(req.id)!} />
                        ) : (
                          <span style={{ color: muted, fontSize: 10 }}>–</span>
                        )}
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        <span style={{ fontSize: 10, color: P, fontWeight: 700 }}>→</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function RTMRequirementsPage({ projectId }: PageProps) {
  return (
    <RTMWorkspaceLayout
      projectId={projectId}
      title="Requirements"
      subtitle="All requirements in this RTM version"
    >
      {versionId => <RequirementsContent projectId={projectId} versionId={versionId} />}
    </RTMWorkspaceLayout>
  );
}
