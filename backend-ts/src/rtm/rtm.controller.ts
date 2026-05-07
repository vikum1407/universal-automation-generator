import {
  Controller, Get, Post, Patch, Delete, Param, Body, Res,
  HttpException, HttpStatus
} from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import type { Response } from "express";
import { RTMDomainService } from "./rtm-domain.service";
import type { ImportRtmDto }        from "./dto/import-rtm.dto";
import type { CreateRequirementDto } from "./dto/create-rtm.dto";
import type { UpdateRequirementDto } from "./dto/update-requirement.dto";

const OUTPUT_BASE = "./qlitz-output";

@Controller("projects/:projectId/rtm")
export class RTMController {
  constructor(private readonly domain: RTMDomainService) {}

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  private base(id: string) {
    return path.join(OUTPUT_BASE, id);
  }

  private loadRaw(projectId: string): any {
    const file = path.join(this.base(projectId), "rtm.json");
    if (!fs.existsSync(file)) {
      throw new HttpException("RTM not found — generate a project first", HttpStatus.NOT_FOUND);
    }
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      throw new HttpException("RTM file is corrupt", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private saveRaw(projectId: string, data: any) {
    const file = path.join(this.base(projectId), "rtm.json");
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  }

  private buildSpecIndex(projectId: string): Set<string> {
    const base = this.base(projectId);
    const idx = new Set<string>();
    const testsDir = path.join(base, "tests");
    if (fs.existsSync(testsDir))
      fs.readdirSync(testsDir).filter(f => f.endsWith(".spec.ts")).forEach(f => idx.add(f));
    if (fs.existsSync(base))
      fs.readdirSync(base).filter(f => f.endsWith(".spec.ts")).forEach(f => idx.add(f));
    return idx;
  }

  private specNameFor(source: any): string {
    if (source?.method && source?.endpointPath) {
      return `${source.method}_${source.endpointPath}`
        .replace(/[{}\/]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") + ".spec.ts";
    }
    return "";
  }

  private isCovered(r: any, idx: Set<string>): boolean {
    if (Array.isArray(r.coveredBy) && r.coveredBy.length > 0) return true;
    const spec = this.specNameFor(r.source ?? {});
    return spec ? idx.has(spec) : false;
  }

  private normalizeReq(r: any, covered: boolean, idx: Set<string>): any {
    const specFile = this.specNameFor(r.source ?? {});
    return {
      id: r.id ?? `REQ-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      title: r.title ?? r.description ?? "Untitled",
      description: r.description ?? "",
      type: r.type ?? "api",
      source: {
        pageName: r.source?.pageName ?? null,
        endpointPath: r.source?.endpointPath ?? null,
        method: r.source?.method ?? null,
        flowId: r.source?.flowId ?? null,
        swaggerRef: r.source?.swaggerRef ?? null,
        domSelector: r.source?.domSelector ?? null,
      },
      businessPriority: r.businessPriority ?? "medium",
      riskLevel: r.riskLevel ?? "medium",
      tags: r.tags ?? [],
      coveredBy: r.coveredBy ?? [],
      covered,
      specFile: covered ? (r.coveredBy?.[0] ?? (specFile || null)) : null,
      aiLogic: {
        generatedBy: r.aiLogic?.generatedBy ?? "claude",
        lastImprovedAt: r.aiLogic?.lastImprovedAt ?? r.generatedAt ?? null,
        confidenceScore: typeof r.aiLogic?.confidenceScore === "number"
          ? r.aiLogic.confidenceScore : 0.72,
        reasoning: r.aiLogic?.reasoning ?? "",
        steps: r.aiLogic?.steps ?? [],
        assertions: r.aiLogic?.assertions ?? [],
        negativeTests: r.aiLogic?.negativeTests ?? [],
      },
      history: Array.isArray(r.history) ? r.history : [],
    };
  }

  private findDuplicates(reqs: any[]): any[] {
    const result: any[] = [];
    for (let i = 0; i < reqs.length; i++) {
      for (let j = i + 1; j < reqs.length; j++) {
        const a = reqs[i].title?.toLowerCase() ?? "";
        const b = reqs[j].title?.toLowerCase() ?? "";
        const wa = new Set(a.split(/\s+/).filter((w: string) => w.length > 3));
        const wb = new Set(b.split(/\s+/).filter((w: string) => w.length > 3));
        const overlap = [...wa].filter(w => wb.has(w)).length;
        const sim = overlap / Math.max(wa.size, wb.size, 1);
        if (sim > 0.65 && wa.size >= 3) {
          result.push({
            ids: [reqs[i].id, reqs[j].id],
            titles: [reqs[i].title, reqs[j].title],
            similarity: Math.round(sim * 100),
          });
          if (result.length >= 8) return result;
        }
      }
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────────
  // GET /projects/:id/rtm  —  Enterprise enriched RTM
  // ─────────────────────────────────────────────────────────────
  @Get()
  getEnterpriseRTM(@Param("projectId") projectId: string) {
    const raw = this.loadRaw(projectId);
    const specIdx = this.buildSpecIndex(projectId);
    const rawReqs: any[] = raw.requirements ?? [];

    // Enrich requirements
    const requirements = rawReqs.map(r => {
      const covered = this.isCovered(r, specIdx);
      return this.normalizeReq(r, covered, specIdx);
    });

    const total = requirements.length;
    const coveredCount = requirements.filter(r => r.covered).length;
    const coveragePercent = total > 0 ? Math.round((coveredCount / total) * 1000) / 10 : 0;

    // Risk score 0-100: proportion of high/critical that are uncovered (higher = riskier)
    const highCritUncovered = requirements.filter(
      r => !r.covered && (r.riskLevel === "high" || r.riskLevel === "critical")
    );
    const riskScore = total > 0
      ? Math.round(((total - coveredCount) / total) * 100 *
          (1 + (highCritUncovered.length / Math.max(total, 1))))
      : 0;

    // Stability score: based on coverage + ratio of high-confidence reqs
    const highConfReqs = requirements.filter(r => (r.aiLogic?.confidenceScore ?? 0) >= 0.75);
    const stabilityScore = Math.min(100, Math.round(
      coveragePercent * 0.6 + (highConfReqs.length / Math.max(total, 1)) * 40
    ));

    // AI confidence: average of all confidenceScores * 100
    const aiConfidenceScore = total > 0
      ? Math.round(requirements.reduce((s, r) => s + (r.aiLogic?.confidenceScore ?? 0.72), 0) / total * 100)
      : 0;

    // Breakdowns
    const groupBy = (key: string) => {
      const m: Record<string, { total: number; covered: number }> = {};
      for (const r of requirements) {
        const k = r[key] ?? "unknown";
        if (!m[k]) m[k] = { total: 0, covered: 0 };
        m[k].total++;
        if (r.covered) m[k].covered++;
      }
      return Object.entries(m).map(([label, c]) => ({
        [key]: label, total: c.total, covered: c.covered,
        uncovered: c.total - c.covered,
        pct: c.total > 0 ? Math.round((c.covered / c.total) * 1000) / 10 : 0,
      }));
    };

    const byType = groupBy("type");
    const byPriority = groupBy("businessPriority");
    const byRisk = groupBy("riskLevel");

    // Trending counts
    const trending = {
      new: requirements.filter(r => r.history.length === 0).length,
      updated: requirements.filter(r => r.history.length > 0).length,
      risky: highCritUncovered.length,
    };

    // Insights
    const highRiskUncovered = requirements.filter(
      r => !r.covered && (r.riskLevel === "high" || r.riskLevel === "critical")
    );
    const needsRewrite = requirements.filter(
      r => !r.description || r.description.length < 15 || r.description === r.title
    );
    const duplicateSuspects = this.findDuplicates(requirements);

    return {
      generatedAt: raw.generatedAt ?? new Date().toISOString(),
      requirements,
      analytics: {
        totalRequirements: total,
        coveredRequirements: coveredCount,
        coveragePercent,
        riskScore: Math.min(riskScore, 100),
        stabilityScore,
        aiConfidenceScore,
        specFilesFound: specIdx.size,
        byType,
        byPriority,
        byRisk,
        trending,
      },
      insights: {
        highRiskUncovered,
        duplicateSuspects,
        needsRewrite,
        withFailingTests: [],
        withFlakyTests: [],
      },
    };
  }

  // ─────────────────────────────────────────────────────────────
  // POST /projects/:id/rtm/regenerate
  // ─────────────────────────────────────────────────────────────
  @Post("regenerate")
  regenerate(
    @Param("projectId") projectId: string,
    @Body() body: { selectedRequirementIds?: string[] },
  ) {
    const raw = this.loadRaw(projectId);
    const ids = new Set(body.selectedRequirementIds ?? []);

    raw.requirements = (raw.requirements ?? []).map((r: any) => {
      if (!ids.size || ids.has(r.id)) {
        return {
          ...r,
          history: [
            ...(r.history ?? []),
            { timestamp: new Date().toISOString(), change: "regenerate_requested", actor: "user" },
          ],
        };
      }
      return r;
    });

    this.saveRaw(projectId, raw);
    return { ok: true, count: ids.size || raw.requirements.length };
  }

  // ─────────────────────────────────────────────────────────────
  // PATCH /projects/:id/rtm/:reqId  —  Update a requirement
  // ─────────────────────────────────────────────────────────────
  @Patch(":reqId")
  patchRequirement(
    @Param("projectId") projectId: string,
    @Param("reqId") reqId: string,
    @Body() body: Record<string, any>,
  ) {
    const raw = this.loadRaw(projectId);
    let found = false;

    raw.requirements = (raw.requirements ?? []).map((r: any) => {
      if (r.id === reqId) {
        found = true;
        const { id: _id, history: _h, ...allowedUpdates } = body;
        return {
          ...r,
          ...allowedUpdates,
          id: r.id,
          history: [
            ...(r.history ?? []),
            { timestamp: new Date().toISOString(), change: "manual_update", actor: "user" },
          ],
        };
      }
      return r;
    });

    if (!found) throw new HttpException("Requirement not found", HttpStatus.NOT_FOUND);
    this.saveRaw(projectId, raw);
    return { ok: true };
  }

  // ─────────────────────────────────────────────────────────────
  // GET /projects/:id/rtm/export  —  Download full RTM as JSON
  // ─────────────────────────────────────────────────────────────
  @Get("export")
  exportJSON(
    @Param("projectId") projectId: string,
    @Res() res: Response,
  ) {
    const data = this.getEnterpriseRTM(projectId);
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="rtm-${projectId.slice(0, 8)}.json"`,
    );
    res.send(JSON.stringify(data, null, 2));
  }

  // ═══════════════════════════════════════════════════════════════
  // DOMAIN MODEL ENDPOINTS  (database-backed, versioned)
  // ═══════════════════════════════════════════════════════════════

  // POST /projects/:id/rtm/initialize
  @Post("initialize")
  async initializeRTM(
    @Param("projectId") projectId: string,
    @Body() body: { label?: string; createdBy?: string },
  ) {
    return this.domain.initialize(projectId, body?.label, body?.createdBy);
  }

  // GET /projects/:id/rtm/snapshot  —  current domain-model snapshot
  @Get("snapshot")
  async getSnapshot(@Param("projectId") projectId: string) {
    const snapshot = await this.domain.getSnapshot(projectId);
    if (!snapshot) throw new HttpException("RTM not initialised — POST /initialize first", HttpStatus.NOT_FOUND);
    return snapshot;
  }

  // POST /projects/:id/rtm/import
  @Post("import")
  async importRTM(
    @Param("projectId") projectId: string,
    @Body() body: Omit<ImportRtmDto, "projectId">,
  ) {
    return this.domain.import({ projectId, ...body });
  }

  // GET /projects/:id/rtm/versions
  @Get("versions")
  async listVersions(@Param("projectId") projectId: string) {
    return this.domain.listVersions(projectId);
  }

  // GET /projects/:id/rtm/versions/:versionId
  @Get("versions/:versionId")
  async getVersion(
    @Param("projectId") projectId: string,
    @Param("versionId") versionId: string,
  ) {
    return this.domain.getVersionSnapshot(projectId, versionId);
  }

  // PATCH /projects/:id/rtm/versions/:versionId/activate
  @Patch("versions/:versionId/activate")
  async activateVersion(
    @Param("projectId") projectId: string,
    @Param("versionId") versionId: string,
  ) {
    await this.domain.activateVersion(projectId, versionId);
    return { ok: true };
  }

  // POST /projects/:id/rtm/requirements
  @Post("requirements")
  async createRequirement(
    @Param("projectId") projectId: string,
    @Body() dto: CreateRequirementDto,
  ) {
    return this.domain.createRequirement(projectId, dto);
  }

  // PATCH /projects/:id/rtm/requirements/:reqId
  @Patch("requirements/:reqId")
  async updateRequirement(
    @Param("projectId") projectId: string,
    @Param("reqId") reqId: string,
    @Body() dto: UpdateRequirementDto,
  ) {
    return this.domain.updateRequirement(projectId, reqId, dto);
  }

  // DELETE /projects/:id/rtm/requirements/:reqId
  @Delete("requirements/:reqId")
  async deleteRequirement(
    @Param("projectId") projectId: string,
    @Param("reqId") reqId: string,
  ) {
    await this.domain.deleteRequirement(projectId, reqId);
    return { ok: true };
  }
}
