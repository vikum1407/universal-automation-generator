import { Controller, Get, Post, Param } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_BASE = "./qlitz-output";

@Controller("projects/:id/system-map")
export class SystemMapController {
  private base(id: string) { return path.join(OUTPUT_BASE, id); }

  // ─── Internal helpers ─────────────────────────────────────────────────────

  private readJson(filePath: string, fallback: any = null) {
    try { return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback; }
    catch { return fallback; }
  }

  private collectSpecs(base: string): Set<string> {
    const s = new Set<string>();
    for (const dir of [base, path.join(base, "tests")]) {
      if (!fs.existsSync(dir)) continue;
      fs.readdirSync(dir).filter(f => f.endsWith(".spec.ts")).forEach(f => s.add(f));
    }
    return s;
  }

  private specNameFor(method: string, epPath: string): string {
    return `${method}_${epPath}`.replace(/[{}/]/g, "_").replace(/_+/g, "_").replace(/^_|_$/, "") + ".spec.ts";
  }

  // ─── Normalise flow-graph (handles both {pages,edges} and {nodes,edges}) ──────

  private normaliseGraph(raw: any): { nodes: any[]; edges: any[] } {
    if (!raw) return { nodes: [], edges: [] };
    const edges: any[] = (raw.edges ?? []).map((e: any, i: number) => ({
      id: e.id ?? `e${i}`,
      from: e.from ?? e.source,
      to: e.to ?? e.target,
      action: e.action ?? "",
      selector: e.selector ?? "",
    }));

    if (raw.pages) {
      // Actual pipeline output: pages array (each page = one node)
      const nodes = (raw.pages as any[]).map((p: any) => ({
        id: p.url,
        pageUrl: p.url,
        text: p.title || "",
      }));
      return { nodes, edges };
    }

    // Legacy {nodes,edges} format
    const nodes: any[] = (raw.nodes ?? []).map((n: any) => ({
      ...n,
      pageUrl: n.pageUrl ?? n.url ?? "",
    }));
    return { nodes, edges };
  }

  // ─── Enriched flows ────────────────────────────────────────────────────────

  private buildFlows(id: string) {
    const base = this.base(id);
    const raw = this.readJson(path.join(base, "flow-graph.json"), null);
    const rtm = this.readJson(path.join(base, "rtm.json"), { requirements: [] });
    const testRes = this.readJson(path.join(base, "test-results.json"), null);
    const specFiles = this.collectSpecs(base);
    const perTest: Record<string, "passed" | "failed"> = testRes?.tests ?? {};

    const { nodes, edges } = this.normaliseGraph(raw);

    // Each unique pageUrl is a flow; for pages-format each node IS a page
    const pageUrls = [...new Set(nodes.map((n: any) => n.pageUrl || n.id).filter(Boolean))];

    return pageUrls.map((url: string) => {
      const grpNodes = nodes.filter((n: any) => (n.pageUrl || n.id) === url);
      const grpEdges = edges.filter((e: any) => e.from === url || e.to === url);

      let name = "Unknown Page";
      try {
        const segs = new URL(url).pathname.split("/").filter(Boolean);
        name = segs.length ? segs[segs.length - 1].replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Home";
      } catch { name = url.slice(0, 40) || "Unknown"; }

      const linkedReqs = (rtm.requirements ?? [])
        .filter((r: any) => r.type === "ui" && r.source?.pageName && url.includes(r.source.pageName))
        .map((r: any) => r.description || r.id || "");

      const nameLower = name.toLowerCase().replace(/\s+/g, "");
      const linkedTests = Array.from(specFiles).filter(f =>
        f.toLowerCase().includes(nameLower) || (f.toLowerCase().includes("ui") && nameLower.length < 4)
      );

      const hasFailing = linkedTests.some(t => perTest[t] === "failed");
      const hasPassing = linkedTests.some(t => perTest[t] === "passed");
      const covered = linkedTests.length > 0;

      const actions = [
        ...grpNodes.map((n: any) => n.text || "").filter(Boolean),
        ...grpEdges.map((e: any) => e.selector || e.action || "").filter(Boolean),
      ].slice(0, 4);

      return {
        id: `flow-${Buffer.from(url).toString("base64").slice(0, 10)}`,
        name,
        url,
        type: "ui" as const,
        nodeCount: grpEdges.length,
        edgeCount: grpEdges.length,
        actions,
        linkedRequirements: linkedReqs,
        linkedTests,
        coverageScore: covered ? 100 : 0,
        riskScore: Math.min(100, !covered ? 75 : hasFailing ? 85 : 25),
        stabilityScore: hasPassing ? 88 : hasFailing ? 20 : covered ? 60 : 50,
        tags: [] as string[],
        hasFailingTests: hasFailing,
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }

  // ─── Enriched endpoints ────────────────────────────────────────────────────

  private buildEndpoints(id: string) {
    const base = this.base(id);
    const raw: any[] = this.readJson(path.join(base, "endpoints.json"), []);
    const rtm = this.readJson(path.join(base, "rtm.json"), { requirements: [] });
    const testRes = this.readJson(path.join(base, "test-results.json"), null);
    const specFiles = this.collectSpecs(base);
    const perTest: Record<string, "passed" | "failed"> = testRes?.tests ?? {};

    return raw.map((ep: any) => {
      const specName = this.specNameFor(ep.method, ep.path);
      const pathFrag = ep.path.replace(/[{}/]/g, "").replace(/^\//, "").toLowerCase().slice(0, 12);

      const linkedTests = Array.from(specFiles).filter(f =>
        f === specName || (pathFrag.length > 3 && f.toLowerCase().includes(pathFrag))
      );

      const linkedReqs = (rtm.requirements ?? [])
        .filter((r: any) => r.source?.endpointPath === ep.path && r.source?.method === ep.method)
        .map((r: any) => r.description || r.id || "");

      const priority = (rtm.requirements ?? [])
        .find((r: any) => r.source?.endpointPath === ep.path)?.businessPriority ?? "medium";

      const hasFailing = linkedTests.some(t => perTest[t] === "failed");
      const hasPassing = linkedTests.some(t => perTest[t] === "passed");
      const covered = linkedTests.length > 0;
      const riskBase = priority === "high" ? 78 : priority === "medium" ? 50 : 22;

      return {
        id: `${ep.method}_${ep.path}`,
        method: ep.method,
        path: ep.path,
        summary: ep.summary || `${ep.method} ${ep.path}`,
        description: ep.description || "",
        tags: ep.tags ?? [],
        parameters: ep.parameters ?? [],
        requestBody: ep.requestBody ?? null,
        responseSchemas: ep.responses ?? {},
        linkedRequirements: linkedReqs,
        linkedTests,
        linkedFlows: [],
        coverageScore: covered ? 100 : 0,
        riskScore: Math.min(100, !covered ? riskBase + 15 : hasFailing ? riskBase + 25 : Math.max(8, riskBase - 20)),
        stabilityScore: hasPassing ? 88 : hasFailing ? 20 : covered ? 60 : 50,
        unused: !covered && !linkedReqs.length,
        hasFailingTests: hasFailing,
        lastTestStatus: linkedTests.length ? (perTest[linkedTests[0]] ?? null) : null,
      };
    });
  }

  // ─── GET /system-map/summary ──────────────────────────────────────────────

  @Get("summary")
  getSummary(@Param("id") id: string) {
    const base = this.base(id);
    const hasFlow = fs.existsSync(path.join(base, "flow-graph.json"));
    const hasEp = fs.existsSync(path.join(base, "endpoints.json"));
    const projectType = hasFlow && hasEp ? "hybrid" : hasFlow ? "ui" : "api";

    const flows = hasFlow ? this.buildFlows(id) : [];
    const endpoints = hasEp ? this.buildEndpoints(id) : [];

    const cF = flows.filter((f: any) => f.coverageScore > 0).length;
    const cE = endpoints.filter((e: any) => e.coverageScore > 0).length;

    return {
      projectType,
      totalFlows: flows.length,
      totalEndpoints: endpoints.length,
      coveredFlows: cF,
      coveredEndpoints: cE,
      coveredFlowsPct: flows.length ? Math.round(cF / flows.length * 100) : 0,
      coveredEndpointsPct: endpoints.length ? Math.round(cE / endpoints.length * 100) : 0,
      highRiskFlows: flows.filter((f: any) => f.riskScore >= 70).length,
      highRiskEndpoints: endpoints.filter((e: any) => e.riskScore >= 70).length,
      unusedEndpoints: endpoints.filter((e: any) => e.unused).length,
      flowsWithFailingTests: flows.filter((f: any) => f.hasFailingTests).length,
      endpointsWithFailingTests: endpoints.filter((e: any) => e.hasFailingTests).length,
    };
  }

  // ─── GET /system-map/flows ────────────────────────────────────────────────

  @Get("flows")
  getFlows(@Param("id") id: string) {
    return this.buildFlows(id);
  }

  // ─── GET /system-map/endpoints ────────────────────────────────────────────

  @Get("endpoints")
  getEndpoints(@Param("id") id: string) {
    return this.buildEndpoints(id);
  }

  // ─── GET /system-map/flow-graph ───────────────────────────────────────────

  @Get("flow-graph")
  getFlowGraph(@Param("id") id: string) {
    const raw = this.readJson(path.join(this.base(id), "flow-graph.json"), null);
    return this.normaliseGraph(raw);
  }

  // ─── POST /system-map/rebuild ─────────────────────────────────────────────

  @Post("rebuild")
  rebuild(@Param("id") id: string) {
    return { ok: true, ...this.getSummary(id) };
  }
}
