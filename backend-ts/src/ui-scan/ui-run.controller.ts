import { Controller, Post, Body } from '@nestjs/common';
import { UIFlowOrchestrator } from './ui-flow-orchestrator';

@Controller()
export class UIRunController {
  constructor(private readonly orchestrator: UIFlowOrchestrator) {}

  @Post('/run-ui')
  async runUi(@Body() body: { url: string; outDir: string }) {
    const { url, outDir } = body;
    const { flowGraph, testFiles, rtm } = await this.orchestrator.run(url, outDir);
    return { flowGraph, testFiles, rtm };
  }
}
