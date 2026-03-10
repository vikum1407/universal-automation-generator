import { Controller, Post, Body } from '@nestjs/common';
import { RTMDashboardBuilder } from './rtm.dashboard';
import { RTMDocument } from './rtm.model';
import { RTMExecutionDocument } from './rtm.execution.model';

@Controller('rtm')
export class RTMController {
  @Post('dashboard')
  generateDashboard(
    @Body() body: { rtm: RTMDocument; execution?: RTMExecutionDocument }
  ) {
    const builder = new RTMDashboardBuilder();
    return { html: builder.build(body.rtm, body.execution) };
  }
}
