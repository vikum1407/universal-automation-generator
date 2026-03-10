import * as path from 'path';
import { UIPipelineOrchestrator } from '../ui-scan/ui-pipeline-orchestrator';
import { APIPipelineOrchestrator } from '../api-scan/api-pipeline-orchestrator';
import { RTMWriter } from '../rtm/rtm-writer';
import { DashboardGenerator } from '../dashboard/dashboard-generator';

export class HybridOrchestrator {
  private ui = new UIPipelineOrchestrator();
  private api = new APIPipelineOrchestrator();
  private rtmWriter = new RTMWriter();
  private dashboard = new DashboardGenerator();

  async run(url: string, outputDir: string) {
    const uiResult = await this.ui.run(url, outputDir);
    const apiResult = await this.api.run(url, outputDir);

    const merged = [
      ...(uiResult.requirements || []),
      ...(apiResult.requirements || [])
    ];

    this.rtmWriter.write(merged, outputDir);
    this.dashboard.generate(
      { generatedAt: new Date().toISOString(), requirements: merged },
      outputDir
    );

    return {
      ui: uiResult,
      api: apiResult,
      total: merged.length
    };
  }
}
