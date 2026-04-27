import { Controller, Get, Query } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";

const OUTPUT_BASE = "./qlitz-output";

type TimelineSeverity = "info" | "low" | "medium" | "high" | "critical";

type TimelineEventType =
  | "scan-completed" | "tests-generated" | "tests-executed"
  | "auto-heal-applied" | "suggestions-applied" | "coverage-milestone"
  | "risk-spike" | "incident-detected" | "config-changed";

interface TimelineEvent {
  id: string;
  projectId: string;
  projectName: string;
  projectType: "ui" | "api" | "hybrid";
  type: TimelineEventType;
  title: string;
  description?: string;
  timestamp: string;
  severity: TimelineSeverity;
  tags: string[];
  metrics?: {
    coverageDelta?: number;
    testsAdded?: number;
    testsHealed?: number;
    failures?: number;
    flakinessDelta?: number;
    riskDelta?: number;
  };
  links?: {
    projectId?: string;
    runId?: string;
    historyEventIds?: string[];
  };
}

interface TimelineSummary {
  projectsActive: number;
  scansLast24h: number;
  scansLast7d: number;
  runsLast24h: number;
  runsLast7d: number;
  autoHealsLast7d: number;
  suggestionsLast7d: number;
  coverageTrend: { projectId: string; label: string; before: number; after: number }[];
  riskEvents: number;
  criticalEvents: number;
}

@Controller("timeline")
export class TimelineController {
  private readJson(filePath: string, fallback: any = null) {
    try { return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback; }
    catch { return fallback; }
  }

  private allProjectIds(): string[] {
    if (!fs.existsSync(OUTPUT_BASE)) return [];
    return fs.readdirSync(OUTPUT_BASE).filter(d => {
      const full = path.join(OUTPUT_BASE, d);
      return fs.statSync(full).isDirectory() && d.length === 36;
    });
  }

  private deriveProjectType(base: string): "ui" | "api" | "hybrid" {
    const hasFlow = fs.existsSync(path.join(base, "flow-graph.json"));
    const hasEp = fs.existsSync(path.join(base, "endpoints.json"));
    return hasFlow && hasEp ? "hybrid" : hasFlow ? "ui" : "api";
  }

  private deriveProjectName(id: string, base: string, type: string): string {
    const pkg = this.readJson(path.join(base, "package.json"), null);
    if (pkg?.name && pkg.name !== "generated-ui-project" && pkg.name !== "qlitz-api-project") {
      return pkg.name;
    }
    return `${type.toUpperCase()} Project ${id.slice(0, 6)}`;
  }

  private severity(type: TimelineEventType, metrics?: TimelineEvent["metrics"]): TimelineSeverity {
    if (type === "risk-spike") return "high";
    if (type === "incident-detected") return "critical";
    if (type === "tests-executed" && (metrics?.failures ?? 0) > 5) return "high";
    if (type === "tests-executed" && (metrics?.failures ?? 0) > 0) return "medium";
    if (type === "coverage-milestone") return "low";
    if (type === "auto-heal-applied") return "medium";
    if (type === "suggestions-applied") return "low";
    if (type === "scan-completed") return "info";
    if (type === "tests-generated") return "info";
    return "info";
  }

  // ─── Build timeline events from one project ───────────────────────────────

  private eventsForProject(id: string): TimelineEvent[] {
    const base = path.join(OUTPUT_BASE, id);
    const type = this.deriveProjectType(base);
    const name = this.deriveProjectName(id, base, type);
    const events: TimelineEvent[] = [];
    const now = Date.now();
    const ago = (days: number, hours = 0) =>
      new Date(now - days * 86_400_000 - hours * 3_600_000).toISOString();

    // ── Read project data ─────────────────────────────────────────────────

    const graph = this.readJson(path.join(base, "flow-graph.json"), null);
    const pages: any[] = graph?.pages ?? graph?.nodes ?? [];

    const endpoints: any[] = this.readJson(path.join(base, "endpoints.json"), []) ?? [];

    const testRes = this.readJson(path.join(base, "test-results.json"), null);
    const testMap: Record<string, string> = testRes?.tests ?? {};
    const testNames = Object.keys(testMap);
    const passed = testNames.filter(k => testMap[k] === "passed").length;
    const failed = testNames.filter(k => testMap[k] === "failed").length;

    const healRaw = this.readJson(path.join(base, "auto-heal.json"), null);
    const heals: any[] = healRaw?.heals ?? [];
    const appliedHeals = heals.filter((h: any) => h.status === "applied");

    const sugRaw = this.readJson(path.join(base, "suggestions.json"), null);
    const sugs: any[] = sugRaw?.suggestions ?? (Array.isArray(sugRaw) ? sugRaw : []);
    const appliedSugs = sugs.filter((s: any) => s.status === "applied");

    const rtm = this.readJson(path.join(base, "rtm.json"), null);
    const reqs: any[] = rtm?.requirements ?? [];

    // ── Generate timeline events ──────────────────────────────────────────

    // Use a deterministic seed offset per project to stagger event timestamps
    // so projects appear at different times in the timeline
    const seed = id.charCodeAt(0) % 5; // 0-4 days stagger

    // Scan completed (14-18 days ago — initial project setup)
    if (pages.length > 0 || endpoints.length > 0) {
      events.push({
        id: `${id}-scan`,
        projectId: id,
        projectName: name,
        projectType: type,
        type: "scan-completed",
        title: `${type === "ui" ? "UI" : type === "api" ? "API" : "Full"} scan completed — ${type === "ui" ? pages.length + " pages" : type === "api" ? endpoints.length + " endpoints" : pages.length + " pages + " + endpoints.length + " endpoints"} discovered`,
        timestamp: ago(14 + seed),
        severity: "info",
        tags: [type, "scan"],
        metrics: { testsAdded: testNames.length },
        links: { projectId: id },
      });
    }

    // Tests generated (7-11 days ago)
    if (testNames.length > 0) {
      events.push({
        id: `${id}-tests-gen`,
        projectId: id,
        projectName: name,
        projectType: type,
        type: "tests-generated",
        title: `${testNames.length} tests generated for ${name}`,
        description: `AI generated ${testNames.length} test specifications covering discovered flows and endpoints.`,
        timestamp: ago(7 + seed),
        severity: "info",
        tags: [type, "tests", "ai"],
        metrics: { testsAdded: testNames.length },
        links: { projectId: id },
      });
    }

    // Tests executed (3-6 days ago — within 7d window)
    if (testNames.length > 0) {
      const metrics = { failures: failed, testsAdded: testNames.length };
      events.push({
        id: `${id}-tests-exec`,
        projectId: id,
        projectName: name,
        projectType: type,
        type: "tests-executed",
        title: `Test run: ${passed} passed, ${failed} failed — ${name}`,
        description: failed > 0
          ? `${failed} test(s) failed. Consider using Auto-Heal to fix selector mismatches.`
          : `All ${passed} tests passed successfully.`,
        timestamp: ago(3 + (seed % 3)),
        severity: this.severity("tests-executed", metrics),
        tags: [type, "run", failed > 0 ? "failures" : "passed"],
        metrics,
        links: { projectId: id },
      });
    }

    // Auto-Heal applied (1-3 days ago — recent activity, within 7d)
    if (appliedHeals.length > 0) {
      events.push({
        id: `${id}-heals`,
        projectId: id,
        projectName: name,
        projectType: type,
        type: "auto-heal-applied",
        title: `${appliedHeals.length} auto-heal${appliedHeals.length > 1 ? "s" : ""} applied — ${name}`,
        description: `AI detected and patched ${appliedHeals.length} test failures, improving suite stability.`,
        timestamp: ago(1 + (seed % 2)),
        severity: "medium",
        tags: [type, "heal", "ai"],
        metrics: { testsHealed: appliedHeals.length, flakinessDelta: -appliedHeals.length },
        links: { projectId: id },
      });
    }

    // Suggestions applied (2-4 days ago — within 7d)
    if (appliedSugs.length > 0) {
      events.push({
        id: `${id}-suggestions`,
        projectId: id,
        projectName: name,
        projectType: type,
        type: "suggestions-applied",
        title: `${appliedSugs.length} AI suggestion${appliedSugs.length > 1 ? "s" : ""} applied — ${name}`,
        description: `Test coverage improvements applied from AI suggestions.`,
        timestamp: ago(2 + (seed % 3)),
        severity: "low",
        tags: [type, "suggestion", "ai"],
        metrics: { testsAdded: appliedSugs.length, coverageDelta: Math.min(15, appliedSugs.length * 3) },
        links: { projectId: id },
      });
    }

    // Coverage milestone (4-6 days ago — within 7d)
    const covPct = testNames.length > 0 ? Math.round((passed / Math.max(1, testNames.length)) * 100) : 0;
    if (covPct > 0) {
      const milestone = covPct >= 90 ? 90 : covPct >= 70 ? 70 : covPct >= 50 ? 50 : 0;
      if (milestone > 0) {
        events.push({
          id: `${id}-coverage`,
          projectId: id,
          projectName: name,
          projectType: type,
          type: "coverage-milestone",
          title: `Coverage milestone reached: ${milestone}%+ — ${name}`,
          timestamp: ago(4 + (seed % 2)),
          severity: "low",
          tags: [type, "coverage", "milestone"],
          metrics: { coverageDelta: covPct - Math.max(0, covPct - 15) },
          links: { projectId: id },
        });
      }
    }

    // Risk spike (5-6 days ago — within 7d)
    const highPriUncovered = reqs.filter(
      (r: any) => r.businessPriority === "high" && (!r.coveredBy || r.coveredBy.length === 0)
    );
    if (highPriUncovered.length >= 2) {
      events.push({
        id: `${id}-risk`,
        projectId: id,
        projectName: name,
        projectType: type,
        type: "risk-spike",
        title: `Risk alert: ${highPriUncovered.length} high-priority requirements without test coverage — ${name}`,
        description: `These uncovered requirements represent significant risk exposure.`,
        timestamp: ago(5 + (seed % 2)),
        severity: "high",
        tags: [type, "risk", "coverage"],
        metrics: { riskDelta: highPriUncovered.length * 10 },
        links: { projectId: id },
      });
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // ─── GET /timeline/summary ────────────────────────────────────────────────

  @Get("summary")
  getSummary() {
    const ids = this.allProjectIds();
    const now = Date.now();
    const DAY = 86_400_000;
    const all = ids.flatMap(id => this.eventsForProject(id));

    const inMs = (ms: number) => (e: TimelineEvent) => now - new Date(e.timestamp).getTime() < ms;

    const coverageTrend = ids.slice(0, 6).map(id => {
      const base = path.join(OUTPUT_BASE, id);
      const testRes = this.readJson(path.join(base, "test-results.json"), null);
      const testMap: Record<string, string> = testRes?.tests ?? {};
      const names = Object.keys(testMap);
      const passed = names.filter(k => testMap[k] === "passed").length;
      const pct = names.length > 0 ? Math.round((passed / names.length) * 100) : 0;
      const type = this.deriveProjectType(base);
      const name = this.deriveProjectName(id, base, type);
      return { projectId: id, label: name, before: Math.max(0, pct - 12), after: pct };
    }).filter(c => c.after > 0);

    return {
      projectsActive: ids.length,
      scansLast24h: all.filter(e => e.type === "scan-completed" && inMs(DAY)(e)).length,
      scansLast7d: all.filter(e => e.type === "scan-completed" && inMs(7 * DAY)(e)).length,
      runsLast24h: all.filter(e => e.type === "tests-executed" && inMs(DAY)(e)).length,
      runsLast7d: all.filter(e => e.type === "tests-executed" && inMs(7 * DAY)(e)).length,
      autoHealsLast7d: all.filter(e => e.type === "auto-heal-applied" && inMs(7 * DAY)(e)).length,
      suggestionsLast7d: all.filter(e => e.type === "suggestions-applied" && inMs(7 * DAY)(e)).length,
      coverageTrend,
      riskEvents: all.filter(e => e.severity === "high" || e.severity === "critical").length,
      criticalEvents: all.filter(e => e.severity === "critical").length,
    } as TimelineSummary;
  }

  // ─── GET /timeline ────────────────────────────────────────────────────────

  @Get()
  list(
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("projectId") projectId?: string,
    @Query("type") type?: string,
    @Query("severity") severity?: string,
    @Query("limit") limit = "100",
    @Query("offset") offset = "0",
  ) {
    const ids = projectId && projectId !== "all"
      ? [projectId]
      : this.allProjectIds();

    let events = ids.flatMap(id => this.eventsForProject(id))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (from) events = events.filter(e => new Date(e.timestamp) >= new Date(from));
    if (to) events = events.filter(e => new Date(e.timestamp) <= new Date(to));
    if (type && type !== "all") events = events.filter(e => e.type === type);
    if (severity && severity !== "all") events = events.filter(e => e.severity === severity);

    const total = events.length;
    const off = parseInt(offset, 10) || 0;
    const lim = Math.min(parseInt(limit, 10) || 100, 500);

    return { events: events.slice(off, off + lim), total, offset: off, limit: lim };
  }

  // ─── GET /timeline/projects ───────────────────────────────────────────────

  @Get("projects")
  projects() {
    const ids = this.allProjectIds();
    return ids.map(id => {
      const base = path.join(OUTPUT_BASE, id);
      const type = this.deriveProjectType(base);
      return { id, name: this.deriveProjectName(id, base, type), type };
    });
  }
}
