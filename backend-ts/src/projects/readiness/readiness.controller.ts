import { Controller, Get, Param, Query } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { InsightEngine } from "../insights/insights.engine";
import { PrismaService } from "../../../prisma/prisma.service";

const BASE = "./qlitz-output";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ReadinessStatus = "ready" | "at-risk" | "not-ready";

interface Gate {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  critical: boolean;     // critical gate failure → "not-ready"
  value: string;         // measured value
  target: string;        // required value
  tab: string;           // which project tab to deep-link
}

interface ScoreDimension {
  label: string;
  score: number;         // 0-100
  color: string;
  detail: string;
}

export interface ReadinessAssessment {
  status: ReadinessStatus;
  overallScore: number;  // 0-100 weighted average
  dimensions: ScoreDimension[];
  gates: Gate[];
  summary: string;
  recommendations: { label: string; detail: string; tab: string; priority: "high" | "medium" | "low" }[];
  environment: string;
  generatedAt: string;
  coverage: { requirementsPct: number | null; endpointsPct: number | null; flowsPct: number | null };
  stability: { passRate: number | null; failedTests: number; flakyCount: number; totalTests: number };
  openCriticalInsights: number;
  openHighInsights: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function loadJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch { return null; }
}

function scoreColor(score: number): string {
  if (score >= 80) return "#4CAF50";
  if (score >= 60) return "#FF9800";
  return "#EF5350";
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

// ─── Default policy thresholds ─────────────────────────────────────────────────

const POLICY = {
  coverageCriticalRequirements: 1.0,  // 100% critical reqs covered
  coverageOverall:               0.70, // 70% overall
  maxFailureRate:                0.10, // ≤10% failing tests
  maxFlakyCritical:              0,    // 0 flaky critical tests
  minPassRate:                   0.80, // ≥80% pass rate
  maxOpenCriticalInsights:       0,    // 0 open critical insights
};

// ─── Controller ────────────────────────────────────────────────────────────────

@Controller("projects/:projectId/readiness")
export class ReadinessController {

  @Get()
  async assess(
    @Param("projectId") projectId: string,
    @Query("env") env: string = "staging",
  ): Promise<ReadinessAssessment> {

    const dir = path.join(BASE, projectId);

    // ── Load raw data ──────────────────────────────────────────────────────────

    const rtm         = loadJson<any>(path.join(dir, "rtm.json"));
    const testResults = loadJson<any>(path.join(dir, "test-results.json"));
    const endpoints   = loadJson<any[]>(path.join(dir, "endpoints.json")) ?? [];
    const flowGraph   = loadJson<any>(path.join(dir, "flow-graph.json"));
    const healStore   = loadJson<any>(path.join(dir, "auto-heal.json"))
                     ?? loadJson<any>(path.join(dir, "autoheal-log.json"));

    const heals: any[] = healStore?.heals ?? (Array.isArray(healStore) ? healStore : []);
    const reqs: any[]  = rtm?.requirements ?? [];

    // Spec file count
    const specDir   = path.join(dir, "tests");
    const rootSpecs = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(".spec.ts")) : [];
    const subSpecs  = fs.existsSync(specDir) ? fs.readdirSync(specDir).filter(f => f.endsWith(".spec.ts")) : [];
    const totalTests = rootSpecs.length + subSpecs.length;

    // ── Requirement metrics ────────────────────────────────────────────────────

    const totalReqs   = reqs.length;
    const coveredReqs = reqs.filter(r => r.coveredBy?.length > 0).length;
    const reqPct      = totalReqs > 0 ? coveredReqs / totalReqs : null;

    const criticalReqs = reqs.filter(r =>
      r.businessPriority === "critical" || r.riskLevel === "high"
    );
    const coveredCritical = criticalReqs.filter(r => r.coveredBy?.length > 0).length;
    const criticalCoveragePct = criticalReqs.length > 0
      ? coveredCritical / criticalReqs.length
      : 1.0; // no critical reqs = considered OK

    const highRiskUncovered = reqs.filter(r =>
      !r.coveredBy?.length &&
      (r.riskLevel === "high" || r.businessPriority === "critical")
    ).length;

    // ── Endpoint metrics ───────────────────────────────────────────────────────

    let endpointCoveragePct: number | null = null;
    if (endpoints.length > 0) {
      const coveredEndpoints = Math.round(endpoints.length * (reqPct ?? 0));
      endpointCoveragePct = reqPct; // proxy if no per-endpoint tracking
    }

    // ── Flow metrics ───────────────────────────────────────────────────────────

    const totalFlows = flowGraph?.pages?.length ?? flowGraph?.nodes?.length ?? 0;
    let flowCoveragePct: number | null = totalFlows > 0 ? (reqPct ?? null) : null;

    // ── Stability metrics ──────────────────────────────────────────────────────

    const failedTests  = testResults?.failures?.length ?? (testResults?.status === "failed" ? 1 : 0);
    const passedTests  = Math.max(totalTests - failedTests, 0);
    const passRate     = totalTests > 0 ? passedTests / totalTests : null;
    const failureRate  = totalTests > 0 ? failedTests / totalTests : 0;
    const flakyCount   = heals.filter(h => h.status === "pending" || h.status === "applied").length;

    // ── Insights ───────────────────────────────────────────────────────────────

    let openCriticalInsights = 0;
    let openHighInsights     = 0;
    try {
      const engine = new InsightEngine();
      const openInsights = engine.list(projectId, { statuses: ["open", "in-progress"] });
      openCriticalInsights = openInsights.filter(i => i.severity === "critical").length;
      openHighInsights     = openInsights.filter(i => i.severity === "high").length;
    } catch {}

    // ── AI/Automation confidence ───────────────────────────────────────────────

    const appliedHeals = heals.filter(h => h.status === "applied" || h.status === "validated").length;
    const totalHeals   = heals.length;
    const healRate     = totalHeals > 0 ? appliedHeals / totalHeals : 1.0;
    const dataCompleteness = totalReqs > 0 && totalTests > 0 ? 1.0 : totalReqs > 0 ? 0.6 : 0.3;
    const aiConfidence = clamp((dataCompleteness * 0.6 + healRate * 0.4) * 100);

    // ── Score dimensions (0-100) ───────────────────────────────────────────────

    const coverageScore  = clamp((reqPct ?? 0) * 100);
    const riskScore      = clamp((1 - (highRiskUncovered / Math.max(totalReqs, 1))) * 100);
    const stabilityScore = clamp((passRate ?? 0.5) * 100);
    const flowsScore     = clamp(flowCoveragePct !== null ? flowCoveragePct * 100 : coverageScore);
    const endpointsScore = clamp(endpointCoveragePct !== null ? endpointCoveragePct * 100 : coverageScore);

    const dimensions: ScoreDimension[] = [
      { label: "Coverage",      score: coverageScore,  color: scoreColor(coverageScore),  detail: `${coveredReqs}/${totalReqs} requirements` },
      { label: "Risk",          score: riskScore,      color: scoreColor(riskScore),      detail: `${highRiskUncovered} high-risk uncovered` },
      { label: "Stability",     score: stabilityScore, color: scoreColor(stabilityScore), detail: passRate !== null ? `${clamp(passRate * 100)}% pass rate` : "No runs yet" },
      { label: "Flows",         score: flowsScore,     color: scoreColor(flowsScore),     detail: totalFlows > 0 ? `${totalFlows} flows discovered` : "No flows" },
      { label: "Endpoints",     score: endpointsScore, color: scoreColor(endpointsScore), detail: endpoints.length > 0 ? `${endpoints.length} endpoints` : "No endpoints" },
      { label: "AI Confidence", score: aiConfidence,   color: scoreColor(aiConfidence),   detail: `${appliedHeals} heals applied` },
    ];

    const overallScore = clamp(
      coverageScore * 0.30 +
      riskScore     * 0.25 +
      stabilityScore * 0.25 +
      flowsScore    * 0.10 +
      endpointsScore * 0.05 +
      aiConfidence  * 0.05
    );

    // ── Gates ─────────────────────────────────────────────────────────────────

    const gates: Gate[] = [
      {
        id: "critical-requirements",
        name: "Critical requirements covered",
        description: "All business-critical and high-risk requirements must have at least one test",
        passed: criticalCoveragePct >= POLICY.coverageCriticalRequirements || criticalReqs.length === 0,
        critical: true,
        value: criticalReqs.length > 0
          ? `${coveredCritical}/${criticalReqs.length} (${clamp(criticalCoveragePct * 100)}%)`
          : "No critical requirements",
        target: "100%",
        tab: "rtm",
      },
      {
        id: "overall-coverage",
        name: "Overall coverage threshold",
        description: `Test coverage must be at least ${Math.round(POLICY.coverageOverall * 100)}%`,
        passed: reqPct === null || reqPct >= POLICY.coverageOverall,
        critical: false,
        value: reqPct !== null ? `${clamp(reqPct * 100)}%` : "No requirements",
        target: `${Math.round(POLICY.coverageOverall * 100)}%`,
        tab: "coverage",
      },
      {
        id: "failure-rate",
        name: "Test failure rate",
        description: `Failure rate in the last test run must be below ${Math.round(POLICY.maxFailureRate * 100)}%`,
        passed: totalTests === 0 || failureRate <= POLICY.maxFailureRate,
        critical: false,
        value: totalTests > 0 ? `${clamp(failureRate * 100)}% (${failedTests} failing)` : "No tests run",
        target: `≤${Math.round(POLICY.maxFailureRate * 100)}%`,
        tab: "tests",
      },
      {
        id: "stability",
        name: "Test pass rate",
        description: `Overall test pass rate must be at least ${Math.round(POLICY.minPassRate * 100)}%`,
        passed: passRate === null || passRate >= POLICY.minPassRate,
        critical: false,
        value: passRate !== null ? `${clamp(passRate * 100)}%` : "No test results",
        target: `≥${Math.round(POLICY.minPassRate * 100)}%`,
        tab: "tests",
      },
      {
        id: "no-critical-insights",
        name: "No open critical insights",
        description: "No open insights of critical severity that signal blocking risks",
        passed: openCriticalInsights <= POLICY.maxOpenCriticalInsights,
        critical: true,
        value: `${openCriticalInsights} critical open`,
        target: "0",
        tab: "insights",
      },
      {
        id: "no-high-risk-uncovered",
        name: "No high-risk gaps",
        description: "No high-risk or business-critical requirements left without tests",
        passed: highRiskUncovered === 0,
        critical: false,
        value: `${highRiskUncovered} uncovered`,
        target: "0",
        tab: "rtm",
      },
      {
        id: "flakiness",
        name: "Flakiness control",
        description: "Number of flaky tests identified should be minimal",
        passed: flakyCount <= 2,
        critical: false,
        value: `${flakyCount} flaky test${flakyCount !== 1 ? "s" : ""}`,
        target: "≤2",
        tab: "autoheal",
      },
    ];

    // ── Overall status ─────────────────────────────────────────────────────────

    const criticalFail = gates.some(g => g.critical && !g.passed);
    const nonCriticalFail = gates.some(g => !g.critical && !g.passed);

    const status: ReadinessStatus = criticalFail
      ? "not-ready"
      : nonCriticalFail
        ? "at-risk"
        : "ready";

    // ── Summary narrative ──────────────────────────────────────────────────────

    const failedGates = gates.filter(g => !g.passed);
    let summary: string;

    if (status === "ready") {
      summary = `This project is ready for ${env}. All quality gates have passed: coverage is at ${clamp(reqPct! * 100)}%, stability is strong (${clamp(passRate! * 100)}% pass rate), and no critical risks are blocking release.`;
    } else if (status === "not-ready") {
      const criticalFailedNames = gates.filter(g => g.critical && !g.passed).map(g => g.name);
      summary = `This project is NOT ready for ${env}. Critical blockers: ${criticalFailedNames.join("; ")}. These must be resolved before proceeding.`;
    } else {
      const warnings = failedGates.map(g => `${g.name} (${g.value})`).join(", ");
      summary = `This project is at-risk for ${env}. While no critical gates are failing, the following areas need attention: ${warnings}. Address these before releasing.`;
    }

    // ── Recommendations ────────────────────────────────────────────────────────

    const recommendations: ReadinessAssessment["recommendations"] = [];

    if (highRiskUncovered > 0)
      recommendations.push({ label: `Cover ${highRiskUncovered} high-risk requirement${highRiskUncovered > 1 ? "s" : ""}`, detail: "Generate tests for critical requirements with no coverage", tab: "tests", priority: "high" });

    if (openCriticalInsights > 0)
      recommendations.push({ label: `Resolve ${openCriticalInsights} critical insight${openCriticalInsights > 1 ? "s" : ""}`, detail: "Critical insights are blocking the readiness gate", tab: "insights", priority: "high" });

    if (failedTests > 0)
      recommendations.push({ label: `Fix ${failedTests} failing test${failedTests > 1 ? "s" : ""}`, detail: "Failing tests reduce stability score and readiness", tab: "tests", priority: "high" });

    if (reqPct !== null && reqPct < POLICY.coverageOverall)
      recommendations.push({ label: `Increase coverage to ${Math.round(POLICY.coverageOverall * 100)}%`, detail: `Currently at ${clamp(reqPct * 100)}% — review uncovered requirements in RTM`, tab: "rtm", priority: "medium" });

    if (flakyCount > 2)
      recommendations.push({ label: `Reduce ${flakyCount} flaky tests`, detail: "Apply Auto-Heal patches to stabilize flaky tests", tab: "autoheal", priority: "medium" });

    if (openHighInsights > 0)
      recommendations.push({ label: `Address ${openHighInsights} high-severity insight${openHighInsights > 1 ? "s" : ""}`, detail: "High insights indicate areas at elevated risk", tab: "insights", priority: "low" });

    if (recommendations.length === 0 && status !== "ready")
      recommendations.push({ label: "Run your test suite", detail: "Execute tests to get fresh stability data", tab: "tests", priority: "low" });

    return {
      status,
      overallScore,
      dimensions,
      gates,
      summary,
      recommendations,
      environment: env,
      generatedAt: new Date().toISOString(),
      coverage: {
        requirementsPct: reqPct !== null ? clamp(reqPct * 100) : null,
        endpointsPct:    endpointCoveragePct !== null ? clamp(endpointCoveragePct * 100) : null,
        flowsPct:        flowCoveragePct !== null ? clamp(flowCoveragePct * 100) : null,
      },
      stability: {
        passRate:     passRate !== null ? clamp(passRate * 100) : null,
        failedTests,
        flakyCount,
        totalTests,
      },
      openCriticalInsights,
      openHighInsights,
    };
  }
}

// ─── Org-scoped readiness (aggregated across all projects) ─────────────────────

interface OrgProjectSummary {
  projectId: string;
  name: string;
  type: string;
  url: string | null;
  status: ReadinessStatus;
  overallScore: number;
  gatesPassed: number;
  gatesTotal: number;
  criticalBlockers: number;
  coveragePct: number | null;
  stabilityPct: number | null;
  totalRequirements: number;
  generatedAt: string;
}

interface OrgReadinessReport {
  totalProjects: number;
  readyCount: number;
  atRiskCount: number;
  notReadyCount: number;
  averageScore: number;
  totalCriticalBlockers: number;
  projects: OrgProjectSummary[];
  generatedAt: string;
}

@Controller("org/readiness")
export class OrgReadinessController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async assess(): Promise<OrgReadinessReport> {
    const projects = await this.prisma.project.findMany({
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    const summaries: OrgProjectSummary[] = await Promise.all(
      projects.map(p => this.summarize(p))
    );

    const ready    = summaries.filter(s => s.status === "ready").length;
    const atRisk   = summaries.filter(s => s.status === "at-risk").length;
    const notReady = summaries.filter(s => s.status === "not-ready").length;
    const totalCritical = summaries.reduce((acc, s) => acc + s.criticalBlockers, 0);
    const avgScore = summaries.length > 0
      ? Math.round(summaries.reduce((acc, s) => acc + s.overallScore, 0) / summaries.length)
      : 0;

    return {
      totalProjects:        summaries.length,
      readyCount:           ready,
      atRiskCount:          atRisk,
      notReadyCount:        notReady,
      averageScore:         avgScore,
      totalCriticalBlockers: totalCritical,
      projects:             summaries,
      generatedAt:          new Date().toISOString(),
    };
  }

  private async summarize(project: any): Promise<OrgProjectSummary> {
    const pid = project.id;
    const dir = path.join(BASE, pid);

    const rtm         = loadJson<any>(path.join(dir, "rtm.json"));
    const testResults = loadJson<any>(path.join(dir, "test-results.json"));
    const reqs: any[] = rtm?.requirements ?? [];

    const specDir    = path.join(dir, "tests");
    const rootSpecs  = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(".spec.ts")) : [];
    const subSpecs   = fs.existsSync(specDir) ? fs.readdirSync(specDir).filter(f => f.endsWith(".spec.ts")) : [];
    const totalTests = rootSpecs.length + subSpecs.length;

    const coveredReqs = reqs.filter(r => r.coveredBy?.length > 0).length;
    const reqPct      = reqs.length > 0 ? coveredReqs / reqs.length : null;

    const criticalReqs    = reqs.filter(r => r.businessPriority === "critical" || r.riskLevel === "high");
    const coveredCritical = criticalReqs.filter(r => r.coveredBy?.length > 0).length;
    const criticalPct     = criticalReqs.length > 0 ? coveredCritical / criticalReqs.length : 1.0;
    const highRiskUncov   = reqs.filter(r => !r.coveredBy?.length && (r.riskLevel === "high" || r.businessPriority === "critical")).length;

    const failedTests = testResults?.failures?.length ?? (testResults?.status === "failed" ? 1 : 0);
    const passedTests = Math.max(totalTests - failedTests, 0);
    const passRate    = totalTests > 0 ? passedTests / totalTests : null;
    const failureRate = totalTests > 0 ? failedTests / totalTests : 0;

    let openCritical = 0;
    try {
      const engine = new InsightEngine();
      const open   = engine.list(pid, { statuses: ["open", "in-progress"] });
      openCritical = open.filter(i => i.severity === "critical").length;
    } catch {}

    // Gates (subset — just the status-determining ones)
    const gateResults = [
      criticalPct >= POLICY.coverageCriticalRequirements || criticalReqs.length === 0, // critical coverage
      reqPct === null || reqPct >= POLICY.coverageOverall,                              // overall coverage
      totalTests === 0 || failureRate <= POLICY.maxFailureRate,                         // failure rate
      passRate === null || passRate >= POLICY.minPassRate,                              // pass rate
      openCritical <= POLICY.maxOpenCriticalInsights,                                   // no critical insights
      highRiskUncov === 0,                                                               // no high-risk gaps
    ];
    const criticalGateResults = [gateResults[0], gateResults[4]]; // critical gates
    const gatesPassed = gateResults.filter(Boolean).length;
    const criticalBlockers = criticalGateResults.filter(r => !r).length + openCritical;

    const coverageScore  = clamp((reqPct ?? 0) * 100);
    const riskScore      = clamp((1 - highRiskUncov / Math.max(reqs.length, 1)) * 100);
    const stabilityScore = clamp((passRate ?? 0.5) * 100);
    const overallScore   = clamp(coverageScore * 0.40 + riskScore * 0.35 + stabilityScore * 0.25);

    const criticalFail    = !gateResults[0] || !gateResults[4];
    const nonCriticalFail = gateResults.some(r => !r);
    const status: ReadinessStatus = criticalFail ? "not-ready" : nonCriticalFail ? "at-risk" : "ready";

    const name = (project.name ?? project.url ?? project.swaggerUrl ?? pid) as string;

    return {
      projectId:         pid,
      name:              typeof name === "string" ? name : pid,
      type:              project.type ?? "ui",
      url:               project.url ?? project.swaggerUrl ?? null,
      status,
      overallScore,
      gatesPassed,
      gatesTotal:        gateResults.length,
      criticalBlockers,
      coveragePct:       reqPct !== null ? clamp(reqPct * 100) : null,
      stabilityPct:      passRate !== null ? clamp(passRate * 100) : null,
      totalRequirements: reqs.length,
      generatedAt:       new Date().toISOString(),
    };
  }
}
