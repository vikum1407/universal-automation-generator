import { Injectable } from '@nestjs/common';

@Injectable()
export class StabilityDataService {
  constructor(
    private readonly prDiffsProvider: any,
    private readonly testFilesProvider: any,
    private readonly riskTrendsProvider: any,
    private readonly nightlyFailuresProvider: any,
    private readonly healedPatternsProvider: any,
    private readonly predictionsProvider: any,
    private readonly pipelinesProvider: any,
    private readonly flakinessProvider: any,
    private readonly healingEffectivenessProvider: any
  ) {}

  async loadGuardrailContext(project: string) {
    return {
      recentPRDiffs: await this.prDiffsProvider.getPRDiffs(project),
      testFiles: await this.testFilesProvider.getTestFiles(project),
      riskTrends: await this.riskTrendsProvider.getRiskTrends(project),
      nightlyFailures: await this.nightlyFailuresProvider.getNightlyFailures(project),
      healedPatterns: await this.healedPatternsProvider.getHealedPatterns(project),
      predictions: await this.predictionsProvider.getPredictions(project)
    };
  }

  async loadScoreContext(project: string) {
    return {
      flakinessRate: await this.flakinessProvider.getFlakinessRate(project),
      avgRisk: (await this.riskTrendsProvider.getRiskTrends(project))
        .reduce((sum, r) => sum + r.increasingStreak, 0) / 10,
      healingEffectiveness: await this.healingEffectivenessProvider.getHealingEffectiveness(project),
      guardrails: await this.loadGuardrailContext(project)
    };
  }

  async loadReadinessContext(project: string) {
    return {
      ...(await this.loadGuardrailContext(project)),
      stabilityScore: await this.loadScoreContext(project),
      recentPipelineFailures: await this.pipelinesProvider.getRecentPipelineFailures(project)
    };
  }
}
