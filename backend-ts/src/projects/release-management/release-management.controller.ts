import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { PrismaService } from "../../../prisma/prisma.service";
import { InsightEngine } from "../insights/insights.engine";

const BASE = "./qlitz-output";

// ─── Status machine ───────────────────────────────────────────────────────────

type ReleaseStatus =
  | "planned"
  | "in_progress"
  | "ready_for_validation"
  | "validating"
  | "ready_to_ship"
  | "shipped"
  | "rolled_back"
  | "cancelled";

const VALID_TRANSITIONS: Record<ReleaseStatus, ReleaseStatus[]> = {
  planned:               ["in_progress", "cancelled"],
  in_progress:           ["ready_for_validation", "cancelled"],
  ready_for_validation:  ["validating", "in_progress", "cancelled"],
  validating:            ["ready_to_ship", "in_progress", "cancelled"],
  ready_to_ship:         ["shipped", "validating", "cancelled"],
  shipped:               ["rolled_back"],
  rolled_back:           ["planned"],
  cancelled:             ["planned"],
};

const STATUS_LABELS: Record<ReleaseStatus, string> = {
  planned:              "Planned",
  in_progress:          "In Progress",
  ready_for_validation: "Ready for Validation",
  validating:           "Validating",
  ready_to_ship:        "Ready to Ship",
  shipped:              "Shipped",
  rolled_back:          "Rolled Back",
  cancelled:            "Cancelled",
};

// ─── DTOs ──────────────────────────────────────────────────────────────────────

interface CreateReleaseDto {
  name: string;
  version?: string;
  environment?: string;
  description?: string;
  createdBy?: string;
  notes?: string;
  plannedStart?: string;
  plannedEnd?: string;
  metadata?: Record<string, any>;
}

interface UpdateReleaseDto {
  name?: string;
  version?: string;
  environment?: string;
  description?: string;
  notes?: string;
  plannedStart?: string | null;
  plannedEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  metadata?: Record<string, any>;
}

interface AddLinkDto {
  type: string;
  targetId: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function loadJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch { return null; }
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function scoreColor(s: number): string {
  return s >= 80 ? "#22c55e" : s >= 60 ? "#f59e0b" : "#ef4444";
}

// ─── Readiness computation (reusable, scoped to any window) ──────────────────

function computeReadiness(projectId: string, env: string) {
  const dir = path.join(BASE, projectId);

  const rtm        = loadJson<any>(path.join(dir, "rtm.json"));
  const testRes    = loadJson<any>(path.join(dir, "test-results.json"));
  const endpoints  = loadJson<any[]>(path.join(dir, "endpoints.json")) ?? [];
  const flowGraph  = loadJson<any>(path.join(dir, "flow-graph.json"));
  const healStore  = loadJson<any>(path.join(dir, "auto-heal.json"))
                  ?? loadJson<any>(path.join(dir, "autoheal-log.json"));

  const heals: any[] = healStore?.heals ?? (Array.isArray(healStore) ? healStore : []);
  const reqs: any[]  = rtm?.requirements ?? [];

  const specDir   = path.join(dir, "tests");
  const rootSpecs = fs.existsSync(dir)     ? fs.readdirSync(dir).filter(f => f.endsWith(".spec.ts"))     : [];
  const subSpecs  = fs.existsSync(specDir) ? fs.readdirSync(specDir).filter(f => f.endsWith(".spec.ts")) : [];
  const totalTests = rootSpecs.length + subSpecs.length;

  const coveredReqs     = reqs.filter(r => r.coveredBy?.length > 0).length;
  const reqPct          = reqs.length > 0 ? coveredReqs / reqs.length : null;
  const criticalReqs    = reqs.filter(r => r.businessPriority === "critical" || r.riskLevel === "high");
  const coveredCritical = criticalReqs.filter(r => r.coveredBy?.length > 0).length;
  const criticalPct     = criticalReqs.length > 0 ? coveredCritical / criticalReqs.length : 1.0;
  const highRiskUncov   = reqs.filter(r => !r.coveredBy?.length && (r.riskLevel === "high" || r.businessPriority === "critical")).length;

  const failedTests  = testRes?.failures?.length ?? (testRes?.status === "failed" ? 1 : 0);
  const passRate     = totalTests > 0 ? (totalTests - failedTests) / totalTests : null;
  const failureRate  = totalTests > 0 ? failedTests / totalTests : 0;
  const flakyCount   = heals.filter(h => h.status === "pending" || h.status === "applied").length;
  const appliedHeals = heals.filter(h => h.status === "applied" || h.status === "validated").length;

  let openCritical = 0;
  let openHigh     = 0;
  try {
    const eng  = new InsightEngine();
    const open = eng.list(projectId, { statuses: ["open", "in-progress"] });
    openCritical = open.filter((i: any) => i.severity === "critical").length;
    openHigh     = open.filter((i: any) => i.severity === "high").length;
  } catch {}

  const coverageScore  = clamp((reqPct ?? 0) * 100);
  const riskScore      = clamp((1 - highRiskUncov / Math.max(reqs.length, 1)) * 100);
  const stabilityScore = clamp((passRate ?? 0.5) * 100);
  const dataComp       = reqs.length > 0 && totalTests > 0 ? 1.0 : reqs.length > 0 ? 0.6 : 0.3;
  const healRate       = heals.length > 0 ? appliedHeals / heals.length : 1.0;
  const aiConf         = clamp((dataComp * 0.6 + healRate * 0.4) * 100);

  const overallScore = clamp(
    coverageScore * 0.30 + riskScore * 0.25 + stabilityScore * 0.25 +
    clamp((reqPct ?? 0) * 100) * 0.10 + coverageScore * 0.05 + aiConf * 0.05
  );

  const gates = [
    criticalPct >= 1.0 || criticalReqs.length === 0,
    reqPct === null || reqPct >= 0.70,
    totalTests === 0 || failureRate <= 0.10,
    passRate === null || passRate >= 0.80,
    openCritical === 0,
    highRiskUncov === 0,
  ];
  const criticalFail    = !gates[0] || !gates[4];
  const nonCriticalFail = gates.some(g => !g);

  const status: "ready" | "at-risk" | "not-ready" = criticalFail
    ? "not-ready" : nonCriticalFail ? "at-risk" : "ready";

  return {
    status,
    overallScore,
    coverageScore,
    riskScore,
    stabilityScore,
    aiConfidence: aiConf,
    gatesPassed: gates.filter(Boolean).length,
    gatesTotal: gates.length,
    openCriticalInsights: openCritical,
    openHighInsights: openHigh,
    coverage: {
      requirementsPct: reqPct !== null ? clamp(reqPct * 100) : null,
      totalRequirements: reqs.length,
      coveredRequirements: coveredReqs,
      criticalRequirements: criticalReqs.length,
      coveredCritical,
    },
    stability: {
      passRate: passRate !== null ? clamp(passRate * 100) : null,
      failedTests,
      flakyCount,
      totalTests,
    },
    highRiskUncovered: highRiskUncov,
    appliedHeals,
    environment: env,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Release summary builder ───────────────────────────────────────────────────

function buildReleaseSummary(release: any) {
  const readiness = computeReadiness(release.projectId, release.environment ?? "staging");
  const gatesPassedPct = readiness.gatesTotal > 0
    ? Math.round((readiness.gatesPassed / readiness.gatesTotal) * 100)
    : 0;

  return {
    ...release,
    displayName: release.name ?? release.version ?? release.id,
    statusLabel: STATUS_LABELS[release.status as ReleaseStatus] ?? release.status,
    readiness: {
      status: readiness.status,
      score:  readiness.overallScore,
      color:  scoreColor(readiness.overallScore),
      gatesPassed: readiness.gatesPassed,
      gatesTotal:  readiness.gatesTotal,
      gatesPassedPct,
      openCriticalInsights: readiness.openCriticalInsights,
    },
    linksCount: release.links?.length ?? 0,
  };
}

// ─── Controller ────────────────────────────────────────────────────────────────

@Controller("projects/:projectId/releases")
export class ReleaseManagementController {
  constructor(private readonly prisma: PrismaService) {}

  // ── List ────────────────────────────────────────────────────────────────────

  @Get()
  async list(
    @Param("projectId") projectId: string,
    @Query("status") status?: string,
    @Query("environment") environment?: string,
  ) {
    const where: any = { projectId };
    if (status)      where.status      = status;
    if (environment) where.environment = environment;

    const releases = await this.prisma.release.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { links: true },
    });

    return releases.map(buildReleaseSummary);
  }

  // ── Create ──────────────────────────────────────────────────────────────────

  @Post()
  async create(
    @Param("projectId") projectId: string,
    @Body() dto: CreateReleaseDto,
  ) {
    if (!dto.name && !dto.version) {
      throw new BadRequestException("Either name or version is required");
    }

    const release = await this.prisma.release.create({
      data: {
        projectId,
        name:        dto.name,
        version:     dto.version,
        environment: dto.environment ?? "staging",
        description: dto.description,
        createdBy:   dto.createdBy ?? "user",
        notes:       dto.notes,
        plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
        plannedEnd:   dto.plannedEnd   ? new Date(dto.plannedEnd)   : undefined,
        metadata:    dto.metadata as any,
        status:      "planned",
      },
      include: { links: true },
    });

    return buildReleaseSummary(release);
  }

  // ── Get one ─────────────────────────────────────────────────────────────────

  @Get(":releaseId")
  async getOne(
    @Param("projectId") projectId: string,
    @Param("releaseId") releaseId: string,
  ) {
    const release = await this.prisma.release.findFirst({
      where: { id: releaseId, projectId },
      include: { links: true },
    });
    if (!release) throw new NotFoundException("Release not found");

    const summary = buildReleaseSummary(release);
    const readiness = computeReadiness(projectId, release.environment ?? "staging");

    return { ...summary, readiness };
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  @Patch(":releaseId")
  async update(
    @Param("projectId") projectId: string,
    @Param("releaseId") releaseId: string,
    @Body() dto: UpdateReleaseDto,
  ) {
    const existing = await this.prisma.release.findFirst({ where: { id: releaseId, projectId } });
    if (!existing) throw new NotFoundException("Release not found");

    const data: any = {};
    if (dto.name        !== undefined) data.name        = dto.name;
    if (dto.version     !== undefined) data.version     = dto.version;
    if (dto.environment !== undefined) data.environment = dto.environment;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.notes       !== undefined) data.notes       = dto.notes;
    if (dto.metadata    !== undefined) data.metadata    = dto.metadata;
    if (dto.plannedStart !== undefined) data.plannedStart = dto.plannedStart ? new Date(dto.plannedStart) : null;
    if (dto.plannedEnd   !== undefined) data.plannedEnd   = dto.plannedEnd   ? new Date(dto.plannedEnd)   : null;
    if (dto.actualStart  !== undefined) data.actualStart  = dto.actualStart  ? new Date(dto.actualStart)  : null;
    if (dto.actualEnd    !== undefined) data.actualEnd    = dto.actualEnd    ? new Date(dto.actualEnd)    : null;

    const updated = await this.prisma.release.update({
      where: { id: releaseId },
      data,
      include: { links: true },
    });

    return buildReleaseSummary(updated);
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  @Delete(":releaseId")
  @HttpCode(204)
  async remove(
    @Param("projectId") projectId: string,
    @Param("releaseId") releaseId: string,
  ) {
    const existing = await this.prisma.release.findFirst({ where: { id: releaseId, projectId } });
    if (!existing) throw new NotFoundException("Release not found");

    await this.prisma.releaseLink.deleteMany({ where: { releaseId } });
    await this.prisma.release.delete({ where: { id: releaseId } });
  }

  // ── Status transition ───────────────────────────────────────────────────────

  @Post(":releaseId/status")
  async changeStatus(
    @Param("projectId") projectId: string,
    @Param("releaseId") releaseId: string,
    @Body() body: { status: ReleaseStatus },
  ) {
    const release = await this.prisma.release.findFirst({ where: { id: releaseId, projectId } });
    if (!release) throw new NotFoundException("Release not found");

    const current = release.status as ReleaseStatus;
    const next    = body.status;
    const allowed = VALID_TRANSITIONS[current] ?? [];

    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Cannot transition from '${current}' to '${next}'. Allowed: ${allowed.join(", ")}`
      );
    }

    const data: any = { status: next };
    if (next === "in_progress" && !release.actualStart) data.actualStart = new Date();
    if (next === "shipped")                              data.actualEnd   = new Date();
    if (next === "rolled_back")                          data.actualEnd   = new Date();

    const updated = await this.prisma.release.update({
      where: { id: releaseId },
      data,
      include: { links: true },
    });

    return buildReleaseSummary(updated);
  }

  // ── Add link ─────────────────────────────────────────────────────────────────

  @Post(":releaseId/links")
  async addLink(
    @Param("projectId") projectId: string,
    @Param("releaseId") releaseId: string,
    @Body() dto: AddLinkDto,
  ) {
    const release = await this.prisma.release.findFirst({ where: { id: releaseId, projectId } });
    if (!release) throw new NotFoundException("Release not found");

    const link = await this.prisma.releaseLink.create({
      data: { releaseId, type: dto.type, targetId: dto.targetId },
    });

    return link;
  }

  // ── Remove link ──────────────────────────────────────────────────────────────

  @Delete(":releaseId/links/:linkId")
  @HttpCode(204)
  async removeLink(
    @Param("projectId") projectId: string,
    @Param("releaseId") releaseId: string,
    @Param("linkId") linkId: string,
  ) {
    const release = await this.prisma.release.findFirst({ where: { id: releaseId, projectId } });
    if (!release) throw new NotFoundException("Release not found");

    await this.prisma.releaseLink.delete({ where: { id: linkId } }).catch(() => {});
  }

  // ── Readiness (release-scoped) ────────────────────────────────────────────────

  @Get(":releaseId/readiness")
  async readiness(
    @Param("projectId") projectId: string,
    @Param("releaseId") releaseId: string,
  ) {
    const release = await this.prisma.release.findFirst({ where: { id: releaseId, projectId } });
    if (!release) throw new NotFoundException("Release not found");

    return computeReadiness(projectId, release.environment ?? "staging");
  }

  // ── Assess readiness (force re-compute + update status if gate passes) ───────

  @Post(":releaseId/assess")
  async assess(
    @Param("projectId") projectId: string,
    @Param("releaseId") releaseId: string,
  ) {
    const release = await this.prisma.release.findFirst({ where: { id: releaseId, projectId } });
    if (!release) throw new NotFoundException("Release not found");

    const readiness = computeReadiness(projectId, release.environment ?? "staging");

    // Auto-advance to ready_to_ship if validating and status is ready
    if (release.status === "validating" && readiness.status === "ready") {
      await this.prisma.release.update({
        where: { id: releaseId },
        data:  { status: "ready_to_ship" },
      });
    }

    return {
      releaseId,
      releaseName: (release as any).name ?? (release as any).version,
      readiness,
      autoAdvanced: release.status === "validating" && readiness.status === "ready",
    };
  }

  // ── Metrics (delta before/after release window) ───────────────────────────────

  @Get(":releaseId/metrics")
  async metrics(
    @Param("projectId") projectId: string,
    @Param("releaseId") releaseId: string,
  ) {
    const release = await this.prisma.release.findFirst({ where: { id: releaseId, projectId } });
    if (!release) throw new NotFoundException("Release not found");

    const current = computeReadiness(projectId, release.environment ?? "staging");

    // For a simple delta we look at sibling releases ordered by time
    const siblings = await this.prisma.release.findMany({
      where:   { projectId, id: { not: releaseId } },
      orderBy: { createdAt: "desc" },
      take:    1,
    });

    const previous = siblings.length > 0
      ? computeReadiness(projectId, siblings[0].environment ?? "staging")
      : null;

    return {
      releaseId,
      current: {
        readinessScore:  current.overallScore,
        coverageScore:   current.coverageScore,
        stabilityScore:  current.stabilityScore,
        riskScore:       current.riskScore,
        openCritical:    current.openCriticalInsights,
      },
      previous: previous ? {
        readinessScore:  previous.overallScore,
        coverageScore:   previous.coverageScore,
        stabilityScore:  previous.stabilityScore,
        riskScore:       previous.riskScore,
        openCritical:    previous.openCriticalInsights,
      } : null,
      delta: previous ? {
        readinessScore:  current.overallScore  - previous.overallScore,
        coverageScore:   current.coverageScore  - previous.coverageScore,
        stabilityScore:  current.stabilityScore - previous.stabilityScore,
        riskScore:       current.riskScore      - previous.riskScore,
        openCritical:    current.openCriticalInsights - previous.openCriticalInsights,
      } : null,
      generatedAt: new Date().toISOString(),
    };
  }
}
