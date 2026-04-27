import { Controller, Get, Param } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { PrismaService } from "../../../prisma/prisma.service";
import { InsightEngine } from "../insights/insights.engine";

const BASE = "./qlitz-output";

function loadJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch { return null; }
}

function listSpecs(dir: string): string[] {
  const files: string[] = [];
  try {
    if (fs.existsSync(dir)) files.push(...fs.readdirSync(dir).filter(f => f.endsWith(".spec.ts")));
    const testsDir = path.join(dir, "tests");
    if (fs.existsSync(testsDir)) files.push(...fs.readdirSync(testsDir).filter(f => f.endsWith(".spec.ts")));
  } catch {}
  return files;
}

@Controller("projects/:projectId/overview")
export class OverviewController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get(@Param("projectId") projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { error: "Project not found" };

    const dir = path.join(BASE, projectId);

    // ── analytics ─────────────────────────────────────────────────────────────
    const specFiles = listSpecs(dir);
    const testResults = loadJson<any>(path.join(dir, "test-results.json"));
    const rtm = loadJson<any>(path.join(dir, "rtm.json"));
    const endpointsArr = loadJson<any[]>(path.join(dir, "endpoints.json")) ?? [];
    const flowGraph = loadJson<any>(path.join(dir, "flow-graph.json"));

    const totalTests = specFiles.length;
    const failed = testResults?.failures?.length ?? (testResults?.status === "failed" ? 1 : 0);
    const passed = Math.max(totalTests - failed, 0);
    const passRate = totalTests > 0 ? Math.round((passed / totalTests) * 100) : null;
    const lastRun: string | null = testResults?.timestamp ?? null;

    const reqs: any[] = rtm?.requirements ?? [];
    const totalReqs = reqs.length;
    const coveredReqs = reqs.filter(r => r.coveredBy?.length > 0).length;
    const reqPct = totalReqs > 0 ? Math.round((coveredReqs / totalReqs) * 100) : null;
    const highRiskUncovered = reqs.filter(r => !r.coveredBy?.length && (r.riskLevel === "high" || r.businessPriority === "critical")).length;

    // ── coverage ──────────────────────────────────────────────────────────────
    const coverageFile = loadJson<any>(path.join(dir, "coverage.json"));
    const coverageSummary = coverageFile?.summary ?? null;

    let endpointPct: number | null = null;
    let flowPct: number | null = null;
    if (coverageSummary?.apiEndpointsTotal > 0)
      endpointPct = Math.round((coverageSummary.apiEndpointsCovered / coverageSummary.apiEndpointsTotal) * 100);
    if (coverageSummary?.uiFlowsTotal > 0)
      flowPct = Math.round((coverageSummary.uiFlowsCovered / coverageSummary.uiFlowsTotal) * 100);

    const coverage = {
      requirementsPct:  reqPct,
      endpointsPct:     endpointPct ?? (endpointsArr.length > 0 ? 0 : null),
      flowsPct:         flowPct,
      highRiskUncovered,
      totalRequirements: totalReqs,
      coveredRequirements: coveredReqs,
      totalEndpoints: endpointsArr.length,
      totalFlows: (flowGraph?.pages?.length ?? 0),
      specFilesFound: specFiles.length,
    };

    // ── stability ─────────────────────────────────────────────────────────────
    const healStore = loadJson<any>(path.join(dir, "auto-heal.json"))
      ?? loadJson<any>(path.join(dir, "autoheal-log.json"));
    const heals: any[] = healStore?.heals ?? (Array.isArray(healStore) ? healStore : []);
    const flakyCount = heals.filter(h => h.status === "pending" || h.status === "applied").length;

    const stability = {
      passRate,
      failedTests: failed,
      totalTests,
      flakyCount,
      lastRun,
      hasResults: testResults !== null,
    };

    // ── ai & automation ───────────────────────────────────────────────────────
    const suggestions = loadJson<any[]>(path.join(dir, "ai-suggestions.json")) ?? [];
    const pendingSuggestions = suggestions.filter(s => !s.status || s.status === "pending").length;
    const appliedSuggestions = suggestions.filter(s => s.status === "applied").length;
    const pendingHeals = heals.filter(h => h.status === "pending" && h.autoApplicable !== false).length;
    const appliedHeals = heals.filter(h => h.status === "applied" || h.status === "validated").length;
    const totalHeals = heals.length;
    const healSuccessRate = totalHeals > 0 ? Math.round((appliedHeals / totalHeals) * 100) : null;

    const aiAutomation = {
      pendingSuggestions,
      appliedSuggestions,
      totalSuggestions: suggestions.length,
      pendingHeals,
      appliedHeals,
      totalHeals,
      healSuccessRate,
    };

    // ── insights ──────────────────────────────────────────────────────────────
    let topInsights: any[] = [];
    try {
      const engine = new InsightEngine();
      topInsights = engine.list(projectId, { statuses: ["open", "in-progress"] }).slice(0, 4);
    } catch {}

    // ── recent activity ───────────────────────────────────────────────────────
    const historyData = loadJson<any>(path.join(dir, "history.json"));
    const recentActivity: any[] = (historyData?.events ?? [])
      .slice(-6)
      .reverse()
      .map((e: any) => ({
        id: e.id,
        summary: e.summary,
        eventType: e.eventType,
        actorType: e.actorType,
        timestamp: e.timestamp,
        impact: e.metadata?.impact ?? null,
      }));

    // ── overall health status ─────────────────────────────────────────────────
    const criticalInsights = topInsights.filter((i: any) => i.severity === "critical").length;
    const highInsights = topInsights.filter((i: any) => i.severity === "high").length;
    let healthStatus: string;
    if (project.status === "processing" || project.status === "initializing") {
      healthStatus = "processing";
    } else if (project.status === "failed") {
      healthStatus = "failed";
    } else if (criticalInsights > 0 || failed > 0) {
      healthStatus = "unstable";
    } else if (highInsights > 0 || highRiskUncovered > 0 || (reqPct !== null && reqPct < 50)) {
      healthStatus = "at-risk";
    } else {
      healthStatus = "healthy";
    }

    // ── next actions ──────────────────────────────────────────────────────────
    const nextActions: { label: string; description: string; tab: string; priority: "high" | "medium" | "low" }[] = [];

    if (highRiskUncovered > 0)
      nextActions.push({ label: "Generate tests for critical gaps", description: `${highRiskUncovered} high-risk requirements have no tests`, tab: "tests", priority: "high" });
    if (pendingHeals > 0)
      nextActions.push({ label: "Apply Auto-Heal patches", description: `${pendingHeals} patches ready to apply with high confidence`, tab: "autoheal", priority: "high" });
    if (pendingSuggestions > 0)
      nextActions.push({ label: "Review AI suggestions", description: `${pendingSuggestions} suggestions waiting for review`, tab: "suggestions", priority: "medium" });
    if (reqPct !== null && reqPct < 60)
      nextActions.push({ label: "Improve test coverage", description: `Coverage is at ${reqPct}% — target 80%+`, tab: "rtm", priority: "medium" });
    if (flakyCount > 0)
      nextActions.push({ label: "Investigate flaky tests", description: `${flakyCount} tests are showing flakiness patterns`, tab: "replay", priority: "low" });
    if (nextActions.length === 0)
      nextActions.push({ label: "Run tests", description: "Execute your test suite to get fresh results", tab: "tests", priority: "low" });

    return {
      project: {
        id: project.id,
        type: project.type,
        url: (project as any).url ?? null,
        swaggerUrl: (project as any).swaggerUrl ?? null,
        env: (project as any).env ?? "production",
        status: project.status,
        createdAt: (project as any).createdAt ?? null,
      },
      healthStatus,
      coverage,
      stability,
      aiAutomation,
      topInsights,
      recentActivity,
      nextActions,
    };
  }
}
