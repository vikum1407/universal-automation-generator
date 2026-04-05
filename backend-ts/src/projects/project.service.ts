import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ProjectOrchestratorService } from "./project-orchestrator.service";
import { CloudService } from "../cloud/cloud.service";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ProjectService {
  constructor(
    private readonly orchestrator: ProjectOrchestratorService,
    private readonly cloud: CloudService,
    private readonly prisma: PrismaService
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

  async delete(id: string) {
    await this.prisma.project.delete({ where: { id } });
    return { deleted: true };
  }

  async getCIStatus(projectId: string) {
    return {
      status: "passed",
      timestamp: new Date().toISOString()
    };
  }

  async getAnalytics(projectId: string) {
    return {
      tests: 120,
      passed: 110,
      failed: 10,
      coverage: 78,
      requirements: 34,
      aiSuggestions: 12,
      autoHealed: 5,
      lastRun: new Date().toISOString()
    };
  }

  async runReCrawl(projectId: string) {
    return {
      updated: true,
      selectorMap: {}
    };
  }

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
