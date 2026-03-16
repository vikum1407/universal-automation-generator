import { Injectable } from '@nestjs/common';

import { UIPipelineOrchestrator } from '../ui-scan/ui-pipeline-orchestrator';
import { APIPipelineOrchestrator } from '../api-scan/api-pipeline-orchestrator';
import { HybridPipelineOrchestrator } from '../hybrid/hybrid-pipeline-orchestrator';

@Injectable()
export class OrchestratorService {
  constructor(
    private readonly uiPipeline: UIPipelineOrchestrator,
    private readonly apiPipeline: APIPipelineOrchestrator,
    private readonly hybridPipeline: HybridPipelineOrchestrator,
  ) {}

  async runPipeline(payload: any) {
    const { projectType, url, outputDir } = payload;
    const finalOutputDir = outputDir || 'qlitz-output';

    if (projectType === 'ui') {
      return this.uiPipeline.run(url, finalOutputDir);
    }

    if (projectType === 'api') {
      return this.apiPipeline.run(url, finalOutputDir);
    }

    if (projectType === 'hybrid') {
      return this.hybridPipeline.run(url, finalOutputDir);
    }

    return {
      status: 'error',
      message: 'Invalid projectType. Expected: ui | api | hybrid',
      received: payload
    };
  }
}
