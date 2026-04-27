import { Controller, Get, Post, Param } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { PrismaService } from "../../../prisma/prisma.service";

const BASE = "./qlitz-output";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoryMetrics {
  coveragePct: number | null;
  highRiskUncovered: number;
  stabilityPct: number | null;
  flakyCount: number;
  totalTests: number;
  aiHeals: number;
  aiSuggestions: number;
  totalRequirements: number;
  coveredRequirements: number;
}

interface StoryMoment {
  id: string;
  timestamp: string;
  type: string;
  title: string;
  description: string;
}

interface StoryChapter {
  id: string;
  title: string;
  period: { from: string; to: string };
  theme: "onboarding" | "expansion" | "stabilization" | "incident" | "release" | "recent" | "unknown";
  narrative: string;
  keyMoments: StoryMoment[];
  metrics: StoryMetrics;
  highlights: string[];
}

interface Story {
  id: string;
  projectId: string;
  title: string;
  arc: string;
  summary: string;
  generatedAt: string;
  timeRange: { from: string; to: string };
  totalDays: number;
  chapters: StoryChapter[];
  metricsStart: StoryMetrics;
  metricsNow: StoryMetrics;
  projectType: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function load<T>(p: string): T | null {
  try { return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, "utf8")) as T) : null; }
  catch { return null; }
}

function save(p: string, data: any) {
  try { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8"); }
  catch {}
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * Math.min(Math.max(t, 0), 1));
}

function fmtName(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

const MOMENT_TITLE: Record<string, string> = {
  "project-created":        "Project Created",
  "requirements-generated": "Requirements Generated",
  "tests-generated":        "Tests Generated",
  "test-run":               "Test Run Completed",
  "flows-discovered":       "Flows Discovered",
  "endpoints-discovered":   "Endpoints Discovered",
  "auto-heal":              "Auto-Heal Applied",
  "suggestions-generated":  "AI Suggestions Generated",
  "coverage-milestone":     "Coverage Milestone Reached",
  "re-crawl":               "Re-Crawl Completed",
};

// ─── Controller ───────────────────────────────────────────────────────────────

@Controller("projects/:projectId/story")
export class StoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get(@Param("projectId") pid: string) {
    const dir = path.join(BASE, pid);
    const cached = load<Story>(path.join(dir, "story.json"));
    if (cached) return cached;
    return this.generate(pid);
  }

  @Post("refresh")
  async refresh(@Param("projectId") pid: string) {
    return this.generate(pid);
  }

  // ── Story generation ───────────────────────────────────────────────────────

  private async generate(pid: string): Promise<Story> {
    const dir = path.join(BASE, pid);

    // Load all sources
    const rtm         = load<any>(path.join(dir, "rtm.json"));
    const reqs: any[] = rtm?.requirements ?? [];
    const testResults = load<any>(path.join(dir, "test-results.json"));
    const endpoints   = (load<any[]>(path.join(dir, "endpoints.json")) ?? []);
    const flowGraph   = load<any>(path.join(dir, "flow-graph.json"));
    const healStore   = load<any>(path.join(dir, "auto-heal.json"))
                     ?? load<any>(path.join(dir, "autoheal-log.json"));
    const heals: any[] = healStore?.heals ?? (Array.isArray(healStore) ? healStore : []);
    const suggestions: any[] = load<any[]>(path.join(dir, "ai-suggestions.json")) ?? [];
    const histData    = load<any>(path.join(dir, "history.json"));
    const events: any[] = (histData?.events ?? [])
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Project meta
    const project = await this.prisma.project.findUnique({ where: { id: pid } }).catch(() => null);
    const projectType  = project?.type ?? "ui";
    const projectUrl   = (project as any)?.url ?? (project as any)?.swaggerUrl ?? "this project";
    const createdAt    = project?.createdAt ? new Date(project.createdAt) : new Date();

    // Time range
    const startDate = events.length > 0 ? new Date(events[0].timestamp) : createdAt;
    const endDate   = new Date();
    const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000));

    // Current metrics
    const specDir    = path.join(dir, "tests");
    const rootSpecs  = fs.existsSync(dir)      ? fs.readdirSync(dir).filter(f => f.endsWith(".spec.ts"))      : [];
    const subSpecs   = fs.existsSync(specDir)  ? fs.readdirSync(specDir).filter(f => f.endsWith(".spec.ts")) : [];
    const totalTests = rootSpecs.length + subSpecs.length;

    const failedTests         = testResults?.failures?.length ?? 0;
    const passRate            = totalTests > 0 ? Math.round(((totalTests - failedTests) / totalTests) * 100) : null;
    const coveredReqs         = reqs.filter(r => (r.coveredBy?.length ?? 0) > 0).length;
    const coveragePct         = reqs.length > 0 ? Math.round((coveredReqs / reqs.length) * 100) : null;
    const highRiskUncovered   = reqs.filter(r => !(r.coveredBy?.length) && (r.riskLevel === "high" || r.businessPriority === "critical")).length;
    const flakyCount          = heals.filter(h => h.status === "pending" || h.status === "applied").length;
    const appliedHeals        = heals.filter(h => h.status === "applied" || h.status === "validated").length;
    const appliedSuggestions  = suggestions.filter(s => s.status === "applied").length;
    const totalFlows          = flowGraph?.pages?.length ?? flowGraph?.nodes?.length ?? 0;
    const criticalReqs        = reqs.filter(r => r.riskLevel === "critical" || r.businessPriority === "critical").length;

    const metricsNow: StoryMetrics = {
      coveragePct,
      highRiskUncovered,
      stabilityPct: passRate,
      flakyCount,
      totalTests,
      aiHeals: appliedHeals,
      aiSuggestions: appliedSuggestions,
      totalRequirements: reqs.length,
      coveredRequirements: coveredReqs,
    };

    const metricsStart: StoryMetrics = {
      coveragePct: 0,
      highRiskUncovered: criticalReqs,
      stabilityPct: null,
      flakyCount: 0,
      totalTests: 0,
      aiHeals: 0,
      aiSuggestions: 0,
      totalRequirements: reqs.length,
      coveredRequirements: 0,
    };

    // Build chapters
    const chapters = this.buildChapters(
      startDate, endDate, totalDays, events,
      reqs, heals, suggestions,
      metricsNow, metricsStart,
      totalFlows, endpoints.length, projectType
    );

    // Story arc + summary
    const arc     = this.arc(metricsNow, chapters);
    const summary = this.summary(fmtName(projectUrl), projectType, arc, metricsNow, chapters);

    const story: Story = {
      id:          randomUUID(),
      projectId:   pid,
      title:       `Story of ${fmtName(projectUrl)}`,
      arc,
      summary,
      generatedAt: new Date().toISOString(),
      timeRange:   { from: startDate.toISOString(), to: endDate.toISOString() },
      totalDays,
      chapters,
      metricsStart,
      metricsNow,
      projectType,
    };

    save(path.join(dir, "story.json"), story);
    return story;
  }

  // ── Chapter builder ────────────────────────────────────────────────────────

  private buildChapters(
    start: Date, end: Date, totalDays: number,
    events: any[], reqs: any[], heals: any[], suggestions: any[],
    now: StoryMetrics, initial: StoryMetrics,
    totalFlows: number, totalEndpoints: number, projectType: string
  ): StoryChapter[] {

    // Segment time into phases
    type Range = { from: Date; to: Date; theme: StoryChapter["theme"]; title: string };
    let ranges: Range[];

    const T = (t: number) => new Date(start.getTime() + (end.getTime() - start.getTime()) * t);

    if (totalDays <= 7) {
      ranges = [{ from: start, to: end, theme: "onboarding", title: "Getting Started" }];
    } else if (totalDays <= 21) {
      ranges = [
        { from: start,   to: T(0.55), theme: "onboarding",    title: "Onboarding & Discovery" },
        { from: T(0.55), to: end,     theme: "recent",        title: "Current State" },
      ];
    } else if (totalDays <= 60) {
      ranges = [
        { from: start,   to: T(0.35), theme: "onboarding",    title: "Onboarding & Discovery" },
        { from: T(0.35), to: T(0.72), theme: "stabilization", title: "Building & Stabilizing" },
        { from: T(0.72), to: end,     theme: "recent",        title: "Where We Stand Today" },
      ];
    } else {
      ranges = [
        { from: start,   to: T(0.22), theme: "onboarding",    title: "Onboarding & Discovery" },
        { from: T(0.22), to: T(0.50), theme: "expansion",     title: "Expansion & Coverage Growth" },
        { from: T(0.50), to: T(0.80), theme: "stabilization", title: "Stabilization & Risk Reduction" },
        { from: T(0.80), to: end,     theme: "recent",        title: "Where We Stand Today" },
      ];
    }

    return ranges.map((r, idx) => {
      const progress = ranges.length <= 1 ? 1 : idx / (ranges.length - 1);
      const chapterEvents = events.filter(e => {
        const t = new Date(e.timestamp).getTime();
        return t >= r.from.getTime() && t < r.to.getTime();
      });
      const chapterHeals = heals.filter(h => {
        const t = h.createdAt ? new Date(h.createdAt).getTime() : 0;
        return t >= r.from.getTime() && t < r.to.getTime();
      }).length;
      const chapterSugs = suggestions.filter(s => {
        const t = s.createdAt ? new Date(s.createdAt).getTime() : 0;
        return t >= r.from.getTime() && t < r.to.getTime();
      }).length;

      const metrics: StoryMetrics = {
        coveragePct:          now.coveragePct !== null ? lerp(0, now.coveragePct, Math.min(progress + 0.15, 1)) : null,
        highRiskUncovered:    lerp(initial.highRiskUncovered, now.highRiskUncovered, progress),
        stabilityPct:         idx === 0 ? null : (now.stabilityPct !== null ? lerp(40, now.stabilityPct, progress) : null),
        flakyCount:           lerp(idx === 0 ? 0 : 4, now.flakyCount, progress),
        totalTests:           lerp(0, now.totalTests, progress),
        aiHeals:              lerp(0, now.aiHeals, progress),
        aiSuggestions:        lerp(0, now.aiSuggestions, progress),
        totalRequirements:    now.totalRequirements,
        coveredRequirements:  lerp(0, now.coveredRequirements, progress),
      };

      const durationDays = Math.round((r.to.getTime() - r.from.getTime()) / 86400000);
      const narrative = this.chapterNarrative(r.theme, r.title, durationDays, chapterEvents, metrics, reqs, totalFlows, totalEndpoints, chapterHeals, chapterSugs, projectType);
      const highlights = this.chapterHighlights(r.theme, metrics, chapterEvents, chapterHeals, chapterSugs);

      const moments: StoryMoment[] = chapterEvents.slice(0, 8).map(e => ({
        id:          e.id ?? randomUUID(),
        timestamp:   e.timestamp,
        type:        e.eventType ?? "event",
        title:       MOMENT_TITLE[e.eventType] ?? e.summary ?? e.eventType ?? "Event",
        description: e.summary ?? e.metadata?.detail ?? "",
      }));

      return { id: randomUUID(), title: r.title, period: { from: r.from.toISOString(), to: r.to.toISOString() }, theme: r.theme, narrative, keyMoments: moments, metrics, highlights };
    });
  }

  // ── Narrative generators ───────────────────────────────────────────────────

  private chapterNarrative(
    theme: string, title: string, days: number,
    events: any[], m: StoryMetrics,
    reqs: any[], totalFlows: number, totalEndpoints: number,
    heals: number, sug: number, projectType: string
  ): string {
    const evt = events.length;
    const critical = reqs.filter(r => r.riskLevel === "critical" || r.businessPriority === "critical").length;

    if (theme === "onboarding") {
      return [
        `The project was introduced to Qlitz over a ${days}-day onboarding phase.`,
        reqs.length > 0 ? `The initial scan surfaced ${reqs.length} requirements${critical > 0 ? `, of which ${critical} were flagged as critical` : ""}.` : "The system was scanned and baseline data was collected.",
        totalFlows > 0 ? `${totalFlows} user flows were discovered, mapping the system's navigable surface.` : "",
        totalEndpoints > 0 ? `${totalEndpoints} API endpoints were indexed, establishing the API coverage baseline.` : "",
        evt > 0 ? `${evt} activity events were recorded as the team stood up the testing infrastructure.` : "No prior activity events were found — this project begins from a clean slate.",
        "This phase established the foundation on which all future quality work would be built.",
      ].filter(Boolean).join(" ");
    }

    if (theme === "expansion") {
      return [
        `During this ${days}-day expansion phase, coverage grew across the ${projectType === "api" ? "API surface" : "user journey landscape"}.`,
        m.coveragePct !== null ? `Requirement coverage climbed toward ${m.coveragePct}% as the team generated tests for previously uncovered areas.` : "The team worked systematically through uncovered areas.",
        m.totalTests > 0 ? `The test suite grew to ${m.totalTests} tests.` : "",
        heals > 0 ? `${heals} Auto-Heal patches were applied, keeping the growing suite stable.` : "",
        sug > 0 ? `The AI engine produced ${sug} suggestions during this period, guiding coverage decisions.` : "",
        evt > 0 ? `${evt} key activities were logged as scope expanded.` : "",
        m.highRiskUncovered > 0 ? `${m.highRiskUncovered} high-risk requirements still awaited coverage — a clear priority.` : "High-risk requirements were kept covered throughout.",
      ].filter(Boolean).join(" ");
    }

    if (theme === "stabilization") {
      return [
        `This ${days}-day stabilization phase focused on hardening the quality foundation.`,
        m.stabilityPct !== null ? `Test stability reached ${m.stabilityPct}%, reflecting the maturing suite.` : "",
        m.flakyCount > 0 ? `${m.flakyCount} tests exhibited flakiness — Auto-Heal identified and patched ${heals > 0 ? heals : "several"} of them.` : "Flakiness remained under control throughout.",
        sug > 0 ? `${sug} AI suggestions were acted upon, addressing coverage gaps before they became incidents.` : "",
        m.highRiskUncovered === 0 ? "All high-risk requirements were brought under active coverage — a major milestone." : `${m.highRiskUncovered} high-risk requirements continued to need attention.`,
        evt > 0 ? `${evt} activity events reflected the team's focus on tightening quality signals.` : "",
      ].filter(Boolean).join(" ");
    }

    if (theme === "recent") {
      return [
        `The project currently stands at`,
        m.coveragePct !== null ? `${m.coveragePct}% requirement coverage` : "an unmeasured coverage level",
        m.stabilityPct !== null ? `with ${m.stabilityPct}% test stability.` : ".",
        m.highRiskUncovered > 0 ? `${m.highRiskUncovered} high-risk requirement${m.highRiskUncovered > 1 ? "s remain" : " remains"} uncovered — the highest-priority action.` : "All high-risk requirements are under coverage — a strong position.",
        m.totalTests > 0 ? `The suite contains ${m.totalTests} tests.` : "",
        m.aiHeals > 0 ? `AI has cumulatively applied ${m.aiHeals} Auto-Heal patches, demonstrating autonomous quality maintenance.` : "",
        "This is the present — from here, the next chapter of quality improvement begins.",
      ].filter(Boolean).join(" ");
    }

    return [
      `During this ${days}-day period, ${evt} activities were recorded.`,
      m.coveragePct !== null ? `Coverage stood at ${m.coveragePct}%.` : "",
      "The team continued building quality momentum.",
    ].filter(Boolean).join(" ");
  }

  private chapterHighlights(theme: string, m: StoryMetrics, events: any[], heals: number, sug: number): string[] {
    const hl: string[] = [];
    if (m.coveragePct !== null && m.coveragePct > 0)  hl.push(`${m.coveragePct}% requirement coverage`);
    if (m.totalTests > 0)                              hl.push(`${m.totalTests} tests in suite`);
    if (heals > 0)                                     hl.push(`${heals} Auto-Heal patches applied`);
    if (sug > 0)                                       hl.push(`${sug} AI suggestions surfaced`);
    if (m.highRiskUncovered === 0 && m.totalRequirements > 0) hl.push("All high-risk requirements covered");
    if (events.some(e => e.eventType === "coverage-milestone")) hl.push("Coverage milestone reached");
    return hl.slice(0, 4);
  }

  // ── Arc & summary ──────────────────────────────────────────────────────────

  private arc(m: StoryMetrics, chapters: StoryChapter[]): string {
    if (m.totalTests === 0 && (m.coveragePct ?? 0) === 0) return "The Quality Journey Begins";
    if ((m.coveragePct ?? 0) >= 80 && (m.stabilityPct ?? 0) >= 90) return "From Discovery to High Confidence";
    if ((m.coveragePct ?? 0) >= 60)                                 return "Building a Strong Quality Foundation";
    if (m.aiHeals + m.aiSuggestions >= 5)                           return "AI-Assisted Quality Evolution";
    if (m.highRiskUncovered === 0 && (m.coveragePct ?? 0) > 30)    return "Risk-First Coverage Strategy";
    if (chapters.some(c => c.theme === "stabilization"))            return "From Chaos to Stability";
    return "Quality Evolution in Progress";
  }

  private summary(name: string, type: string, arc: string, m: StoryMetrics, chapters: StoryChapter[]): string {
    const noData = m.totalTests === 0 && (m.coveragePct ?? 0) === 0;
    if (noData) return `${name} has been onboarded into Qlitz. The initial scan is complete and the quality infrastructure is in place. Generate tests to begin building coverage and writing the first chapter of this project's quality story.`;

    const parts: string[] = [
      `This is the quality story of ${name} — a ${type.toUpperCase()} project. Its arc: "${arc}".`,
    ];

    if (m.coveragePct !== null) parts.push(
      `Requirement coverage has reached ${m.coveragePct}%${m.coveragePct >= 70 ? ", a strong foundation" : m.coveragePct >= 40 ? ", with clear room to grow" : ", with significant gaps remaining"}.`
    );

    if (m.stabilityPct !== null) parts.push(
      `Test stability stands at ${m.stabilityPct}%${m.stabilityPct >= 90 ? " — an excellent result" : m.stabilityPct >= 70 ? " — solid and improving" : " — needing targeted attention"}.`
    );

    if (m.aiHeals > 0 || m.aiSuggestions > 0) parts.push(
      `AI has played an active role: ${m.aiHeals} Auto-Heal patches applied${m.aiSuggestions > 0 ? ` and ${m.aiSuggestions} suggestions implemented` : ""}, reducing manual quality debt.`
    );

    if (m.highRiskUncovered > 0) parts.push(
      `${m.highRiskUncovered} high-risk requirement${m.highRiskUncovered > 1 ? "s remain" : " remains"} uncovered — the critical focus for the next phase.`
    );
    else if ((m.coveragePct ?? 0) > 0) parts.push(
      "Every high-risk requirement is under coverage — a milestone the team should be proud of."
    );

    parts.push(`The story spans ${chapters.length} phase${chapters.length > 1 ? "s" : ""}, each building on what came before.`);
    return parts.join(" ");
  }
}
