import { useState, useEffect, useMemo } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import {
  fetchRTMSnapshot, getEndpointCoverages, getEndpointGaps,
  generateRtmTests,
  type RtmEndpoint, type EndpointCoverage, type EndpointGap,
} from "@/api/rtm";
import { RTMWorkspaceLayout } from "../components/RTMWorkspaceLayout";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const METHOD_COLOR: Record<string, string> = {
  GET: "#4CAF50", POST: "#2196F3", PUT: "#FF9800", DELETE: "#EF4444", PATCH: "#9C27B0",
};

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
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{Math.round(score)}%</span>
    </div>
  );
}

// ─── Endpoint detail drawer ───────────────────────────────────────────────────

function EndpointDetail({
  endpoint, projectId, versionId, cov, gap, onClose,
}: {
  endpoint: RtmEndpoint;
  projectId: string;
  versionId: string;
  cov: EndpointCoverage | null;
  gap: EndpointGap | null;
  onClose: () => void;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();
  const [genLoading, setGenLoading] = useState(false);
  const methodColor = METHOD_COLOR[endpoint.method] ?? "#9E9E9E";

  async function handleGenerate() {
    setGenLoading(true);
    try {
      await generateRtmTests(projectId, versionId, {
        framework: "playwright", language: "typescript",
        strategy: "regression", includeUI: false, includeAPI: true, includeHybrid: false,
        baseUrl: "http://localhost:3000",
      });
      toast.success("Tests generation started");
    } catch { toast.error("Generation failed"); }
    finally { setGenLoading(false); }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.15)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 400, zIndex: 50,
        background: surface, borderLeft: `1px solid ${border}`,
        display: "flex", flexDirection: "column", overflowY: "auto",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: P, marginBottom: 4 }}>{endpoint.key}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {badge(endpoint.method, methodColor)}
              <span style={{ fontSize: 13, fontWeight: 700, color: text, fontFamily: "monospace" }}>{endpoint.path}</span>
            </div>
            {endpoint.serviceName && <div style={{ fontSize: 11, color: muted }}>{endpoint.serviceName}</div>}
            {endpoint.description && <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>{endpoint.description}</div>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: muted, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Linked requirements */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              Linked Requirements ({endpoint.requirementIds?.length ?? 0})
            </div>
            {endpoint.requirementIds?.length ? (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {endpoint.requirementIds.map(id => (
                  <span key={id} style={{ padding: "2px 8px", borderRadius: 5, fontSize: 10, background: `${P}12`, color: P, fontWeight: 700 }}>{id}</span>
                ))}
              </div>
            ) : <div style={{ fontSize: 11, color: muted }}>No requirements linked</div>}
          </div>

          {/* Coverage */}
          {cov && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Coverage</div>
              <ScoreBar score={cov.coverageScore * 100} />
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                {[
                  { label: "Total", v: cov.totalTests, color: text },
                  { label: "Passed", v: cov.passedTests, color: "#4CAF50" },
                  { label: "Failed", v: cov.failedTests, color: "#EF4444" },
                ].map(({ label, v, color }) => (
                  <div key={label} style={{ flex: 1, textAlign: "center", padding: "8px", background: bg, borderRadius: 8, border: `1px solid ${border}` }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color }}>{v}</div>
                    <div style={{ fontSize: 9, color: muted }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gaps */}
          {gap && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Gaps</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { label: "No Tests", active: gap.hasNoTests },
                  { label: "Missing Positive Tests", active: gap.missingPositiveTests },
                  { label: "Missing Negative Tests", active: gap.missingNegativeTests },
                  { label: "Missing Boundary Tests", active: gap.missingBoundaryTests },
                ].map(({ label, active }) => (
                  <div key={label} style={{
                    padding: "7px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                    background: active ? "#EF535014" : "#4CAF5014",
                    border: `1px solid ${active ? "#EF535044" : "#4CAF5044"}`,
                    color: active ? "#EF5350" : "#4CAF50",
                  }}>
                    {active ? "✗" : "✓"} {label}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={genLoading}
            style={{ padding: "9px 0", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", background: P, color: "#fff", cursor: genLoading ? "wait" : "pointer", marginTop: 8 }}
          >
            {genLoading ? "Generating…" : "⚡ Generate Tests for Endpoint"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function EndpointsContent({ projectId, versionId }: { projectId: string; versionId: string }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P } = useColors();

  const [endpoints,  setEndpoints]  = useState<RtmEndpoint[]>([]);
  const [coverages,  setCoverages]  = useState<EndpointCoverage[]>([]);
  const [gaps,       setGaps]       = useState<EndpointGap[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState<RtmEndpoint | null>(null);
  const [search,     setSearch]     = useState("");
  const [methodFilt, setMethodFilt] = useState("all");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchRTMSnapshot(projectId),
      getEndpointCoverages(projectId, versionId).catch(() => []),
      getEndpointGaps(projectId, versionId).catch(() => []),
    ]).then(([snap, covs, gps]) => {
      setEndpoints(snap?.endpoints ?? []);
      setCoverages(covs);
      setGaps(gps);
    }).finally(() => setLoading(false));
  }, [projectId, versionId]);

  const covMap = useMemo(() => new Map(coverages.map(c => [c.endpointId, c])), [coverages]);
  const gapMap = useMemo(() => new Map(gaps.map(g => [g.endpointId, g])), [gaps]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return endpoints.filter(ep => {
      if (methodFilt !== "all" && ep.method !== methodFilt) return false;
      if (q && !ep.key.toLowerCase().includes(q) && !ep.path.toLowerCase().includes(q) && !(ep.serviceName ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [endpoints, search, methodFilt]);

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: muted, fontSize: 13 }}>Loading endpoints…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {selected && (
        <EndpointDetail
          endpoint={selected} projectId={projectId} versionId={versionId}
          cov={covMap.get(selected.id) ?? null}
          gap={gapMap.get(selected.id) ?? null}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Filter bar */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search endpoints…"
          style={{ flex: "1 1 180px", padding: "6px 10px", borderRadius: 7, border: `1px solid ${border}`, background: surface, color: text, fontSize: 12, outline: "none" }}
        />
        <select value={methodFilt} onChange={e => setMethodFilt(e.target.value)} style={{ padding: "6px 9px", borderRadius: 7, border: `1px solid ${border}`, background: surface, color: text, fontSize: 11, cursor: "pointer" }}>
          <option value="all">All Methods</option>
          {["GET","POST","PUT","DELETE","PATCH"].map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span style={{ fontSize: 11, color: muted, marginLeft: "auto" }}>{filtered.length} / {endpoints.length}</span>
      </div>

      {/* Table */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: muted, fontSize: 13 }}>
            {endpoints.length === 0 ? "No endpoints defined in this RTM version." : "No endpoints match the search."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {["Key","Method","Path","Service","Linked Reqs","Coverage","Gaps"].map(h => (
                    <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                  <th style={{ padding: "9px 12px", width: 50 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((ep, i) => {
                  const cov = covMap.get(ep.id);
                  const gap = gapMap.get(ep.id);
                  const isSelected = selected?.id === ep.id;
                  return (
                    <tr
                      key={ep.id}
                      onClick={() => setSelected(isSelected ? null : ep)}
                      style={{
                        borderBottom: `1px solid ${border}`, cursor: "pointer",
                        background: isSelected ? `${P}09` : i % 2 === 0 ? "transparent" : `${border}30`,
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = `${P}06`; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "transparent" : `${border}30`; }}
                    >
                      <td style={{ padding: "9px 12px", fontWeight: 800, color: P }}>{ep.key}</td>
                      <td style={{ padding: "9px 12px" }}>{badge(ep.method, METHOD_COLOR[ep.method] ?? "#9E9E9E")}</td>
                      <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 11, color: text, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.path}</td>
                      <td style={{ padding: "9px 12px", color: muted }}>{ep.serviceName ?? "–"}</td>
                      <td style={{ padding: "9px 12px", color: muted }}>{ep.requirementIds?.length ?? 0}</td>
                      <td style={{ padding: "9px 12px" }}>
                        {cov ? <ScoreBar score={cov.coverageScore * 100} /> : <span style={{ color: muted, fontSize: 10 }}>–</span>}
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        {gap?.hasNoTests && badge("No Tests", "#EF5350")}
                        {gap?.missingNegativeTests && badge("NEG", "#FFA726")}
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

export function RTMEndpointsPage({ projectId }: { projectId: string }) {
  return (
    <RTMWorkspaceLayout projectId={projectId} title="Endpoints" subtitle="API endpoint coverage and gaps">
      {versionId => <EndpointsContent projectId={projectId} versionId={versionId} />}
    </RTMWorkspaceLayout>
  );
}
