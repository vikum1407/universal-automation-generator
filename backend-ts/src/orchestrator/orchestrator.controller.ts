import { Controller, Post, Body } from '@nestjs/common';
import { IngestionOrchestrator } from './ingestion-orchestrator';
import { UnifiedTestCaseGenerator } from '../generator/unified-test-case-generator';
import { FrameworkGenerationOrchestrator } from '../generator/framework-generation-orchestrator';

@Controller('orchestrator')
export class OrchestratorController {
  constructor(
    private readonly ingestionOrchestrator: IngestionOrchestrator,
    private readonly unifiedTestCaseGenerator: UnifiedTestCaseGenerator,
    private readonly frameworkGen: FrameworkGenerationOrchestrator
  ) {}

  // -----------------------------
  // INGEST FROM URL
  // -----------------------------
  @Post('ingest/url')
  async ingestFromUrl(@Body('url') url: string) {
    return this.ingestionOrchestrator.ingestFromUrl(url);
  }

  // -----------------------------
  // INGEST FROM SWAGGER
  // -----------------------------
  @Post('ingest/swagger')
  async ingestFromSwagger(@Body('swaggerUrl') swaggerUrl: string) {
    return this.ingestionOrchestrator.ingestFromSwagger(swaggerUrl);
  }

  // -----------------------------
  // GENERATE TEST CASES FROM URL
  // -----------------------------
  @Post('generate/url')
  async generateFromUrl(@Body('url') url: string) {
    const data = await this.ingestionOrchestrator.ingestFromUrl(url);
    return this.unifiedTestCaseGenerator.generateFromIngested(data);
  }

  // -----------------------------
  // GENERATE TEST CASES FROM SWAGGER
  // -----------------------------
  @Post('generate/swagger')
  async generateFromSwagger(@Body('swaggerUrl') swaggerUrl: string) {
    const data = await this.ingestionOrchestrator.ingestFromSwagger(swaggerUrl);
    return this.unifiedTestCaseGenerator.generateFromIngested(data);
  }

  // -----------------------------
  // UI FRAMEWORK GENERATION
  // -----------------------------
  @Post('framework/ui')
  async generateUiFramework(@Body('url') url: string) {
    return this.frameworkGen.generateUiFrameworkFromUrl(url);
  }

  // -----------------------------
  // API FRAMEWORK GENERATION
  // -----------------------------
  @Post('framework/api')
  async generateApiFramework(@Body('swaggerUrl') swaggerUrl: string) {
    return this.frameworkGen.generateApiFrameworkFromSwagger(swaggerUrl);
  }
}
