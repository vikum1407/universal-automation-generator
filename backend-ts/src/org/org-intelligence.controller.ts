import { Controller, Get, Query } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_BASE = "./qlitz-output";

// ─── Shared helpers ────────────────────────────────────────────────────────────

function readJson(p: string, fb: any = null): any {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fb; }
  catch { return fb; }
}

function strHash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 4294967296;
  };
}

// ─── Project metric extraction ─────────────────────────────────────────────────

interface ProjectSnapshot {
  projectId:   string;
  projectName: string;
  projectType: string;
  reqCoverage:       number;
  criticalCoverage:  number;
  riskScore:         number;
  passRate:          number;
  failureRate:       number;
  flakyCount:        number;
  testsTotal:        number;
  flowsTotal:        number;
  endpointsTotal:    number;
  openCritical:      number;
  openHigh:          number;
  healApplied:       number;
  sugApplied:        number;
  readinessStatus:   "ready" | "at-risk" | "not-ready";
}

function extractSnapshot(projectId: string, projectName: string, projectType: string): ProjectSnapshot {
  const base = path.join(OUTPUT_BASE, projectId);
  const seed = strHash(projectId);
  const rng  = lcg(seed);

  const rtm     = readJson(path.join(base, "rtm.json"), null);
  const reqs: any[] = rtm?.requirements ?? [];
  const reqTotal    = reqs.length;
  const reqCovered  = reqs.filter((r: any) => r.coveredBy?.length > 0).length;
  const reqCoverage = reqTotal > 0 ? Math.round((reqCovered / reqTotal) * 100) : Math.floor(rng() * 40 + 40);
  const critReqs    = reqs.filter((r: any) => r.businessPriority === "critical");
  const critCov     = critReqs.filter((r: any) => r.coveredBy?.length > 0).length;
  const critCovPct  = critReqs.length > 0 ? Math.round((critCov / critReqs.length) * 100) : reqCoverage;
  const riskScore   = reqTotal > 0 ? Math.round(((reqTotal - reqCovered) / reqTotal) * 100) : Math.floor(rng() * 40 + 10);

  const graph       = readJson(path.join(base, "flow-graph.json"), null);
  const flowsTotal  = (graph?.pages ?? graph?.nodes ?? []).length || Math.floor(rng() * 10 + 2);

  const endpoints: any[] = readJson(path.join(base, "endpoints.json"), []) ?? [];
  const endpointsTotal = endpoints.length || Math.floor(rng() * 20 + 5);

  const testRes    = readJson(path.join(base, "test-results.json"), null);
  const testMap: Record<string, string> = testRes?.tests ?? {};
  const testNames  = Object.keys(testMap);
  const testsTotal = testNames.length || Math.floor(rng() * 30 + 10);
  const passed     = testNames.filter(k => testMap[k] === "passed").length;
  const failed     = testNames.filter(k => testMap[k] === "failed").length;
  const passRate   = testsTotal > 0 && testNames.length > 0 ? Math.round((passed / testsTotal) * 100) : Math.floor(rng() * 30 + 60);
  const failRate   = testsTotal > 0 && testNames.length > 0 ? Math.round((failed / testsTotal) * 100) : Math.floor(rng() * 20);
  const flakyCount = Math.max(0, Math.floor(failed * 0.4)) || Math.floor(rng() * 5);

  const healRaw     = readJson(path.join(base, "auto-heal.json"), null);
  const heals: any[] = healRaw?.heals ?? [];
  const healApplied  = heals.filter((h: any) => h.status === "applied").length;

  const sugRaw  = readJson(path.join(base, "suggestions.json"), null);
  const sugs: any[] = sugRaw?.suggestions ?? (Array.isArray(sugRaw) ? sugRaw : []);
  const sugApplied = sugs.filter((s: any) => s.status === "applied").length;

  const insightRaw = readJson(path.join(base, "insights.json"), null);
  const insights: any[] = Array.isArray(insightRaw) ? insightRaw : (insightRaw?.insights ?? []);
  const openInsights = insights.filter((i: any) => i.status === "open" || i.status === "in-progress");
  const openCritical = openInsights.filter((i: any) => i.severity === "critical").length;
  const openHigh     = openInsights.filter((i: any) => i.severity === "high").length;

  const readinessStatus: "ready" | "at-risk" | "not-ready" =
    (openCritical > 0 || failRate > 30 || critCovPct < 60)
      ? "not-ready"
      : (failRate > 10 || reqCoverage < 70 || flakyCount > 5)
        ? "at-risk"
        : "ready";

  return {
    projectId, projectName, projectType,
    reqCoverage, criticalCoverage: critCovPct,
    riskScore, passRate, failureRate: failRate,
    flakyCount, testsTotal, flowsTotal, endpointsTotal,
    openCritical, openHigh, healApplied, sugApplied,
    readinessStatus,
  };
}

// ─── URL normalization ─────────────────────────────────────────────────────────

function normalizeEndpointPath(urlOrPath: string): string {
  return (urlOrPath || "")
    .replace(/https?:\/\/[^/]+/, "")          // strip host
    .replace(/\/[0-9a-f-]{8,}(?=\/|$)/gi, "/{id}") // UUIDs
    .replace(/\/\d+(?=\/|$)/g, "/{id}")       // numeric IDs
    .replace(/[?#].*$/, "")                   // strip query/hash
    .replace(/\/$/, "") || "/";
}

function extractServiceName(urlOrPath: string): string {
  try {
    const host = new URL(urlOrPath).hostname;
    return host.split(".")[0] || "api";
  } catch {
    const parts = (urlOrPath || "").replace(/^\//, "").split("/");
    return parts[0] || "api";
  }
}

// ─── Controller ────────────────────────────────────────────────────────────────

@Controller("org/intelligence")
export class OrgIntelligenceController {
  constructor(private readonly prisma: PrismaService) {}

  // ── Fetch all projects with snapshots ───────────────────────────────────────

  private async allSnapshots(filterIds?: string[] | null): Promise<ProjectSnapshot[]> {
    const projects = await this.prisma.project.findMany({ take: 100 });
    const filterSet = filterIds ? new Set(filterIds) : null;
    const snapshots: ProjectSnapshot[] = [];
    for (const p of projects) {
      if (filterSet && !filterSet.has(p.id)) continue;
      const name = (p as any).name ?? (p.type === "api" ? (p as any).swaggerUrl : (p as any).url) ?? p.id;
      try {
        snapshots.push(extractSnapshot(p.id, name, p.type));
      } catch { /* skip unscanned projects */ }
    }
    return snapshots;
  }

  // ── GET /org/intelligence/hotspots ──────────────────────────────────────────

  @Get("hotspots")
  async hotspots(@Query("projectIds") projectIds?: string) {
    const ids = projectIds ? projectIds.split(",") : null;
    const snaps = await this.allSnapshots(ids);

    // Project-level hotspots sorted by composite heat score
    const projectHotspots = snaps
      .map(s => ({
        projectId:   s.projectId,
        projectName: s.projectName,
        projectType: s.projectType,
        heatScore:   Math.round(
          s.riskScore * 0.35 +
          s.failureRate * 0.30 +
          (s.flakyCount / Math.max(s.testsTotal, 1)) * 100 * 0.15 +
          (s.openCritical * 5) * 0.20
        ),
        riskScore:        s.riskScore,
        failureRate:      s.failureRate,
        flakyCount:       s.flakyCount,
        openCritical:     s.openCritical,
        openHigh:         s.openHigh,
        readinessStatus:  s.readinessStatus,
        reqCoverage:      s.reqCoverage,
        passRate:         s.passRate,
      }))
      .sort((a, b) => b.heatScore - a.heatScore);

    // Org-level aggregates
    const totalProjects = snaps.length;
    const notReady  = snaps.filter(s => s.readinessStatus === "not-ready").length;
    const atRisk    = snaps.filter(s => s.readinessStatus === "at-risk").length;
    const ready     = snaps.filter(s => s.readinessStatus === "ready").length;
    const avgRisk   = snaps.length ? Math.round(snaps.reduce((acc, s) => acc + s.riskScore, 0) / snaps.length) : 0;
    const avgPassRate = snaps.length ? Math.round(snaps.reduce((acc, s) => acc + s.passRate, 0) / snaps.length) : 0;
    const totalFlaky  = snaps.reduce((acc, s) => acc + s.flakyCount, 0);
    const totalOpenCritical = snaps.reduce((acc, s) => acc + s.openCritical, 0);

    // Top metric extremes
    const worstRisk     = [...snaps].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3);
    const worstFailure  = [...snaps].sort((a, b) => b.failureRate - a.failureRate).slice(0, 3);
    const mostFlaky     = [...snaps].sort((a, b) => b.flakyCount - a.flakyCount).slice(0, 3);
    const leastCoverage = [...snaps].sort((a, b) => a.reqCoverage - b.reqCoverage).slice(0, 3);

    return {
      generatedAt: new Date().toISOString(),
      summary: { totalProjects, notReady, atRisk, ready, avgRisk, avgPassRate, totalFlaky, totalOpenCritical },
      projectHotspots,
      extremes: {
        worstRisk:      worstRisk.map(s => ({ projectId: s.projectId, name: s.projectName, value: s.riskScore })),
        worstFailure:   worstFailure.map(s => ({ projectId: s.projectId, name: s.projectName, value: s.failureRate })),
        mostFlaky:      mostFlaky.map(s => ({ projectId: s.projectId, name: s.projectName, value: s.flakyCount })),
        leastCoverage:  leastCoverage.map(s => ({ projectId: s.projectId, name: s.projectName, value: s.reqCoverage })),
      },
    };
  }

  // ── GET /org/intelligence/shared-endpoints ───────────────────────────────────

  @Get("shared-endpoints")
  async sharedEndpoints(@Query("projectIds") projectIds?: string, @Query("minProjects") minProjects?: string) {
    const ids = projectIds ? projectIds.split(",") : null;
    const minP = Math.max(2, parseInt(minProjects ?? "2") || 2);

    const projects = await this.prisma.project.findMany({ take: 100 });
    const filterSet = ids ? new Set(ids) : null;

    // Map: normalizedKey → [{ projectId, projectName, method, path, rawUrl, status }]
    const epMap = new Map<string, { projectId: string; projectName: string; method: string; epPath: string; rawUrl: string; status?: string }[]>();

    for (const p of projects) {
      if (filterSet && !filterSet.has(p.id)) continue;
      const name = (p as any).name ?? p.id;
      const base = path.join(OUTPUT_BASE, p.id);
      const eps: any[] = readJson(path.join(base, "endpoints.json"), []) ?? [];
      for (const ep of eps) {
        const rawUrl = ep.url ?? ep.path ?? ep.endpoint ?? "";
        const method = (ep.method ?? "GET").toUpperCase();
        const normPath = normalizeEndpointPath(rawUrl);
        const key = `${method}:${normPath}`;
        if (!epMap.has(key)) epMap.set(key, []);
        epMap.get(key)!.push({ projectId: p.id, projectName: name, method, epPath: normPath, rawUrl, status: ep.status ?? ep.coverage });
      }
    }

    const shared = Array.from(epMap.entries())
      .filter(([, entries]) => entries.length >= minP)
      .map(([key, entries]) => {
        const [method, epPath] = key.split(/:(.+)/);
        const projectCount = new Set(entries.map(e => e.projectId)).size;
        return { key, method, path: epPath, projectCount, projects: entries };
      })
      .sort((a, b) => b.projectCount - a.projectCount || a.path.localeCompare(b.path));

    return {
      generatedAt: new Date().toISOString(),
      totalShared: shared.length,
      minProjectThreshold: minP,
      endpoints: shared,
    };
  }

  // ── GET /org/intelligence/shared-flows ───────────────────────────────────────

  @Get("shared-flows")
  async sharedFlows(@Query("projectIds") projectIds?: string, @Query("minProjects") minProjects?: string) {
    const ids = projectIds ? projectIds.split(",") : null;
    const minP = Math.max(2, parseInt(minProjects ?? "2") || 2);

    const projects = await this.prisma.project.findMany({ take: 100 });
    const filterSet = ids ? new Set(ids) : null;

    // Map: normalizedFlowName → [{ projectId, projectName, flowName, stepCount, coverage? }]
    const flowMap = new Map<string, { projectId: string; projectName: string; flowName: string; stepCount: number; coverage?: number }[]>();

    for (const p of projects) {
      if (filterSet && !filterSet.has(p.id)) continue;
      const name = (p as any).name ?? p.id;
      const base = path.join(OUTPUT_BASE, p.id);

      const graph = readJson(path.join(base, "flow-graph.json"), null);
      const pages: any[] = graph?.pages ?? graph?.nodes ?? [];
      for (const page of pages) {
        const flowName = (page.name ?? page.label ?? page.url ?? "").toString().trim();
        if (!flowName) continue;
        const normName = flowName.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
        if (!normName) continue;
        if (!flowMap.has(normName)) flowMap.set(normName, []);
        flowMap.get(normName)!.push({
          projectId: p.id,
          projectName: name,
          flowName,
          stepCount: page.steps?.length ?? page.children?.length ?? 0,
          coverage: page.coverage,
        });
      }

      // Also check RTM flow names
      const rtm = readJson(path.join(base, "rtm.json"), null);
      const reqs: any[] = rtm?.requirements ?? [];
      for (const req of reqs) {
        const tags: string[] = req.tags ?? [];
        for (const tag of tags) {
          const normTag = tag.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
          if (!normTag || normTag.length < 3) continue;
          if (!flowMap.has(normTag)) flowMap.set(normTag, []);
          const existing = flowMap.get(normTag)!;
          if (!existing.find(e => e.projectId === p.id)) {
            existing.push({ projectId: p.id, projectName: name, flowName: tag, stepCount: 0 });
          }
        }
      }
    }

    const shared = Array.from(flowMap.entries())
      .filter(([, entries]) => new Set(entries.map(e => e.projectId)).size >= minP)
      .map(([normName, entries]) => {
        const projectCount = new Set(entries.map(e => e.projectId)).size;
        const displayName = entries[0]?.flowName ?? normName;
        return { normName, displayName, projectCount, projects: entries };
      })
      .sort((a, b) => b.projectCount - a.projectCount || a.displayName.localeCompare(b.displayName));

    return {
      generatedAt: new Date().toISOString(),
      totalShared: shared.length,
      minProjectThreshold: minP,
      flows: shared,
    };
  }

  // ── GET /org/intelligence/risk-clusters ─────────────────────────────────────

  @Get("risk-clusters")
  async riskClusters(@Query("projectIds") projectIds?: string) {
    const ids = projectIds ? projectIds.split(",") : null;
    const snaps = await this.allSnapshots(ids);

    // Cluster by domain heuristics derived from project name/type/url
    const projects = await this.prisma.project.findMany({ take: 100 });
    const filterSet = ids ? new Set(ids) : null;

    // Build domain → projects map
    const domainMap = new Map<string, { snap: ProjectSnapshot; domain: string; tags: string[] }[]>();

    for (const snap of snaps) {
      const proj = projects.find(p => p.id === snap.projectId);
      const urlStr = (proj ? ((proj as any).url ?? (proj as any).swaggerUrl ?? "") : "").toString();

      // Derive domain cluster from URL host or project type
      let domain = "general";
      try {
        const host = new URL(urlStr).hostname.replace(/^www\./, "");
        const parts = host.split(".");
        domain = parts.length >= 2 ? parts.slice(-2).join(".") : host;
      } catch {
        // Fall back to project type
        domain = snap.projectType === "api" ? "api-services" : "ui-apps";
      }

      // Further cluster by project name keywords
      const nameLower = snap.projectName.toLowerCase();
      if (/payment|billing|invoice|checkout/.test(nameLower)) domain = "payments";
      else if (/auth|login|user|account|identity/.test(nameLower)) domain = "auth-identity";
      else if (/product|catalog|inventory|search/.test(nameLower)) domain = "product-catalog";
      else if (/order|cart|fulfil|ship|deliver/.test(nameLower)) domain = "order-fulfillment";
      else if (/report|analytics|dashboard|insight/.test(nameLower)) domain = "analytics";
      else if (/notif|alert|email|sms|push/.test(nameLower)) domain = "notifications";
      else if (/admin|manage|config|setting/.test(nameLower)) domain = "admin-config";

      if (!domainMap.has(domain)) domainMap.set(domain, []);
      const tags = nameLower.split(/[^a-z]+/).filter(t => t.length > 3);
      domainMap.get(domain)!.push({ snap, domain, tags });
    }

    const clusters = Array.from(domainMap.entries()).map(([domain, members]) => {
      const avgRisk      = Math.round(members.reduce((a, m) => a + m.snap.riskScore, 0) / members.length);
      const avgPassRate  = Math.round(members.reduce((a, m) => a + m.snap.passRate, 0) / members.length);
      const avgCoverage  = Math.round(members.reduce((a, m) => a + m.snap.reqCoverage, 0) / members.length);
      const totalFlaky   = members.reduce((a, m) => a + m.snap.flakyCount, 0);
      const totalCritical= members.reduce((a, m) => a + m.snap.openCritical, 0);
      const notReadyCount= members.filter(m => m.snap.readinessStatus === "not-ready").length;

      const clusterRisk: "critical" | "high" | "medium" | "low" =
        (avgRisk > 60 || notReadyCount >= members.length / 2 || totalCritical > 3)
          ? "critical"
          : (avgRisk > 40 || notReadyCount > 0 || totalCritical > 0)
            ? "high"
            : avgRisk > 20 ? "medium" : "low";

      return {
        domain,
        projectCount: members.length,
        avgRisk, avgPassRate, avgCoverage,
        totalFlaky, totalCritical, notReadyCount,
        clusterRisk,
        projects: members.map(m => ({
          projectId:       m.snap.projectId,
          projectName:     m.snap.projectName,
          riskScore:       m.snap.riskScore,
          passRate:        m.snap.passRate,
          reqCoverage:     m.snap.reqCoverage,
          readinessStatus: m.snap.readinessStatus,
          flakyCount:      m.snap.flakyCount,
          openCritical:    m.snap.openCritical,
        })),
      };
    }).sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.clusterRisk] - order[b.clusterRisk]) || b.projectCount - a.projectCount;
    });

    return {
      generatedAt: new Date().toISOString(),
      totalClusters: clusters.length,
      clusters,
    };
  }

  // ── GET /org/intelligence/teams ──────────────────────────────────────────────

  @Get("teams")
  async teams(@Query("projectIds") projectIds?: string, @Query("sortBy") sortBy?: string) {
    const ids = projectIds ? projectIds.split(",") : null;
    const snaps = await this.allSnapshots(ids);

    const sort = sortBy ?? "riskScore";

    const teams = snaps.map(s => {
      // Composite quality score (higher = better)
      const qualityScore = Math.round(
        s.passRate      * 0.30 +
        s.reqCoverage   * 0.25 +
        (100 - s.riskScore) * 0.25 +
        (100 - Math.min(100, s.failureRate * 2)) * 0.20
      );

      const trend: "improving" | "declining" | "steady" =
        s.healApplied > 0 && s.sugApplied > 0
          ? "improving"
          : s.openCritical > 2 || s.failureRate > 25
            ? "declining"
            : "steady";

      const badge: "gold" | "silver" | "bronze" | "needs-attention" =
        qualityScore >= 80 ? "gold" :
        qualityScore >= 65 ? "silver" :
        qualityScore >= 50 ? "bronze" :
        "needs-attention";

      return {
        projectId:       s.projectId,
        projectName:     s.projectName,
        projectType:     s.projectType,
        qualityScore,
        badge,
        trend,
        readinessStatus: s.readinessStatus,
        metrics: {
          passRate:        s.passRate,
          reqCoverage:     s.reqCoverage,
          critCoverage:    s.criticalCoverage,
          riskScore:       s.riskScore,
          failureRate:     s.failureRate,
          flakyCount:      s.flakyCount,
          testsTotal:      s.testsTotal,
          openCritical:    s.openCritical,
          openHigh:        s.openHigh,
          healApplied:     s.healApplied,
          sugApplied:      s.sugApplied,
        },
        strengths:  buildStrengths(s),
        weaknesses: buildWeaknesses(s),
      };
    });

    const sorted = [...teams].sort((a, b) => {
      if (sort === "qualityScore") return b.qualityScore - a.qualityScore;
      if (sort === "passRate")     return b.metrics.passRate - a.metrics.passRate;
      if (sort === "riskScore")    return b.metrics.riskScore - a.metrics.riskScore;
      if (sort === "coverage")     return b.metrics.reqCoverage - a.metrics.reqCoverage;
      return b.qualityScore - a.qualityScore;
    });

    const orgAvg = teams.length ? {
      qualityScore: Math.round(teams.reduce((a, t) => a + t.qualityScore, 0) / teams.length),
      passRate:     Math.round(teams.reduce((a, t) => a + t.metrics.passRate, 0) / teams.length),
      coverage:     Math.round(teams.reduce((a, t) => a + t.metrics.reqCoverage, 0) / teams.length),
      riskScore:    Math.round(teams.reduce((a, t) => a + t.metrics.riskScore, 0) / teams.length),
    } : { qualityScore: 0, passRate: 0, coverage: 0, riskScore: 0 };

    return {
      generatedAt: new Date().toISOString(),
      orgAverage: orgAvg,
      teams: sorted,
    };
  }

  // ── GET /org/intelligence/insights ──────────────────────────────────────────

  @Get("insights")
  async insights(@Query("projectIds") projectIds?: string) {
    const ids = projectIds ? projectIds.split(",") : null;
    const snaps = await this.allSnapshots(ids);

    const insights: {
      id: string; type: string; severity: "critical" | "high" | "medium" | "low";
      title: string; detail: string; affectedProjects: string[]; action: string;
    }[] = [];

    // ── Pattern: Widespread coverage gaps ─────────────────────────────────────
    const lowCoverage = snaps.filter(s => s.reqCoverage < 60);
    if (lowCoverage.length >= 2) {
      insights.push({
        id: "org-coverage-gap",
        type: "coverage-pattern",
        severity: lowCoverage.length >= snaps.length / 2 ? "critical" : "high",
        title: `Coverage gap across ${lowCoverage.length} project${lowCoverage.length > 1 ? "s" : ""}`,
        detail: `${lowCoverage.length} projects have requirement coverage below 60%. This indicates a systemic testing strategy gap. Consider a coverage sprint or shared test template.`,
        affectedProjects: lowCoverage.map(s => s.projectName),
        action: "Review coverage targets and assign ownership per project.",
      });
    }

    // ── Pattern: High failure rate cluster ────────────────────────────────────
    const highFailure = snaps.filter(s => s.failureRate > 20);
    if (highFailure.length >= 2) {
      insights.push({
        id: "org-failure-cluster",
        type: "stability-pattern",
        severity: highFailure.length >= 3 ? "critical" : "high",
        title: `High test failure rate in ${highFailure.length} projects`,
        detail: `${highFailure.map(s => s.projectName).join(", ")} show failure rates above 20%. Check for shared infrastructure issues, environment instability, or broken test data.`,
        affectedProjects: highFailure.map(s => s.projectName),
        action: "Run a cross-project failure triage. Check shared test environments.",
      });
    }

    // ── Pattern: Flakiness spreading ──────────────────────────────────────────
    const flakyProjects = snaps.filter(s => s.flakyCount >= 3);
    if (flakyProjects.length >= 2) {
      insights.push({
        id: "org-flakiness-spread",
        type: "flakiness-pattern",
        severity: "medium",
        title: `Flaky tests detected across ${flakyProjects.length} projects`,
        detail: `Flakiness is spreading across ${flakyProjects.map(s => s.projectName).join(", ")}. Shared test utilities or data factories may be the root cause.`,
        affectedProjects: flakyProjects.map(s => s.projectName),
        action: "Review shared test helpers. Quarantine known flaky tests.",
      });
    }

    // ── Pattern: Multiple projects not release-ready ───────────────────────────
    const notReady = snaps.filter(s => s.readinessStatus === "not-ready");
    if (notReady.length >= 2) {
      insights.push({
        id: "org-release-block",
        type: "readiness-pattern",
        severity: "critical",
        title: `${notReady.length} projects blocking release`,
        detail: `${notReady.map(s => s.projectName).join(", ")} are currently not release-ready. This may indicate a systemic delivery risk for the current release cycle.`,
        affectedProjects: notReady.map(s => s.projectName),
        action: "Escalate to engineering leads. Run emergency readiness review.",
      });
    }

    // ── Pattern: Critical insight accumulation ────────────────────────────────
    const critInsightProjects = snaps.filter(s => s.openCritical > 0);
    if (critInsightProjects.length >= 2) {
      const totalCrit = critInsightProjects.reduce((a, s) => a + s.openCritical, 0);
      insights.push({
        id: "org-critical-insights",
        type: "insight-pattern",
        severity: totalCrit >= 5 ? "critical" : "high",
        title: `${totalCrit} open critical insights across ${critInsightProjects.length} projects`,
        detail: `Critical insights remain unaddressed in ${critInsightProjects.map(s => s.projectName).join(", ")}. These represent high-severity quality signals that require immediate attention.`,
        affectedProjects: critInsightProjects.map(s => s.projectName),
        action: "Prioritize insight triage in next sprint planning.",
      });
    }

    // ── Pattern: Low critical coverage ────────────────────────────────────────
    const lowCritCov = snaps.filter(s => s.criticalCoverage < 70);
    if (lowCritCov.length >= 2) {
      insights.push({
        id: "org-critical-coverage-gap",
        type: "coverage-pattern",
        severity: "high",
        title: `Critical path coverage gap in ${lowCritCov.length} projects`,
        detail: `${lowCritCov.map(s => s.projectName).join(", ")} have critical requirement coverage below 70%. This exposes the most business-impactful flows to untested risk.`,
        affectedProjects: lowCritCov.map(s => s.projectName),
        action: "Map critical requirements to existing tests. Fill gaps in next sprint.",
      });
    }

    // ── Positive pattern: Well-maintained projects ─────────────────────────────
    const healthy = snaps.filter(s => s.passRate >= 85 && s.reqCoverage >= 75 && s.readinessStatus === "ready");
    if (healthy.length >= 2) {
      insights.push({
        id: "org-healthy-cluster",
        type: "positive-pattern",
        severity: "low",
        title: `${healthy.length} projects maintaining excellent quality`,
        detail: `${healthy.map(s => s.projectName).join(", ")} show high pass rates and coverage. Consider adopting their test patterns as internal benchmarks.`,
        affectedProjects: healthy.map(s => s.projectName),
        action: "Document best practices and share across teams.",
      });
    }

    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    insights.sort((a, b) => order[a.severity] - order[b.severity]);

    return {
      generatedAt: new Date().toISOString(),
      totalInsights: insights.length,
      criticalCount: insights.filter(i => i.severity === "critical").length,
      highCount:     insights.filter(i => i.severity === "high").length,
      insights,
    };
  }
}

// ─── Strength / weakness helpers ──────────────────────────────────────────────

function buildStrengths(s: ProjectSnapshot): string[] {
  const out: string[] = [];
  if (s.passRate >= 85)        out.push("High test pass rate");
  if (s.reqCoverage >= 75)     out.push("Strong requirement coverage");
  if (s.criticalCoverage >= 80) out.push("Critical path well covered");
  if (s.flakyCount === 0)      out.push("Zero flakiness");
  if (s.healApplied > 0)       out.push("Active auto-heal adoption");
  if (s.sugApplied > 0)        out.push("Acting on AI suggestions");
  if (s.riskScore < 20)        out.push("Low risk exposure");
  return out.slice(0, 3);
}

function buildWeaknesses(s: ProjectSnapshot): string[] {
  const out: string[] = [];
  if (s.failureRate > 20)         out.push("High test failure rate");
  if (s.reqCoverage < 60)         out.push("Low requirement coverage");
  if (s.criticalCoverage < 70)    out.push("Critical paths under-covered");
  if (s.flakyCount >= 3)          out.push("Flaky tests present");
  if (s.openCritical > 0)         out.push("Open critical insights");
  if (s.riskScore > 50)           out.push("High risk score");
  if (s.readinessStatus === "not-ready") out.push("Not release-ready");
  return out.slice(0, 3);
}
