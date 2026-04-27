import { Controller, Get, Post, Patch, Param, Body, Query } from "@nestjs/common";
import { InsightEngine, InsightFilters, InsightType, InsightSeverity, InsightStatus } from "./insights.engine";
import { PrismaService } from "../../../prisma/prisma.service";

const engine = new InsightEngine();

// ─── Project-scoped insights ─────────────────────────────────────────────────────

@Controller("projects/:projectId/insights")
export class InsightsController {
  @Get()
  list(
    @Param("projectId") projectId: string,
    @Query("types") types?: string,
    @Query("severities") severities?: string,
    @Query("statuses") statuses?: string,
  ) {
    const filters: InsightFilters = {
      types: types ? (types.split(",") as InsightType[]) : undefined,
      severities: severities ? (severities.split(",") as InsightSeverity[]) : undefined,
      statuses: statuses ? (statuses.split(",") as InsightStatus[]) : undefined,
    };
    return engine.list(projectId, filters);
  }

  @Post("refresh")
  refresh(@Param("projectId") projectId: string) {
    const insights = engine.generate(projectId);
    return { refreshed: insights.length, insights };
  }

  @Get(":insightId")
  get(@Param("projectId") projectId: string, @Param("insightId") insightId: string) {
    return engine.get(projectId, insightId) ?? { error: "Insight not found" };
  }

  @Patch(":insightId/status")
  updateStatus(
    @Param("projectId") projectId: string,
    @Param("insightId") insightId: string,
    @Body() body: { status: InsightStatus },
  ) {
    return engine.updateStatus(projectId, insightId, body.status) ?? { error: "Insight not found" };
  }
}

// ─── Org-scoped insights ─────────────────────────────────────────────────────────

@Controller("org/insights")
export class OrgInsightsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listAll(
    @Query("types") types?: string,
    @Query("severities") severities?: string,
    @Query("statuses") statuses?: string,
    @Query("projectIds") projectIds?: string,
  ) {
    const filters: InsightFilters = {
      types: types ? (types.split(",") as InsightType[]) : undefined,
      severities: severities ? (severities.split(",") as InsightSeverity[]) : undefined,
      statuses: statuses ? (statuses.split(",") as InsightStatus[]) : undefined,
    };

    const projects = await this.prisma.project.findMany({ take: 50 });
    const filterIds = projectIds ? new Set(projectIds.split(",")) : null;

    const all: any[] = [];
    for (const p of projects) {
      if (filterIds && !filterIds.has(p.id)) continue;
      try {
        const insights = engine.list(p.id, filters);
        const name = (p as any).name ?? (p.type === "api" ? p.swaggerUrl : (p as any).url) ?? p.id;
        insights.forEach(i => all.push({ ...i, projectName: name, projectType: p.type }));
      } catch { /* project may not have been scanned */ }
    }

    // Sort: critical first, then high, then by project
    const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    all.sort((a, b) => (order[a.severity] ?? 4) - (order[b.severity] ?? 4));
    return all;
  }

  @Get("summary")
  async summary() {
    const projects = await this.prisma.project.findMany({ take: 50 });

    let critical = 0, high = 0, medium = 0, low = 0;
    const byProject: any[] = [];

    for (const p of projects) {
      try {
        const insights = engine.list(p.id, { statuses: ["open", "in-progress"] });
        const pc = insights.filter(i => i.severity === "critical").length;
        const ph = insights.filter(i => i.severity === "high").length;
        const pm = insights.filter(i => i.severity === "medium").length;
        const pl = insights.filter(i => i.severity === "low").length;
        critical += pc; high += ph; medium += pm; low += pl;
        if (insights.length > 0) {
          const name = (p as any).name ?? (p.type === "api" ? p.swaggerUrl : (p as any).url) ?? p.id;
          byProject.push({ id: p.id, name, type: p.type, total: insights.length, critical: pc, high: ph });
        }
      } catch { /* skip */ }
    }

    byProject.sort((a, b) => b.critical - a.critical || b.high - a.high);
    return { critical, high, medium, low, total: critical + high + medium + low, topProjects: byProject.slice(0, 5) };
  }
}
