import {
  Controller, Get, Post, Delete, Param, Query, Body, HttpCode,
} from '@nestjs/common';
import { RtmCoverageService } from './rtm-coverage.service';

// All routes are under /projects/:projectId/rtm/versions/:versionId/coverage
@Controller('projects/:projectId/rtm/versions/:versionId/coverage')
export class RtmCoverageController {
  constructor(private readonly coverage: RtmCoverageService) {}

  // ── Recompute ──────────────────────────────────────────────────────────────

  @Post('recompute')
  @HttpCode(200)
  async recompute(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
  ) {
    await this.coverage.recompute(projectId, versionId);
    return { ok: true };
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  @Get('summary')
  getSummary(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Query('frameworkId') frameworkId?: string,
  ) {
    return this.coverage.getSummary(projectId, versionId, frameworkId);
  }

  // ── Requirements ───────────────────────────────────────────────────────────

  @Get('requirements')
  getRequirements(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Query('frameworkId') frameworkId?: string,
  ) {
    return this.coverage.getRequirementCoverages(projectId, versionId, frameworkId);
  }

  @Get('requirements/:requirementId')
  getRequirement(
    @Param('projectId')     projectId: string,
    @Param('versionId')     versionId: string,
    @Param('requirementId') requirementId: string,
  ) {
    return this.coverage.getRequirementCoverage(projectId, versionId, requirementId);
  }

  // ── Endpoints ──────────────────────────────────────────────────────────────

  @Get('endpoints')
  getEndpoints(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Query('frameworkId') frameworkId?: string,
  ) {
    return this.coverage.getEndpointCoverages(projectId, versionId, frameworkId);
  }

  // ── Journeys ───────────────────────────────────────────────────────────────

  @Get('journeys')
  getJourneys(
    @Param('projectId') projectId: string,
    @Param('versionId') versionId: string,
    @Query('frameworkId') frameworkId?: string,
  ) {
    return this.coverage.getJourneyCoverages(projectId, versionId, frameworkId);
  }

  // ── Test tags ──────────────────────────────────────────────────────────────
  // Phase 4 test generator will POST here to register test↔RTM associations.

  @Get('tags')
  listTags(@Param('projectId') projectId: string) {
    return this.coverage.listTags(projectId);
  }

  @Post('tags')
  addTag(
    @Param('projectId') projectId: string,
    @Body() body: { testId: string; tagType: string; tagValue: string },
  ) {
    return this.coverage.addTag(projectId, body.testId, body.tagType, body.tagValue);
  }

  @Delete('tags/:tagId')
  @HttpCode(200)
  async removeTag(@Param('tagId') tagId: string) {
    await this.coverage.removeTag(tagId);
    return { ok: true };
  }
}
