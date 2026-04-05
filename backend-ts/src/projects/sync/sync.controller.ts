import { Controller, Post, Get, Param } from "@nestjs/common";
import * as fs from "fs";
import { CloudService } from "../../cloud/cloud.service";

@Controller("projects/:id/sync")
export class SyncController {
  constructor(private readonly cloud: CloudService) {}

  // Upload project to cloud
  @Post("upload")
  async upload(@Param("id") id: string) {
    const isUI = fs.existsSync(`./generated-ui-project/${id}`);
    const base = isUI
      ? `./generated-ui-project/${id}`
      : `./generated-api-project/${id}`;

    await this.cloud.uploadDir(
      process.env.S3_BUCKET!,
      `projects/${id}`,
      base
    );

    return { ok: true };
  }

  // Download project from cloud
  @Post("download")
  async download(@Param("id") id: string) {
    const isUI = fs.existsSync(`./generated-ui-project/${id}`);
    const base = isUI
      ? `./generated-ui-project/${id}`
      : `./generated-api-project/${id}`;

    await this.cloud.downloadDir(
      process.env.S3_BUCKET!,
      `projects/${id}`,
      base
    );

    return { ok: true };
  }

  // CI status
  @Get("ci-status")
  async getCIStatus(@Param("id") id: string) {
    const isUI = fs.existsSync(`./generated-ui-project/${id}`);
    const base = isUI
      ? `./generated-ui-project/${id}`
      : `./generated-api-project/${id}`;

    const report = `${base}/qlitz-report.json`;
    if (!fs.existsSync(report)) return { status: "not-run" };

    const json = JSON.parse(fs.readFileSync(report, "utf8"));
    const failed = json.suites?.some((s: any) => s.status === "failed");

    return {
      status: failed ? "failed" : "passed",
      timestamp: new Date().toISOString()
    };
  }
}
