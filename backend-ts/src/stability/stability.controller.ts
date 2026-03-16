import { Controller, Get, Param } from '@nestjs/common';
import { loadStabilityContext } from './context/loadStabilityContext';
import { loadStabilityScoreContext } from './context/loadStabilityScoreContext';
import { loadReleaseReadinessContext } from './context/loadReleaseReadinessContext';
import { evaluateGuardrails } from './guardrails/evaluator';
import { evaluateStabilityScore } from './score/evaluator';
import { evaluateReleaseReadiness } from './readiness/evaluator';

@Controller('stability')
export class StabilityController {
  @Get(':project/guardrails')
  async guardrails(@Param('project') project: string) {
    const context = await loadStabilityContext(project);
    return evaluateGuardrails(context);
  }

  @Get(':project/score')
  async score(@Param('project') project: string) {
    const context = await loadStabilityScoreContext(project);
    return evaluateStabilityScore(context);
  }

  @Get(':project/readiness')
  async readiness(@Param('project') project: string) {
    const context = await loadReleaseReadinessContext(project);
    return evaluateReleaseReadiness(context);
  }
}
