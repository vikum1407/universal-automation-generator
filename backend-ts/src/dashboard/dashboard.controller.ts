import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('projects')
  listProjects() {
    return this.dashboard.listProjects();
  }

  @Get('projects/:project/runs')
  listRuns(@Param('project') project: string) {
    return this.dashboard.listRuns(project);
  }

  @Get('projects/:project/latest')
  latest(@Param('project') project: string) {
    return this.dashboard.latestRun(project);
  }

  @Get('projects/:project/trends')
  trends(@Param('project') project: string) {
    return this.dashboard.trends(project);
  }

  @Get('projects/:project/insights')
  insights(@Param('project') project: string) {
    return this.dashboard.insights(project);
  }

  @Get('projects/:project/rrs')
  rrs(@Param('project') project: string) {
    return this.dashboard.rrs(project);
  }

  @Get('projects/:project/release-intelligence')
  releaseIntel(@Param('project') project: string) {
    return this.dashboard.releaseIntelligence(project);
  }

  @Get('projects/:project/release-notes')
  releaseNotes(@Param('project') project: string) {
    return this.dashboard.releaseNotes(project);
  }

  @Get('projects/:project/timeline')
  timeline(@Param('project') project: string) {
    return this.dashboard.releaseTimeline(project);
  }

  @Get('projects/:project/compare/:from/:to')
  compare(
    @Param('project') project: string,
    @Param('from') from: number,
    @Param('to') to: number
  ) {
    return this.dashboard.compare(project, from, to);
  }

  @Get('projects/:project/quality-gate')
  qualityGate(@Param('project') project: string) {
    return this.dashboard.qualityGate(project);
  }

  @Get('projects/:project/release-report')
  releaseReport(@Param('project') project: string) {
    return this.dashboard.unifiedReport(project);
  }

  // ---------------------------------------------------------
  // C18 REQUIREMENT EXPLORER ROUTES
  // ---------------------------------------------------------

  @Get('projects/:project/requirements')
  listRequirements(@Param('project') project: string) {
    return this.dashboard.listRequirements(project);
  }

  @Get('projects/:project/requirements/:requirementId')
  requirementDetails(
    @Param('project') project: string,
    @Param('requirementId') requirementId: string
  ) {
    return this.dashboard.getRequirementDetails(project, requirementId);
  }
}
