import { Injectable } from '@nestjs/common';
import { IngestionOrchestrator } from '../orchestrator/ingestion-orchestrator';
import { UnifiedTestCaseGenerator } from './unified-test-case-generator';

import { UIFrameworkGenerator } from '../ui-scan/ui-framework-generator';
import { APIFrameworkGenerator } from '../api-scan/api-framework-generator';

@Injectable()
export class FrameworkGenerationOrchestrator {
  private uiFramework = new UIFrameworkGenerator();
  private apiFramework = new APIFrameworkGenerator();

  constructor(
    private readonly ingestionOrchestrator: IngestionOrchestrator,
    private readonly unifiedTestCaseGenerator: UnifiedTestCaseGenerator
  ) {}

  // ----------------------------------------
  // UI FRAMEWORK GENERATION FROM URL
  // ----------------------------------------
  async generateUiFrameworkFromUrl(url: string) {
    const ingested = await this.ingestionOrchestrator.ingestFromUrl(url);
    const bundle = this.unifiedTestCaseGenerator.generateFromIngested(ingested);

    const grouped: Record<string, any[]> = {};

    for (const tc of bundle.uiTestCases) {
      if (!grouped[tc.pageName]) grouped[tc.pageName] = [];
      grouped[tc.pageName].push(tc);
    }

    return this.uiFramework.generate(grouped);
  }

  // ----------------------------------------
  // API FRAMEWORK GENERATION FROM SWAGGER
  // ----------------------------------------
  async generateApiFrameworkFromSwagger(swaggerUrl: string) {
    const ingested = await this.ingestionOrchestrator.ingestFromSwagger(swaggerUrl);
    const bundle = this.unifiedTestCaseGenerator.generateFromIngested(ingested);

    const requirements = bundle.apiTestCases.map(tc => ({
      id: tc.id,
      description: tc.description,
      method: tc.method,
      path: tc.path,
      positive: tc.positive
    }));

    return this.apiFramework.generateFramework(requirements as any);
  }
}
