import { Controller, Post, Get, Patch, Body, Param, Delete } from "@nestjs/common";
import { ProjectService } from "../project.service";
import * as path from "path";
import * as fs from "fs";
import { UIPipelineOrchestrator } from "../../ui-scan/ui-pipeline-orchestrator";
import { ProgressGateway } from "../../gateways/progress.gateway";
import { progressService } from "../../services/ProgressService";

@Controller("projects")
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly gateway: ProgressGateway
  ) {}

  @Post()
  async createProject(@Body() body: any) {
    if (body.type === "ui") {
      return this.projectService.createUIProject(body);
    }
    if (body.type === "api") {
      return this.projectService.createAPIProject(body);
    }
    return { error: "Invalid project type" };
  }

  @Post("scan-ui")
  async scanUI(@Body() body: any) {
    // 1. Create DB project
    const project = await this.projectService.createUIProject(body);

    // 2. Prepare output directory
    const outputDir = path.join("qlitz-output", project.id);
    fs.mkdirSync(outputDir, { recursive: true });

    // 3. Init progress BEFORE starting pipeline so events are never lost
    progressService.init(project.id, "processing");

    // 4. Run pipeline with progress support
    const orchestrator = new UIPipelineOrchestrator(project.id, this.gateway);

    orchestrator
      .run(project.url, outputDir)
      .then(async () => {
        await this.projectService.markProjectReady(project.id);
      })
      .catch(async (err) => {
        console.error(`Pipeline failed for project ${project.id}:`, err);
        progressService.fail(project.id, "Pipeline failed");
        await this.projectService.markProjectFailed(project.id);
      });

    // 5. Return projectId immediately (pipeline runs async)
    return { projectId: project.id };
  }

  @Get()
  async findAll() {
    return this.projectService.listProjects();
  }

  @Get(":id")
  async getProject(@Param("id") id: string) {
    return this.projectService.getFullProject(id);
  }

  @Patch(":id")
  async updateProject(@Param("id") id: string, @Body() body: { name?: string; pinned?: boolean }) {
    return this.projectService.updateProject(id, body);
  }

  @Delete(":id")
  async deleteProject(@Param("id") id: string) {
    return this.projectService.delete(id);
  }

  @Get(":id/ci-status")
  getCIStatus(@Param("id") id: string) {
    return this.projectService.getCIStatus(id);
  }

  @Get(":id/analytics")
  getAnalytics(@Param("id") id: string) {
    return this.projectService.getAnalytics(id);
  }

  @Post(":id/recrawl")
  recrawl(@Param("id") id: string) {
    return this.projectService.runReCrawl(id);
  }

  @Get(":id/flows")
  getFlows(@Param("id") id: string) {
    return this.projectService.getFlowGraph(id);
  }

  @Get(":id/endpoints")
  getEndpoints(@Param("id") id: string) {
    return this.projectService.getEndpoints(id);
  }
}