import { useState, useEffect } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import {
  getCoverageSummary, getRequirementCoverages, getEndpointCoverages,
  getJourneyCoverages, recomputeCoverage,
  type RTMCoverageSummary, type RequirementCoverage,
  type EndpointCoverage, type JourneyCoverage,
} from "@/api/rtm";
import { RTMWorkspaceLayout } from "../components/RTMWorkspaceLayout";

// ─── Gauge ────────────────────────────────────────────────────────────────────

function Gauge({ pct, label, sub, target }: { pct: number; label: string; sub: string; target?: number }) {
  const { TXT: text, TXT2: muted, P, BDR: border, CARD: surface } = useColors();
  const color = pct >= 80 ? "#4CAF50" : pct >= 50 ? "#FFA726" : "#EF4444";
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16, flex: "1 1 200px" }}>
      <svg width={88} height={88} viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke={`${color}20`} strokeWidth={8} />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 44 44)" style={{ transition: "stroke-dasharray 0.6s" }}
        />
        <text x="44" y="44" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="800" fill={color}>
          {Math.round(pct)}%
        </text>
      </svg>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: text }}>{label}</div>
        <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{sub}</div>
        {target !== undefined && (
          <div style={{ fontSize: 10, color: pct >= target * 100 ? "#4CAF50" : "#FFA726", marginTop: 4, fontWeight: 600 }}>
            {pct >= target * 100 ? "✓ Target met" : `Target: ${Math.round(target * 100)}%`}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Coverage table ───────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "#4CAF50" : score >= 50 ? "#FFA726" : "#EF4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 60, height: 5, borderRadius: 3, background: "#e0e0e0", overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, minWidth: 28 }}>{Math.round(score)}%</span>
    </div>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function CoverageContent({ projectId, versionId, frameworkId }: { projectId: string; versionId: string; frameworkId?: string }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P } = useColors();

  const [summary,      setSummary]      = useState<RTMCoverageSummary | null>(null);
  const [reqCovs,      setReqCovs]      = useState<RequirementCoverage[]>([]);
  const [epCovs,       setEpCovs]       = useState<EndpointCoverage[]>([]);
  const [jCovs,        setJCovs]        = useState<JourneyCoverage[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [recomputing,  setRecomputing]  = useState(false);
  const [activeTab,    setActiveTab]    = useState<"requirements" | "endpoints" | "journeys">("requirements");

  const load = () => {
    setLoading(true);
    Promise.all([
      getCoverageSummary(projectId, versionId, frameworkId).catch(() => null),
      getRequirementCoverages(projectId, versionId, frameworkId).catch(() => []),
      getEndpointCoverages(projectId, versionId, frameworkId).catch(() => []),
      getJourneyCoverages(projectId, versionId, frameworkId).catch(() => []),
    ]).then(([sum, reqs, eps, js]) => {
      setSummary(sum);
      setReqCovs(reqs);
      setEpCovs(eps);
      setJCovs(js);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [projectId, versionId, frameworkId]);

  async function handleRecompute() {
    setRecomputing(true);
    try {
      await recomputeCoverage(projectId, versionId);
      toast.success("Coverage recomputed");
      load();
    } catch { toast.error("Recompute failed"); }
    finally { setRecomputing(false); }
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: active ? 700 : 500,
    border: `1px solid ${active ? P : border}`,
    background: active ? `${P}1A` : "transparent",
    color: active ? P : muted, cursor: "pointer",
  });

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: muted, fontSize: 13 }}>Loading coverage…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Recompute button + last computed */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={handleRecompute}
          disabled={recomputing}
          style={{ padding: "8px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", background: P, color: "#fff", cursor: recomputing ? "wait" : "pointer" }}
        >
          {recomputing ? "Recomputing…" : "↻ Recompute Coverage"}
        </button>
        {summary?.lastComputedAt && (
          <span style={{ fontSize: 11, color: muted }}>
            Last computed: {new Date(summary.lastComputedAt).toLocaleString()}
          </span>
        )}
      </div>

      {/* Gauges */}
      {summary ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Gauge
            pct={summary.requirementsCoveragePercent}
            label="Requirements"
            sub={`${summary.requirementsCovered} / ${summary.requirementsTotal} covered`}
          />
          <Gauge
            pct={summary.endpointsCoveragePercent}
            label="Endpoints"
            sub={`${summary.endpointsCovered} / ${summary.endpointsTotal} covered`}
          />
          <Gauge
            pct={summary.journeysCoveragePercent}
            label="Journeys"
            sub={`${summary.journeysCovered} / ${summary.journeysTotal} covered`}
          />
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: "16px 20px", flex: "1 1 160px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ fontSize: 11, color: muted, marginBottom: 4 }}>Risk-Weighted Score</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: summary.riskWeightedCoverageScore >= 0.8 ? "#4CAF50" : "#FFA726" }}>
              {Math.round(summary.riskWeightedCoverageScore * 100)}
            </div>
            <div style={{ fontSize: 10, color: muted }}>out of 100</div>
          </div>
        </div>
      ) : (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: "32px 24px", textAlign: "center", color: muted, fontSize: 13 }}>
          No coverage data. Click "Recompute Coverage" to generate metrics.
        </div>
      )}

      {/* Coverage tables */}
      {(reqCovs.length > 0 || epCovs.length > 0 || jCovs.length > 0) && (
        <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${border}`, display: "flex", gap: 8 }}>
            <button onClick={() => setActiveTab("requirements")} style={tabStyle(activeTab === "requirements")}>Requirements</button>
            <button onClick={() => setActiveTab("endpoints")} style={tabStyle(activeTab === "endpoints")}>Endpoints</button>
            <button onClick={() => setActiveTab("journeys")} style={tabStyle(activeTab === "journeys")}>Journeys</button>
          </div>

          <div style={{ overflowX: "auto" }}>
            {activeTab === "requirements" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    {["Key","Title","Risk","Priority","Coverage","UI Flows","Endpoints","Journeys","Tests"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reqCovs.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${border}`, background: i % 2 === 0 ? "transparent" : `${border}30` }}>
                      <td style={{ padding: "8px 12px", fontWeight: 700, color: P }}>{c.requirementKey ?? "–"}</td>
                      <td style={{ padding: "8px 12px", color: text, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.requirementTitle ?? "–"}</td>
                      <td style={{ padding: "8px 12px", color: muted, textTransform: "capitalize" }}>{c.risk ?? "–"}</td>
                      <td style={{ padding: "8px 12px", color: muted }}>{c.priority ?? "–"}</td>
                      <td style={{ padding: "8px 12px" }}><ScoreBar score={c.coverageScore * 100} /></td>
                      <td style={{ padding: "8px 12px", color: muted }}>{c.uiFlowsCovered}/{c.uiFlowsTotal}</td>
                      <td style={{ padding: "8px 12px", color: muted }}>{c.endpointsCovered}/{c.endpointsTotal}</td>
                      <td style={{ padding: "8px 12px", color: muted }}>{c.journeysCovered}/{c.journeysTotal}</td>
                      <td style={{ padding: "8px 12px", color: muted }}>{c.totalTests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "endpoints" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    {["Key","Method","Path","Coverage","Total Tests","Passed","Failed"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {epCovs.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${border}`, background: i % 2 === 0 ? "transparent" : `${border}30` }}>
                      <td style={{ padding: "8px 12px", fontWeight: 700, color: P }}>{c.endpointKey ?? "–"}</td>
                      <td style={{ padding: "8px 12px", fontWeight: 700, color: ({ GET: "#4CAF50", POST: "#2196F3", PUT: "#FF9800", DELETE: "#EF4444", PATCH: "#9C27B0" }[c.method ?? ""] ?? muted) }}>{c.method ?? "–"}</td>
                      <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: text }}>{c.path ?? "–"}</td>
                      <td style={{ padding: "8px 12px" }}><ScoreBar score={c.coverageScore * 100} /></td>
                      <td style={{ padding: "8px 12px", color: muted }}>{c.totalTests}</td>
                      <td style={{ padding: "8px 12px", color: "#4CAF50", fontWeight: 600 }}>{c.passedTests}</td>
                      <td style={{ padding: "8px 12px", color: "#EF4444", fontWeight: 600 }}>{c.failedTests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "journeys" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    {["Key","Name","Coverage","Total Tests","Passed","Failed"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {jCovs.map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${border}`, background: i % 2 === 0 ? "transparent" : `${border}30` }}>
                      <td style={{ padding: "8px 12px", fontWeight: 700, color: P }}>{c.journeyKey ?? "–"}</td>
                      <td style={{ padding: "8px 12px", color: text, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.journeyName ?? "–"}</td>
                      <td style={{ padding: "8px 12px" }}><ScoreBar score={c.coverageScore * 100} /></td>
                      <td style={{ padding: "8px 12px", color: muted }}>{c.totalTests}</td>
                      <td style={{ padding: "8px 12px", color: "#4CAF50", fontWeight: 600 }}>{c.passedTests}</td>
                      <td style={{ padding: "8px 12px", color: "#EF4444", fontWeight: 600 }}>{c.failedTests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function RTMCoveragePage({ projectId }: { projectId: string }) {
  return (
    <RTMWorkspaceLayout projectId={projectId} title="Coverage Dashboard" subtitle="Requirement, endpoint, and journey coverage metrics">
      {(versionId, frameworkId) => <CoverageContent projectId={projectId} versionId={versionId} frameworkId={frameworkId} />}
    </RTMWorkspaceLayout>
  );
}
