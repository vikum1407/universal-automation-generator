import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ClosureLoopService } from './closure-loop.service';
import type { StartClosureJobDto } from './entities/closure-job.entity';

@Controller('projects/:projectId/rtm/:versionId/closure-jobs')
export class ClosureLoopController {
  constructor(private readonly svc: ClosureLoopService) {}

  @Post()
  start(
    @Param('projectId')  projectId:    string,
    @Param('versionId')  rtmVersionId: string,
    @Body()              dto:          StartClosureJobDto,
  ) {
    return this.svc.startClosureJob(projectId, rtmVersionId, dto);
  }

  @Get()
  list(
    @Param('projectId')  projectId:    string,
    @Param('versionId')  rtmVersionId: string,
  ) {
    return this.svc.listJobs(projectId, rtmVersionId);
  }

  @Get(':jobId')
  getJob(@Param('jobId') jobId: string) {
    return this.svc.getJob(jobId);
  }

  @Post(':jobId/cancel')
  cancel(@Param('jobId') jobId: string) {
    return this.svc.cancelJob(jobId);
  }

  @Get(':jobId/iterations')
  listIterations(@Param('jobId') jobId: string) {
    return this.svc.getIterations(jobId);
  }

  @Get(':jobId/iterations/:iterationNumber')
  getIteration(
    @Param('jobId')                              jobId:           string,
    @Param('iterationNumber', ParseIntPipe)      iterationNumber: number,
  ) {
    return this.svc.getIteration(jobId, iterationNumber);
  }
}
