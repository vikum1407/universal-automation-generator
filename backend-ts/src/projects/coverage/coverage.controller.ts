import { Controller, Get, Param } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_BASE = "./qlitz-output";

@Controller("projects/:id")
export class CoverageController {
  private base(id: string) {
    return path.join(OUTPUT_BASE, id);
  }

  @Get("coverage")
  async getCoverage(@Param("id") id: string) {
    const base = this.base(id);
    const rtmFile = path.join(base, "rtm.json");
    const flowGraphFile = path.join(base, "flow-graph.json");
    const endpointsFile = path.join(base, "endpoints.json");
    const apiTestsDir = path.join(base, "tests");
    const uiTestsDir = base;

    const hasFlow = fs.existsSync(flowGraphFile);
    const hasEndpoints = fs.existsSync(endpointsFile);

    // ---- Load RTM ----
    const rtm = fs.existsSync(rtmFile)
      ? JSON.parse(fs.readFileSync(rtmFile, "utf8"))
      : { requirements: [] };
    const allReqs: any[] = rtm.requirements ?? [];

    // ---- Build spec-file index ----
    const specIndex = new Set<string>();
    if (fs.existsSync(apiTestsDir)) {
      fs.readdirSync(apiTestsDir)
        .filter(f => f.endsWith(".spec.ts"))
        .forEach(f => specIndex.add(f));
    }
    if (fs.existsSync(uiTestsDir)) {
      fs.readdirSync(uiTestsDir)
        .filter(f => f.endsWith(".spec.ts"))
        .forEach(f => specIndex.add(f));
    }

    const specNameFor = (source: { method?: string; endpointPath?: string }): string => {
      if (source?.method && source?.endpointPath) {
        return (
          `${source.method}_${source.endpointPath}`
            .replace(/[{}\/]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "") + ".spec.ts"
        );
      }
      return "";
    };

    const isCovered = (r: any): boolean => {
      if (Array.isArray(r.coveredBy) && r.coveredBy.length > 0) return true;
      const specFile = specNameFor(r.source ?? {});
      return specFile ? specIndex.has(specFile) : false;
    };

    // ===================================================
    // 1. REQUIREMENTS
    // ===================================================
    const coveredRequirements: any[] = [];
    const uncoveredRequirements: any[] = [];

    for (const r of allReqs) {
      const covered = isCovered(r);
      const suggestedTestFile =
        specNameFor(r.source ?? {}) ||
        `${(r.id ?? "req").replace(/[^a-zA-Z0-9]/g, "_")}.spec.ts`;

      const item = {
        id: r.id,
        title: r.title || r.description || r.id,
        description: r.description,
        type: r.type ?? "api",
        riskLevel: r.riskLevel ?? "medium",
        businessPriority: r.businessPriority ?? "medium",
        lastUpdated: r.lastUpdated ?? null,
        tags: r.tags ?? [],
        suggestedTestFile,
        specFile: covered ? (r.coveredBy?.[0] ?? suggestedTestFile) : null,
      };

      if (covered) coveredRequirements.push(item);
      else uncoveredRequirements.push(item);
    }

    const requirementsTotal = allReqs.length;
    const requirementsCovered = coveredRequirements.length;
    const requirementsCoveragePct =
      requirementsTotal > 0
        ? Math.round((requirementsCovered / requirementsTotal) * 1000) / 10
        : 0;

    // ===================================================
    // 2. BY REQUIREMENT TYPE BREAKDOWN
    // ===================================================
    const typeMap: Record<string, { total: number; covered: number }> = {};
    for (const r of allReqs) {
      const t = r.type ?? "api";
      if (!typeMap[t]) typeMap[t] = { total: 0, covered: 0 };
      typeMap[t].total++;
      if (isCovered(r)) typeMap[t].covered++;
    }
    const byRequirementType = Object.entries(typeMap).map(([type, counts]) => ({
      type,
      total: counts.total,
      covered: counts.covered,
      uncovered: counts.total - counts.covered,
      pct: counts.total > 0 ? Math.round((counts.covered / counts.total) * 1000) / 10 : 0,
    }));

    // ===================================================
    // 3. API ENDPOINT COVERAGE
    // ===================================================
    let apiEndpointsTotal = 0;
    let apiEndpointsCovered = 0;
    let apiCoveragePct: number | null = null;
    const untestedEndpoints: any[] = [];

    if (hasEndpoints) {
      const endpoints: any[] = JSON.parse(fs.readFileSync(endpointsFile, "utf8"));
      apiEndpointsTotal = endpoints.length;

      for (const ep of endpoints) {
        const req = allReqs.find(
          r => r.source?.endpointPath === ep.path && r.source?.method === ep.method
        );
        const specFile = req
          ? specNameFor(req.source ?? {})
          : `${ep.method}_${ep.path}`.replace(/[{}\/]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") + ".spec.ts";
        const covered = req ? isCovered(req) : specIndex.has(specFile);

        if (covered) {
          apiEndpointsCovered++;
        } else {
          untestedEndpoints.push({
            method: ep.method,
            path: ep.path,
            summary: ep.summary || `${ep.method} ${ep.path}`,
            tags: ep.tags ?? [],
            suggestedTestFile: specFile,
          });
        }
      }

      apiCoveragePct =
        apiEndpointsTotal > 0
          ? Math.round((apiEndpointsCovered / apiEndpointsTotal) * 1000) / 10
          : 0;
    }

    // ===================================================
    // 4. UI FLOW COVERAGE
    // ===================================================
    let uiFlowsTotal = 0;
    let uiFlowsCovered = 0;
    let uiCoveragePct: number | null = null;
    const untestedFlows: any[] = [];

    if (hasFlow) {
      const flowGraph = JSON.parse(fs.readFileSync(flowGraphFile, "utf8"));
      const edges: any[] = flowGraph.edges ?? [];
      uiFlowsTotal = edges.length;

      for (const e of edges) {
        const label = e.action ? `${e.action} → ${e.to}` : `navigate (${e.from} → ${e.to})`;
        const req = allReqs.find(
          r =>
            r.type === "ui" &&
            (
              (r.source?.pageName && e.from?.includes(r.source.pageName)) ||
              (r.description && label.includes(r.description))
            )
        );
        const covered = req ? isCovered(req) : false;

        if (covered) {
          uiFlowsCovered++;
        } else {
          const flowId = e.id ?? `${e.from}->${e.to}`;
          untestedFlows.push({
            id: flowId,
            from: e.from,
            to: e.to,
            action: e.action ?? null,
            selector: e.selector ?? null,
            label,
            suggestedTestFile: `ui_${flowId.replace(/[^a-zA-Z0-9]/g, "_")}.spec.ts`,
          });
        }
      }

      uiCoveragePct =
        uiFlowsTotal > 0
          ? Math.round((uiFlowsCovered / uiFlowsTotal) * 1000) / 10
          : 0;
    }

    // ===================================================
    // 5. HYBRID SCENARIOS
    // ===================================================
    const hybridReqs = allReqs.filter(r => r.type === "hybrid");
    const hybridScenariosTotal = hybridReqs.length;
    const hybridScenariosCovered = hybridReqs.filter(r => isCovered(r)).length;
    const hybridCoveragePct =
      hybridScenariosTotal > 0
        ? Math.round((hybridScenariosCovered / hybridScenariosTotal) * 1000) / 10
        : null;

    // ===================================================
    // 6. HIGH-RISK UNCOVERED
    // ===================================================
    const highRiskUncovered = uncoveredRequirements.filter(
      r => r.riskLevel === "high" || r.businessPriority === "critical"
    );

    return {
      generatedAt: new Date().toISOString(),
      projectType: hasFlow && hasEndpoints ? "hybrid" : hasFlow ? "ui" : "api",
      summary: {
        requirementsTotal,
        requirementsCovered,
        requirementsCoveragePct,
        apiEndpointsTotal: hasEndpoints ? apiEndpointsTotal : null,
        apiEndpointsCovered: hasEndpoints ? apiEndpointsCovered : null,
        apiCoveragePct,
        uiFlowsTotal: hasFlow ? uiFlowsTotal : null,
        uiFlowsCovered: hasFlow ? uiFlowsCovered : null,
        uiCoveragePct,
        hybridScenariosTotal: hybridScenariosTotal > 0 ? hybridScenariosTotal : null,
        hybridScenariosCovered: hybridScenariosTotal > 0 ? hybridScenariosCovered : null,
        hybridCoveragePct,
        specFilesFound: specIndex.size,
      },
      byRequirementType,
      coveredRequirements,
      uncoveredRequirements,
      gaps: {
        untestedEndpoints,
        untestedFlows,
        untestedRequirements: uncoveredRequirements,
        highRiskUncovered,
      },
    };
  }
}
