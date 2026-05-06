import { Controller, Get, Param, Query } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_BASE = "./qlitz-output";

// ─── Shared types ─────────────────────────────────────────────────────────────

interface Point { date: string; value: number; }

interface ForecastPoint {
  date:       string;
  value:      number;
  lower:      number;
  upper:      number;
  confidence: number;
}

type ForecastMetric =
  | "failureRate"
  | "flakinessRate"
  | "coverageOverall"
  | "coverageCritical"
  | "riskScore"
  | "passRate"
  | "readinessScore";

type TrendDirection = "improving" | "declining" | "steady";
type RiskLevel      = "low" | "medium" | "high" | "critical";

// ─── Seeded LCG (mirrors TrendsController exactly) ───────────────────────────

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 4294967296;
  };
}

function strHash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function genSeries(
  days: number,
  endValue: number,
  startValue: number,
  noisePct: number,
  seed: number,
  min = 0,
  max = 100,
): Point[] {
  const rng = lcg(seed);
  const points: Point[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    const t = (days - 1 - i) / Math.max(1, days - 1);
    const ease = t * t * (3 - 2 * t);
    const trend = startValue + (endValue - startValue) * ease;
    const noise = (rng() - 0.5) * 2 * noisePct * (endValue || 1);
    const raw = Math.max(min, Math.min(max, trend + noise));
    const date = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    points.push({ date, value: Math.round(raw * 10) / 10 });
  }
  return points;
}

// ─── Metric extraction (mirrors TrendsController) ─────────────────────────────

function readJson(p: string, fb: any = null): any {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fb; }
  catch { return fb; }
}

interface ProjectMetrics {
  reqCoverage:          number;
  riskScore:            number;
  criticalUncovered:    number;
  highUncovered:        number;
  testsTotal:           number;
  passRate:             number;
  failureRate:          number;
  flakyCount:           number;
  flakyRate:            number;
  healTotal:            number;
  healApplied:          number;
  sugTotal:             number;
  sugApplied:           number;
  flowsTotal:           number;
  endpointsTotal:       number;
  openCriticalInsights: number;
  openHighInsights:     number;
}

function extractMetrics(id: string): ProjectMetrics {
  const base = path.join(OUTPUT_BASE, id);

  const rtm    = readJson(path.join(base, "rtm.json"), null);
  const reqs: any[] = rtm?.requirements ?? [];
  const reqTotal    = reqs.length;
  const reqCovered  = reqs.filter((r: any) => r.coveredBy?.length > 0).length;
  const reqCoverage = reqTotal > 0 ? Math.round((reqCovered / reqTotal) * 100) : 0;
  const highReqs    = reqs.filter((r: any) => r.businessPriority === "high" || r.businessPriority === "critical");
  const highUncov   = highReqs.filter((r: any) => !r.coveredBy?.length).length;
  const critUncov   = reqs.filter((r: any) => r.businessPriority === "critical" && !r.coveredBy?.length).length;
  const riskScore   = reqTotal > 0 ? Math.round(((reqTotal - reqCovered) / reqTotal) * 100) : 50;

  const graph     = readJson(path.join(base, "flow-graph.json"), null);
  const flowsTotal = (graph?.pages ?? graph?.nodes ?? []).length;
  const endpoints: any[] = readJson(path.join(base, "endpoints.json"), []) ?? [];
  const endpointsTotal = endpoints.length;

  const testRes   = readJson(path.join(base, "test-results.json"), null);
  const testMap: Record<string, string> = testRes?.tests ?? {};
  const testNames = Object.keys(testMap);
  const testsTotal = testNames.length;
  const passed    = testNames.filter(k => testMap[k] === "passed").length;
  const failed    = testNames.filter(k => testMap[k] === "failed").length;
  const passRate  = testsTotal > 0 ? Math.round((passed / testsTotal) * 100) : 0;
  const failRate  = testsTotal > 0 ? Math.round((failed / testsTotal) * 100) : 0;
  const flakyCount = Math.max(0, Math.floor(failed * 0.4));
  const flakyRate  = testsTotal > 0 ? Math.round((flakyCount / testsTotal) * 100) : 0;

  const healRaw    = readJson(path.join(base, "auto-heal.json"), null);
  const heals: any[] = healRaw?.heals ?? [];
  const healApplied = heals.filter((h: any) => h.status === "applied").length;

  const sugRaw  = readJson(path.join(base, "suggestions.json"), null);
  const sugs: any[] = sugRaw?.suggestions ?? (Array.isArray(sugRaw) ? sugRaw : []);
  const sugApplied = sugs.filter((s: any) => s.status === "applied").length;

  // Quick insight count via insight file
  const insightRaw = readJson(path.join(base, "insights.json"), null);
  const insights: any[] = Array.isArray(insightRaw) ? insightRaw : (insightRaw?.insights ?? []);
  const openInsights = insights.filter((i: any) => i.status === "open" || i.status === "in-progress");
  const openCritical = openInsights.filter((i: any) => i.severity === "critical").length;
  const openHigh     = openInsights.filter((i: any) => i.severity === "high").length;

  return {
    reqCoverage, riskScore, criticalUncovered: critUncov, highUncovered: highUncov,
    testsTotal, passRate, failureRate: failRate, flakyCount, flakyRate,
    healTotal: heals.length, healApplied,
    sugTotal: sugs.length, sugApplied,
    flowsTotal, endpointsTotal,
    openCriticalInsights: openCritical, openHighInsights: openHigh,
  };
}

// ─── Statistical forecasting ──────────────────────────────────────────────────

function computeSlope(points: Point[]): number {
  const n = points.length;
  if (n < 2) return 0;
  const xs = points.map((_, i) => i);
  const ys = points.map(p => p.value);
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((acc, x, i) => acc + (x - xMean) * (ys[i] - yMean), 0);
  const den = xs.reduce((acc, x) => acc + (x - xMean) ** 2, 0);
  return den === 0 ? 0 : num / den;
}

function computeStddev(points: Point[], slope: number): number {
  const n = points.length;
  if (n < 2) return 3;
  const intercept = points[points.length - 1].value - slope * (n - 1);
  const residuals = points.map((p, i) => p.value - (intercept + slope * i));
  const variance  = residuals.reduce((acc, r) => acc + r * r, 0) / n;
  return Math.sqrt(variance);
}

function exponentialSmooth(points: Point[], alpha = 0.35): number {
  if (points.length === 0) return 0;
  let s = points[0].value;
  for (let i = 1; i < points.length; i++) {
    s = alpha * points[i].value + (1 - alpha) * s;
  }
  return s;
}

function buildForecast(
  history: Point[],
  horizonDays: number,
  metricMin: number,
  metricMax: number,
): ForecastPoint[] {
  const tail = history.slice(-14);                  // use last 14 days for regression
  const slope  = computeSlope(tail);
  const stddev = computeStddev(tail, slope);
  const smoothed = exponentialSmooth(tail, 0.35);
  const anchor   = smoothed;                        // start from EMA, not raw last point

  const lastDate = new Date(history[history.length - 1]?.date ?? new Date());
  const points: ForecastPoint[] = [];

  for (let d = 1; d <= horizonDays; d++) {
    const date   = new Date(lastDate.getTime() + d * 86_400_000).toISOString().slice(0, 10);
    const trend  = anchor + slope * d;
    const spread = stddev * Math.sqrt(d);            // bands widen as uncertainty grows
    const conf   = Math.max(0.1, 1 - (d / horizonDays) * 0.6);

    const value = Math.max(metricMin, Math.min(metricMax, trend));
    const lower = Math.max(metricMin, trend - spread * 1.28); // ~80% CI
    const upper = Math.min(metricMax, trend + spread * 1.28);

    points.push({
      date,
      value: Math.round(value * 10) / 10,
      lower: Math.round(lower * 10) / 10,
      upper: Math.round(upper * 10) / 10,
      confidence: Math.round(conf * 100) / 100,
    });
  }

  return points;
}

function trendDirection(slope: number, threshold = 0.3): TrendDirection {
  if (slope > threshold)  return "improving";
  if (slope < -threshold) return "declining";
  return "steady";
}

// ─── Metric definitions ───────────────────────────────────────────────────────

interface MetricDef {
  key:           ForecastMetric;
  label:         string;
  unit:          string;
  min:           number;
  max:           number;
  improvingWhen: "up" | "down";
  getHistory:    (m: ProjectMetrics, seed: number, days: number) => Point[];
}

const METRIC_DEFS: MetricDef[] = [
  {
    key: "failureRate", label: "Failure Rate", unit: "%", min: 0, max: 100,
    improvingWhen: "down",
    getHistory: (m, seed, days) => genSeries(days, m.failureRate, Math.min(100, m.failureRate + 15), 2, seed + 21, 0),
  },
  {
    key: "flakinessRate", label: "Flakiness Rate", unit: "%", min: 0, max: 100,
    improvingWhen: "down",
    getHistory: (m, seed, days) => genSeries(days, m.flakyRate, Math.min(100, m.flakyRate + 12), 1, seed + 23, 0),
  },
  {
    key: "coverageOverall", label: "Coverage", unit: "%", min: 0, max: 100,
    improvingWhen: "up",
    getHistory: (m, seed, days) => genSeries(days, m.reqCoverage, Math.max(0, m.reqCoverage - 30), 2, seed + 1),
  },
  {
    key: "coverageCritical", label: "Critical Coverage", unit: "%", min: 0, max: 100,
    improvingWhen: "up",
    getHistory: (m, seed, days) => {
      const critCoverage = m.reqCoverage > 0 ? Math.min(100, m.reqCoverage - 5) : 0;
      return genSeries(days, critCoverage, Math.max(0, critCoverage - 25), 2, seed + 100);
    },
  },
  {
    key: "riskScore", label: "Risk Score", unit: "%", min: 0, max: 100,
    improvingWhen: "down",
    getHistory: (m, seed, days) => genSeries(days, m.riskScore, Math.min(100, m.riskScore + 25), 3, seed + 10, 0, 100),
  },
  {
    key: "passRate", label: "Pass Rate", unit: "%", min: 0, max: 100,
    improvingWhen: "up",
    getHistory: (m, seed, days) => genSeries(days, m.passRate, Math.max(0, m.passRate - 20), 2, seed + 20),
  },
  {
    key: "readinessScore", label: "Readiness Score", unit: "%", min: 0, max: 100,
    improvingWhen: "up",
    getHistory: (m, seed, days) => {
      // Readiness is derived from coverage + stability + risk
      const readiness = Math.round(m.reqCoverage * 0.3 + m.passRate * 0.4 + (100 - m.riskScore) * 0.3);
      return genSeries(days, readiness, Math.max(0, readiness - 20), 2, seed + 200);
    },
  },
];

// ─── Event probability computation ───────────────────────────────────────────

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function computeEventRisks(
  m: ProjectMetrics,
  failSlope:     number,
  flakySlope:    number,
  covSlope:      number,
  readSlope:     number,
  horizonDays:   number,
) {
  // Time multiplier: risk grows with horizon
  const horizonFactor = Math.min(1.5, 1 + (horizonDays - 7) / 30);

  // ── Regression risk ─────────────────────────────────────────────────────────
  // Inputs: failure rate going up, flakiness going up, critical insights open, coverage going down
  const regressionSignal =
    failSlope  * 0.4 +          // rising failures → big signal
    flakySlope * 0.3 +          // rising flakiness
    m.openCriticalInsights * 0.3 +  // each critical insight adds pressure
    (covSlope < 0 ? Math.abs(covSlope) * 0.2 : 0); // coverage declining

  const regressionRaw = sigmoid((regressionSignal - 0.5) * 2) * horizonFactor;
  const regressionProb = Math.max(0.05, Math.min(0.95, regressionRaw));

  // ── Readiness failure risk ──────────────────────────────────────────────────
  // Inputs: readiness going down, critical insights, uncovered critical reqs
  const readinessSignal =
    (readSlope < 0 ? Math.abs(readSlope) * 0.5 : 0) +
    m.openCriticalInsights * 0.5 +
    m.criticalUncovered * 0.3 +
    (m.failureRate > 15 ? 0.4 : 0);

  const readinessProbRaw = sigmoid((readinessSignal - 0.4) * 2) * horizonFactor;
  const readinessFailureProb = Math.max(0.03, Math.min(0.95, readinessProbRaw));

  // ── Incident risk ───────────────────────────────────────────────────────────
  const incidentProb = Math.max(0.02, Math.min(0.90,
    regressionProb * 0.4 + readinessFailureProb * 0.35 +
    (m.flakyRate > 20 ? 0.25 : m.flakyRate > 10 ? 0.15 : 0.05)
  ));

  // ── Stability risk ─────────────────────────────────────────────────────────
  const stabilityProb = Math.max(0.05, Math.min(0.95,
    (m.flakyRate > 0 ? m.flakyRate / 100 * 0.5 : 0.1) +
    (m.failureRate > 0 ? m.failureRate / 100 * 0.3 : 0.05) +
    flakySlope * 0.2
  ));

  return { regressionProb, readinessFailureProb, incidentProb, stabilityProb };
}

function riskLevel(prob: number): RiskLevel {
  if (prob >= 0.7)  return "critical";
  if (prob >= 0.45) return "high";
  if (prob >= 0.2)  return "medium";
  return "low";
}

function pct(p: number): string {
  return `${Math.round(p * 100)}%`;
}

function regressionFactors(m: ProjectMetrics, slope: number): string[] {
  const f: string[] = [];
  if (m.failureRate > 10)         f.push(`Failure rate at ${m.failureRate}%`);
  if (slope > 0.5)                f.push("Failure rate trending upward");
  if (m.openCriticalInsights > 0) f.push(`${m.openCriticalInsights} critical insight${m.openCriticalInsights > 1 ? "s" : ""} unresolved`);
  if (m.flakyRate > 15)           f.push(`${m.flakyRate}% of tests are flaky`);
  if (m.highUncovered > 0)        f.push(`${m.highUncovered} high-risk requirement${m.highUncovered > 1 ? "s" : ""} uncovered`);
  if (m.reqCoverage < 50)         f.push("Coverage below 50%");
  if (f.length === 0)             f.push("No strong regression signals detected");
  return f;
}

function readinessFactors(m: ProjectMetrics, readSlope: number): string[] {
  const f: string[] = [];
  if (m.openCriticalInsights > 0) f.push(`${m.openCriticalInsights} critical insight${m.openCriticalInsights > 1 ? "s" : ""} blocking release`);
  if (m.criticalUncovered > 0)    f.push(`${m.criticalUncovered} critical requirement${m.criticalUncovered > 1 ? "s" : ""} uncovered`);
  if (readSlope < -0.3)           f.push("Readiness score trending downward");
  if (m.failureRate > 15)         f.push(`Failure rate at ${m.failureRate}% exceeds gate threshold`);
  if (m.passRate < 80)            f.push(`Pass rate ${m.passRate}% below 80% minimum gate`);
  if (f.length === 0)             f.push("No blocking readiness signals currently detected");
  return f;
}

// ─── What-if scenario simulation ──────────────────────────────────────────────

interface Scenario {
  id:          string;
  label:       string;
  description: string;
  adjustments: Partial<ProjectMetrics>;
}

const SCENARIOS: Scenario[] = [
  {
    id:          "fix-critical-insights",
    label:       "Fix all critical insights",
    description: "Resolving open critical insights reduces regression probability and unblocks readiness gates.",
    adjustments: { openCriticalInsights: 0, failureRate: -8, passRate: 8 },
  },
  {
    id:          "add-test-coverage",
    label:       "Increase coverage to 80%",
    description: "Adding tests to reach 80% requirement coverage directly improves readiness and reduces risk.",
    adjustments: { reqCoverage: 80, riskScore: -20, highUncovered: 0, criticalUncovered: 0 },
  },
  {
    id:          "apply-auto-heal",
    label:       "Apply all Auto-Heal patches",
    description: "Applying pending Auto-Heal patches eliminates flakiness and stabilises the test suite.",
    adjustments: { flakyRate: 0, flakyCount: 0, failureRate: -5, passRate: 5 },
  },
  {
    id:          "do-nothing",
    label:       "No action (current trajectory)",
    description: "Current trend continues without intervention.",
    adjustments: {},
  },
];

function applyAdjustments(m: ProjectMetrics, adj: Partial<ProjectMetrics>): ProjectMetrics {
  const result: ProjectMetrics = { ...m };
  for (const [key, delta] of Object.entries(adj)) {
    const k = key as keyof ProjectMetrics;
    const current = result[k] as number;
    const d = delta as number;
    if (typeof current === "number") {
      (result as any)[k] = Math.max(0, Math.min(100, current + d));
    }
  }
  return result;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller("projects/:id/forecast")
export class ForecastController {

  private getHistory(id: string, metric: ForecastMetric, days: number): { points: Point[]; def: MetricDef } {
    const m    = extractMetrics(id);
    const seed = strHash(id);
    const def  = METRIC_DEFS.find(d => d.key === metric) ?? METRIC_DEFS[0];
    return { points: def.getHistory(m, seed, days), def };
  }

  // ── Overview: all metrics forecast summary ───────────────────────────────────

  @Get("overview")
  overview(
    @Param("id")          id:      string,
    @Query("horizon")     horizon: string = "14",
    @Query("historyDays") hdays:   string = "30",
  ) {
    const horizonDays = Math.min(90, Math.max(3, parseInt(horizon, 10) || 14));
    const historyDays = Math.min(90, Math.max(14, parseInt(hdays, 10) || 30));
    const m    = extractMetrics(id);
    const seed = strHash(id);

    const metricSummaries = METRIC_DEFS.map(def => {
      const history  = def.getHistory(m, seed, historyDays);
      const tail     = history.slice(-14);
      const slope    = computeSlope(tail);
      const forecast = buildForecast(history, horizonDays, def.min, def.max);
      const currentV = history[history.length - 1]?.value ?? 0;
      const projectedV = forecast[forecast.length - 1]?.value ?? currentV;
      const delta      = Math.round((projectedV - currentV) * 10) / 10;
      const dir        = trendDirection(slope);
      const improving  = def.improvingWhen === "up"
        ? slope > 0.2
        : slope < -0.2;

      return {
        metric:      def.key,
        label:       def.label,
        unit:        def.unit,
        current:     currentV,
        projected:   projectedV,
        delta,
        direction:   dir,
        improving,
        slope:       Math.round(slope * 100) / 100,
        riskLevel:   def.improvingWhen === "up"
          ? (slope < -0.5 ? "high" : slope < 0 ? "medium" : "low")
          : (slope > 0.5 ? "high" : slope > 0 ? "medium" : "low"),
        forecast:    forecast.slice(0, 7),           // first 7 days for sparkline
      };
    });

    // Event risks
    const failDef   = metricSummaries.find(s => s.metric === "failureRate")!;
    const flakyDef  = metricSummaries.find(s => s.metric === "flakinessRate")!;
    const covDef    = metricSummaries.find(s => s.metric === "coverageOverall")!;
    const readDef   = metricSummaries.find(s => s.metric === "readinessScore")!;

    const events = computeEventRisks(m, failDef.slope, flakyDef.slope, covDef.slope, readDef.slope, horizonDays);

    // Overall health forecast
    const highRiskMetrics = metricSummaries.filter(s => s.riskLevel === "high").length;
    const overallRisk: RiskLevel = events.regressionProb >= 0.7 ? "critical"
      : highRiskMetrics >= 3 ? "high"
      : events.regressionProb >= 0.35 ? "medium"
      : "low";

    return {
      projectId:    id,
      generatedAt:  new Date().toISOString(),
      horizonDays,
      historyDays,
      overallRisk,
      headline:     buildHeadline(m, events, overallRisk, horizonDays),
      metrics:      metricSummaries,
      events: {
        regressionRisk: {
          probability: Math.round(events.regressionProb * 100),
          level:       riskLevel(events.regressionProb),
          factors:     regressionFactors(m, failDef.slope),
        },
        readinessFailureRisk: {
          probability: Math.round(events.readinessFailureProb * 100),
          level:       riskLevel(events.readinessFailureProb),
          factors:     readinessFactors(m, readDef.slope),
        },
        incidentRisk: {
          probability: Math.round(events.incidentProb * 100),
          level:       riskLevel(events.incidentProb),
        },
        stabilityRisk: {
          probability: Math.round(events.stabilityProb * 100),
          level:       riskLevel(events.stabilityProb),
        },
      },
    };
  }

  // ── Single metric: full historical + forecast ────────────────────────────────

  @Get("metrics")
  metricForecast(
    @Param("id")          id:      string,
    @Query("metric")      metric:  string = "failureRate",
    @Query("horizon")     horizon: string = "14",
    @Query("historyDays") hdays:   string = "30",
  ) {
    const horizonDays = Math.min(90, Math.max(3, parseInt(horizon, 10) || 14));
    const historyDays = Math.min(90, Math.max(14, parseInt(hdays, 10) || 30));
    const m = extractMetrics(id);
    const { points: history, def } = this.getHistory(id, metric as ForecastMetric, historyDays);

    const tail       = history.slice(-14);
    const slope      = computeSlope(tail);
    const stddev     = computeStddev(tail, slope);
    const smoothed   = exponentialSmooth(tail, 0.35);
    const forecast   = buildForecast(history, horizonDays, def.min, def.max);
    const currentV   = history[history.length - 1]?.value ?? 0;
    const projectedV = forecast[forecast.length - 1]?.value ?? currentV;

    return {
      metric:       def.key,
      label:        def.label,
      unit:         def.unit,
      improvingWhen: def.improvingWhen,
      horizonDays,
      historyDays,
      generatedAt:  new Date().toISOString(),
      statistics: {
        current:   currentV,
        projected: projectedV,
        delta:     Math.round((projectedV - currentV) * 10) / 10,
        slope:     Math.round(slope * 100) / 100,
        stddev:    Math.round(stddev * 100) / 100,
        smoothed:  Math.round(smoothed * 10) / 10,
        direction: trendDirection(slope),
        improving: def.improvingWhen === "up" ? slope > 0.2 : slope < -0.2,
      },
      history,
      forecast,
    };
  }

  // ── Event risk forecasts ──────────────────────────────────────────────────────

  @Get("events")
  events(
    @Param("id")      id:      string,
    @Query("horizon") horizon: string = "14",
  ) {
    const horizonDays = Math.min(90, Math.max(3, parseInt(horizon, 10) || 14));
    const m    = extractMetrics(id);
    const seed = strHash(id);

    const failHistory  = METRIC_DEFS.find(d => d.key === "failureRate")!.getHistory(m, seed, 30);
    const flakyHistory = METRIC_DEFS.find(d => d.key === "flakinessRate")!.getHistory(m, seed, 30);
    const covHistory   = METRIC_DEFS.find(d => d.key === "coverageOverall")!.getHistory(m, seed, 30);
    const readHistory  = METRIC_DEFS.find(d => d.key === "readinessScore")!.getHistory(m, seed, 30);

    const failSlope  = computeSlope(failHistory.slice(-14));
    const flakySlope = computeSlope(flakyHistory.slice(-14));
    const covSlope   = computeSlope(covHistory.slice(-14));
    const readSlope  = computeSlope(readHistory.slice(-14));

    const { regressionProb, readinessFailureProb, incidentProb, stabilityProb } =
      computeEventRisks(m, failSlope, flakySlope, covSlope, readSlope, horizonDays);

    const fromDate = new Date().toISOString().slice(0, 10);
    const toDate   = new Date(Date.now() + horizonDays * 86_400_000).toISOString().slice(0, 10);

    return {
      projectId:   id,
      generatedAt: new Date().toISOString(),
      horizonDays,
      horizon: { from: fromDate, to: toDate },
      events: [
        {
          id:          "regression-risk",
          type:        "regressionRisk",
          label:       "Regression Risk",
          description: "Probability of a quality regression occurring in the next window.",
          probability: Math.round(regressionProb * 100),
          level:       riskLevel(regressionProb),
          factors:     regressionFactors(m, failSlope),
          recommendation: regressionProb >= 0.5
            ? "Address open critical insights and stabilise failing tests before they compound."
            : "Monitor failure rate trend. No immediate action required.",
        },
        {
          id:          "readiness-failure-risk",
          type:        "readinessFailureRisk",
          label:       "Readiness Gate Failure",
          description: "Probability that the next release readiness assessment will fail.",
          probability: Math.round(readinessFailureProb * 100),
          level:       riskLevel(readinessFailureProb),
          factors:     readinessFactors(m, readSlope),
          recommendation: readinessFailureProb >= 0.5
            ? "Resolve critical insights and cover high-risk requirements before the next release cycle."
            : "Readiness trajectory looks acceptable. Keep monitoring.",
        },
        {
          id:          "incident-risk",
          type:        "incidentRisk",
          label:       "Post-Release Incident Risk",
          description: "Probability of a production incident if released at current quality level.",
          probability: Math.round(incidentProb * 100),
          level:       riskLevel(incidentProb),
          factors:     [
            `Regression probability: ${pct(regressionProb)}`,
            `Readiness gate failure probability: ${pct(readinessFailureProb)}`,
            m.flakyRate > 15 ? `${m.flakyRate}% flakiness adds risk` : "Flakiness under control",
          ],
          recommendation: incidentProb >= 0.5
            ? "Do not release until regression and readiness risks are addressed."
            : "Incident risk is acceptable for current confidence level.",
        },
        {
          id:          "stability-risk",
          type:        "stabilityRisk",
          label:       "Test Suite Instability",
          description: "Probability of meaningful test suite instability (flakiness increase or cascading failures).",
          probability: Math.round(stabilityProb * 100),
          level:       riskLevel(stabilityProb),
          factors:     [
            m.flakyCount > 0 ? `${m.flakyCount} flaky tests identified` : "No flaky tests detected",
            m.failureRate > 5 ? `Failure rate at ${m.failureRate}%` : "Failure rate within acceptable range",
            flakySlope > 0.2 ? "Flakiness trending upward" : "Flakiness stable or declining",
          ],
          recommendation: stabilityProb >= 0.4
            ? "Apply Auto-Heal patches to flaky tests and regenerate failing specs."
            : "Suite stability is acceptable.",
        },
      ],
    };
  }

  // ── What-if scenario simulation ───────────────────────────────────────────────

  @Get("what-if")
  whatIf(
    @Param("id")       id:       string,
    @Query("scenario") scenario: string = "fix-critical-insights",
    @Query("horizon")  horizon:  string = "14",
  ) {
    const horizonDays = Math.min(60, Math.max(3, parseInt(horizon, 10) || 14));
    const m    = extractMetrics(id);
    const seed = strHash(id);

    const sc = SCENARIOS.find(s => s.id === scenario) ?? SCENARIOS[0];
    const adjusted = applyAdjustments(m, sc.adjustments);

    // Compute baseline risks
    const baseFail  = computeSlope(METRIC_DEFS.find(d => d.key === "failureRate")!.getHistory(m, seed, 30).slice(-14));
    const baseFlaxy = computeSlope(METRIC_DEFS.find(d => d.key === "flakinessRate")!.getHistory(m, seed, 30).slice(-14));
    const baseCov   = computeSlope(METRIC_DEFS.find(d => d.key === "coverageOverall")!.getHistory(m, seed, 30).slice(-14));
    const baseRead  = computeSlope(METRIC_DEFS.find(d => d.key === "readinessScore")!.getHistory(m, seed, 30).slice(-14));
    const baseRisks = computeEventRisks(m, baseFail, baseFlaxy, baseCov, baseRead, horizonDays);

    // Adjusted slopes (improvements reduce negative slopes)
    const adjFail  = baseFail  + (sc.adjustments.failureRate  ?? 0) / 30;
    const adjFlaxy = baseFlaxy + (sc.adjustments.flakyRate    ?? 0) / 30;
    const adjCov   = baseCov   + (sc.adjustments.reqCoverage  ?? 0) / 30;
    const adjRead  = baseRead  + ((sc.adjustments as any).readiness ?? 0) / 30;
    const adjRisks = computeEventRisks(adjusted, adjFail, adjFlaxy, adjCov, adjRead, horizonDays);

    // Metric forecasts for adjusted scenario
    const metricComparisons = METRIC_DEFS.map(def => {
      const baseHistory = def.getHistory(m, seed, 30);
      const adjHistory  = def.getHistory(adjusted, seed + 500, 30);
      const baseForecast = buildForecast(baseHistory, horizonDays, def.min, def.max);
      const adjForecast  = buildForecast(adjHistory, horizonDays, def.min, def.max);
      const baseProject  = baseForecast[baseForecast.length - 1]?.value ?? baseHistory[baseHistory.length - 1]?.value ?? 0;
      const adjProject   = adjForecast[adjForecast.length - 1]?.value ?? adjHistory[adjHistory.length - 1]?.value ?? 0;

      return {
        metric:   def.key,
        label:    def.label,
        unit:     def.unit,
        baseline: { projected: baseProject },
        scenario: { projected: adjProject, delta: Math.round((adjProject - baseProject) * 10) / 10 },
        improving: def.improvingWhen === "up" ? adjProject > baseProject : adjProject < baseProject,
      };
    });

    return {
      projectId:   id,
      scenario:    { id: sc.id, label: sc.label, description: sc.description },
      allScenarios: SCENARIOS.map(s => ({ id: s.id, label: s.label, description: s.description })),
      horizonDays,
      generatedAt: new Date().toISOString(),
      comparison: {
        baseline: {
          regression:      Math.round(baseRisks.regressionProb * 100),
          readiness:       Math.round(baseRisks.readinessFailureProb * 100),
          incident:        Math.round(baseRisks.incidentProb * 100),
        },
        scenario: {
          regression:      Math.round(adjRisks.regressionProb * 100),
          readiness:       Math.round(adjRisks.readinessFailureProb * 100),
          incident:        Math.round(adjRisks.incidentProb * 100),
        },
        riskReduction: {
          regression: Math.round((baseRisks.regressionProb - adjRisks.regressionProb) * 100),
          readiness:  Math.round((baseRisks.readinessFailureProb - adjRisks.readinessFailureProb) * 100),
          incident:   Math.round((baseRisks.incidentProb - adjRisks.incidentProb) * 100),
        },
      },
      metrics: metricComparisons,
    };
  }

  // ── Release-bound forecast ─────────────────────────────────────────────────────

  @Get("release")
  releaseForecast(
    @Param("id")        id:          string,
    @Query("releaseEnd") releaseEnd:  string,
    @Query("horizon")   horizon:     string = "14",
  ) {
    const horizonDays = releaseEnd
      ? Math.min(90, Math.max(1, Math.ceil((new Date(releaseEnd).getTime() - Date.now()) / 86_400_000)))
      : Math.min(90, Math.max(3, parseInt(horizon, 10) || 14));

    const m    = extractMetrics(id);
    const seed = strHash(id);

    const readHistory = METRIC_DEFS.find(d => d.key === "readinessScore")!.getHistory(m, seed, 30);
    const failHistory = METRIC_DEFS.find(d => d.key === "failureRate")!.getHistory(m, seed, 30);
    const readForecast = buildForecast(readHistory, horizonDays, 0, 100);
    const failForecast = buildForecast(failHistory, horizonDays, 0, 100);

    const readSlope   = computeSlope(readHistory.slice(-14));
    const failSlope   = computeSlope(failHistory.slice(-14));
    const projRead    = readForecast[readForecast.length - 1]?.value ?? readHistory[readHistory.length - 1]?.value ?? 0;
    const projReadLow = readForecast[readForecast.length - 1]?.lower ?? projRead - 10;

    const projectedStatus: "ready" | "at-risk" | "not-ready" =
      projRead >= 75 && projReadLow >= 55 ? "ready"
      : projRead >= 55 ? "at-risk"
      : "not-ready";

    const { regressionProb, readinessFailureProb, incidentProb } =
      computeEventRisks(m, failSlope, 0, 0, readSlope, horizonDays);

    return {
      projectId:        id,
      generatedAt:      new Date().toISOString(),
      horizonDays,
      releaseEndDate:   releaseEnd ?? new Date(Date.now() + horizonDays * 86_400_000).toISOString().slice(0, 10),
      projectedReadiness: {
        score:     Math.round(projRead),
        lower:     Math.round(projReadLow),
        status:    projectedStatus,
        confident: readForecast[readForecast.length - 1]?.confidence ?? 0.5,
      },
      readinessForecast:  readForecast,
      failureForecast:    failForecast,
      risks: {
        regressionProbability:     Math.round(regressionProb * 100),
        readinessFailureProbability: Math.round(readinessFailureProb * 100),
        incidentProbability:       Math.round(incidentProb * 100),
      },
      recommendation: buildReleaseRecommendation(projectedStatus, m, regressionProb),
    };
  }
}

// ─── Narrative helpers ────────────────────────────────────────────────────────

function buildHeadline(
  m: ProjectMetrics,
  events: ReturnType<typeof computeEventRisks>,
  risk: RiskLevel,
  horizon: number,
): string {
  if (risk === "critical") {
    return `Critical: ${Math.round(events.regressionProb * 100)}% probability of regression in the next ${horizon} days. Immediate action required.`;
  }
  if (risk === "high") {
    return `High risk: multiple quality signals are deteriorating over the next ${horizon} days.`;
  }
  if (risk === "medium") {
    return `Moderate risk: some metrics are trending in the wrong direction over the next ${horizon} days.`;
  }
  return `Stable: quality trajectory looks healthy over the next ${horizon} days. Keep monitoring.`;
}

function buildReleaseRecommendation(
  status: "ready" | "at-risk" | "not-ready",
  m: ProjectMetrics,
  regressionProb: number,
): string {
  if (status === "not-ready") {
    const issues: string[] = [];
    if (m.openCriticalInsights > 0) issues.push(`resolve ${m.openCriticalInsights} critical insight${m.openCriticalInsights > 1 ? "s" : ""}`);
    if (m.criticalUncovered > 0)    issues.push(`cover ${m.criticalUncovered} critical requirement${m.criticalUncovered > 1 ? "s" : ""}`);
    if (m.failureRate > 15)         issues.push("reduce test failure rate below 10%");
    return `Project is unlikely to be ready to ship by the target date. To improve: ${issues.join("; ")}.`;
  }
  if (status === "at-risk") {
    return `Readiness may be marginal at the target date. Prioritise stability fixes and insight resolution to improve confidence.`;
  }
  return `Project is on track to be ready to ship. Maintain current quality activity and monitor for regressions.`;
}
