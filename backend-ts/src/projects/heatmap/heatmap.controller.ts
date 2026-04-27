import { Controller, Get, Param, Query } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

const BASE = "./qlitz-output";

function loadJson<T>(p: string): T | null {
  try { return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) as T : null; }
  catch { return null; }
}

const RISK_SCORE: Record<string, number> = { critical: 1.0, high: 0.75, medium: 0.5, low: 0.25 };

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller("projects/:projectId/heatmap")
export class HeatMapController {

  // ── 1. Coverage HeatMap ────────────────────────────────────────────────────
  @Get("coverage")
  getCoverage(@Param("projectId") pid: string) {
    const dir = path.join(BASE, pid);
    const reqs: any[] = loadJson<any>(path.join(dir, "rtm.json"))?.requirements ?? [];
    const tests = loadJson<any[]>(path.join(dir, "tests.json")) ?? [];

    return reqs.map(r => {
      const covered = (r.coveredBy?.length ?? 0) > 0;
      const covIds: string[] = r.coveredBy ?? [];
      return {
        id: r.id,
        label: r.title ?? r.id,
        type: r.type ?? "functional",
        covered,
        partial: !covered && covIds.length === 0 && (r.status === "in_progress"),
        aiGenerated: r.aiGenerated ?? false,
        coveredBy: covIds,
        riskLevel: r.riskLevel ?? "low",
        businessPriority: r.businessPriority ?? "normal",
        coverageDimensions: {
          ui:     covIds.some(id => /ui/i.test(id)),
          api:    covIds.some(id => /api/i.test(id)),
          hybrid: covIds.some(id => /hybrid/i.test(id)),
          flow:   covIds.some(id => /flow/i.test(id)),
        },
      };
    });
  }

  // ── 2. Flow Stability HeatMap ──────────────────────────────────────────────
  @Get("flows")
  getFlows(@Param("projectId") pid: string) {
    const dir = path.join(BASE, pid);
    const fg = loadJson<any>(path.join(dir, "flow-graph.json"));
    const tr = loadJson<any>(path.join(dir, "test-results.json"));
    const heal = loadJson<any>(path.join(dir, "auto-heal.json"))
              ?? loadJson<any>(path.join(dir, "autoheal-log.json"));
    const heals: any[] = heal?.heals ?? (Array.isArray(heal) ? heal : []);

    const pages: any[] = (fg?.pages ?? fg?.nodes ?? []).slice(0, 25);
    const allRuns: any[] = tr?.runs ?? (tr?.status ? [tr] : []);
    const lastRuns = allRuns.slice(-8);

    return pages.map((p: any, i: number) => {
      const pageHeals = heals.filter(h => h.flowId === p.id || h.page === p.url);
      const runs = lastRuns.map((r: any, ri: number) => {
        const failed = tr?.failures?.some((f: any) =>
          f.flowId === p.id || f.file?.includes(p.title ?? "")
        );
        return {
          runId: r.id ?? `run-${i}-${ri}`,
          timestamp: r.timestamp ?? new Date(Date.now() - (7 - ri) * 86400000).toISOString(),
          status: failed ? "failed" : (r.status ?? "passed") as "passed" | "failed" | "flaky" | "skipped",
        };
      });

      const statuses = runs.map(r => r.status);
      const lastStatus = statuses[statuses.length - 1] ?? "not-run";
      const flakyCount = pageHeals.filter(h => h.status === "pending").length;

      return {
        flowId: p.id ?? `flow-${i}`,
        flowName: p.title ?? p.name ?? (p.url ? new URL(p.url).pathname : `Page ${i + 1}`),
        url: p.url ?? null,
        runs,
        lastStatus: flakyCount > 0 ? "flaky" : lastStatus,
        flakyCount,
        hasTests: runs.length > 0,
      };
    });
  }

  // ── 3. Endpoint Health HeatMap ─────────────────────────────────────────────
  @Get("endpoints")
  getEndpoints(@Param("projectId") pid: string) {
    const dir = path.join(BASE, pid);
    const eps: any[] = loadJson<any[]>(path.join(dir, "endpoints.json")) ?? [];
    const tr = loadJson<any>(path.join(dir, "test-results.json"));
    const failures: any[] = tr?.failures ?? [];

    const METHOD_ORDER: Record<string, number> = { GET: 0, POST: 1, PUT: 2, PATCH: 3, DELETE: 4 };

    return eps
      .map((ep: any, i: number) => {
        const failed = failures.some(f => f.path === ep.path || f.endpoint === ep.path);
        const status = failed
          ? "failing"
          : ep.schemaMismatch ? "schema-mismatch"
          : ep.slow || (ep.responseTime && ep.responseTime > 2000) ? "slow"
          : "healthy";

        return {
          endpointId: ep.id ?? `ep-${i}`,
          method: (ep.method ?? "GET").toUpperCase(),
          path: ep.path ?? ep.url ?? `/endpoint/${i}`,
          status,
          lastSeen: ep.lastSeen ?? ep.updatedAt ?? new Date().toISOString(),
          responseTime: ep.responseTime ?? null,
          tags: ep.tags ?? [],
          group: ep.group ?? ep.tag ?? ep.path?.split("/")[1] ?? "general",
        };
      })
      .sort((a, b) => {
        const so = { failing: 0, "schema-mismatch": 1, slow: 2, healthy: 3 };
        return (so[a.status as keyof typeof so] ?? 9) - (so[b.status as keyof typeof so] ?? 9);
      });
  }

  // ── 4. Risk HeatMap ────────────────────────────────────────────────────────
  @Get("risk")
  getRisk(@Param("projectId") pid: string) {
    const dir = path.join(BASE, pid);
    const reqs: any[] = loadJson<any>(path.join(dir, "rtm.json"))?.requirements ?? [];
    const tr = loadJson<any>(path.join(dir, "test-results.json"));
    const failures: string[] = (tr?.failures ?? []).map((f: any) => f.requirementId ?? "");

    return reqs
      .map(r => ({
        id: r.id,
        label: r.title ?? r.id,
        riskScore: RISK_SCORE[r.riskLevel ?? "low"] ?? 0.25,
        riskLevel: (r.riskLevel ?? "low") as "low" | "medium" | "high" | "critical",
        covered: (r.coveredBy?.length ?? 0) > 0,
        failing: failures.includes(r.id),
        businessPriority: r.businessPriority ?? "normal",
        type: r.type ?? "functional",
        coveredBy: r.coveredBy ?? [],
      }))
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  // ── 5. AI Activity HeatMap ─────────────────────────────────────────────────
  @Get("ai")
  getAI(@Param("projectId") pid: string) {
    const dir = path.join(BASE, pid);
    const suggestions: any[] = loadJson<any[]>(path.join(dir, "ai-suggestions.json")) ?? [];
    const healStore = loadJson<any>(path.join(dir, "auto-heal.json"))
                   ?? loadJson<any>(path.join(dir, "autoheal-log.json"));
    const heals: any[] = healStore?.heals ?? (Array.isArray(healStore) ? healStore : []);
    const reqs: any[] = loadJson<any>(path.join(dir, "rtm.json"))?.requirements ?? [];

    const map = new Map<string, {
      id: string; label: string; type: string;
      suggestions: number; applied: number; heals: number; healApplied: number;
    }>();

    reqs.forEach(r => map.set(r.id, {
      id: r.id, label: r.title ?? r.id, type: "requirement",
      suggestions: 0, applied: 0, heals: 0, healApplied: 0,
    }));

    suggestions.forEach(s => {
      const key = s.requirementId ?? s.reqId ?? `sug-${s.id ?? Math.random()}`;
      if (!map.has(key)) map.set(key, { id: key, label: s.area ?? s.description?.slice(0, 40) ?? "General", type: "area", suggestions: 0, applied: 0, heals: 0, healApplied: 0 });
      const e = map.get(key)!;
      e.suggestions++;
      if (s.status === "applied") e.applied++;
    });

    heals.forEach(h => {
      const key = h.requirementId ?? h.reqId ?? `heal-${h.id ?? Math.random()}`;
      if (!map.has(key)) map.set(key, { id: key, label: h.area ?? h.testFile ?? "Auto-Heal", type: "area", suggestions: 0, applied: 0, heals: 0, healApplied: 0 });
      const e = map.get(key)!;
      e.heals++;
      if (h.status === "applied" || h.status === "validated") e.healApplied++;
    });

    return Array.from(map.values())
      .filter(r => r.suggestions + r.heals > 0 || reqs.some(req => req.id === r.id))
      .sort((a, b) => (b.suggestions + b.heals) - (a.suggestions + a.heals));
  }

  // ── 6. Trend HeatMap ───────────────────────────────────────────────────────
  @Get("trends")
  getTrends(
    @Param("projectId") pid: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const dir = path.join(BASE, pid);
    const history = loadJson<any>(path.join(dir, "history.json"));
    const events: any[] = history?.events ?? [];

    const now = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(now.getTime() - 56 * 86400000); // 8 weeks

    const buckets: string[] = [];
    const cur = new Date(start);
    while (cur <= now) {
      buckets.push(cur.toISOString().split("T")[0]);
      cur.setDate(cur.getDate() + 7);
    }

    const METRICS = [
      { key: "coverage",        label: "Coverage",        eventTypes: ["coverage-milestone", "requirements-generated"] },
      { key: "tests",           label: "Tests Generated", eventTypes: ["tests-generated"] },
      { key: "stability",       label: "Stability",       eventTypes: ["test-run"] },
      { key: "heals",           label: "Auto-Heals",      eventTypes: ["auto-heal"] },
      { key: "suggestions",     label: "AI Suggestions",  eventTypes: ["suggestions-generated"] },
    ];

    return METRICS.map(m => ({
      metric: m.key,
      label: m.label,
      values: buckets.map(ts => {
        const bStart = new Date(ts).getTime();
        const bEnd   = bStart + 7 * 86400000;
        const weekEvents = events.filter(e => {
          const t = new Date(e.timestamp).getTime();
          return t >= bStart && t < bEnd && m.eventTypes.includes(e.eventType);
        });
        return {
          timestamp: ts,
          count: weekEvents.length,
          delta: weekEvents.length,
        };
      }),
    }));
  }
}
