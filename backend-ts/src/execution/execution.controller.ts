import { Controller, Post, Body } from '@nestjs/common';
import { TestRunnerService } from './test-runner.service';
import { Requirement } from '../rtm/rtm.model';

@Controller('execute')
export class ExecutionController {
  private runner = new TestRunnerService();

  @Post('ui')
  async executeUI(@Body() body: { projectPath: string; requirements: Requirement[] }) {
    return this.runner.runTests(body.projectPath, body.requirements);
  }

  @Post('api')
  async executeAPI(@Body() body: { projectPath: string; requirements: Requirement[] }) {
    return this.runner.runTests(body.projectPath, body.requirements);
  }
}
