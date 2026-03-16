import { Controller, Post, Body } from '@nestjs/common';

import { RTMDocument } from './rtm.model';
import { RTMExecutionDocument } from './rtm.execution.model';

import { RTMDashboardBuilder } from './rtm.dashboard';
import { RTMGenerationOrchestrator } from './rtm-generation-orchestrator';

import { RTMAnalyticsEngine } from './rtm.analytics';
import { RTMInsightsEngine } from './rtm.insights';

import { HistoryService } from '../history/history.service';

@Controller('rtm')
export class RTMController {
  constructor(
    private readonly rtmGen: RTMGenerationOrchestrator,
    private readonly history: HistoryService
  ) {}

  @Post('generate/url')
  async generateFromUrl(@Body('url') url: string) {
    return this.rtmGen.generateFromUrl(url);
  }

  @Post('generate/swagger')
  async generateFromSwagger(@Body('swaggerUrl') swaggerUrl: string) {
    return this.rtmGen.generateFromSwagger(swaggerUrl);
  }

  @Post('dashboard')
  generateDashboard(
    @Body() body: { rtm: RTMDocument; execution?: RTMExecutionDocument }
  ) {
    const builder = new RTMDashboardBuilder();
    return { html: builder.build(body.rtm, body.execution) };
  }

  @Post('analytics')
  computeAnalytics(
    @Body() body: { rtm: RTMDocument; execution?: RTMExecutionDocument }
  ) {
    const engine = new RTMAnalyticsEngine();
    return engine.compute(body.rtm, body.execution);
  }

  @Post('insights')
  generateInsights(
    @Body() body: { rtm: RTMDocument; execution?: RTMExecutionDocument }
  ) {
    const analytics = new RTMAnalyticsEngine().compute(body.rtm, body.execution);
    const insights = new RTMInsightsEngine().generate(
      analytics,
      body.rtm,
      body.execution
    );
    return { analytics, insights };
  }

  @Post('save-run')
  saveRun(
    @Body()
    body: {
      project: string;
      rtm: RTMDocument;
      execution?: RTMExecutionDocument;
    }
  ) {
    const analytics = new RTMAnalyticsEngine().compute(body.rtm, body.execution);
    const insights = new RTMInsightsEngine().generate(
      analytics,
      body.rtm,
      body.execution
    );

    return this.history.saveRun({
      project: body.project,
      rtm: body.rtm,
      execution: body.execution,
      analytics,
      insights
    });
  }
}
