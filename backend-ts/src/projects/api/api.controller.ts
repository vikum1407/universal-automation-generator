import { Controller, Get, Post, Param, Body, UploadedFile, UseInterceptors } from "@nestjs/common";
import * as fs from "fs";
import * as path from "path";
import { FileInterceptor } from "@nestjs/platform-express";

const OUTPUT_BASE = "./qlitz-output";

@Controller("projects/:id/api")
export class APIController {
  private base(id: string) { return path.join(OUTPUT_BASE, id); }

  @Post("upload")
  @UseInterceptors(FileInterceptor("file"))
  async uploadSwagger(@UploadedFile() file: any) {
    return { filePath: file.path };
  }

  @Get("endpoints")
  async getEndpoints(@Param("id") id: string) {
    const file = path.join(this.base(id), "endpoints.json");
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  @Get("rtm")
  async getRTM(@Param("id") id: string) {
    const file = path.join(this.base(id), "rtm.json");
    if (!fs.existsSync(file)) return { generatedAt: "", requirements: [] };
    return JSON.parse(fs.readFileSync(file, "utf8"));
  }

  /**
   * API Replay — returns each endpoint as an inspectable "step" (request inspector).
   * If test-results.json exists, actual pass/fail is merged in per endpoint.
   */
  @Get("replay")
  async getAPIReplay(@Param("id") id: string) {
    const base = this.base(id);
    const endpointsFile = path.join(base, "endpoints.json");
    if (!fs.existsSync(endpointsFile)) return [];

    const endpoints: any[] = JSON.parse(fs.readFileSync(endpointsFile, "utf8"));

    // Try to merge last run results
    const resultsFile = path.join(base, "test-results.json");
    const lastRun = fs.existsSync(resultsFile)
      ? JSON.parse(fs.readFileSync(resultsFile, "utf8"))
      : null;

    return endpoints.map((ep: any, i: number) => ({
      type: "request",
      index: i + 1,
      method: ep.method,
      url: ep.path,
      summary: ep.summary || `${ep.method} ${ep.path}`,
      parameters: ep.parameters || [],
      requestBody: ep.requestBody ?? null,
      responses: ep.responses ?? {},
      tags: ep.tags || [],
      expectedStatus: 200,
      lastStatus: lastRun?.status ?? "not-run",
      timestamp: i * 50
    }));
  }
}
