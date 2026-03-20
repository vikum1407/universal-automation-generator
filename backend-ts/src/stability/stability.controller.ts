import { Controller, Get, Param } from '@nestjs/common';

import { LoadStabilityContext } from './context/loadStabilityContext';
import { LoadStabilityScoreContext } from './context/loadStabilityScoreContext';
import { LoadReleaseReadinessContext } from './context/loadReleaseReadinessContext';

import evaluateGuardrails from './guardrails/index';
import { evaluateStabilityScore } from './score/evaluator';
import { evaluateReleaseReadiness } from './readiness/evaluator';

import { runAutonomousStabilization } from './stabilization/orchestrator';

@Controller('stability')
export class StabilityController {
  constructor(
    private readonly loadStabilityContext: LoadStabilityContext,
    private readonly loadStabilityScoreContext: LoadStabilityScoreContext,
    private readonly loadReleaseReadinessContext: LoadReleaseReadinessContext
  ) {}

  @Get(':project/guardrails')
  async guardrails(@Param('project') project: string) {
    const context = await this.loadStabilityContext.execute(project);
    const result = evaluateGuardrails(context);

    return {
      project,
      generatedAt: new Date().toISOString(),
      guardrails: result
    };
  }

  @Get(':project/score')
  async score(@Param('project') project: string) {
    const context = await this.loadStabilityScoreContext.execute(project);
    const result = evaluateStabilityScore(context);

    return {
      project,
      generatedAt: new Date().toISOString(),
      score: result
    };
  }

  @Get(':project/readiness')
  async readiness(@Param('project') project: string) {
    const context = await this.loadReleaseReadinessContext.execute(project);
    const result = evaluateReleaseReadiness(context);

    return {
      project,
      generatedAt: new Date().toISOString(),
      readiness: result
    };
  }

  @Get(':project/stabilize')
  async stabilize(@Param('project') project: string) {
    const result = await runAutonomousStabilization(project);

    return {
      project,
      generatedAt: new Date().toISOString(),
      stabilization: result
    };
  }

  @Get(':project/context')
  async fullContext(@Param('project') project: string) {
    const guardrailContext = await this.loadStabilityContext.execute(project);
    const scoreContext = await this.loadStabilityScoreContext.execute(project);
    const readinessContext = await this.loadReleaseReadinessContext.execute(project);

    return {
      project,
      generatedAt: new Date().toISOString(),
      contexts: {
        guardrails: guardrailContext,
        score: scoreContext,
        readiness: readinessContext
      }
    };
  }

  @Get(':project/dashboard')
  async dashboard(@Param('project') project: string) {
    const guardrailContext = await this.loadStabilityContext.execute(project);
    const scoreContext = await this.loadStabilityScoreContext.execute(project);
    const readinessContext = await this.loadReleaseReadinessContext.execute(project);

    const guardrails = evaluateGuardrails(guardrailContext);
    const score = evaluateStabilityScore(scoreContext);
    const readiness = evaluateReleaseReadiness(readinessContext);

    return {
      project,
      generatedAt: new Date().toISOString(),
      guardrails,
      score,
      readiness,
      contexts: {
        guardrails: guardrailContext,
        score: scoreContext,
        readiness: readinessContext
      }
    };
  }
}
