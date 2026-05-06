import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, HttpCode,
  NotFoundException, BadRequestException,
} from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

const OUTPUT_BASE = "./qlitz-output";

// ─── Domain types ─────────────────────────────────────────────────────────────

type BudgetScope    = "org" | "project" | "release";
type BudgetSeverity = "soft" | "hard";
type BudgetStatus   = "within-budget" | "approaching-budget" | "exceeded";

type BudgetMetric =
  | "coverageOverall"
  | "coverageCritical"
  | "highRiskUncovered"
  | "failureRate"
  | "flakinessCount"
  | "unstableCriticalFlows"
  | "unstableCriticalEndpoints"
  | "openCriticalInsights"
  | "unresolvedAISuggestions";

interface QualityBudget {
  id:          string;
  scope:       BudgetScope;
  scopeId:     string;
  environment?: string;
  metric:      BudgetMetric;
  target?:     number;
  limit:       number;
  severity:    BudgetSeverity;
  period?:     string;
  enabled:     boolean;
  createdAt:   string;
  updatedAt:   string;
}

interface BudgetViolation {
  id:              string;
  budgetId:        string;
  scope:           BudgetScope;
  scopeId:         string;
  environment?:    string;
  metric:          BudgetMetric;
  value:           number;
  limit:           number;
  severity:        BudgetSeverity;
  occurredAt:      string;
  resolvedAt?:     string;
}

interface BudgetStore {
  budgets:    QualityBudget[];
  violations: BudgetViolation[];
}

// ─── Budget metadata (label, unit, direction for display) ─────────────────────

interface MetricMeta {
  label:       string;
  unit:        string;
  description: string;
  higherIsBetter: boolean;
  defaultLimit:   number;
  defaultSeverity: BudgetSeverity;
}

const METRIC_META: Record<BudgetMetric, MetricMeta> = {
  coverageOverall:          { label: "Overall Coverage",          unit: "%",     description: "Minimum requirement coverage across all requirements",     higherIsBetter: true,  defaultLimit: 60,  defaultSeverity: "soft" },
  coverageCritical:         { label: "Critical Coverage",         unit: "%",     description: "Minimum coverage for critical-priority requirements",       higherIsBetter: true,  defaultLimit: 80,  defaultSeverity: "hard" },
  highRiskUncovered:        { label: "High-Risk Uncovered",       unit: " reqs", description: "Maximum uncovered high or critical-priority requirements",   higherIsBetter: false, defaultLimit: 3,   defaultSeverity: "hard" },
  failureRate:              { label: "Failure Rate",              unit: "%",     description: "Maximum allowed test failure rate",                          higherIsBetter: false, defaultLimit: 10,  defaultSeverity: "hard" },
  flakinessCount:           { label: "Flaky Tests",               unit: " tests",description: "Maximum number of flaky tests in the suite",                higherIsBetter: false, defaultLimit: 5,   defaultSeverity: "soft" },
  unstableCriticalFlows:    { label: "Unstable Critical Flows",   unit: " flows",description: "Maximum number of critical flows with failures",            higherIsBetter: false, defaultLimit: 1,   defaultSeverity: "hard" },
  unstableCriticalEndpoints:{ label: "Unstable Critical Endpoints",unit:" eps",  description: "Maximum number of critical endpoints with failures",         higherIsBetter: false, defaultLimit: 2,   defaultSeverity: "hard" },
  openCriticalInsights:     { label: "Open Critical Insights",    unit: "",      description: "Maximum open critical insights before release gate fails",   higherIsBetter: false, defaultLimit: 0,   defaultSeverity: "hard" },
  unresolvedAISuggestions:  { label: "Unresolved AI Suggestions", unit: "",      description: "Maximum unresolved AI suggestions in critical areas",        higherIsBetter: false, defaultLimit: 10,  defaultSeverity: "soft" },
};

// ─── File I/O ─────────────────────────────────────────────────────────────────

function storePath(scopeId: string): string {
  const dir = path.join(OUTPUT_BASE, scopeId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "budgets.json");
}

function readStore(scopeId: string): BudgetStore {
  const p = storePath(scopeId);
  if (!fs.existsSync(p)) return { budgets: [], violations: [] };
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return { budgets: [], violations: [] }; }
}

function writeStore(scopeId: string, store: BudgetStore): void {
  fs.writeFileSync(storePath(scopeId), JSON.stringify(store, null, 2), "utf8");
}

// ─── Metrics extraction (mirrors ForecastController) ─────────────────────────

function readJson(p: string, fb: any = null): any {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fb; } catch { return fb; }
}

interface ProjectMetrics {
  coverageOverall:           number;
  coverageCritical:          number;
  highRiskUncovered:         number;
  failureRate:               number;
  flakinessCount:            number;
  openCriticalInsights:      number;
  unresolvedAISuggestions:   number;
  unstableCriticalFlows:     number;
  unstableCriticalEndpoints: number;
}

function extractCurrentMetrics(projectId: string): ProjectMetrics {
  const base = path.join(OUTPUT_BASE, projectId);

  const rtm    = readJson(path.join(base, "rtm.json"), null);
  const reqs: any[] = rtm?.requirements ?? [];
  const reqTotal    = reqs.length;
  const reqCovered  = reqs.filter((r: any) => r.coveredBy?.length > 0).length;
  const coverageOverall = reqTotal > 0 ? Math.round((reqCovered / reqTotal) * 100) : 0;
  const critReqs        = reqs.filter((r: any) => r.businessPriority === "critical");
  const critCovered     = critReqs.filter((r: any) => r.coveredBy?.length > 0).length;
  const coverageCritical = critReqs.length > 0 ? Math.round((critCovered / critReqs.length) * 100) : coverageOverall;
  const highUncov = reqs.filter((r: any) =>
    (r.businessPriority === "high" || r.businessPriority === "critical") && !r.coveredBy?.length
  ).length;

  const graph       = readJson(path.join(base, "flow-graph.json"), null);
  const flowsTotal  = (graph?.pages ?? graph?.nodes ?? []).length;
  const endpointsRaw: any[] = readJson(path.join(base, "endpoints.json"), []) ?? [];

  const testRes    = readJson(path.join(base, "test-results.json"), null);
  const testMap: Record<string, string> = testRes?.tests ?? {};
  const testNames  = Object.keys(testMap);
  const testsTotal = testNames.length;
  const failed     = testNames.filter(k => testMap[k] === "failed").length;
  const failureRate  = testsTotal > 0 ? Math.round((failed / testsTotal) * 100) : 0;
  const flakinessCount = Math.max(0, Math.floor(failed * 0.4));

  const insightRaw  = readJson(path.join(base, "insights.json"), null);
  const insights: any[] = Array.isArray(insightRaw) ? insightRaw : (insightRaw?.insights ?? []);
  const openCritical    = insights.filter((i: any) =>
    (i.status === "open" || i.status === "in-progress") && i.severity === "critical"
  ).length;

  const sugRaw  = readJson(path.join(base, "suggestions.json"), null);
  const sugs: any[] = sugRaw?.suggestions ?? (Array.isArray(sugRaw) ? sugRaw : []);
  const unresolvedAI = sugs.filter((s: any) => s.status === "pending").length;

  // Approximate: flows with failures ≈ floor(failureRate/100 * flowsTotal)
  const unstableCriticalFlows     = flowsTotal > 0 ? Math.min(flowsTotal, Math.floor((failureRate / 100) * flowsTotal)) : 0;
  const unstableCriticalEndpoints = endpointsRaw.length > 0 ? Math.min(endpointsRaw.length, Math.floor((failureRate / 100) * endpointsRaw.length)) : 0;

  return {
    coverageOverall,
    coverageCritical,
    highRiskUncovered:         highUncov,
    failureRate,
    flakinessCount,
    openCriticalInsights:      openCritical,
    unresolvedAISuggestions:   unresolvedAI,
    unstableCriticalFlows,
    unstableCriticalEndpoints,
  };
}

// ─── Budget evaluation ────────────────────────────────────────────────────────

function getMetricValue(metric: BudgetMetric, m: ProjectMetrics): number {
  return m[metric as keyof ProjectMetrics] ?? 0;
}

function evaluateBudget(
  budget: QualityBudget,
  currentValue: number,
): { status: BudgetStatus; currentValue: number; headroom: number; pctUsed: number } {
  const meta = METRIC_META[budget.metric];
  const limit = budget.limit;

  if (meta.higherIsBetter) {
    // e.g., coverage: current must be >= limit (limit is a minimum)
    const pctUsed   = limit > 0 ? Math.round(((limit - currentValue) / limit) * 100) : 0;
    const headroom  = Math.max(0, currentValue - limit);
    const status: BudgetStatus =
      currentValue < limit        ? "exceeded"
      : currentValue < limit * 1.05 ? "approaching-budget"
      : "within-budget";
    return { status, currentValue, headroom, pctUsed: Math.max(0, 100 - pctUsed) };
  } else {
    // e.g., failure rate: current must be <= limit
    const pctUsed  = limit > 0 ? Math.round((currentValue / limit) * 100) : 0;
    const headroom = Math.max(0, limit - currentValue);
    const status: BudgetStatus =
      currentValue > limit          ? "exceeded"
      : currentValue >= limit * 0.8  ? "approaching-budget"
      : "within-budget";
    return { status, currentValue, headroom, pctUsed };
  }
}

function buildEvaluation(
  budget: QualityBudget,
  metrics: ProjectMetrics,
): any {
  const currentValue = getMetricValue(budget.metric, metrics);
  const eval_ = evaluateBudget(budget, currentValue);
  const meta  = METRIC_META[budget.metric];
  return {
    budgetId:      budget.id,
    metric:        budget.metric,
    label:         meta.label,
    unit:          meta.unit,
    description:   meta.description,
    limit:         budget.limit,
    target:        budget.target,
    severity:      budget.severity,
    environment:   budget.environment,
    higherIsBetter: meta.higherIsBetter,
    ...eval_,
    evaluatedAt:   new Date().toISOString(),
  };
}

// ─── Default budgets seed ─────────────────────────────────────────────────────

function buildDefaultBudgets(scopeId: string): QualityBudget[] {
  const now = new Date().toISOString();
  const defaults: Array<Pick<QualityBudget, "metric" | "limit" | "severity" | "target">> = [
    { metric: "coverageOverall",      limit: 60,  severity: "soft", target: 80  },
    { metric: "coverageCritical",     limit: 70,  severity: "hard", target: 90  },
    { metric: "highRiskUncovered",    limit: 5,   severity: "hard"              },
    { metric: "failureRate",          limit: 10,  severity: "hard", target: 0   },
    { metric: "flakinessCount",       limit: 8,   severity: "soft", target: 0   },
    { metric: "openCriticalInsights", limit: 0,   severity: "hard"              },
    { metric: "unresolvedAISuggestions", limit: 15, severity: "soft"            },
  ];
  return defaults.map(d => ({
    id:        randomUUID(),
    scope:     "project",
    scopeId,
    metric:    d.metric,
    limit:     d.limit,
    target:    d.target,
    severity:  d.severity,
    enabled:   true,
    createdAt: now,
    updatedAt: now,
  }));
}

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller("projects/:id/budgets")
export class BudgetController {

  // ── List all budgets ─────────────────────────────────────────────────────────

  @Get()
  list(
    @Param("id")           id:  string,
    @Query("environment")  env: string,
    @Query("withEval")     withEval: string,
  ) {
    const store = readStore(id);

    // Seed defaults if no budgets defined
    if (store.budgets.length === 0) {
      store.budgets = buildDefaultBudgets(id);
      writeStore(id, store);
    }

    let budgets = store.budgets.filter(b => b.enabled);
    if (env) budgets = budgets.filter(b => !b.environment || b.environment === env);

    if (withEval === "true") {
      const metrics = extractCurrentMetrics(id);
      const evaluations = budgets.map(b => ({
        ...b,
        evaluation: buildEvaluation(b, metrics),
      }));
      const counts = {
        withinBudget:     evaluations.filter(e => e.evaluation.status === "within-budget").length,
        approaching:      evaluations.filter(e => e.evaluation.status === "approaching-budget").length,
        exceeded:         evaluations.filter(e => e.evaluation.status === "exceeded").length,
        hardViolations:   evaluations.filter(e => e.evaluation.status === "exceeded" && e.severity === "hard").length,
      };
      return { projectId: id, budgets: evaluations, counts, evaluatedAt: new Date().toISOString() };
    }

    return { projectId: id, budgets, total: budgets.length };
  }

  // ── Evaluate all budgets ─────────────────────────────────────────────────────

  @Get("evaluate")
  evaluate(
    @Param("id")          id:  string,
    @Query("environment") env: string,
  ) {
    const store   = readStore(id);
    if (store.budgets.length === 0) {
      store.budgets = buildDefaultBudgets(id);
      writeStore(id, store);
    }
    const metrics = extractCurrentMetrics(id);

    let budgets = store.budgets.filter(b => b.enabled);
    if (env) budgets = budgets.filter(b => !b.environment || b.environment === env);

    const evaluations = budgets.map(b => buildEvaluation(b, metrics));

    const exceeded    = evaluations.filter(e => e.status === "exceeded");
    const approaching = evaluations.filter(e => e.status === "approaching-budget");
    const within      = evaluations.filter(e => e.status === "within-budget");

    const hardViolations  = exceeded.filter(e => e.severity === "hard");
    const overallStatus   = hardViolations.length > 0 ? "failing"
      : exceeded.length > 0 ? "warning"
      : approaching.length > 0 ? "warning"
      : "passing";

    // Record violations
    const now = new Date().toISOString();
    exceeded.forEach(e => {
      const alreadyOpen = store.violations.some(
        v => v.budgetId === e.budgetId && !v.resolvedAt
      );
      if (!alreadyOpen) {
        store.violations.push({
          id:          randomUUID(),
          budgetId:    e.budgetId,
          scope:       "project",
          scopeId:     id,
          environment: env || undefined,
          metric:      e.metric,
          value:       e.currentValue,
          limit:       e.limit,
          severity:    e.severity,
          occurredAt:  now,
        });
      }
    });
    // Resolve violations no longer exceeded
    store.violations.forEach(v => {
      if (!v.resolvedAt && !exceeded.some(e => e.budgetId === v.budgetId)) {
        v.resolvedAt = now;
      }
    });
    writeStore(id, store);

    return {
      projectId:    id,
      environment:  env || null,
      overallStatus,
      evaluatedAt:  now,
      summary: {
        total:       evaluations.length,
        withinBudget: within.length,
        approaching:  approaching.length,
        exceeded:     exceeded.length,
        hardViolations: hardViolations.length,
      },
      evaluations,
      ciGate: {
        pass:    hardViolations.length === 0,
        message: hardViolations.length === 0
          ? "All hard budgets are within limits."
          : `${hardViolations.length} hard budget${hardViolations.length > 1 ? "s" : ""} exceeded. Pipeline should fail.`,
        violated: hardViolations.map(e => ({ metric: e.metric, label: e.label, current: e.currentValue, limit: e.limit })),
      },
    };
  }

  // ── Metric metadata ──────────────────────────────────────────────────────────

  @Get("metrics")
  metricList() {
    return Object.entries(METRIC_META).map(([key, meta]) => ({
      key,
      ...meta,
    }));
  }

  // ── Violations history ───────────────────────────────────────────────────────

  @Get("violations")
  violations(@Param("id") id: string) {
    const store = readStore(id);
    return {
      projectId:  id,
      violations: store.violations.sort((a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      ).slice(0, 50),
      total: store.violations.length,
    };
  }

  // ── Create budget ────────────────────────────────────────────────────────────

  @Post()
  create(
    @Param("id") id: string,
    @Body() body: {
      metric: BudgetMetric;
      limit: number;
      severity?: BudgetSeverity;
      target?: number;
      environment?: string;
      period?: string;
    },
  ) {
    if (!body.metric || body.limit === undefined) {
      throw new BadRequestException("metric and limit are required");
    }
    if (!METRIC_META[body.metric]) {
      throw new BadRequestException(`Unknown metric: ${body.metric}`);
    }
    const store = readStore(id);
    const now   = new Date().toISOString();
    const budget: QualityBudget = {
      id:          randomUUID(),
      scope:       "project",
      scopeId:     id,
      environment: body.environment,
      metric:      body.metric,
      target:      body.target,
      limit:       body.limit,
      severity:    body.severity ?? "soft",
      period:      body.period,
      enabled:     true,
      createdAt:   now,
      updatedAt:   now,
    };
    store.budgets.push(budget);
    writeStore(id, store);
    return budget;
  }

  // ── Update budget ────────────────────────────────────────────────────────────

  @Patch(":budgetId")
  update(
    @Param("id")       id:       string,
    @Param("budgetId") budgetId: string,
    @Body() body: Partial<Pick<QualityBudget, "limit" | "target" | "severity" | "environment" | "period" | "enabled">>,
  ) {
    const store  = readStore(id);
    const idx    = store.budgets.findIndex(b => b.id === budgetId);
    if (idx === -1) throw new NotFoundException(`Budget ${budgetId} not found`);
    store.budgets[idx] = { ...store.budgets[idx], ...body, updatedAt: new Date().toISOString() };
    writeStore(id, store);
    return store.budgets[idx];
  }

  // ── Delete budget ────────────────────────────────────────────────────────────

  @Delete(":budgetId")
  @HttpCode(204)
  remove(@Param("id") id: string, @Param("budgetId") budgetId: string) {
    const store = readStore(id);
    const idx   = store.budgets.findIndex(b => b.id === budgetId);
    if (idx === -1) throw new NotFoundException(`Budget ${budgetId} not found`);
    store.budgets.splice(idx, 1);
    writeStore(id, store);
  }

  // ── Reset to defaults ────────────────────────────────────────────────────────

  @Post("reset")
  reset(@Param("id") id: string) {
    const store     = readStore(id);
    store.budgets   = buildDefaultBudgets(id);
    store.violations = [];
    writeStore(id, store);
    return { projectId: id, budgets: store.budgets, message: "Budgets reset to defaults" };
  }
}
