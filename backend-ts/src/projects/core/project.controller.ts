import { Controller, Post, Get, Body, Param, Delete } from "@nestjs/common";
import { ProjectService } from "../project.service";

@Controller("projects")
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

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

  @Get()
  async findAll() {
    return this.projectService.listProjects();
  }

  @Get(":id")
  async getProject(@Param("id") id: string) {
    return this.projectService.getFullProject(id);
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
