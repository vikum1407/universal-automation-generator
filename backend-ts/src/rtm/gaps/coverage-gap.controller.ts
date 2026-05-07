import { Controller, Get, Param, Post } from '@nestjs/common';
import { CoverageGapService } from './coverage-gap.service';

@Controller('projects/:projectId/rtm/:versionId/gaps')
export class CoverageGapController {
  constructor(private readonly svc: CoverageGapService) {}

  @Post('recompute')
  recompute(
    @Param('projectId')  projectId:    string,
    @Param('versionId')  rtmVersionId: string,
  ) {
    return this.svc.recomputeGaps(projectId, rtmVersionId);
  }

  @Get('summary')
  summary(
    @Param('projectId')  projectId:    string,
    @Param('versionId')  rtmVersionId: string,
  ) {
    return this.svc.getSummary(projectId, rtmVersionId);
  }

  @Get('requirements')
  requirements(
    @Param('projectId')  projectId:    string,
    @Param('versionId')  rtmVersionId: string,
  ) {
    return this.svc.getRequirementGaps(projectId, rtmVersionId);
  }

  @Get('endpoints')
  endpoints(
    @Param('projectId')  projectId:    string,
    @Param('versionId')  rtmVersionId: string,
  ) {
    return this.svc.getEndpointGaps(projectId, rtmVersionId);
  }

  @Get('journeys')
  journeys(
    @Param('projectId')  projectId:    string,
    @Param('versionId')  rtmVersionId: string,
  ) {
    return this.svc.getJourneyGaps(projectId, rtmVersionId);
  }

  @Get('generation-plan')
  generationPlan(
    @Param('projectId')  projectId:    string,
    @Param('versionId')  rtmVersionId: string,
  ) {
    return this.svc.getGenerationPlan(projectId, rtmVersionId);
  }
}
