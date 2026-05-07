import { useState, useEffect, useMemo } from "react";
import { useColors } from "@/hooks/useColors";
import toast from "react-hot-toast";
import {
  fetchRTMSnapshot, getJourneyCoverages, getJourneyGaps,
  generateRtmTests,
  type RtmJourney, type JourneyCoverage, type JourneyGap,
} from "@/api/rtm";
import { RTMWorkspaceLayout } from "../components/RTMWorkspaceLayout";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Journey detail drawer ────────────────────────────────────────────────────

function JourneyDetail({
  journey, projectId, versionId, cov, gap, onClose,
}: {
  journey: RtmJourney;
  projectId: string;
  versionId: string;
  cov: JourneyCoverage | null;
  gap: JourneyGap | null;
  onClose: () => void;
}) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P, BG: bg } = useColors();
  const [genLoading, setGenLoading] = useState(false);

  async function handleGenerate() {
    setGenLoading(true);
    try {
      await generateRtmTests(projectId, versionId, {
        framework: "playwright", language: "typescript",
        strategy: "regression", includeUI: true, includeAPI: true, includeHybrid: true,
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
            <div style={{ fontSize: 11, fontWeight: 800, color: P, marginBottom: 4 }}>{journey.key}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: text, lineHeight: 1.4 }}>{journey.name}</div>
            {journey.description && <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>{journey.description}</div>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, color: muted, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Linked requirements */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
              Linked Requirements ({journey.requirementIds?.length ?? 0})
            </div>
            {journey.requirementIds?.length ? (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {journey.requirementIds.map(id => (
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
              <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                {[
                  { label: "Total", v: cov.totalTests, color: text },
                  { label: "Passed", v: cov.passedTests, color: "#4CAF50" },
                  { label: "Failed", v: cov.failedTests, color: "#EF4444" },
                ].map(({ label, v, color }) => (
                  <div key={label} style={{ textAlign: "center", flex: 1, padding: "8px", background: bg, borderRadius: 8, border: `1px solid ${border}` }}>
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
                  { label: "Missing End-to-End Flow", active: gap.missingEndToEndFlow },
                  { label: "Missing Alternative Paths", active: gap.missingAlternativePaths },
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

          {/* Generate action */}
          <button
            onClick={handleGenerate}
            disabled={genLoading}
            style={{ padding: "9px 0", borderRadius: 8, fontSize: 12, fontWeight: 700, border: "none", background: P, color: "#fff", cursor: genLoading ? "wait" : "pointer", marginTop: 8 }}
          >
            {genLoading ? "Generating…" : "⚡ Generate Tests for Journey"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function JourneysContent({ projectId, versionId }: { projectId: string; versionId: string }) {
  const { CARD: surface, BDR: border, TXT: text, TXT2: muted, P } = useColors();

  const [journeys,    setJourneys]    = useState<RtmJourney[]>([]);
  const [coverages,   setCoverages]   = useState<JourneyCoverage[]>([]);
  const [gaps,        setGaps]        = useState<JourneyGap[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<RtmJourney | null>(null);
  const [search,      setSearch]      = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchRTMSnapshot(projectId),
      getJourneyCoverages(projectId, versionId).catch(() => []),
      getJourneyGaps(projectId, versionId).catch(() => []),
    ]).then(([snap, covs, gps]) => {
      setJourneys(snap?.journeys ?? []);
      setCoverages(covs);
      setGaps(gps);
    }).finally(() => setLoading(false));
  }, [projectId, versionId]);

  const covMap = useMemo(() => new Map(coverages.map(c => [c.journeyId, c])), [coverages]);
  const gapMap = useMemo(() => new Map(gaps.map(g => [g.journeyId, g])), [gaps]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return journeys.filter(j => !q || j.key.toLowerCase().includes(q) || j.name.toLowerCase().includes(q) || j.description.toLowerCase().includes(q));
  }, [journeys, search]);

  if (loading) return <div style={{ padding: 32, textAlign: "center", color: muted, fontSize: 13 }}>Loading journeys…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {selected && (
        <JourneyDetail
          journey={selected} projectId={projectId} versionId={versionId}
          cov={covMap.get(selected.id) ?? null}
          gap={gapMap.get(selected.id) ?? null}
          onClose={() => setSelected(null)}
        />
      )}

      {/* Filter bar */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search journeys…"
          style={{ flex: 1, padding: "6px 10px", borderRadius: 7, border: `1px solid ${border}`, background: surface, color: text, fontSize: 12, outline: "none" }}
        />
        <span style={{ fontSize: 11, color: muted }}>{filtered.length} / {journeys.length}</span>
      </div>

      {/* Table */}
      <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: muted, fontSize: 13 }}>
            {journeys.length === 0 ? "No journeys defined in this RTM version." : "No journeys match the search."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {["Key","Name","Linked Reqs","Coverage","Gaps"].map(h => (
                    <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: muted, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                  <th style={{ padding: "9px 12px", width: 50 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((j, i) => {
                  const cov = covMap.get(j.id);
                  const gap = gapMap.get(j.id);
                  const isSelected = selected?.id === j.id;
                  return (
                    <tr
                      key={j.id}
                      onClick={() => setSelected(isSelected ? null : j)}
                      style={{
                        borderBottom: `1px solid ${border}`, cursor: "pointer",
                        background: isSelected ? `${P}09` : i % 2 === 0 ? "transparent" : `${border}30`,
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = `${P}06`; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? "transparent" : `${border}30`; }}
                    >
                      <td style={{ padding: "9px 12px", fontWeight: 800, color: P }}>{j.key}</td>
                      <td style={{ padding: "9px 12px", color: text, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.name}</td>
                      <td style={{ padding: "9px 12px", color: muted }}>{j.requirementIds?.length ?? 0}</td>
                      <td style={{ padding: "9px 12px" }}>
                        {cov ? <ScoreBar score={cov.coverageScore * 100} /> : <span style={{ color: muted, fontSize: 10 }}>–</span>}
                      </td>
                      <td style={{ padding: "9px 12px" }}>
                        {gap?.hasNoTests && badge("No Tests", "#EF5350")}
                        {gap?.missingEndToEndFlow && badge("No E2E", "#FFA726")}
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

export function RTMJourneysPage({ projectId }: { projectId: string }) {
  return (
    <RTMWorkspaceLayout projectId={projectId} title="Journeys" subtitle="User journey coverage and gaps">
      {versionId => <JourneysContent projectId={projectId} versionId={versionId} />}
    </RTMWorkspaceLayout>
  );
}
