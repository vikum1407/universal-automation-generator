import { Controller, Get, Post, Param, Query } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

const OUTPUT_BASE = "./qlitz-output";

// ─── Shared helpers ────────────────────────────────────────────────────────────

function readJson(p: string, fb: any = null): any {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fb; }
  catch { return fb; }
}

function writeJson(p: string, data: any): void {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

// ─── Graph domain types ────────────────────────────────────────────────────────

type NodeType = "requirement" | "test" | "flow" | "endpoint" | "failure"
  | "insight" | "autoheal" | "suggestion" | "release" | "run";

type EdgeType = "covers" | "fails" | "heals" | "impacts" | "depends_on"
  | "belongs_to" | "part_of" | "resolves" | "generates";

type RiskWeight = 0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;

interface GraphNode {
  id:          string;
  type:        NodeType;
  label:       string;
  properties:  Record<string, any>;
  riskWeight:  number;
}

interface GraphEdge {
  id:     string;
  source: string;
  target: string;
  type:   EdgeType;
  weight: number;
}

interface GraphStats {
  totalNodes:   number;
  totalEdges:   number;
  nodesByType:  Record<string, number>;
  edgesByType:  Record<string, number>;
  density:      number;
  coverageRatio: number;
  riskExposure: number;
}

interface KnowledgeGraph {
  projectId: string;
  builtAt:   string;
  nodes:     GraphNode[];
  edges:     GraphEdge[];
  stats:     GraphStats;
}

// ─── Graph builder ─────────────────────────────────────────────────────────────

function buildGraph(projectId: string): KnowledgeGraph {
  const base   = path.join(OUTPUT_BASE, projectId);
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const nodeIndex = new Map<string, GraphNode>();
  const addNode = (n: GraphNode) => { nodes.push(n); nodeIndex.set(n.id, n); };
  const addEdge = (source: string, target: string, type: EdgeType, weight = 0.8) => {
    if (nodeIndex.has(source) && nodeIndex.has(target)) {
      edges.push({ id: `${source}→${target}:${type}`, source, target, type, weight });
    }
  };

  // ── Requirements ────────────────────────────────────────────────────────────
  const rtm    = readJson(path.join(base, "rtm.json"), null);
  const reqs: any[] = (rtm?.requirements ?? []).slice(0, 14);
  const reqIds: string[] = [];

  for (const r of reqs) {
    const id = `req:${r.id ?? r.title ?? randomUUID()}`;
    reqIds.push(id);
    addNode({
      id, type: "requirement",
      label: (r.title ?? r.id ?? "REQ").slice(0, 28),
      properties: { priority: r.businessPriority ?? "medium", status: r.status ?? "open", tags: r.tags ?? [] },
      riskWeight: r.businessPriority === "critical" ? 1 : r.businessPriority === "high" ? 0.7 : 0.4,
    });
  }

  // ── Tests ────────────────────────────────────────────────────────────────────
  const testRes = readJson(path.join(base, "test-results.json"), null);
  const testMap: Record<string, string> = testRes?.tests ?? {};
  const testEntries = Object.entries(testMap).slice(0, 15);
  const testIds: string[] = [];
  const failedTestIds = new Set<string>();

  for (const [name, status] of testEntries) {
    const id = `test:${name.replace(/\s/g, "_").slice(0, 48)}`;
    testIds.push(id);
    if (status === "failed") failedTestIds.add(id);
    addNode({
      id, type: "test",
      label: name.slice(0, 28),
      properties: { status, file: name },
      riskWeight: status === "failed" ? 0.8 : 0.2,
    });
  }

  // covers: Requirement → Test (from RTM coveredBy)
  for (const r of reqs) {
    const reqId = `req:${r.id ?? r.title ?? ""}`;
    for (const testName of (r.coveredBy ?? [])) {
      const testId = `test:${testName.replace(/\s/g, "_").slice(0, 48)}`;
      addEdge(reqId, testId, "covers", 1.0);
    }
  }

  // covers: also pair by index if no coveredBy links exist
  const coveredCount = edges.filter(e => e.type === "covers").length;
  if (coveredCount === 0 && reqIds.length > 0 && testIds.length > 0) {
    for (let i = 0; i < Math.min(reqIds.length, testIds.length, 8); i++) {
      addEdge(reqIds[i % reqIds.length], testIds[i], "covers", 0.6);
    }
  }

  // ── Failures ─────────────────────────────────────────────────────────────────
  const failIds: string[] = [];
  for (const testId of Array.from(failedTestIds).slice(0, 8)) {
    const failId = `fail:${testId.replace("test:", "")}`;
    failIds.push(failId);
    addNode({
      id: failId, type: "failure",
      label: `Fail: ${testId.replace("test:", "").slice(0, 22)}`,
      properties: { testId, message: "Assertion error", occurredAt: new Date().toISOString() },
      riskWeight: 0.9,
    });
    addEdge(testId, failId, "fails", 1.0);
  }

  // Synthetic failures if no real ones
  if (failIds.length === 0 && testIds.length > 0) {
    const sampleTest = testIds[Math.floor(testIds.length * 0.3)];
    const failId = `fail:synthetic_001`;
    failIds.push(failId);
    addNode({ id: failId, type: "failure", label: "Intermittent failure", properties: { message: "Timeout", synthetic: true }, riskWeight: 0.7 });
    if (sampleTest) addEdge(sampleTest, failId, "fails", 0.7);
  }

  // ── Flows ─────────────────────────────────────────────────────────────────────
  const graph = readJson(path.join(base, "flow-graph.json"), null);
  const pages: any[] = (graph?.pages ?? graph?.nodes ?? []).slice(0, 9);
  const flowIds: string[] = [];

  for (const p of pages) {
    const id = `flow:${(p.name ?? p.id ?? randomUUID()).toString().replace(/\s/g, "_").slice(0, 36)}`;
    flowIds.push(id);
    addNode({
      id, type: "flow",
      label: (p.name ?? p.label ?? "Flow").slice(0, 28),
      properties: { url: p.url ?? "", stepCount: p.steps?.length ?? 0 },
      riskWeight: 0.5,
    });
  }

  // belongs_to: Test → Flow (pair by index, partial)
  for (let i = 0; i < Math.min(testIds.length, flowIds.length * 2, 10); i++) {
    addEdge(testIds[i], flowIds[i % flowIds.length], "belongs_to", 0.6);
  }

  // ── Endpoints ─────────────────────────────────────────────────────────────────
  const eps: any[] = (readJson(path.join(base, "endpoints.json"), []) ?? []).slice(0, 11);
  const endpointIds: string[] = [];

  for (const ep of eps) {
    const raw = (ep.url ?? ep.path ?? "").replace(/https?:\/\/[^/]+/, "").slice(0, 40);
    const method = (ep.method ?? "GET").toUpperCase();
    const id = `ep:${method}_${raw.replace(/[^a-z0-9_]/gi, "_")}`;
    endpointIds.push(id);
    addNode({
      id, type: "endpoint",
      label: `${method} ${raw.slice(0, 22)}`,
      properties: { method, path: raw, service: ep.service ?? "api" },
      riskWeight: 0.4,
    });
  }

  // depends_on: Flow → Endpoint (partial cross-link)
  for (let i = 0; i < Math.min(flowIds.length, endpointIds.length, 6); i++) {
    addEdge(flowIds[i % flowIds.length], endpointIds[i], "depends_on", 0.7);
  }

  // ── Auto-Heal ──────────────────────────────────────────────────────────────────
  const healRaw = readJson(path.join(base, "auto-heal.json"), null);
  const heals: any[] = (healRaw?.heals ?? []).slice(0, 6);
  const healIds: string[] = [];

  for (const h of heals) {
    const id = `heal:${(h.id ?? h.testId ?? randomUUID()).toString().slice(0, 36)}`;
    healIds.push(id);
    addNode({
      id, type: "autoheal",
      label: `Heal: ${(h.testId ?? h.selector ?? "test").slice(0, 22)}`,
      properties: { status: h.status ?? "pending", testId: h.testId },
      riskWeight: 0.3,
    });
    const relatedTest = `test:${(h.testId ?? "").replace(/\s/g, "_").slice(0, 48)}`;
    addEdge(id, relatedTest, "heals", 0.9);

    // resolves: AutoHeal → Failure
    const relatedFail = `fail:${(h.testId ?? "").replace(/\s/g, "_").slice(0, 36)}`;
    if (nodeIndex.has(relatedFail)) {
      addEdge(id, relatedFail, "resolves", 0.9);
    } else if (failIds.length > 0) {
      addEdge(id, failIds[0], "resolves", 0.5);
    }
  }

  // Synthetic heal if none
  if (healIds.length === 0 && failIds.length > 0) {
    const hid = "heal:synthetic_001";
    addNode({ id: hid, type: "autoheal", label: "Auto-Heal suggestion", properties: { status: "pending", synthetic: true }, riskWeight: 0.2 });
    addEdge(hid, failIds[0], "resolves", 0.6);
    healIds.push(hid);
  }

  // ── Insights ──────────────────────────────────────────────────────────────────
  const insightRaw = readJson(path.join(base, "insights.json"), null);
  const insightList: any[] = (Array.isArray(insightRaw) ? insightRaw : (insightRaw?.insights ?? [])).slice(0, 7);
  const insightIds: string[] = [];

  for (const ins of insightList) {
    const id = `ins:${(ins.id ?? randomUUID()).toString().slice(0, 36)}`;
    insightIds.push(id);
    addNode({
      id, type: "insight",
      label: (ins.title ?? ins.type ?? "Insight").slice(0, 28),
      properties: { severity: ins.severity ?? "medium", status: ins.status ?? "open", type: ins.type },
      riskWeight: ins.severity === "critical" ? 1 : ins.severity === "high" ? 0.7 : 0.4,
    });
    // generates: Failure → Insight (link first failure if any)
    if (failIds.length > 0) {
      addEdge(failIds[Math.min(insightIds.length - 1, failIds.length - 1)], id, "generates", 0.7);
    }
    // impacts: Insight → Requirement (link to requirement if priority match)
    if (reqIds.length > 0 && (ins.severity === "critical" || ins.severity === "high")) {
      addEdge(id, reqIds[Math.floor((insightIds.length - 1) % reqIds.length)], "impacts", 0.6);
    }
  }

  // Synthetic insight
  if (insightIds.length === 0 && failIds.length > 0) {
    const iid = "ins:synthetic_001";
    addNode({ id: iid, type: "insight", label: "Coverage gap detected", properties: { severity: "high", status: "open", synthetic: true }, riskWeight: 0.7 });
    addEdge(failIds[0], iid, "generates", 0.7);
    insightIds.push(iid);
  }

  // ── Suggestions ────────────────────────────────────────────────────────────────
  const sugRaw = readJson(path.join(base, "suggestions.json"), null);
  const sugs: any[] = (sugRaw?.suggestions ?? (Array.isArray(sugRaw) ? sugRaw : [])).slice(0, 5);

  for (const s of sugs) {
    const id = `sug:${(s.id ?? randomUUID()).toString().slice(0, 36)}`;
    addNode({
      id, type: "suggestion",
      label: (s.title ?? s.type ?? "Suggestion").slice(0, 28),
      properties: { impact: s.impact ?? "medium", status: s.status ?? "open", type: s.type },
      riskWeight: 0.3,
    });
    if (testIds.length > 0) {
      addEdge(id, testIds[Math.floor(testIds.length * 0.5)], "impacts", 0.5);
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────────

  const nodesByType: Record<string, number> = {};
  const edgesByType: Record<string, number> = {};
  for (const n of nodes) nodesByType[n.type] = (nodesByType[n.type] ?? 0) + 1;
  for (const e of edges) edgesByType[e.type] = (edgesByType[e.type] ?? 0) + 1;

  const n    = nodes.length;
  const maxEdges = n > 1 ? n * (n - 1) : 1;
  const density  = Math.round((edges.length / maxEdges) * 10000) / 100;

  const coveredReqs  = new Set(edges.filter(e => e.type === "covers").map(e => e.source)).size;
  const coverageRatio = reqs.length > 0 ? Math.round((coveredReqs / reqs.length) * 100) : 0;

  const riskNodes    = nodes.filter(n => n.riskWeight >= 0.7);
  const riskExposure = Math.round((riskNodes.length / Math.max(1, nodes.length)) * 100);

  const stats: GraphStats = { totalNodes: n, totalEdges: edges.length, nodesByType, edgesByType, density, coverageRatio, riskExposure };

  return { projectId, builtAt: new Date().toISOString(), nodes, edges, stats };
}

// ─── Graph cache ───────────────────────────────────────────────────────────────

function graphPath(id: string) { return path.join(OUTPUT_BASE, id, "knowledge-graph.json"); }

function loadOrBuildGraph(projectId: string): KnowledgeGraph {
  const p = graphPath(projectId);
  if (fs.existsSync(p)) {
    const cached = readJson(p, null);
    if (cached?.nodes?.length > 0) return cached;
  }
  const g = buildGraph(projectId);
  writeJson(p, g);
  return g;
}

// ─── Query engine ──────────────────────────────────────────────────────────────

interface QueryResult {
  queryType:     string;
  rootNode:      GraphNode | null;
  affectedNodes: GraphNode[];
  affectedEdges: GraphEdge[];
  depths:        Record<string, number>;
  riskScore:     number;
  summary:       string;
}

function bfsTraverse(
  graph: KnowledgeGraph,
  startId: string,
  direction: "forward" | "backward",
  maxDepth = 6,
): { nodes: GraphNode[]; edges: GraphEdge[]; depths: Map<string, number> } {
  const nodeMap  = new Map(graph.nodes.map(n => [n.id, n]));
  const visited  = new Set<string>([startId]);
  const depths   = new Map<string, number>([[startId, 0]]);
  const queue: { id: string; depth: number }[] = [{ id: startId, depth: 0 }];
  const resultNodes: GraphNode[] = [];
  const resultEdges: GraphEdge[] = [];

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) resultNodes.push(node);
    if (depth >= maxDepth) continue;

    const adj = direction === "forward"
      ? graph.edges.filter(e => e.source === id)
      : graph.edges.filter(e => e.target === id);

    for (const edge of adj) {
      resultEdges.push(edge);
      const nextId = direction === "forward" ? edge.target : edge.source;
      if (!visited.has(nextId)) {
        visited.add(nextId);
        depths.set(nextId, depth + 1);
        queue.push({ id: nextId, depth: depth + 1 });
      }
    }
  }

  return { nodes: resultNodes, edges: resultEdges, depths };
}

function shortestPath(graph: KnowledgeGraph, fromId: string, toId: string): { nodes: GraphNode[]; edges: GraphEdge[] } | null {
  const nodeMap  = new Map(graph.nodes.map(n => [n.id, n]));
  const visited  = new Set<string>([fromId]);
  const parent   = new Map<string, { parentId: string; edge: GraphEdge }>();
  const queue    = [fromId];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (id === toId) break;
    for (const edge of graph.edges.filter(e => e.source === id)) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        parent.set(edge.target, { parentId: id, edge });
        queue.push(edge.target);
      }
    }
  }

  if (!parent.has(toId) && fromId !== toId) return null;

  const pathEdges: GraphEdge[] = [];
  const pathNodeIds: string[] = [toId];
  let curr = toId;
  while (parent.has(curr)) {
    const { parentId, edge } = parent.get(curr)!;
    pathEdges.unshift(edge);
    pathNodeIds.unshift(parentId);
    curr = parentId;
  }

  return {
    nodes: pathNodeIds.map(id => nodeMap.get(id)).filter(Boolean) as GraphNode[],
    edges: pathEdges,
  };
}

function runQuery(graph: KnowledgeGraph, queryType: string, params: Record<string, string>): QueryResult {
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
  const rootNode = params.nodeId ? (nodeMap.get(params.nodeId) ?? null) : null;

  const empty: QueryResult = { queryType, rootNode, affectedNodes: [], affectedEdges: [], depths: {}, riskScore: 0, summary: "No results" };

  if (queryType === "impacts" && params.nodeId) {
    const { nodes, edges, depths } = bfsTraverse(graph, params.nodeId, "forward");
    const affected = nodes.filter(n => n.id !== params.nodeId);
    const riskScore = Math.round(Math.min(1, affected.reduce((a, n) => a + n.riskWeight, 0) / Math.max(1, affected.length)) * 100);
    const byType = affected.reduce((acc, n) => { acc[n.type] = (acc[n.type] ?? 0) + 1; return acc; }, {} as Record<string, number>);
    const typeSummary = Object.entries(byType).map(([t, c]) => `${c} ${t}${c !== 1 ? "s" : ""}`).join(", ");
    return { queryType, rootNode, affectedNodes: affected, affectedEdges: edges, depths: Object.fromEntries(depths), riskScore, summary: affected.length > 0 ? `Changing "${rootNode?.label}" may impact ${typeSummary}` : `"${rootNode?.label}" has no downstream dependencies` };
  }

  if (queryType === "depends-on" && params.nodeId) {
    const { nodes, edges, depths } = bfsTraverse(graph, params.nodeId, "backward");
    const affected = nodes.filter(n => n.id !== params.nodeId);
    const riskScore = Math.round(Math.min(1, affected.reduce((a, n) => a + n.riskWeight, 0) / Math.max(1, affected.length)) * 100);
    const byType = affected.reduce((acc, n) => { acc[n.type] = (acc[n.type] ?? 0) + 1; return acc; }, {} as Record<string, number>);
    const typeSummary = Object.entries(byType).map(([t, c]) => `${c} ${t}${c !== 1 ? "s" : ""}`).join(", ");
    return { queryType, rootNode, affectedNodes: affected, affectedEdges: edges, depths: Object.fromEntries(depths), riskScore, summary: affected.length > 0 ? `"${rootNode?.label}" depends on ${typeSummary}` : `"${rootNode?.label}" has no upstream dependencies` };
  }

  if (queryType === "path" && params.from && params.to) {
    const result = shortestPath(graph, params.from, params.to);
    if (!result) return { ...empty, summary: `No path found from ${params.from} to ${params.to}` };
    return { queryType, rootNode: nodeMap.get(params.from) ?? null, affectedNodes: result.nodes, affectedEdges: result.edges, depths: Object.fromEntries(result.nodes.map((n, i) => [n.id, i])), riskScore: 0, summary: `Path of ${result.nodes.length} nodes found` };
  }

  if (queryType === "risk-exposure" && params.nodeId) {
    const { nodes, edges } = bfsTraverse(graph, params.nodeId, "forward");
    const riskNodes = nodes.filter(n => n.riskWeight >= 0.7);
    const riskScore = Math.round(Math.min(100, riskNodes.reduce((a, n) => a + n.riskWeight * 100, 0) / Math.max(1, nodes.length)));
    return { queryType, rootNode, affectedNodes: nodes.filter(n => n.id !== params.nodeId), affectedEdges: edges, depths: {}, riskScore, summary: `Risk exposure score: ${riskScore}/100. ${riskNodes.length} high-risk node${riskNodes.length !== 1 ? "s" : ""} reachable.` };
  }

  if (queryType === "neighborhood" && params.nodeId) {
    const depth = parseInt(params.depth ?? "2");
    const { nodes, edges } = bfsTraverse(graph, params.nodeId, "forward", depth);
    const backward = bfsTraverse(graph, params.nodeId, "backward", depth);
    const allNodes = [...new Map([...nodes, ...backward.nodes].map(n => [n.id, n])).values()];
    const allEdges = [...new Map([...edges, ...backward.edges].map(e => [e.id, e])).values()];
    return { queryType, rootNode, affectedNodes: allNodes.filter(n => n.id !== params.nodeId), affectedEdges: allEdges, depths: {}, riskScore: 0, summary: `${allNodes.length - 1} nodes within ${depth} hops` };
  }

  return empty;
}

// ─── Controller ────────────────────────────────────────────────────────────────

@Controller("projects/:id/graph")
export class GraphController {

  @Get()
  getGraph(@Param("id") id: string) {
    return loadOrBuildGraph(id);
  }

  @Get("nodes")
  getNodes(@Param("id") id: string, @Query("type") type?: string) {
    const g = loadOrBuildGraph(id);
    return { nodes: type ? g.nodes.filter(n => n.type === type) : g.nodes, total: g.nodes.length };
  }

  @Get("nodes/:nodeId")
  getNode(@Param("id") id: string, @Param("nodeId") nodeId: string) {
    const g    = loadOrBuildGraph(id);
    const node = g.nodes.find(n => n.id === nodeId);
    if (!node) return { error: "Node not found" };
    const outEdges = g.edges.filter(e => e.source === nodeId);
    const inEdges  = g.edges.filter(e => e.target === nodeId);
    const nodeMap  = new Map(g.nodes.map(n => [n.id, n]));
    return {
      node,
      outgoing: outEdges.map(e => ({ edge: e, target: nodeMap.get(e.target) })),
      incoming: inEdges.map(e => ({ edge: e, source: nodeMap.get(e.source) })),
    };
  }

  @Get("query")
  query(
    @Param("id") id: string,
    @Query("type")   type   = "impacts",
    @Query("nodeId") nodeId?: string,
    @Query("from")   from?: string,
    @Query("to")     to?: string,
    @Query("depth")  depth?: string,
  ) {
    const g      = loadOrBuildGraph(id);
    const params = { nodeId, from, to, depth } as Record<string, string>;
    return runQuery(g, type, params);
  }

  @Get("stats")
  getStats(@Param("id") id: string) {
    const g = loadOrBuildGraph(id);
    return { stats: g.stats, builtAt: g.builtAt };
  }

  @Post("rebuild")
  rebuild(@Param("id") id: string) {
    const p = graphPath(id);
    if (fs.existsSync(p)) fs.unlinkSync(p);
    const g = loadOrBuildGraph(id);
    return { message: "Graph rebuilt", nodes: g.stats.totalNodes, edges: g.stats.totalEdges };
  }
}
