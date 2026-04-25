import { Controller, Get, Param } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_BASE = "./qlitz-output";

@Controller("projects/:id/flow")
export class FlowController {
  private base(id: string) {
    return path.join(OUTPUT_BASE, id);
  }

  @Get()
  async getFlow(@Param("id") id: string) {
    const file = path.join(this.base(id), "flow-graph.json");
    if (!fs.existsSync(file)) return { nodes: [], edges: [] };
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  @Get("rtm")
  async getRTM(@Param("id") id: string) {
    const file = path.join(this.base(id), "rtm.json");
    if (!fs.existsSync(file)) return { generatedAt: "", requirements: [] };
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  // -------------------------------------------------------
  // COVERAGE — returns a rich CoverageReport for UI, API, or hybrid projects
  // -------------------------------------------------------
  @Get("coverage")
  async getCoverage(@Param("id") id: string) {
    const base = this.base(id);
    const rtmFile = path.join(base, "rtm.json");
    const flowGraphFile = path.join(base, "flow-graph.json");
    const endpointsFile = path.join(base, "endpoints.json");
    const apiTestsDir = path.join(base, "tests");   // API specs live here
    const uiTestsDir = base;                         // UI specs live at root

    // ---- Determine project type ----
    const hasFlow = fs.existsSync(flowGraphFile);
    const hasEndpoints = fs.existsSync(endpointsFile);
    const projectType: "ui" | "api" | "hybrid" =
      hasFlow && hasEndpoints ? "hybrid" : hasFlow ? "ui" : "api";

    // ---- Load RTM ----
    const rtm = fs.existsSync(rtmFile)
      ? JSON.parse(fs.readFileSync(rtmFile, "utf8"))
      : { requirements: [] };

    // ---- Build spec-file index for fast lookup ----
    const specIndex = new Set<string>();
    if (fs.existsSync(apiTestsDir)) {
      fs.readdirSync(apiTestsDir)
        .filter(f => f.endsWith(".spec.ts"))
        .forEach(f => specIndex.add(f));
    }
    // Also scan root for UI spec files
    if (fs.existsSync(uiTestsDir)) {
      fs.readdirSync(uiTestsDir)
        .filter(f => f.endsWith(".spec.ts"))
        .forEach(f => specIndex.add(f));
    }

    // ---- Helper: derive expected spec filename from a requirement ----
    const specNameFor = (r: any): string => {
      if (r.source?.endpointPath && r.source?.method) {
        return (
          `${r.source.method}_${r.source.endpointPath}`
            .replace(/[{}\/]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "") + ".spec.ts"
        );
      }
      return "";
    };

    // ---- Helper: is a requirement covered? ----
    const isCovered = (r: any): boolean => {
      if (Array.isArray(r.coveredBy) && r.coveredBy.length > 0) return true;
      const specFile = specNameFor(r);
      return specFile ? specIndex.has(specFile) : false;
    };

    // ===================================================
    // 1. REQUIREMENT COVERAGE
    // ===================================================
    const allReqs: any[] = rtm.requirements ?? [];
    const reqItems = allReqs.map((r: any) => {
      const covered = isCovered(r);
      const specFile = specNameFor(r);
      return {
        id: r.id,
        label: r.title || r.description || r.id,
        description: r.description,
        type: r.type ?? "api",
        priority: r.businessPriority ?? "medium",
        risk: r.riskLevel ?? "medium",
        covered,
        specFile: covered ? (r.coveredBy?.[0] ?? specFile) : null,
        requirementId: r.id,
        tags: r.tags ?? []
      };
    });

    const coveredReqs = reqItems.filter(r => r.covered).length;

    // ===================================================
    // 2. ENDPOINT COVERAGE (API / hybrid)
    // ===================================================
    let endpointItems: any[] | null = null;
    let coveredEndpoints = 0;

    if (hasEndpoints) {
      const endpoints: any[] = JSON.parse(fs.readFileSync(endpointsFile, "utf8"));

      endpointItems = endpoints.map((ep: any) => {
        // Find matching RTM requirement
        const req = allReqs.find(
          r => r.source?.endpointPath === ep.path && r.source?.method === ep.method
        );
        const covered = req ? isCovered(req) : specIndex.has(
          `${ep.method}_${ep.path}`.replace(/[{}\/]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") + ".spec.ts"
        );

        return {
          id: `${ep.method} ${ep.path}`,
          method: ep.method,
          path: ep.path,
          label: ep.summary || `${ep.method} ${ep.path}`,
          tags: ep.tags ?? [],
          covered,
          requirementId: req?.id ?? null,
          specFile: covered ? specNameFor(req ?? { source: { method: ep.method, endpointPath: ep.path } }) : null
        };
      });

      coveredEndpoints = endpointItems.filter(e => e.covered).length;
    }

    // ===================================================
    // 3. UI FLOW COVERAGE (UI / hybrid)
    // ===================================================
    let flowItems: any[] | null = null;
    let coveredFlows = 0;

    if (hasFlow) {
      const flowGraph = JSON.parse(fs.readFileSync(flowGraphFile, "utf8"));
      const edges: any[] = flowGraph.edges ?? [];

      flowItems = edges.map((e: any) => {
        const label = e.action
          ? `${e.action} → ${e.to}`
          : `navigate (${e.from} → ${e.to})`;

        // Match against UI requirements by page/source
        const req = allReqs.find(
          r =>
            r.type === "ui" &&
            (
              (r.source?.pageName && e.from?.includes(r.source.pageName)) ||
              (r.description && label.includes(r.description))
            )
        );

        const covered = req ? isCovered(req) : false;

        return {
          id: e.id ?? `${e.from}->${e.to}`,
          label,
          from: e.from,
          to: e.to,
          action: e.action,
          selector: e.selector,
          covered,
          requirementId: req?.id ?? null
        };
      });

      coveredFlows = flowItems.filter(f => f.covered).length;
    }

    // ===================================================
    // 4. GAPS — every uncovered item across all dimensions
    // ===================================================
    const gaps: any[] = [];

    reqItems.filter(r => !r.covered).forEach(r => {
      gaps.push({
        id: r.id,
        dimension: "requirement",
        type: r.type,
        label: r.label,
        reason: "No test file found for this requirement",
        priority: r.priority,
        risk: r.risk,
        suggestedTestName: specNameFor({ source: { method: (r as any).method, endpointPath: (r as any).path } }) || `${r.id.replace(/[^a-zA-Z0-9]/g, "_")}.spec.ts`,
        tags: r.tags
      });
    });

    if (endpointItems) {
      endpointItems.filter(e => !e.covered).forEach(e => {
        if (!gaps.find(g => g.id === e.id)) {
          gaps.push({
            id: e.id,
            dimension: "endpoint",
            type: "api",
            label: e.label,
            method: e.method,
            path: e.path,
            reason: "No Playwright spec file found for this endpoint",
            priority: "medium",
            risk: "medium",
            suggestedTestName:
              `${e.method}_${e.path}`.replace(/[{}\/]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") + ".spec.ts",
            tags: e.tags
          });
        }
      });
    }

    if (flowItems) {
      flowItems.filter(f => !f.covered).forEach(f => {
        if (!gaps.find(g => g.id === f.id)) {
          gaps.push({
            id: f.id,
            dimension: "flow",
            type: "ui",
            label: f.label,
            reason: "No test covers this UI interaction",
            priority: "medium",
            risk: "low",
            suggestedTestName: `ui_${f.id.replace(/[^a-zA-Z0-9]/g, "_")}.spec.ts`,
            tags: []
          });
        }
      });
    }

    // ===================================================
    // 5. SUMMARY & SCORE
    // ===================================================
    const reqPct = allReqs.length > 0 ? Math.round((coveredReqs / allReqs.length) * 100) : 0;
    const epPct = endpointItems?.length
      ? Math.round((coveredEndpoints / endpointItems.length) * 100)
      : null;
    const flowPct = flowItems?.length
      ? Math.round((coveredFlows / flowItems.length) * 100)
      : null;

    // Overall score: weighted average of available dimensions
    const scores = [reqPct, epPct, flowPct].filter(v => v !== null) as number[];
    const overall = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return {
      projectType,
      generatedAt: new Date().toISOString(),
      summary: {
        overall,
        requirements: { total: allReqs.length, covered: coveredReqs, percent: reqPct },
        endpoints: endpointItems
          ? { total: endpointItems.length, covered: coveredEndpoints, percent: epPct ?? 0 }
          : null,
        flows: flowItems
          ? { total: flowItems.length, covered: coveredFlows, percent: flowPct ?? 0 }
          : null,
        gaps: gaps.length,
        specFilesFound: specIndex.size
      },
      requirements: reqItems,
      endpoints: endpointItems,
      flows: flowItems,
      gaps
    };
  }
}
