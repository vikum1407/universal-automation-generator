import { useState, useEffect, useRef, useCallback } from "react";
import { useColors } from "@/hooks/useColors";

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeType =
  | "requirement" | "test" | "flow" | "endpoint"
  | "failure" | "insight" | "autoheal" | "suggestion"
  | "release" | "run";

type EdgeType =
  | "covers" | "fails" | "heals" | "impacts"
  | "depends_on" | "belongs_to" | "part_of" | "resolves" | "generates";

interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties: Record<string, any>;
  riskWeight: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
}

interface KnowledgeGraph {
  projectId: string;
  builtAt: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: Record<string, any>;
}

interface QueryResult {
  queryType:     string;
  rootNode:      GraphNode | null;
  affectedNodes: GraphNode[];
  affectedEdges: GraphEdge[];
  depths:        Record<string, number>;
  riskScore:     number;
  summary:       string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_COLORS: Record<NodeType, string> = {
  requirement: "#6D4FF0",
  test:        "#3B82F6",
  flow:        "#F97316",
  endpoint:    "#10B981",
  failure:     "#EF4444",
  insight:     "#EC4899",
  autoheal:    "#14B8A6",
  suggestion:  "#A78BFA",
  release:     "#F59E0B",
  run:         "#64748B",
};

const NODE_LAYER: Record<NodeType, number> = {
  requirement: 0,
  release:     0,
  test:        1,
  run:         1,
  flow:        2,
  endpoint:    2,
  failure:     3,
  insight:     4,
  autoheal:    4,
  suggestion:  5,
};

const QUERY_TYPES = [
  { value: "impacts",      label: "What does this impact?" },
  { value: "depends-on",   label: "What does this depend on?" },
  { value: "neighborhood", label: "Neighborhood (2 hops)" },
  { value: "risk-exposure",label: "Risk exposure" },
];

const EDGE_COLORS: Record<EdgeType, string> = {
  covers:     "#6D4FF0",
  fails:      "#EF4444",
  heals:      "#14B8A6",
  impacts:    "#F97316",
  depends_on: "#10B981",
  belongs_to: "#3B82F6",
  part_of:    "#64748B",
  resolves:   "#A78BFA",
  generates:  "#EC4899",
};

// ─── Layout engine ────────────────────────────────────────────────────────────

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
}

function computeLayout(nodes: GraphNode[], width: number, height: number): LayoutNode[] {
  const layers: GraphNode[][] = Array.from({ length: 6 }, () => []);
  nodes.forEach(n => {
    const layer = NODE_LAYER[n.type] ?? 2;
    layers[layer].push(n);
  });

  const layerCount = layers.filter(l => l.length > 0).length || 1;
  const layerH = height / (layerCount + 1);
  let layerIdx = 0;

  const result: LayoutNode[] = [];

  layers.forEach((layer) => {
    if (layer.length === 0) return;
    layerIdx++;
    const y = layerIdx * layerH;
    layer.forEach((node, i) => {
      const colW = width / (layer.length + 1);
      const x = (i + 1) * colW;
      result.push({ ...node, x, y });
    });
  });

  return result;
}

const API_BASE = "http://localhost:3000";

// ─── Main component ───────────────────────────────────────────────────────────

interface GraphPageProps {
  projectId: string;
}

export default function GraphPage({ projectId }: GraphPageProps) {
  const { P, BDR, CARD, TXT, TXT2 } = useColors();

  const [graph, setGraph] = useState<KnowledgeGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<string> | null>(null);

  const [queryType, setQueryType] = useState<string>("impacts");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [querying, setQuerying] = useState(false);

  const [filterTypes, setFilterTypes] = useState<Set<NodeType>>(new Set());

  const svgRef = useRef<SVGSVGElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const isPanning = useRef(false);
  const lastPan = useRef({ x: 0, y: 0 });

  const [svgSize, setSvgSize] = useState({ w: 900, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Fetch graph ─────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/projects/${projectId}/graph`)
      .then(r => r.json())
      .then(data => { setGraph(data); setLoading(false); })
      .catch(() => { setError("Failed to load knowledge graph"); setLoading(false); });
  }, [projectId]);

  // ── Resize observer ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      const e = entries[0];
      setSvgSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Layout ──────────────────────────────────────────────────────────────────

  const GRAPH_W = 1200;
  const GRAPH_H = 800;

  const layoutNodes = graph
    ? computeLayout(graph.nodes, GRAPH_W, GRAPH_H)
    : [];

  const nodeMap = new Map<string, LayoutNode>(layoutNodes.map(n => [n.id, n]));

  const visibleNodes = filterTypes.size > 0
    ? layoutNodes.filter(n => !filterTypes.has(n.type))
    : layoutNodes;

  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));

  const visibleEdges = graph
    ? graph.edges.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
    : [];

  // ── Pan/zoom ─────────────────────────────────────────────────────────────────

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(3, Math.max(0.3, z - e.deltaY * 0.001)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest("[data-node]")) return;
    isPanning.current = true;
    lastPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    setPan({ x: e.clientX - lastPan.current.x, y: e.clientY - lastPan.current.y });
  }, []);

  const handleMouseUp = useCallback(() => { isPanning.current = false; }, []);

  // ── Node click ───────────────────────────────────────────────────────────────

  const handleNodeClick = (node: LayoutNode) => {
    setSelectedNode(node);
    setQueryResult(null);
    if (graph) {
      const connected = new Set<string>([node.id]);
      graph.edges.forEach(e => {
        if (e.source === node.id) connected.add(e.target);
        if (e.target === node.id) connected.add(e.source);
      });
      setHighlightedIds(connected);
    }
  };

  const handleCanvasClick = () => {
    setSelectedNode(null);
    setHighlightedIds(null);
    setQueryResult(null);
  };

  // ── Graph query ──────────────────────────────────────────────────────────────

  const runQuery = async () => {
    if (!selectedNode) return;
    setQuerying(true);
    try {
      const r = await fetch(
        `${API_BASE}/projects/${projectId}/graph/query?type=${queryType}&nodeId=${selectedNode.id}&depth=3`
      );
      const data: QueryResult = await r.json();
      setQueryResult(data);
      if (data.affectedNodes?.length) {
        setHighlightedIds(new Set([selectedNode.id, ...data.affectedNodes.map(n => n.id)]));
      }
    } catch {
      setQueryResult({ queryType, rootNode: null, affectedNodes: [], affectedEdges: [], depths: {}, riskScore: 0, summary: "Query failed" });
    } finally {
      setQuerying(false);
    }
  };

  const toggleTypeFilter = (t: NodeType) => {
    setFilterTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  const handleRebuild = async () => {
    setLoading(true);
    await fetch(`${API_BASE}/projects/${projectId}/graph/rebuild`, { method: "POST" });
    const r = await fetch(`${API_BASE}/projects/${projectId}/graph`);
    const data = await r.json();
    setGraph(data);
    setLoading(false);
    setSelectedNode(null);
    setHighlightedIds(null);
  };

  // ── Derived stats ────────────────────────────────────────────────────────────

  const nodeTypeCounts = graph
    ? (Object.keys(NODE_COLORS) as NodeType[]).map(t => ({
        type: t,
        count: graph.nodes.filter(n => n.type === t).length,
      })).filter(x => x.count > 0)
    : [];

  const selectedNodeEdges = selectedNode && graph
    ? graph.edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
    : [];

  // ── Node radius by risk ───────────────────────────────────────────────────────

  const nodeR = (n: GraphNode) => Math.max(14, Math.min(22, 14 + n.riskWeight * 8));

  // ── SVG arrow marker def ──────────────────────────────────────────────────────

  const allEdgeColors = [...new Set(visibleEdges.map(e => EDGE_COLORS[e.type]))];

  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: TXT2 }}>
      Building knowledge graph…
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#EF4444" }}>
      {error}
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", background: CARD }}>

      {/* ── Left panel: type legend + filter ──────────────────────────────── */}
      <div style={{
        width: 200, flexShrink: 0, borderRight: `1px solid ${BDR}`,
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "14px 16px 10px", borderBottom: `1px solid ${BDR}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: TXT }}>QLitzGraph</span>
          <button onClick={handleRebuild} style={{
            fontSize: 10, fontWeight: 600, color: P, background: `${P}14`,
            border: `1px solid ${P}30`, borderRadius: 5, padding: "3px 8px", cursor: "pointer",
          }}>
            Rebuild
          </button>
        </div>

        {/* Stats */}
        {graph && (
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${BDR}` }}>
            <div style={{ fontSize: 11, color: TXT2, marginBottom: 6 }}>Graph overview</div>
            <div style={{ display: "flex", gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: TXT }}>{graph.nodes.length}</div>
                <div style={{ fontSize: 10, color: TXT2 }}>Nodes</div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: TXT }}>{graph.edges.length}</div>
                <div style={{ fontSize: 10, color: TXT2 }}>Edges</div>
              </div>
            </div>
          </div>
        )}

        {/* Node type filter */}
        <div style={{ padding: "10px 14px 6px", flex: 1, overflowY: "auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: TXT2, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Node types
          </div>
          {nodeTypeCounts.map(({ type, count }) => {
            const hidden = filterTypes.has(type);
            return (
              <button key={type} onClick={() => toggleTypeFilter(type)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "5px 6px", borderRadius: 6, border: "none", cursor: "pointer",
                background: hidden ? "transparent" : `${NODE_COLORS[type]}12`,
                marginBottom: 2, opacity: hidden ? 0.4 : 1, transition: "all 0.15s",
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: NODE_COLORS[type], flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, color: TXT, textAlign: "left", flex: 1 }}>
                  {type}
                </span>
                <span style={{ fontSize: 11, color: TXT2, fontWeight: 600 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Edge type legend */}
        <div style={{ padding: "10px 14px", borderTop: `1px solid ${BDR}` }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: TXT2, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Edge types
          </div>
          {(Object.entries(EDGE_COLORS) as [EdgeType, string][]).map(([t, c]) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <div style={{ width: 16, height: 2, background: c, borderRadius: 1 }} />
              <span style={{ fontSize: 10, color: TXT2 }}>{t.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Graph canvas ────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: "hidden", position: "relative", cursor: "grab" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <svg
          ref={svgRef}
          width={svgSize.w}
          height={svgSize.h}
          style={{ display: "block" }}
        >
          <defs>
            {allEdgeColors.map(color => (
              <marker
                key={color}
                id={`arrow-${color.slice(1)}`}
                markerWidth="8" markerHeight="8"
                refX="6" refY="3"
                orient="auto"
              >
                <path d="M0,0 L0,6 L8,3 z" fill={color} opacity={0.8} />
              </marker>
            ))}
          </defs>

          <g transform={`translate(${pan.x + svgSize.w / 2 - (GRAPH_W / 2) * zoom}, ${pan.y + 30}) scale(${zoom})`}>

            {/* Edges */}
            {visibleEdges.map(edge => {
              const src = nodeMap.get(edge.source);
              const tgt = nodeMap.get(edge.target);
              if (!src || !tgt) return null;

              const dimmed = highlightedIds && !highlightedIds.has(edge.source) && !highlightedIds.has(edge.target);
              const color = EDGE_COLORS[edge.type];

              const dx = tgt.x - src.x;
              const dy = tgt.y - src.y;
              const cx1 = src.x + dx * 0.3;
              const cy1 = src.y + dy * 0.1;
              const cx2 = src.x + dx * 0.7;
              const cy2 = src.y + dy * 0.9;

              return (
                <path
                  key={edge.id}
                  d={`M ${src.x} ${src.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tgt.x} ${tgt.y}`}
                  stroke={color}
                  strokeWidth={Math.max(0.8, edge.weight * 2.5)}
                  fill="none"
                  opacity={dimmed ? 0.08 : 0.55}
                  markerEnd={`url(#arrow-${color.slice(1)})`}
                />
              );
            })}

            {/* Nodes */}
            {visibleNodes.map(node => {
              const dimmed = highlightedIds && !highlightedIds.has(node.id);
              const isSelected = selectedNode?.id === node.id;
              const color = NODE_COLORS[node.type];
              const r = nodeR(node);
              const isHighlightResult = queryResult?.results?.includes(node.id);

              return (
                <g
                  key={node.id}
                  data-node="1"
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={e => { e.stopPropagation(); handleNodeClick(node); }}
                  style={{ cursor: "pointer" }}
                >
                  {/* Glow ring for query results */}
                  {isHighlightResult && (
                    <circle r={r + 7} fill="none" stroke={color} strokeWidth={2} opacity={0.35} />
                  )}

                  {/* Selection ring */}
                  {isSelected && (
                    <circle r={r + 5} fill="none" stroke={color} strokeWidth={2} opacity={0.7} />
                  )}

                  {/* Node body */}
                  <circle
                    r={r}
                    fill={`${color}22`}
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    opacity={dimmed ? 0.15 : 1}
                  />

                  {/* Risk fill indicator */}
                  {node.riskWeight > 0.5 && (
                    <circle
                      r={r * 0.45}
                      fill={color}
                      opacity={(dimmed ? 0.05 : node.riskWeight * 0.45)}
                    />
                  )}

                  {/* Label */}
                  <text
                    x={0} y={r + 12}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={600}
                    fill={dimmed ? TXT2 : TXT}
                    opacity={dimmed ? 0.3 : 0.85}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {node.label.length > 16 ? node.label.slice(0, 14) + "…" : node.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Empty state */}
        {graph && graph.nodes.length === 0 && (
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <div style={{ fontSize: 32, opacity: 0.2 }}>◈</div>
            <div style={{ fontSize: 13, color: TXT2 }}>No nodes — click Rebuild to generate the graph</div>
          </div>
        )}

        {/* Zoom hint */}
        <div style={{
          position: "absolute", bottom: 12, right: 12,
          fontSize: 10, color: TXT2, background: CARD,
          border: `1px solid ${BDR}`, borderRadius: 6,
          padding: "4px 8px", pointerEvents: "none",
        }}>
          Scroll to zoom · Drag to pan · Click node to select
        </div>

        {/* Zoom level */}
        <div style={{
          position: "absolute", bottom: 12, left: 12,
          fontSize: 10, color: TXT2, background: CARD,
          border: `1px solid ${BDR}`, borderRadius: 6,
          padding: "4px 8px",
          display: "flex", gap: 6, alignItems: "center",
        }}>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} style={{
            border: "none", background: "none", cursor: "pointer", color: TXT, fontSize: 14, lineHeight: 1, padding: 0,
          }}>+</button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} style={{
            border: "none", background: "none", cursor: "pointer", color: TXT, fontSize: 14, lineHeight: 1, padding: 0,
          }}>−</button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={{
            border: "none", background: "none", cursor: "pointer", color: TXT2, fontSize: 10, padding: 0,
          }}>Reset</button>
        </div>
      </div>

      {/* ── Right panel: node detail + query ─────────────────────────────────── */}
      <div style={{
        width: selectedNode ? 280 : 0,
        overflow: "hidden",
        transition: "width 0.2s ease",
        borderLeft: `1px solid ${BDR}`,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}>
        {selectedNode && (
          <>
            {/* Node header */}
            <div style={{
              padding: "14px 16px 10px",
              borderBottom: `1px solid ${BDR}`,
              display: "flex", alignItems: "flex-start", gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: `${NODE_COLORS[selectedNode.type]}22`,
                border: `2px solid ${NODE_COLORS[selectedNode.type]}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: NODE_COLORS[selectedNode.type] }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: TXT, wordBreak: "break-word" }}>
                  {selectedNode.label}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 600, marginTop: 3,
                  color: NODE_COLORS[selectedNode.type],
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}>
                  {selectedNode.type}
                </div>
              </div>
              <button onClick={handleCanvasClick} style={{
                border: "none", background: "none", cursor: "pointer",
                color: TXT2, fontSize: 16, lineHeight: 1, padding: 2,
              }}>×</button>
            </div>

            {/* Properties */}
            <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BDR}`, overflowY: "auto", maxHeight: 160 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                Properties
              </div>
              {Object.entries(selectedNode.properties).slice(0, 6).map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: TXT2, minWidth: 70 }}>{k}</span>
                  <span style={{
                    fontSize: 10, color: TXT,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1,
                  }}>
                    {String(v).length > 30 ? String(v).slice(0, 28) + "…" : String(v)}
                  </span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: TXT2, minWidth: 70 }}>risk</span>
                <span style={{ fontSize: 10, color: selectedNode.riskWeight > 0.6 ? "#EF4444" : TXT }}>
                  {(selectedNode.riskWeight * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Connected edges */}
            {selectedNodeEdges.length > 0 && (
              <div style={{ padding: "10px 16px", borderBottom: `1px solid ${BDR}`, overflowY: "auto", maxHeight: 140 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                  Connections ({selectedNodeEdges.length})
                </div>
                {selectedNodeEdges.slice(0, 8).map(edge => {
                  const other = edge.source === selectedNode.id ? edge.target : edge.source;
                  const otherNode = nodeMap.get(other);
                  const dir = edge.source === selectedNode.id ? "→" : "←";
                  const color = EDGE_COLORS[edge.type];
                  return (
                    <div key={edge.id} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: TXT2 }}>{dir}</span>
                      <span style={{
                        fontSize: 9, fontWeight: 600, color, background: `${color}15`,
                        padding: "1px 5px", borderRadius: 3,
                      }}>{edge.type.replace("_", " ")}</span>
                      <span style={{ fontSize: 10, color: TXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {otherNode?.label?.slice(0, 18) ?? other.slice(0, 12)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Query panel */}
            <div style={{ padding: "10px 16px", flex: 1, overflowY: "auto" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: TXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Graph Query
              </div>

              <select
                value={queryType}
                onChange={e => setQueryType(e.target.value)}
                style={{
                  width: "100%", padding: "6px 8px", borderRadius: 6, border: `1px solid ${BDR}`,
                  background: CARD, color: TXT, fontSize: 11, marginBottom: 8, cursor: "pointer",
                }}
              >
                {QUERY_TYPES.map(q => (
                  <option key={q.value} value={q.value}>{q.label}</option>
                ))}
              </select>

              <button
                onClick={runQuery}
                disabled={querying}
                style={{
                  width: "100%", padding: "7px 0", borderRadius: 6,
                  border: `1px solid ${P}40`, background: `${P}14`,
                  color: P, fontSize: 12, fontWeight: 600, cursor: querying ? "wait" : "pointer",
                  marginBottom: 12,
                }}
              >
                {querying ? "Running…" : "Run Query"}
              </button>

              {queryResult && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: TXT, marginBottom: 6 }}>
                    {queryResult.summary || `${queryResult.affectedNodes.length} nodes found`}
                  </div>
                  {queryResult.riskScore > 0 && (
                    <div style={{ fontSize: 10, color: queryResult.riskScore >= 70 ? "#EF4444" : "#FFA726", marginBottom: 8, fontWeight: 600 }}>
                      Risk score: {queryResult.riskScore}/100
                    </div>
                  )}
                  {queryResult.affectedNodes.slice(0, 12).map(n => {
                    const layoutNode = nodeMap.get(n.id);
                    return (
                      <div
                        key={n.id}
                        onClick={() => layoutNode && handleNodeClick(layoutNode)}
                        style={{
                          display: "flex", alignItems: "center", gap: 6, marginBottom: 5,
                          padding: "5px 8px", borderRadius: 6, cursor: layoutNode ? "pointer" : "default",
                          background: `${NODE_COLORS[n.type]}10`,
                          border: `1px solid ${NODE_COLORS[n.type]}30`,
                        }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: NODE_COLORS[n.type], flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: TXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {n.label}
                          </div>
                          <div style={{ fontSize: 9, color: TXT2 }}>{n.type}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
