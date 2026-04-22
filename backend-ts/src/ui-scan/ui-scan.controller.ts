import { Controller, Post, Body } from "@nestjs/common";
import * as path from "path";
import * as fs from "fs";
import { v4 as uuid } from "uuid";

import { UIPipelineOrchestrator } from "./ui-pipeline-orchestrator";

@Controller("scan-ui")
export class UIScanController {
  @Post()
  async scan(@Body() body: { url: string }) {
    const projectId = uuid();

    // Write to the folder your dashboard expects
    const outputDir = path.join("qlitz-output", projectId);
    fs.mkdirSync(outputDir, { recursive: true });

    // Run full UI pipeline
    const orchestrator = new UIPipelineOrchestrator();
    const result = await orchestrator.run(body.url, outputDir);

    return {
      projectId,
      outputDir,
      rtm: path.join(outputDir, "rtm.json"),
      flowGraph: path.join(outputDir, "flow-graph.json"),
      uiTestsDir: path.join(outputDir, "ui-tests"),
      pagesDir: path.join(outputDir, "pages"),
      stats: result.stats,
      timings: result.timings,
      requirementCount: result.requirements.length
    };
  }
}
