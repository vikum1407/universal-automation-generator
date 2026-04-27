import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import ReactFlow, { Background, Controls, MiniMap, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import { theme } from "@/theme";
import type { EnrichedFlow, EnrichedEndpoint, SystemMapSummary } from "@/api/system-map";
import {
  fetchSystemMapSummary, fetchSystemFlows, fetchSystemEndpoints,
  fetchFlowGraph, rebuildSystemMap, METHOD_COLOR,
} from "@/api/system-map";

// ── Shared helpers ────────────────────────────────────────────────────────────

function Badge({ label, color, small }: { label: string; color: string; small?: boolean }) {
  return (
    <span style={{
      padding: small ? "1px 6px" : "2px 8px",
      borderRadius: 5, fontSize: small ? 9 : 10, fontWeight: 700,
      background: `${color}22`, color,
    }}>{label}</span>
  );
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  const isDark = theme.mode === "dark";
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: textLight }}>{label}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color }}>{value}%</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: isDark ? "#333" : "#eee" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 2, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function ScoreDot({ score, size = 8 }: { score: number; size?: number }) {
  const color = score >= 70 ? "#66BB6A" : score >= 40 ? "#FFA726" : "#EF5350";
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      background: color, flexShrink: 0, boxShadow: `0 0 4px ${color}66`,
    }} />
  );
}

function MethodBadge({ method }: { method: string }) {
  const color = METHOD_COLOR[method] ?? "#90A4AE";
  return (
    <span style={{
      padding: "3px 8px", borderRadius: 6,
      background: color, color: "#000",
      fontSize: 10, fontWeight: 700, letterSpacing: "0.03em",
    }}>{method}</span>
  );
}

// ── Summary tiles ─────────────────────────────────────────────────────────────

function SummaryTiles({
  summary, rebuilding, onRebuild,
}: { summary: SystemMapSummary; rebuilding: boolean; onRebuild: () => void }) {
  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  const tiles = [
    {
      icon: "🌐", label: "Total Flows", value: summary.totalFlows,
      sub: `${summary.coveredFlowsPct}% covered`,
      color: theme.colors.primary,
    },
    {
      icon: "🔌", label: "Total Endpoints", value: summary.totalEndpoints,
      sub: `${summary.coveredEndpointsPct}% covered`,
      color: "#448AFF",
    },
    {
      icon: "✅", label: "Covered",
      value: `${summary.projectType !== "api" ? summary.coveredFlowsPct : summary.coveredEndpointsPct}%`,
      sub: summary.projectType === "hybrid"
        ? `${summary.coveredFlows}F / ${summary.coveredEndpoints}E`
        : summary.projectType === "ui"
        ? `${summary.coveredFlows} flows`
        : `${summary.coveredEndpoints} endpoints`,
      color: summary.coveredEndpointsPct >= 70 ? "#66BB6A" : "#FFA726",
    },
    {
      icon: "🔥", label: "High Risk",
      value: summary.highRiskFlows + summary.highRiskEndpoints,
      sub: `${summary.highRiskFlows} flows · ${summary.highRiskEndpoints} endpoints`,
      color: (summary.highRiskFlows + summary.highRiskEndpoints) > 0 ? "#EF5350" : "#66BB6A",
    },
    {
      icon: "⚠️", label: "Unused Endpoints", value: summary.unusedEndpoints,
      sub: "No tests or requirements",
      color: summary.unusedEndpoints > 0 ? "#FFA726" : "#66BB6A",
    },
    {
      icon: "❌", label: "Failing Tests",
      value: summary.flowsWithFailingTests + summary.endpointsWithFailingTests,
      sub: `${summary.flowsWithFailingTests}F · ${summary.endpointsWithFailingTests}E`,
      color: (summary.flowsWithFailingTests + summary.endpointsWithFailingTests) > 0 ? "#EF5350" : "#66BB6A",
    },
  ];

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <button onClick={onRebuild} disabled={rebuilding} style={{
          padding: "8px 18px", borderRadius: 8, border: "none",
          background: rebuilding ? "#9e7de0" : theme.colors.primary,
          color: "#fff", fontWeight: 700, fontSize: 12,
          cursor: rebuilding ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span>{rebuilding ? "⏳" : "🔄"}</span>
          {rebuilding ? "Rebuilding…" : "Rebuild Map"}
        </button>
        <Badge
          label={summary.projectType.toUpperCase()}
          color={summary.projectType === "hybrid" ? "#FF9800" : summary.projectType === "ui" ? "#9C27B0" : "#448AFF"}
        />
        <span style={{ fontSize: 11, color: textLight }}>
          {summary.totalFlows + summary.totalEndpoints} total items in system map
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {tiles.map(t => (
          <div key={t.label} style={{
            flex: "1 1 120px", minWidth: 0, padding: "14px 16px", borderRadius: 14,
            background: surface, border: `1px solid ${border}`, boxShadow: theme.shadow.card,
          }}>
            <div style={{ fontSize: 20, marginBottom: 5 }}>{t.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: t.color, lineHeight: 1 }}>{t.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: text, marginTop: 4 }}>{t.label}</div>
            {t.sub && <div style={{ fontSize: 10, color: textLight, marginTop: 2 }}>{t.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Flow detail panel ─────────────────────────────────────────────────────────

function FlowDetailPanel({
  flow, graph, onClose,
}: { flow: EnrichedFlow | null; graph: { nodes: any[]; edges: any[] } | null; onClose: () => void }) {
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => { setShowGraph(false); }, [flow?.id]);

  if (!flow) return null;

  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const bg = isDark ? theme.colors.darkBackground : "#f5f5f8";

  const covColor = flow.coverageScore >= 70 ? "#66BB6A" : flow.coverageScore >= 30 ? "#FFA726" : "#EF5350";
  const riskColor = flow.riskScore >= 70 ? "#EF5350" : flow.riskScore >= 40 ? "#FFA726" : "#66BB6A";
  const stabColor = flow.stabilityScore >= 70 ? "#66BB6A" : flow.stabilityScore >= 40 ? "#FFA726" : "#EF5350";

  // Filter graph to this flow's nodes (by URL match)
  const filteredGraph = (() => {
    const allNodes: any[] = graph?.nodes ?? [];
    const allEdges: any[] = graph?.edges ?? [];
    const flowNodes = allNodes.filter((n: any) => (n.pageUrl ?? n.id) === flow.url);
    const flowNodeIds = new Set(flowNodes.map((n: any) => n.id));
    const flowEdges = allEdges.filter((e: any) => e.from === flow.url || e.to === flow.url || flowNodeIds.has(e.from) || flowNodeIds.has(e.to));
    return { nodes: flowNodes, edges: flowEdges };
  })();

  const rfNodes = filteredGraph.nodes.map((n: any, i: number) => ({
    id: n.id,
    position: { x: (i % 3) * 220, y: Math.floor(i / 3) * 140 },
    data: { label: n.text || n.selector || "(element)", url: n.pageUrl },
    type: "flowNode",
  }));
  const rfEdges = filteredGraph.edges.map((e: any, i: number) => ({
    id: e.id ?? `e${i}`,
    source: e.from,
    target: e.to,
    label: e.action,
    animated: true,
    style: { stroke: theme.colors.primary, strokeWidth: 1.5 },
    labelStyle: { fill: theme.colors.primary, fontSize: 9 },
  }));

  const MiniFlowNode = ({ data }: any) => (
    <div style={{
      padding: "6px 10px", borderRadius: 8, border: `1.5px solid ${theme.colors.primary}`,
      background: surface, color: text, fontSize: 10, fontWeight: 600,
      width: 160, wordBreak: "break-word",
    }}>
      {data.label}
      <Handle type="target" position={Position.Top} style={{ width: 6, height: 6 }} />
      <Handle type="source" position={Position.Bottom} style={{ width: 6, height: 6 }} />
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.18)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 460, zIndex: 50,
        background: surface, borderLeft: `1px solid ${border}`,
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 28px rgba(0,0,0,0.13)", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Badge label="UI FLOW" color="#9C27B0" />
              {flow.hasFailingTests && <Badge label="FAILING TESTS" color="#EF5350" />}
              {flow.coverageScore === 0 && <Badge label="UNCOVERED" color="#FFA726" />}
            </div>
            <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 17, color: textLight }}>✕</button>
          </div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.colors.primary }}>{flow.name}</h3>
          <div style={{ fontSize: 11, color: textLight, marginTop: 3, fontFamily: "monospace", wordBreak: "break-all" }}>{flow.url}</div>
        </div>

        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Nodes", value: flow.nodeCount },
              { label: "Edges", value: flow.edgeCount },
              { label: "Requirements", value: flow.linkedRequirements.length },
              { label: "Tests", value: flow.linkedTests.length },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: "10px 12px", borderRadius: 8, background: bg }}>
                <div style={{ fontSize: 10, color: textLight, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: theme.colors.primary, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Scores */}
          <div style={{ padding: "12px 14px", borderRadius: 10, background: bg }}>
            <ScoreBar label="Coverage" value={flow.coverageScore} color={covColor} />
            <ScoreBar label="Risk" value={flow.riskScore} color={riskColor} />
            <ScoreBar label="Stability" value={flow.stabilityScore} color={stabColor} />
          </div>

          {/* Requirements */}
          {flow.linkedRequirements.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                Linked Requirements ({flow.linkedRequirements.length})
              </div>
              {flow.linkedRequirements.map((req, i) => (
                <div key={i} style={{
                  padding: "7px 10px", marginBottom: 5, borderRadius: 7,
                  background: bg, border: `1px solid ${border}`,
                  fontSize: 11, color: text, display: "flex", gap: 6,
                }}>
                  <span>📋</span><span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{req}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tests */}
          {flow.linkedTests.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                Linked Tests ({flow.linkedTests.length})
              </div>
              {flow.linkedTests.map((t, i) => (
                <div key={i} style={{
                  padding: "6px 10px", marginBottom: 4, borderRadius: 6,
                  background: bg, border: `1px solid ${border}`,
                  fontSize: 10, fontFamily: "monospace", color: textLight,
                }}>
                  🧪 {t}
                </div>
              ))}
            </div>
          )}

          {/* Actions on this page */}
          {flow.actions.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                Actions ({flow.nodeCount} total)
              </div>
              {flow.actions.map((a, i) => (
                <div key={i} style={{
                  padding: "5px 10px", marginBottom: 3, borderRadius: 6,
                  background: bg, fontSize: 11, color: text, display: "flex", gap: 6,
                }}>
                  <span style={{ color: theme.colors.primary }}>→</span>{a}
                </div>
              ))}
            </div>
          )}

          {/* AI insight */}
          {flow.coverageScore === 0 && (
            <div style={{
              padding: "10px 12px", borderRadius: 8,
              background: isDark ? "#1a0e00" : "#fffbf0",
              border: `1px solid ${isDark ? "#3a2a00" : "#FFE082"}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#FFA726", textTransform: "uppercase", marginBottom: 4 }}>🧠 AI Insight</div>
              <div style={{ fontSize: 12, color: text, lineHeight: 1.6 }}>
                This flow has no test coverage. It represents {flow.nodeCount} UI interactions with no automated verification.
                Consider generating a UI test from the Suggestions tab.
              </div>
            </div>
          )}

          {/* Mini graph */}
          <div>
            <button onClick={() => setShowGraph(v => !v)} style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: `1px solid ${border}`, background: "transparent",
              color: text, fontSize: 12, fontWeight: 600,
              cursor: "pointer", display: "flex", justifyContent: "space-between",
            }}>
              <span>🌐 Flow Graph ({rfNodes.length} nodes)</span>
              <span>{showGraph ? "▲" : "▼"}</span>
            </button>
            {showGraph && rfNodes.length > 0 && (
              <div style={{ height: 280, marginTop: 8, borderRadius: 10, border: `1px solid ${border}`, overflow: "hidden" }}>
                <ReactFlow
                  nodes={rfNodes} edges={rfEdges} fitView
                  nodeTypes={{ flowNode: MiniFlowNode }}
                  minZoom={0.4}
                >
                  <Background color={isDark ? "#333" : "#ddd"} gap={16} />
                  <Controls />
                </ReactFlow>
              </div>
            )}
            {showGraph && rfNodes.length === 0 && (
              <div style={{ padding: 16, textAlign: "center", color: textLight, fontSize: 12 }}>
                No graph nodes available for this flow.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Endpoint detail panel ─────────────────────────────────────────────────────

function EndpointDetailPanel({
  endpoint, onClose,
}: { endpoint: EnrichedEndpoint | null; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "schema" | "quality" | "insights">("overview");

  useEffect(() => { setActiveTab("overview"); }, [endpoint?.id]);

  if (!endpoint) return null;

  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;
  const bg = isDark ? theme.colors.darkBackground : "#f5f5f8";
  const codeBg = isDark ? "#0d0d1a" : "#f8f8ff";

  const methodColor = METHOD_COLOR[endpoint.method] ?? "#90A4AE";
  const covColor = endpoint.coverageScore >= 70 ? "#66BB6A" : endpoint.coverageScore >= 30 ? "#FFA726" : "#EF5350";
  const riskColor = endpoint.riskScore >= 70 ? "#EF5350" : endpoint.riskScore >= 40 ? "#FFA726" : "#66BB6A";
  const stabColor = endpoint.stabilityScore >= 70 ? "#66BB6A" : endpoint.stabilityScore >= 40 ? "#FFA726" : "#EF5350";

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "schema", label: "Schema" },
    { id: "quality", label: "Quality" },
    { id: "insights", label: "AI Insights" },
  ] as const;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.18)" }} />
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 480, zIndex: 50,
        background: surface, borderLeft: `1px solid ${border}`,
        display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 28px rgba(0,0,0,0.13)",
      }}>
        {/* Header */}
        <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <MethodBadge method={endpoint.method} />
              {endpoint.unused && <Badge label="UNUSED" color="#FF9800" />}
              {endpoint.hasFailingTests && <Badge label="FAILING" color="#EF5350" />}
              {endpoint.coverageScore === 0 && !endpoint.unused && <Badge label="UNCOVERED" color="#FFA726" />}
            </div>
            <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 17, color: textLight }}>✕</button>
          </div>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: theme.colors.primary, fontFamily: "monospace" }}>
            {endpoint.path}
          </h3>
          {endpoint.summary && (
            <div style={{ fontSize: 12, color: textLight, marginTop: 4 }}>{endpoint.summary}</div>
          )}
          {endpoint.tags.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
              {endpoint.tags.map(t => <Badge key={t} label={t} color="#42A5F5" small />)}
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", borderBottom: `1px solid ${border}`, flexShrink: 0,
          background: isDark ? theme.colors.darkBackground : "#fafafa",
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, padding: "9px 4px", border: "none",
                borderBottom: `2px solid ${activeTab === tab.id ? theme.colors.primary : "transparent"}`,
                background: "transparent",
                color: activeTab === tab.id ? theme.colors.primary : textLight,
                fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 11,
                cursor: "pointer", transition: "color 0.15s",
              }}
            >{tab.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* Overview */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {endpoint.linkedRequirements.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
                    Linked Requirements ({endpoint.linkedRequirements.length})
                  </div>
                  {endpoint.linkedRequirements.map((req, i) => (
                    <div key={i} style={{
                      padding: "7px 10px", marginBottom: 5, borderRadius: 7,
                      background: bg, border: `1px solid ${border}`,
                      fontSize: 11, color: text, display: "flex", gap: 6,
                    }}>
                      <span>📋</span><span>{req}</span>
                    </div>
                  ))}
                </div>
              )}

              {endpoint.linkedTests.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
                    Linked Tests ({endpoint.linkedTests.length})
                  </div>
                  {endpoint.linkedTests.map((t, i) => (
                    <div key={i} style={{
                      padding: "6px 10px", marginBottom: 4, borderRadius: 6,
                      background: bg, border: `1px solid ${border}`,
                      fontSize: 10, fontFamily: "monospace", color: textLight,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{ fontSize: 12 }}>🧪</span> {t}
                      {endpoint.lastTestStatus === "passed" && i === 0 && <Badge label="passed" color="#66BB6A" small />}
                      {endpoint.lastTestStatus === "failed" && i === 0 && <Badge label="failed" color="#EF5350" small />}
                    </div>
                  ))}
                </div>
              )}

              {endpoint.parameters.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
                    Parameters ({endpoint.parameters.length})
                  </div>
                  {endpoint.parameters.map((p: any, i: number) => (
                    <div key={i} style={{
                      padding: "7px 10px", marginBottom: 4, borderRadius: 6,
                      background: bg, border: `1px solid ${border}`, fontSize: 11,
                    }}>
                      <span style={{ color: theme.colors.primary, fontWeight: 700 }}>{p.name}</span>
                      <span style={{ color: textLight, marginLeft: 6 }}>{p.in}</span>
                      {p.required && <Badge label="required" color="#EF5350" small />}
                      {p.description && <div style={{ color: textLight, fontSize: 10, marginTop: 2 }}>{p.description}</div>}
                    </div>
                  ))}
                </div>
              )}

              {endpoint.description && (
                <div style={{ fontSize: 12, color: textLight, lineHeight: 1.7, padding: "10px 12px", borderRadius: 8, background: bg }}>
                  {endpoint.description}
                </div>
              )}
            </div>
          )}

          {/* Schema */}
          {activeTab === "schema" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {endpoint.requestBody && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", marginBottom: 7 }}>Request Body</div>
                  <pre style={{
                    padding: "10px 12px", borderRadius: 8, background: codeBg,
                    border: `1px solid ${border}`, fontSize: 11, color: text,
                    overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: 220,
                  }}>
                    {JSON.stringify(endpoint.requestBody, null, 2)}
                  </pre>
                </div>
              )}

              {Object.entries(endpoint.responseSchemas).length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", marginBottom: 7 }}>Responses</div>
                  {Object.entries(endpoint.responseSchemas).map(([code, resp]: [string, any]) => (
                    <div key={code} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <span style={{
                          padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700,
                          background: code.startsWith("2") ? "#00C85322" : "#EF535022",
                          color: code.startsWith("2") ? "#00C853" : "#EF5350",
                        }}>{code}</span>
                        {resp?.description && <span style={{ fontSize: 11, color: textLight }}>{resp.description}</span>}
                      </div>
                      {resp?.content && (
                        <pre style={{
                          padding: "8px 10px", borderRadius: 7, background: codeBg,
                          border: `1px solid ${border}`, fontSize: 10, color: text,
                          overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: 160,
                        }}>
                          {JSON.stringify(resp.content, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!endpoint.requestBody && Object.entries(endpoint.responseSchemas).length === 0 && (
                <div style={{ textAlign: "center", padding: 24, color: textLight, fontSize: 12 }}>
                  No schema information available for this endpoint.
                </div>
              )}
            </div>
          )}

          {/* Quality */}
          {activeTab === "quality" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ padding: "14px 16px", borderRadius: 10, background: bg }}>
                <ScoreBar label="Coverage" value={endpoint.coverageScore} color={covColor} />
                <ScoreBar label="Risk" value={endpoint.riskScore} color={riskColor} />
                <ScoreBar label="Stability" value={endpoint.stabilityScore} color={stabColor} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { label: "Tests", value: endpoint.linkedTests.length, color: "#42A5F5" },
                  { label: "Requirements", value: endpoint.linkedRequirements.length, color: "#9C27B0" },
                  { label: "Last Status", value: endpoint.lastTestStatus ?? "—", color: endpoint.lastTestStatus === "passed" ? "#66BB6A" : endpoint.lastTestStatus === "failed" ? "#EF5350" : "#90A4AE" },
                  { label: "Unused", value: endpoint.unused ? "Yes" : "No", color: endpoint.unused ? "#FFA726" : "#66BB6A" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: "10px 12px", borderRadius: 8, background: bg }}>
                    <div style={{ fontSize: 10, color: textLight, fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color, marginTop: 2 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Insights */}
          {activeTab === "insights" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {endpoint.coverageScore === 0 && (
                <div style={{ padding: "12px 14px", borderRadius: 8, background: isDark ? "#1a0a00" : "#fff8f0", border: `1px solid ${isDark ? "#3a1500" : "#FFE0B2"}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#FF9800", textTransform: "uppercase", marginBottom: 6 }}>🔍 No Test Coverage</div>
                  <div style={{ fontSize: 12, color: text, lineHeight: 1.6 }}>
                    This endpoint has no automated tests. Any regressions or schema changes will go undetected.
                    Generate an API test from the Suggestions or Tests tabs.
                  </div>
                </div>
              )}

              {endpoint.riskScore >= 70 && (
                <div style={{ padding: "12px 14px", borderRadius: 8, background: isDark ? "#1a0000" : "#fff5f5", border: `1px solid ${isDark ? "#3a0000" : "#FFCDD2"}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#EF5350", textTransform: "uppercase", marginBottom: 6 }}>🔥 High Risk Endpoint</div>
                  <div style={{ fontSize: 12, color: text, lineHeight: 1.6 }}>
                    Risk score of {endpoint.riskScore}%. This endpoint may have high business impact or limited test stability.
                    Prioritize test generation and ensure schema contracts are validated.
                  </div>
                </div>
              )}

              {endpoint.hasFailingTests && (
                <div style={{ padding: "12px 14px", borderRadius: 8, background: isDark ? "#1a0000" : "#fff5f5", border: `1px solid ${isDark ? "#3a0000" : "#FFCDD2"}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#EF5350", textTransform: "uppercase", marginBottom: 6 }}>❌ Tests Failing</div>
                  <div style={{ fontSize: 12, color: text, lineHeight: 1.6 }}>
                    One or more tests for this endpoint are currently failing. Check the Auto-Heal tab for patch suggestions.
                  </div>
                </div>
              )}

              {endpoint.unused && (
                <div style={{ padding: "12px 14px", borderRadius: 8, background: isDark ? "#1a1000" : "#fffbf0", border: `1px solid ${isDark ? "#3a2500" : "#FFE082"}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#FFA726", textTransform: "uppercase", marginBottom: 6 }}>⚠️ Unused Endpoint</div>
                  <div style={{ fontSize: 12, color: text, lineHeight: 1.6 }}>
                    No tests or requirements are linked to this endpoint. It may be deprecated, undocumented, or a coverage gap.
                    Consider adding it to the RTM and generating a test.
                  </div>
                </div>
              )}

              {!endpoint.coverageScore && !endpoint.riskScore && !endpoint.hasFailingTests && !endpoint.unused && (
                <div style={{ textAlign: "center", padding: 24, color: textLight, fontSize: 12 }}>
                  ✅ No issues detected for this endpoint.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Flows tab ─────────────────────────────────────────────────────────────────

function FlowsTab({
  flows, graph, selectedId, onSelect,
}: {
  flows: EnrichedFlow[];
  graph: { nodes: any[]; edges: any[] } | null;
  selectedId: string | null;
  onSelect: (f: EnrichedFlow) => void;
}) {
  const [showFullGraph, setShowFullGraph] = useState(false);
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "low">("all");

  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  const filtered = flows.filter(f => {
    if (riskFilter === "high") return f.riskScore >= 70;
    if (riskFilter === "low") return f.riskScore < 40;
    return true;
  });

  // Build ReactFlow graph for full view
  const rfNodes = (graph?.nodes ?? []).map((n: any, i: number) => ({
    id: n.id,
    position: { x: (i % 5) * 260, y: Math.floor(i / 5) * 160 },
    data: { label: n.text || n.selector || "(element)", url: n.pageUrl },
    type: "flowNode",
  }));

  const rfEdges = (graph?.edges ?? []).map((e: any, i: number) => ({
    id: e.id ?? `e${i}`,
    source: e.from,
    target: e.to,
    label: e.action,
    animated: true,
    style: { stroke: theme.colors.primary, strokeWidth: 1.5 },
    labelStyle: { fill: theme.colors.primary, fontSize: 9 },
  }));

  const FlowNode = ({ data }: any) => (
    <div style={{
      padding: "8px 12px", borderRadius: 10, border: `1.5px solid ${theme.colors.primary}`,
      background: surface, color: text, fontSize: 11, fontWeight: 600,
      width: 200, wordBreak: "break-word",
    }}>
      <div style={{ fontSize: 9, color: textLight, marginBottom: 2, fontFamily: "monospace" }}>
        {data.url ? (() => { try { return new URL(data.url).pathname; } catch { return data.url.slice(0, 30); } })() : ""}
      </div>
      {data.label}
      <Handle type="target" position={Position.Top} style={{ width: 6, height: 6 }} />
      <Handle type="source" position={Position.Bottom} style={{ width: 6, height: 6 }} />
    </div>
  );

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value as any)}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`, background: isDark ? surface : "#fff", color: text, fontSize: 12 }}>
          <option value="all">All Risk Levels ({flows.length})</option>
          <option value="high">High Risk ({flows.filter(f => f.riskScore >= 70).length})</option>
          <option value="low">Low Risk ({flows.filter(f => f.riskScore < 40).length})</option>
        </select>
        <span style={{ fontSize: 12, color: textLight }}>{filtered.length} flow{filtered.length !== 1 ? "s" : ""}</span>
        <button onClick={() => setShowFullGraph(v => !v)} style={{
          marginLeft: "auto", padding: "7px 14px", borderRadius: 8,
          border: `1px solid ${showFullGraph ? theme.colors.primary : border}`,
          background: showFullGraph ? `${theme.colors.primary}15` : "transparent",
          color: showFullGraph ? theme.colors.primary : text, fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>
          🌐 {showFullGraph ? "Hide Graph" : "Full Graph"}
        </button>
      </div>

      {/* Full graph */}
      {showFullGraph && (
        <div style={{ height: 480, marginBottom: 16, borderRadius: 12, border: `1px solid ${border}`, overflow: "hidden", background: isDark ? theme.colors.darkBackground : "#fafafa" }}>
          {rfNodes.length > 0 ? (
            <ReactFlow nodes={rfNodes} edges={rfEdges} fitView nodeTypes={{ flowNode: FlowNode }}>
              <Background color={isDark ? "#333" : "#ddd"} gap={16} />
              <Controls />
              <MiniMap nodeColor={() => surface} maskColor={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
            </ReactFlow>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: textLight, fontSize: 13 }}>
              No flow graph data available.
            </div>
          )}
        </div>
      )}

      {/* Flows table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: textLight, fontSize: 13 }}>
          No flows match the current filter.
        </div>
      ) : (
        <div style={{ borderRadius: 14, border: `1px solid ${border}`, background: surface, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {["Flow Name", "Nodes", "Requirements", "Tests", "Coverage", "Risk", "Stability", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(flow => {
                const selected = flow.id === selectedId;
                const riskColor = flow.riskScore >= 70 ? "#EF5350" : flow.riskScore >= 40 ? "#FFA726" : "#66BB6A";
                return (
                  <tr key={flow.id} onClick={() => onSelect(flow)}
                    style={{
                      cursor: "pointer",
                      background: selected ? (isDark ? "#1e1230" : "#f0eaff") : "transparent",
                      borderLeft: `3px solid ${selected ? theme.colors.primary : "transparent"}`,
                    }}
                    onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = isDark ? "#1a1a2e" : "#fafafa"; }}
                    onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                  >
                    <td style={{ padding: "11px 14px", maxWidth: 200 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{flow.name}</div>
                      <div style={{ fontSize: 10, color: textLight, fontFamily: "monospace", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{flow.url}</div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 12, color: text }}>{flow.nodeCount}</span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 11, color: flow.linkedRequirements.length ? theme.colors.primary : textLight }}>{flow.linkedRequirements.length || "—"}</span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 11, color: flow.linkedTests.length ? "#42A5F5" : textLight }}>{flow.linkedTests.length || "—"}</span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <ScoreDot score={flow.coverageScore} />
                        <span style={{ fontSize: 11, color: textLight }}>{flow.coverageScore}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: riskColor }}>
                        {flow.riskScore >= 70 ? "High" : flow.riskScore >= 40 ? "Med" : "Low"}
                      </span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <ScoreDot score={flow.stabilityScore} />
                        <span style={{ fontSize: 11, color: textLight }}>{flow.stabilityScore}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <button onClick={e => { e.stopPropagation(); onSelect(flow); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${border}`, background: "transparent", color: text, fontSize: 10, cursor: "pointer" }}>
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Endpoints tab ─────────────────────────────────────────────────────────────

function EndpointsTab({
  endpoints, selectedId, onSelect,
}: {
  endpoints: EnrichedEndpoint[];
  selectedId: string | null;
  onSelect: (e: EnrichedEndpoint) => void;
}) {
  const [methodFilter, setMethodFilter] = useState("all");
  const [coverageFilter, setCoverageFilter] = useState<"all" | "covered" | "uncovered" | "unused">("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "high">("all");
  const [search, setSearch] = useState("");

  const isDark = theme.mode === "dark";
  const surface = isDark ? theme.colors.darkSurface : theme.colors.background;
  const border = isDark ? theme.colors.darkBorder : theme.colors.border;
  const text = isDark ? theme.colors.darkText : theme.colors.textDark;
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  const methods = Array.from(new Set(endpoints.map(e => e.method)));

  const filtered = endpoints.filter(ep => {
    if (methodFilter !== "all" && ep.method !== methodFilter) return false;
    if (coverageFilter === "covered" && ep.coverageScore === 0) return false;
    if (coverageFilter === "uncovered" && ep.coverageScore > 0) return false;
    if (coverageFilter === "unused" && !ep.unused) return false;
    if (riskFilter === "high" && ep.riskScore < 70) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!ep.path.toLowerCase().includes(q) && !ep.summary.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        <input placeholder="Search path or summary…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: "1 1 160px", padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`, background: isDark ? surface : "#fff", color: text, fontSize: 12, outline: "none" }} />
        <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`, background: isDark ? surface : "#fff", color: text, fontSize: 12 }}>
          <option value="all">All Methods</option>
          {methods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={coverageFilter} onChange={e => setCoverageFilter(e.target.value as any)}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`, background: isDark ? surface : "#fff", color: text, fontSize: 12 }}>
          <option value="all">All Coverage</option>
          <option value="covered">Covered</option>
          <option value="uncovered">Uncovered</option>
          <option value="unused">Unused</option>
        </select>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value as any)}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${border}`, background: isDark ? surface : "#fff", color: text, fontSize: 12 }}>
          <option value="all">All Risk</option>
          <option value="high">High Risk</option>
        </select>
        <span style={{ fontSize: 12, color: textLight, whiteSpace: "nowrap" }}>
          {filtered.length} of {endpoints.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: textLight, fontSize: 13 }}>
          No endpoints match the current filters.
        </div>
      ) : (
        <div style={{ borderRadius: 14, border: `1px solid ${border}`, background: surface, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {["Method", "Path", "Summary", "Tags", "Reqs", "Tests", "Coverage", "Risk", "Stability", ""].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: textLight, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(ep => {
                const selected = ep.id === selectedId;
                const riskColor = ep.riskScore >= 70 ? "#EF5350" : ep.riskScore >= 40 ? "#FFA726" : "#66BB6A";
                return (
                  <tr key={ep.id} onClick={() => onSelect(ep)}
                    style={{
                      cursor: "pointer",
                      background: selected ? (isDark ? "#1e1230" : "#f0eaff") : "transparent",
                      borderLeft: `3px solid ${selected ? theme.colors.primary : "transparent"}`,
                    }}
                    onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = isDark ? "#1a1a2e" : "#fafafa"; }}
                    onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                  >
                    <td style={{ padding: "10px 14px" }}><MethodBadge method={ep.method} /></td>
                    <td style={{ padding: "10px 14px", maxWidth: 220 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: theme.colors.primary, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {ep.path}
                      </div>
                      {ep.unused && <Badge label="unused" color="#FFA726" small />}
                    </td>
                    <td style={{ padding: "10px 14px", maxWidth: 200 }}>
                      <div style={{ fontSize: 11, color: textLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.summary}</div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                        {ep.tags.slice(0, 2).map(t => <Badge key={t} label={t} color="#42A5F5" small />)}
                        {ep.tags.length > 2 && <span style={{ fontSize: 9, color: textLight }}>+{ep.tags.length - 2}</span>}
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, color: ep.linkedRequirements.length ? theme.colors.primary : textLight }}>{ep.linkedRequirements.length || "—"}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, color: ep.linkedTests.length ? "#42A5F5" : textLight }}>{ep.linkedTests.length || "—"}</span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <ScoreDot score={ep.coverageScore} />
                        <span style={{ fontSize: 11, color: textLight }}>{ep.coverageScore}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: riskColor }}>
                        {ep.riskScore >= 70 ? "High" : ep.riskScore >= 40 ? "Med" : "Low"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <ScoreDot score={ep.stabilityScore} />
                        <span style={{ fontSize: 11, color: textLight }}>{ep.stabilityScore}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={e => { e.stopPropagation(); onSelect(ep); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${border}`, background: "transparent", color: text, fontSize: 10, cursor: "pointer" }}>
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main SystemMap component ──────────────────────────────────────────────────

export default function SystemMap({ projectId, projectType }: { projectId: string; projectType?: string }) {
  const isDark = theme.mode === "dark";
  const textLight = isDark ? theme.colors.darkTextLight : theme.colors.textLight;

  const [summary, setSummary] = useState<SystemMapSummary | null>(null);
  const [flows, setFlows] = useState<EnrichedFlow[]>([]);
  const [endpoints, setEndpoints] = useState<EnrichedEndpoint[]>([]);
  const [graph, setGraph] = useState<{ nodes: any[]; edges: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<EnrichedFlow | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<EnrichedEndpoint | null>(null);
  const [activeTab, setActiveTab] = useState<"flows" | "endpoints">(
    projectType === "api" ? "endpoints" : "flows"
  );

  const load = useCallback(async () => {
    try {
      const [sum, fl, eps, gr] = await Promise.all([
        fetchSystemMapSummary(projectId),
        fetchSystemFlows(projectId),
        fetchSystemEndpoints(projectId),
        fetchFlowGraph(projectId),
      ]);
      setSummary(sum);
      setFlows(Array.isArray(fl) ? fl : []);
      setEndpoints(Array.isArray(eps) ? eps : []);
      setGraph(gr);
      if (sum.projectType === "api" && !sum.totalFlows) setActiveTab("endpoints");
    } catch {
      setFlows([]); setEndpoints([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const handleRebuild = async () => {
    setRebuilding(true);
    const tid = toast.loading("Rebuilding system map…");
    try {
      await rebuildSystemMap(projectId);
      await load();
      toast.success("System map rebuilt.", { id: tid, duration: 3000 });
    } catch {
      toast.error("Rebuild failed.", { id: tid });
    } finally {
      setRebuilding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
        <div style={{ textAlign: "center", color: textLight, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🌐</div>
          Loading system map…
        </div>
      </div>
    );
  }

  const showFlowsTab = summary ? (summary.projectType !== "api" || summary.totalFlows > 0) : projectType !== "api";
  const showEndpointsTab = summary ? (summary.projectType !== "ui" || summary.totalEndpoints > 0) : projectType !== "ui";

  return (
    <div style={{ width: "100%", minWidth: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: theme.colors.primary, fontSize: 20, fontWeight: 800 }}>
          Flows / Endpoints
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: textLight }}>
          The system map — user journeys, API surface, coverage metrics, risk scores, and AI insights.
        </p>
      </div>

      {/* Summary */}
      {summary && (
        <SummaryTiles summary={summary} rebuilding={rebuilding} onRebuild={handleRebuild} />
      )}

      {/* Tab bar */}
      {showFlowsTab && showEndpointsTab && (
        <div style={{ display: "flex", marginBottom: 16, borderBottom: `1px solid ${isDark ? theme.colors.darkBorder : theme.colors.border}` }}>
          {(showFlowsTab ? [{ id: "flows", label: "🌐 Flows", count: flows.length }] : [])
            .concat(showEndpointsTab ? [{ id: "endpoints", label: "🔌 Endpoints", count: endpoints.length }] : [])
            .map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} style={{
                padding: "10px 20px", border: "none",
                borderBottom: `2px solid ${activeTab === tab.id ? theme.colors.primary : "transparent"}`,
                background: "transparent",
                color: activeTab === tab.id ? theme.colors.primary : textLight,
                fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 13,
                cursor: "pointer",
              }}>
                {tab.label} <span style={{ fontSize: 11, marginLeft: 4, opacity: 0.7 }}>({tab.count})</span>
              </button>
            ))
          }
        </div>
      )}

      {/* Tab content */}
      {activeTab === "flows" && showFlowsTab && (
        <FlowsTab
          flows={flows} graph={graph}
          selectedId={selectedFlow?.id ?? null}
          onSelect={f => setSelectedFlow(prev => prev?.id === f.id ? null : f)}
        />
      )}

      {activeTab === "endpoints" && showEndpointsTab && (
        <EndpointsTab
          endpoints={endpoints}
          selectedId={selectedEndpoint?.id ?? null}
          onSelect={e => setSelectedEndpoint(prev => prev?.id === e.id ? null : e)}
        />
      )}

      {/* Detail panels */}
      {selectedFlow && (
        <FlowDetailPanel
          flow={selectedFlow} graph={graph}
          onClose={() => setSelectedFlow(null)}
        />
      )}
      {selectedEndpoint && (
        <EndpointDetailPanel
          endpoint={selectedEndpoint}
          onClose={() => setSelectedEndpoint(null)}
        />
      )}
    </div>
  );
}
