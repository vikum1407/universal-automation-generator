import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { CloudService } from "../cloud/cloud.service";
import { PrismaService } from "../../prisma/prisma.service";
import * as fs from "fs";
import * as path from "path";
import { ReCrawlService } from "../services/ReCrawlService";

@Injectable()
export class ProjectService {
  constructor(
    private readonly cloud: CloudService,
    private readonly prisma: PrismaService,
    private readonly recrawlService: ReCrawlService
  ) {}

  async createUIProject(data: any) {
    const id = randomUUID();

    return this.prisma.project.create({
      data: {
        id,
        type: "ui",
        url: data.url,
        username: data.username,
        password: data.password,
        crawlDepth: data.crawlDepth,
        env: data.env,
        status: "processing"
      }
    });
  }

  async createAPIProject(data: any) {
    const id = randomUUID();

    return this.prisma.project.create({
      data: {
        id,
        type: "api",
        swaggerUrl: data.swaggerUrl,
        swaggerFilePath: data.swaggerFilePath,
        authToken: data.authToken,
        env: data.env,
        status: "processing"
      }
    });
  }

  async getFullProject(id: string) {
    const p = await this.prisma.project.findUnique({ where: { id } });
    return p ? this.withName(p) : null;
  }

  async listProjects() {
    const projects = await this.prisma.project.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 50
    });
    return projects.map(p => this.withName(p));
  }

  private withName(p: any) {
    if (p.name) return p;
    const url = p.type === "api" ? p.swaggerUrl : p.url;
    let name = "Untitled Project";
    try {
      if (url) name = new URL(url).hostname;
    } catch {}
    return { ...p, name };
  }

  async updateProject(id: string, data: { name?: string; pinned?: boolean }) {
    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.pinned !== undefined ? { pinned: data.pinned } : {}),
      },
    });
    return this.withName(updated);
  }

  async delete(id: string) {
    await this.prisma.transition.deleteMany({ where: { projectId: id } });
    await this.prisma.page.deleteMany({ where: { projectId: id } });
    await this.prisma.endpoint.deleteMany({ where: { projectId: id } });
    await this.prisma.requirement.deleteMany({ where: { projectId: id } });
    await this.prisma.suggestion.deleteMany({ where: { projectId: id } });
    await this.prisma.release.deleteMany({ where: { projectId: id } });
    await this.prisma.history.deleteMany({ where: { projectId: id } });
    await this.prisma.analytics.deleteMany({ where: { projectId: id } });
    await this.prisma.stability.deleteMany({ where: { projectId: id } });
    await this.prisma.cloudSync.deleteMany({ where: { projectId: id } });

    await this.prisma.project.delete({ where: { id } });

    return { deleted: true };
  }

  async getCIStatus(projectId: string) {
    const base = `./qlitz-output/${projectId}`;
    const ciFile = `${base}/qlitz-report.json`;

    if (!fs.existsSync(ciFile)) {
      return {
        status: "not-run",
        timestamp: null
      };
    }

    const ci = JSON.parse(fs.readFileSync(ciFile, "utf8"));
    const failed = ci.suites?.some((s: any) => s.status === "failed");

    return {
      status: failed ? "failed" : "passed",
      timestamp: ci.timestamp || null
    };
  }

  async getAnalytics(projectId: string) {
    const base = `./qlitz-output/${projectId}`;

    const analytics: any = {
      endpoints: undefined,
      tests: 0,
      passed: 0,
      failed: 0,
      coverage: 0,
      requirements: 0,
      aiSuggestions: 0,
      autoHealed: 0,
      lastRun: null,
      ciStatus: "not-run"
    };

    if (!fs.existsSync(base)) return analytics;

    // Count spec files at root level (UI tests) and tests/ subdirectory (API tests)
    const rootTests = fs.readdirSync(base).filter(f => f.endsWith(".spec.ts"));
    const testsDir = path.join(base, "tests");
    const subTests = fs.existsSync(testsDir)
      ? fs.readdirSync(testsDir).filter(f => f.endsWith(".spec.ts"))
      : [];
    analytics.tests = rootTests.length + subTests.length;

    // Endpoint count (API projects only)
    const endpointsFile = path.join(base, "endpoints.json");
    if (fs.existsSync(endpointsFile)) {
      const eps = JSON.parse(fs.readFileSync(endpointsFile, "utf8"));
      analytics.endpoints = Array.isArray(eps) ? eps.length : 0;
    }

    const resultsFile = `${base}/test-results.json`;
    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, "utf8"));
      analytics.lastRun = results.timestamp || null;

      if (results.status === "passed") {
        analytics.passed = analytics.tests;
      } else {
        analytics.failed = results.failures?.length || 1;
        analytics.passed = Math.max(analytics.tests - analytics.failed, 0);
      }
    }

    const rtmFile = `${base}/rtm.json`;
    if (fs.existsSync(rtmFile)) {
      const rtm = JSON.parse(fs.readFileSync(rtmFile, "utf8"));
      analytics.requirements = rtm.requirements?.length || 0;

      if (analytics.requirements > 0) {
        const covered = rtm.requirements.filter(
          (r: any) => r.coveredBy && r.coveredBy.length > 0
        );
        analytics.coverage = Math.round((covered.length / analytics.requirements) * 100);
      }
    }

    const aiFile = `${base}/ai-suggestions.json`;
    if (fs.existsSync(aiFile)) {
      const ai = JSON.parse(fs.readFileSync(aiFile, "utf8"));
      analytics.aiSuggestions = Array.isArray(ai) ? ai.length : 0;
    }

    const healFile = `${base}/autoheal-log.json`;
    if (fs.existsSync(healFile)) {
      const heal = JSON.parse(fs.readFileSync(healFile, "utf8"));
      analytics.autoHealed = Array.isArray(heal) ? heal.length : 0;
    }

    const ciFile = `${base}/qlitz-report.json`;
    if (fs.existsSync(ciFile)) {
      const ci = JSON.parse(fs.readFileSync(ciFile, "utf8"));
      const failed = ci.suites?.some((s: any) => s.status === "failed");
      analytics.ciStatus = failed ? "failed" : "passed";
    }

    return analytics;
  }

  async runReCrawl(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) return { error: "Project not found" };

    this.recrawlService.recrawl(projectId).catch(() => {});

    return {
      recrawl: "started",
      projectId,
      type: project.type
    };
  }

  async getEndpoints(projectId: string) {
    const base = `./qlitz-output/${projectId}`;
    const file = `${base}/endpoints.json`;

    if (!fs.existsSync(file)) return [];

    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  async markProjectReady(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { status: "ready" }
    });
  }

  async markProjectFailed(id: string) {
    return this.prisma.project.update({
      where: { id },
      data: { status: "failed" }
    });
  }

  async getFlowGraph(projectId: string) {
    const file = `./qlitz-output/${projectId}/flow-graph.json`;

    if (!fs.existsSync(file)) {
      return { pages: [], edges: [] };
    }

    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  async recordFlowStep(
    projectId: string,
    fromUrl: string,
    toUrl: string,
    action: string,
    selector?: string
  ) {
    const fromPage = await this.prisma.page.upsert({
      where: { projectId_url: { projectId, url: fromUrl } },
      update: {},
      create: { projectId, url: fromUrl }
    });

    const toPage = await this.prisma.page.upsert({
      where: { projectId_url: { projectId, url: toUrl } },
      update: {},
      create: { projectId, url: toUrl }
    });

    await this.prisma.transition.create({
      data: {
        projectId,
        fromId: fromPage.id,
        toId: toPage.id,
        action,
        selector
      }
    });

    return { ok: true };
  }
}
