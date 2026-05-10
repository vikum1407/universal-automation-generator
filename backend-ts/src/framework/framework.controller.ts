import { Controller, Get, Post, Query, Body, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { FrameworkService }         from './framework.service';
import { SwaggerValidatorService }  from './swagger/swagger-validator.service';

// All endpoints are under /framework.
// Controllers are intentionally thin — all logic is in FrameworkService.

@Controller('framework')
export class FrameworkController {
  constructor(
    private readonly service:    FrameworkService,
    private readonly validator:  SwaggerValidatorService,
  ) {}

  // ── Framework + language discovery ─────────────────────────────────────────

  @Get('frameworks')
  getSupportedFrameworks() {
    return this.service.getSupportedFrameworks();
  }

  @Get('frameworks/summary')
  getFrameworkSummaries() {
    return this.service.getFrameworkSummaries();
  }

  @Get('languages')
  getSupportedLanguages(@Query('framework') framework: string) {
    return this.service.getSupportedLanguages(framework ?? '');
  }

  @Get('compatibility')
  getCompatibilityMatrix() {
    return this.service.getCompatibilityMatrix();
  }

  @Get('compatibility/validate')
  validateCombination(
    @Query('framework') framework: string,
    @Query('language')  language:  string,
  ) {
    return this.service.validateCombination(framework, language);
  }

  // ── Node catalog ────────────────────────────────────────────────────────────

  @Get('categories')
  getCategories() {
    return this.service.getCategories();
  }

  @Get('library/summary')
  getLibrarySummary() {
    return this.service.getLibrarySummary();
  }

  // GET /framework/nodes?framework=selenium&language=java[&category=reporting]
  @Get('nodes')
  getNodes(
    @Query('framework') framework: string,
    @Query('language')  language:  string,
    @Query('category')  category?: string,
  ) {
    return this.service.getNodes(framework, language, category);
  }

  @Get('nodes/:id')
  getNodeById(@Param('id') id: string) {
    return this.service.getNodeById(id);
  }

  // ── Blueprint ───────────────────────────────────────────────────────────────

  @Post('blueprint/validate')
  validateBlueprint(@Body() blueprint: any) {
    return this.service.validateBlueprint(blueprint);
  }

  // ── Swagger spec validation ─────────────────────────────────────────────────

  @Post('swagger/validate')
  async validateSwagger(@Body() body: { url?: string; content?: string }) {
    if (body.content) return this.validator.validateFromContent(body.content);
    if (body.url)     return this.validator.validateFromUrl(body.url);
    return { valid: false, canGenerate: false, errors: [{ code: 'NO_INPUT', message: 'Provide either url or content.' }] };
  }

  // ── Assembly ─────────────────────────────────────────────────────────────────

  @Post('generate')
  async generate(@Body() blueprint: any) {
    return this.service.generateFramework(blueprint);
  }

  @Get('download/:jobId')
  download(@Param('jobId') jobId: string, @Res() res: Response) {
    const zipPath = this.service.getDownloadPath(jobId);
    if (!zipPath) throw new NotFoundException(`Job "${jobId}" not found or expired.`);
    res.download(zipPath, `${jobId}.zip`);
  }

  // ── AI endpoints ─────────────────────────────────────────────────────────────

  @Post('explain')
  async explain(@Body() blueprint: any) {
    return this.service.explainBlueprint(blueprint);
  }

  @Get('job/:jobId/docs')
  getJobDocs(@Param('jobId') jobId: string) {
    return this.service.getJobDocs(jobId);
  }
}
