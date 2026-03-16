import { Injectable } from '@nestjs/common';
import { IngestionOrchestrator } from '../orchestrator/ingestion-orchestrator';
import { UnifiedTestCaseGenerator } from '../generator/unified-test-case-generator';
import { RTMDocument } from './rtm.model';

@Injectable()
export class RTMGenerationOrchestrator {
  constructor(
    private readonly ingestionOrchestrator: IngestionOrchestrator,
    private readonly unifiedTestCaseGenerator: UnifiedTestCaseGenerator
  ) {}

  async generateFromUrl(url: string): Promise<RTMDocument> {
    const ingested = await this.ingestionOrchestrator.ingestFromUrl(url);
    const bundle = this.unifiedTestCaseGenerator.generateFromIngested(ingested);

    const requirements = bundle.uiTestCases.map(tc => ({
      id: tc.id,
      page: tc.pageName,
      description: tc.description,
      type: 'ui' as const,
      coveredBy: [tc.id],
      source: 'UI' as const
    }));

    return {
      generatedAt: new Date().toISOString(),
      requirements
    };
  }

  async generateFromSwagger(swaggerUrl: string): Promise<RTMDocument> {
    const ingested = await this.ingestionOrchestrator.ingestFromSwagger(swaggerUrl);
    const bundle = this.unifiedTestCaseGenerator.generateFromIngested(ingested);

    const requirements = bundle.apiTestCases.map(tc => ({
      id: tc.id,
      page: tc.path,
      description: tc.description,
      type: 'api' as const,
      method: tc.method,
      url: tc.path,
      coveredBy: [tc.id],
      source: 'API' as const
    }));

    return {
      generatedAt: new Date().toISOString(),
      requirements
    };
  }
}
