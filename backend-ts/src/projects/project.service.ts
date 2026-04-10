import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ProjectOrchestratorService } from "./project-orchestrator.service";
import { CloudService } from "../cloud/cloud.service";
import { PrismaService } from "../../prisma/prisma.service";
import { ProjectGateway } from './project.gateway';
import * as fs from "fs";

@Injectable()
export class ProjectService {
  constructor(
    private readonly orchestrator: ProjectOrchestratorService,
    private readonly cloud: CloudService,
    private readonly prisma: PrismaService,
    private readonly gateway: ProjectGateway
  ) {}

  async createUIProject(data: any) {
    const id = randomUUID();

    const project = await this.prisma.project.create({
      data: {
        id,
        type: "ui",
        url: data.url,
        username: data.username,
        password: data.password,
        crawlDepth: data.crawlDepth,
        env: data.env,
        status: "initializing"
      }
    });

    this.orchestrator.runUIInitialization(project).catch(() => {});
    return project;
  }

  async createAPIProject(data: any) {
    const id = randomUUID();

    const project = await this.prisma.project.create({
      data: {
        id,
        type: "api",
        swaggerUrl: data.swaggerUrl,
        swaggerFilePath: data.swaggerFilePath,
        authToken: data.authToken,
        env: data.env,
        status: "initializing"
      }
    });

    this.orchestrator.runAPIInitialization(project).catch(() => {});
    return project;
  }

  async getFullProject(id: string) {
    return this.prisma.project.findUnique({
      where: { id }
    });
  }

  async listProjects() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    });
  }

  // ------------------------------------------------------
  // SAFE PROJECT DELETE (NO FK ERRORS)
  // ------------------------------------------------------
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

  // ------------------------------------------------------
  // ANALYTICS
  // ------------------------------------------------------
  async getCIStatus(projectId: string) {
    const uiBase = `./generated-ui-project/${projectId}`;
    const apiBase = `./generated-api-project/${projectId}`;
    const base = fs.existsSync(uiBase) ? uiBase : apiBase;

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
    const uiBase = `./generated-ui-project/${projectId}`;
    const apiBase = `./generated-api-project/${projectId}`;
    const base = fs.existsSync(uiBase) ? uiBase : apiBase;

    const analytics: any = {
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

    const testFiles = fs.readdirSync(base).filter(f => f.endsWith(".spec.ts"));
    analytics.tests = testFiles.length;

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

  // ------------------------------------------------------
  // RE-CRAWL (WITH LOGS + EVENTS + SAFE DB RESET)
  // ------------------------------------------------------
  async runReCrawl(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) return { error: "Project not found" };

    const base =
      project.type === "ui"
        ? `./generated-ui-project/${projectId}`
        : `./generated-api-project/${projectId}`;

    this.gateway.emitRecrawlEvent(projectId, 'recrawl-started', { type: project.type });
    this.gateway.emitStatus(projectId, 'initializing');

    this.appendRecrawlLog(projectId, {
      stage: 'start',
      message: 'Recrawl requested',
    });

    if (fs.existsSync(base)) {
      fs.rmSync(base, { recursive: true, force: true });
      this.appendRecrawlLog(projectId, {
        stage: 'cleanup',
        message: 'Old generated folder removed',
      });
    }

    fs.mkdirSync(base, { recursive: true });

    await this.prisma.transition.deleteMany({ where: { projectId } });
    await this.prisma.page.deleteMany({ where: { projectId } });

    this.appendRecrawlLog(projectId, {
      stage: 'db-reset',
      message: 'Pages and transitions cleared',
    });

    await this.prisma.project.update({
      where: { id: projectId },
      data: { status: "initializing" }
    });

    if (project.type === "ui") {
      this.orchestrator.runUIInitialization(project)
        .then(() => {
          this.gateway.emitRecrawlEvent(projectId, 'recrawl-completed', { type: 'ui' });
          this.gateway.emitStatus(projectId, 'ready');
          this.appendRecrawlLog(projectId, {
            stage: 'complete',
            message: 'UI recrawl completed',
          });
        })
        .catch(err => {
          this.gateway.emitRecrawlEvent(projectId, 'recrawl-failed', { error: err?.message });
          this.gateway.emitStatus(projectId, 'failed');
          this.appendRecrawlLog(projectId, {
            stage: 'error',
            message: `UI recrawl failed: ${err?.message || 'unknown error'}`,
          });
        });
    } else {
      this.orchestrator.runAPIInitialization(project)
        .then(() => {
          this.gateway.emitRecrawlEvent(projectId, 'recrawl-completed', { type: 'api' });
          this.gateway.emitStatus(projectId, 'ready');
          this.appendRecrawlLog(projectId, {
            stage: 'complete',
            message: 'API recrawl completed',
          });
        })
        .catch(err => {
          this.gateway.emitRecrawlEvent(projectId, 'recrawl-failed', { error: err?.message });
          this.gateway.emitStatus(projectId, 'failed');
          this.appendRecrawlLog(projectId, {
            stage: 'error',
            message: `API recrawl failed: ${err?.message || 'unknown error'}`,
          });
        });
    }

    return {
      recrawl: "started",
      projectId,
      type: project.type
    };
  }

  private appendRecrawlLog(projectId: string, entry: { stage: string; message: string }) {
    const uiBase = `./generated-ui-project/${projectId}`;
    const apiBase = `./generated-api-project/${projectId}`;
    const dir = fs.existsSync(uiBase) ? uiBase : apiBase;

    fs.mkdirSync(dir, { recursive: true });

    const logFile = `${dir}/recrawl-log.json`;
    let log: any[] = [];

    if (fs.existsSync(logFile)) {
      try {
        log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        if (!Array.isArray(log)) log = [];
      } catch {
        log = [];
      }
    }

    log.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });

    fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
  }

  // ------------------------------------------------------
  // FLOW GRAPH
  // ------------------------------------------------------
  async getEndpoints(projectId: string) {
    return this.prisma.endpoint.findMany({
      where: { projectId },
      orderBy: { path: "asc" }
    });
  }

  async getFlowGraph(projectId: string) {
    const pages = await this.prisma.page.findMany({
      where: { projectId }
    });

    const transitions = await this.prisma.transition.findMany({
      where: { projectId }
    });

    return {
      pages: pages.map(p => ({
        url: p.url
      })),
      edges: transitions.map(t => ({
        from: pages.find(p => p.id === t.fromId)?.url || "",
        to: pages.find(p => p.id === t.toId)?.url || "",
        action: t.action
      }))
    };
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
