import { Controller, Post, Body } from '@nestjs/common';
import { TestRunnerService } from './test-runner.service';
import { Requirement } from '../rtm/rtm.model';
import { ExecutionService } from './execution.service';

@Controller('execute')
export class ExecutionController {
  constructor(
    private readonly runner: TestRunnerService,
    private readonly exec: ExecutionService
  ) {}

  @Post('ui')
  async executeUI(@Body() body: { projectPath: string; requirements: Requirement[] }) {
    return this.runner.runTests(body.projectPath, body.requirements);
  }

  @Post('api')
  async executeAPI(@Body() body: { projectPath: string; requirements: Requirement[] }) {
    return this.runner.runTests(body.projectPath, body.requirements);
  }

  @Post('run')
  run(@Body() body: { project: string; path: string }) {
    return this.exec.run(body.project, body.path);
  }
}
