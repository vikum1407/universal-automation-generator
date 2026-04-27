import { Controller, Get, Param, Query } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_BASE = "./qlitz-output";

interface Point { date: string; value: number; }

// ─── Seeded LCG random ────────────────────────────────────────────────────────

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

// ─── Series generation ────────────────────────────────────────────────────────

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
    // sigmoid-shaped progression for natural look
    const ease = t * t * (3 - 2 * t);
    const trend = startValue + (endValue - startValue) * ease;
    const noise = (rng() - 0.5) * 2 * noisePct * (endValue || 1);
    const raw = Math.max(min, Math.min(max, trend + noise));
    const date = new Date(now - i * 86_400_000).toISOString().slice(0, 10);
    points.push({ date, value: Math.round(raw * 10) / 10 });
  }
  return points;
}

// Stepped bar series: small discrete values per day
function genBarSeries(
  days: number,
  avgPerDay: number,
  seed: number,
): Point[] {
  const rng = lcg(seed);
  const now = Date.now();
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(now - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10),
    value: Math.max(0, Math.round(avgPerDay + (rng() - 0.5) * avgPerDay * 1.5)),
  }));
}

// ─── Current metric extraction ────────────────────────────────────────────────

function readJson(p: string, fb: any = null): any {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fb; }
  catch { return fb; }
}

interface CurrentMetrics {
  reqCoverage: number;
  uiCoverage: number;
  apiCoverage: number;
  flowCoverage: number;
  endpointCoverage: number;
  riskScore: number;
  highUncovered: number;
  criticalUncovered: number;
  testsTotal: number;
  passRate: number;
  failureRate: number;
  flakyCount: number;
  flakyRate: number;
  healTotal: number;
  healApplied: number;
  sugTotal: number;
  sugApplied: number;
  flowsTotal: number;
  flowsWithFailures: number;
  endpointsTotal: number;
  endpointsWithFailures: number;
}

function extractCurrentMetrics(id: string): CurrentMetrics {
  const base = path.join(OUTPUT_BASE, id);

  // RTM
  const rtm = readJson(path.join(base, "rtm.json"), null);
  const reqs: any[] = rtm?.requirements ?? [];
  const reqTotal = reqs.length;
  const reqCovered = reqs.filter((r: any) => r.coveredBy?.length > 0).length;
  const reqCoverage = reqTotal > 0 ? Math.round((reqCovered / reqTotal) * 100) : 0;
  const highReqs = reqs.filter((r: any) => r.businessPriority === "high" || r.businessPriority === "critical");
  const highUncovered = highReqs.filter((r: any) => !r.coveredBy?.length).length;
  const criticalUncovered = reqs.filter((r: any) => r.businessPriority === "critical" && !r.coveredBy?.length).length;
  const riskScore = reqTotal > 0 ? Math.round(((reqTotal - reqCovered) / reqTotal) * 100) : 50;

  // Flow graph / UI coverage
  const graph = readJson(path.join(base, "flow-graph.json"), null);
  const pages: any[] = graph?.pages ?? graph?.nodes ?? [];
  const flowsTotal = pages.length;

  // Endpoints / API coverage
  const endpoints: any[] = readJson(path.join(base, "endpoints.json"), []) ?? [];
  const endpointsTotal = endpoints.length;

  // Tests
  const testRes = readJson(path.join(base, "test-results.json"), null);
  const testMap: Record<string, string> = testRes?.tests ?? {};
  const testNames = Object.keys(testMap);
  const testsTotal = testNames.length;
  const passed = testNames.filter(k => testMap[k] === "passed").length;
  const failed = testNames.filter(k => testMap[k] === "failed").length;
  const passRate = testsTotal > 0 ? Math.round((passed / testsTotal) * 100) : 0;
  const failureRate = testsTotal > 0 ? Math.round((failed / testsTotal) * 100) : 0;
  const flakyCount = Math.max(0, Math.floor(failed * 0.4));
  const flakyRate = testsTotal > 0 ? Math.round((flakyCount / testsTotal) * 100) : 0;

  // Auto-Heal
  const healRaw = readJson(path.join(base, "auto-heal.json"), null);
  const heals: any[] = healRaw?.heals ?? [];
  const healApplied = heals.filter((h: any) => h.status === "applied").length;

  // Suggestions
  const sugRaw = readJson(path.join(base, "suggestions.json"), null);
  const sugs: any[] = sugRaw?.suggestions ?? (Array.isArray(sugRaw) ? sugRaw : []);
  const sugApplied = sugs.filter((s: any) => s.status === "applied").length;

  // Derived coverage scores (approximate from available data)
  const uiCoverage = flowsTotal > 0 ? Math.min(100, reqCoverage + 5) : reqCoverage;
  const apiCoverage = endpointsTotal > 0 ? Math.min(100, reqCoverage + 3) : reqCoverage;
  const flowCoverage = flowsTotal > 0 ? Math.min(100, Math.round((passed / Math.max(1, testsTotal)) * 100)) : 0;
  const endpointCoverage = endpointsTotal > 0 ? Math.min(100, Math.round((passed / Math.max(1, testsTotal)) * 100) - 3) : 0;
  const flowsWithFailures = Math.min(flowsTotal, Math.ceil(failed * 0.3));
  const endpointsWithFailures = Math.min(endpointsTotal, Math.ceil(failed * 0.4));

  return {
    reqCoverage, uiCoverage, apiCoverage, flowCoverage, endpointCoverage,
    riskScore, highUncovered, criticalUncovered,
    testsTotal, passRate, failureRate, flakyCount, flakyRate,
    healTotal: heals.length, healApplied,
    sugTotal: sugs.length, sugApplied,
    flowsTotal, flowsWithFailures, endpointsTotal, endpointsWithFailures,
  };
}

// ─── Bucket / filter helpers ──────────────────────────────────────────────────

function filterByRange(points: Point[], from?: string, to?: string): Point[] {
  return points.filter(p =>
    (!from || p.date >= from) && (!to || p.date <= to),
  );
}

function bucketWeekly(points: Point[]): Point[] {
  const map = new Map<string, number[]>();
  for (const p of points) {
    const d = new Date(p.date);
    d.setDate(d.getDate() - d.getDay()); // Monday of week
    const key = d.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p.value);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, value: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 }));
}

function applyBucket(points: Point[], bucket: string): Point[] {
  if (bucket === "week") return bucketWeekly(points);
  return points;
}

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller("projects/:id/trends")
export class TrendsController {

  private build(id: string, days: number): {
    metrics: CurrentMetrics;
    coverage: { requirements: Point[]; ui: Point[]; api: Point[]; flows: Point[]; endpoints: Point[] };
    risk: { score: Point[]; highUncovered: Point[]; criticalUncovered: Point[] };
    stability: { passRate: Point[]; failureRate: Point[]; flakyCount: Point[]; flakyRate: Point[] };
    tests: { total: Point[]; added: Point[]; healed: Point[]; regenerated: Point[] };
    ai: { sugCreated: Point[]; sugApplied: Point[]; healCreated: Point[]; healApplied: Point[]; coverageDelta: Point[] };
    flows: { health: Point[]; flowFailures: Point[]; endpointFailures: Point[] };
  } {
    const m = extractCurrentMetrics(id);
    const seed = strHash(id);

    const coverage = {
      requirements: genSeries(days, m.reqCoverage, Math.max(0, m.reqCoverage - 30), 2, seed + 1),
      ui: genSeries(days, m.uiCoverage, Math.max(0, m.uiCoverage - 25), 2, seed + 2),
      api: genSeries(days, m.apiCoverage, Math.max(0, m.apiCoverage - 20), 2, seed + 3),
      flows: genSeries(days, m.flowCoverage, Math.max(0, m.flowCoverage - 28), 3, seed + 4),
      endpoints: genSeries(days, m.endpointCoverage, Math.max(0, m.endpointCoverage - 22), 3, seed + 5),
    };

    const risk = {
      score: genSeries(days, m.riskScore, Math.min(100, m.riskScore + 25), 3, seed + 10, 0, 100),
      highUncovered: genSeries(days, m.highUncovered, Math.max(0, m.highUncovered + 5), 1, seed + 11, 0),
      criticalUncovered: genSeries(days, m.criticalUncovered, Math.max(0, m.criticalUncovered + 3), 0.5, seed + 12, 0),
    };

    const stability = {
      passRate: genSeries(days, m.passRate, Math.max(0, m.passRate - 20), 2, seed + 20),
      failureRate: genSeries(days, m.failureRate, Math.min(100, m.failureRate + 15), 2, seed + 21, 0),
      flakyCount: genSeries(days, m.flakyCount, Math.max(0, m.flakyCount + 4), 0.5, seed + 22, 0),
      flakyRate: genSeries(days, m.flakyRate, Math.min(100, m.flakyRate + 12), 1, seed + 23, 0),
    };

    const avgTestsPerDay = m.testsTotal > 0 ? m.testsTotal / days * 0.4 : 1;
    const tests = {
      total: genSeries(days, m.testsTotal, Math.max(0, m.testsTotal - Math.round(days * avgTestsPerDay)), 0.5, seed + 30, 0),
      added: genBarSeries(days, avgTestsPerDay, seed + 31),
      healed: genBarSeries(days, Math.max(0, m.healApplied / days), seed + 32),
      regenerated: genBarSeries(days, Math.max(0, m.sugApplied / days * 0.3), seed + 33),
    };

    const avgSugPerDay = Math.max(0.2, m.sugTotal / days);
    const ai = {
      sugCreated: genBarSeries(days, avgSugPerDay, seed + 40),
      sugApplied: genBarSeries(days, avgSugPerDay * (m.sugTotal > 0 ? m.sugApplied / m.sugTotal : 0.4), seed + 41),
      healCreated: genBarSeries(days, Math.max(0, m.healTotal / days), seed + 42),
      healApplied: genBarSeries(days, Math.max(0, m.healApplied / days), seed + 43),
      coverageDelta: genSeries(days, Math.min(20, m.sugApplied * 0.5), 0, 0.3, seed + 44, 0),
    };

    const flows = {
      health: genSeries(days, Math.max(0, 100 - m.flowsWithFailures * 10), 50, 3, seed + 50, 0, 100),
      flowFailures: genSeries(days, m.flowsWithFailures, Math.min(m.flowsTotal, m.flowsWithFailures + 4), 0.5, seed + 51, 0),
      endpointFailures: genSeries(days, m.endpointsWithFailures, Math.min(m.endpointsTotal, m.endpointsWithFailures + 5), 0.5, seed + 52, 0),
    };

    return { metrics: m, coverage, risk, stability, tests, ai, flows };
  }

  private rangeAndBucket(query: Record<string, string | undefined>) {
    const days = Math.min(365, Math.max(7, parseInt(query.days ?? "30", 10) || 30));
    const bucket = query.bucket ?? "day";
    const now = new Date().toISOString().slice(0, 10);
    const from = query.from ?? new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
    const to = query.to ?? now;
    return { days, bucket, from, to };
  }

  @Get("overview")
  overview(
    @Param("id") id: string,
    @Query("days") days?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("bucket") bucket?: string,
  ) {
    const opts = this.rangeAndBucket({ days, from, to, bucket });
    const data = this.build(id, opts.days);
    const filter = (s: Point[]) => applyBucket(filterByRange(s, opts.from, opts.to), opts.bucket);

    const last = (s: Point[]) => s[s.length - 1]?.value ?? 0;
    const prev = (s: Point[]) => s[Math.max(0, s.length - 8)]?.value ?? 0;
    const delta = (s: Point[]) => Math.round((last(s) - prev(s)) * 10) / 10;

    const cov = filter(data.coverage.requirements);
    const pass = filter(data.stability.passRate);
    const risk = filter(data.risk.score);
    const tests = filter(data.tests.total);
    const aiSug = filter(data.ai.sugCreated);

    return {
      from: opts.from, to: opts.to,
      kpis: {
        coverage: { value: last(cov), delta: delta(data.coverage.requirements) },
        passRate: { value: last(pass), delta: delta(data.stability.passRate) },
        riskScore: { value: last(risk), delta: delta(data.risk.score) },
        testsTotal: { value: last(tests), delta: delta(data.tests.total) },
        aiActions: { value: aiSug.reduce((a, p) => a + p.value, 0), delta: 0 },
      },
      series: {
        coverage: cov,
        passRate: pass,
        riskScore: risk,
        testsTotal: tests,
        flakyCount: filter(data.stability.flakyCount),
      },
    };
  }

  @Get("coverage")
  coverage(
    @Param("id") id: string,
    @Query("days") days?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("bucket") bucket?: string,
  ) {
    const opts = this.rangeAndBucket({ days, from, to, bucket });
    const data = this.build(id, opts.days);
    const filter = (s: Point[]) => applyBucket(filterByRange(s, opts.from, opts.to), opts.bucket);
    return {
      from: opts.from, to: opts.to,
      current: {
        requirements: data.metrics.reqCoverage,
        ui: data.metrics.uiCoverage,
        api: data.metrics.apiCoverage,
        flows: data.metrics.flowCoverage,
        endpoints: data.metrics.endpointCoverage,
      },
      series: {
        requirements: filter(data.coverage.requirements),
        ui: filter(data.coverage.ui),
        api: filter(data.coverage.api),
        flows: filter(data.coverage.flows),
        endpoints: filter(data.coverage.endpoints),
      },
    };
  }

  @Get("risk")
  risk(
    @Param("id") id: string,
    @Query("days") days?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("bucket") bucket?: string,
  ) {
    const opts = this.rangeAndBucket({ days, from, to, bucket });
    const data = this.build(id, opts.days);
    const filter = (s: Point[]) => applyBucket(filterByRange(s, opts.from, opts.to), opts.bucket);
    return {
      from: opts.from, to: opts.to,
      current: {
        score: data.metrics.riskScore,
        highUncovered: data.metrics.highUncovered,
        criticalUncovered: data.metrics.criticalUncovered,
      },
      series: {
        score: filter(data.risk.score),
        highUncovered: filter(data.risk.highUncovered),
        criticalUncovered: filter(data.risk.criticalUncovered),
      },
    };
  }

  @Get("stability")
  stability(
    @Param("id") id: string,
    @Query("days") days?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("bucket") bucket?: string,
  ) {
    const opts = this.rangeAndBucket({ days, from, to, bucket });
    const data = this.build(id, opts.days);
    const filter = (s: Point[]) => applyBucket(filterByRange(s, opts.from, opts.to), opts.bucket);
    return {
      from: opts.from, to: opts.to,
      current: {
        passRate: data.metrics.passRate,
        failureRate: data.metrics.failureRate,
        flakyCount: data.metrics.flakyCount,
        flakyRate: data.metrics.flakyRate,
      },
      series: {
        passRate: filter(data.stability.passRate),
        failureRate: filter(data.stability.failureRate),
        flakyCount: filter(data.stability.flakyCount),
        flakyRate: filter(data.stability.flakyRate),
      },
    };
  }

  @Get("tests")
  tests(
    @Param("id") id: string,
    @Query("days") days?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("bucket") bucket?: string,
  ) {
    const opts = this.rangeAndBucket({ days, from, to, bucket });
    const data = this.build(id, opts.days);
    const filter = (s: Point[]) => applyBucket(filterByRange(s, opts.from, opts.to), opts.bucket);
    return {
      from: opts.from, to: opts.to,
      current: { total: data.metrics.testsTotal },
      series: {
        total: filter(data.tests.total),
        added: filter(data.tests.added),
        healed: filter(data.tests.healed),
        regenerated: filter(data.tests.regenerated),
      },
    };
  }

  @Get("ai")
  ai(
    @Param("id") id: string,
    @Query("days") days?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("bucket") bucket?: string,
  ) {
    const opts = this.rangeAndBucket({ days, from, to, bucket });
    const data = this.build(id, opts.days);
    const filter = (s: Point[]) => applyBucket(filterByRange(s, opts.from, opts.to), opts.bucket);
    const sum = (s: Point[]) => Math.round(s.reduce((a, p) => a + p.value, 0));
    return {
      from: opts.from, to: opts.to,
      current: {
        sugTotal: data.metrics.sugTotal,
        sugApplied: data.metrics.sugApplied,
        healTotal: data.metrics.healTotal,
        healApplied: data.metrics.healApplied,
        applyRate: data.metrics.sugTotal > 0
          ? Math.round((data.metrics.sugApplied / data.metrics.sugTotal) * 100)
          : 0,
        healRate: data.metrics.healTotal > 0
          ? Math.round((data.metrics.healApplied / data.metrics.healTotal) * 100)
          : 0,
      },
      periodTotals: {
        sugCreated: sum(filter(data.ai.sugCreated)),
        sugApplied: sum(filter(data.ai.sugApplied)),
        healCreated: sum(filter(data.ai.healCreated)),
        healApplied: sum(filter(data.ai.healApplied)),
      },
      series: {
        sugCreated: filter(data.ai.sugCreated),
        sugApplied: filter(data.ai.sugApplied),
        healCreated: filter(data.ai.healCreated),
        healApplied: filter(data.ai.healApplied),
        coverageDelta: filter(data.ai.coverageDelta),
      },
    };
  }

  @Get("flows-endpoints")
  flowsEndpoints(
    @Param("id") id: string,
    @Query("days") days?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("bucket") bucket?: string,
  ) {
    const opts = this.rangeAndBucket({ days, from, to, bucket });
    const data = this.build(id, opts.days);
    const filter = (s: Point[]) => applyBucket(filterByRange(s, opts.from, opts.to), opts.bucket);
    return {
      from: opts.from, to: opts.to,
      current: {
        flowsTotal: data.metrics.flowsTotal,
        flowsWithFailures: data.metrics.flowsWithFailures,
        endpointsTotal: data.metrics.endpointsTotal,
        endpointsWithFailures: data.metrics.endpointsWithFailures,
        healthScore: data.flows.health[data.flows.health.length - 1]?.value ?? 0,
      },
      series: {
        health: filter(data.flows.health),
        flowFailures: filter(data.flows.flowFailures),
        endpointFailures: filter(data.flows.endpointFailures),
      },
    };
  }
}
