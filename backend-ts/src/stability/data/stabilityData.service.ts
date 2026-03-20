import { PrDiffsProvider } from "./providers/pr_diffs.provider";
import { TestFilesProvider } from "./providers/test_files.provider";
import { RiskTrendsProvider } from "./providers/risk_trends.provider";
import { NightlyFailuresProvider } from "./providers/nightly_failures.provider";
import { HealedPatternsProvider } from "./providers/healed_patterns.provider";
import { PredictionsProvider } from "./providers/predictions.provider";
import { PipelinesProvider } from "./providers/pipelines.provider";
import { FlakinessProvider } from "./providers/flakiness.provider";
import { HealingEffectivenessProvider } from "./providers/healing_effectiveness.provider";

export class StabilityDataService {
  constructor(
    private readonly prDiffs: PrDiffsProvider,
    private readonly testFiles: TestFilesProvider,
    private readonly riskTrends: RiskTrendsProvider,
    private readonly nightlyFailures: NightlyFailuresProvider,
    private readonly healedPatterns: HealedPatternsProvider,
    private readonly predictions: PredictionsProvider,
    private readonly pipelines: PipelinesProvider,
    private readonly flakiness: FlakinessProvider,
    private readonly healingEffectiveness: HealingEffectivenessProvider
  ) {}

  async loadGuardrailContext(project: string) {
    return {
      prDiffs: await this.prDiffs.getRecent(project),
      testFiles: await this.testFiles.getRecent(project),
      riskTrend: await this.riskTrends.getLatest(project),
      nightlyFailures: await this.nightlyFailures.getRecent(project),
      healedPatterns: await this.healedPatterns.getRecent(project),
      predictions: await this.predictions.getRecent(project),
      pipelines: await this.pipelines.getRecent(project),
      flakiness: await this.flakiness.getLatest(project),
      healingEffectiveness: await this.healingEffectiveness.getLatest(project)
    };
  }

  async loadStabilityScoreContext(project: string) {
    return {
      riskTrend: await this.riskTrends.getLatest(project),
      nightlyFailures: await this.nightlyFailures.getRecent(project),
      flakiness: await this.flakiness.getLatest(project),
      healingEffectiveness: await this.healingEffectiveness.getLatest(project),
      predictions: await this.predictions.getRecent(project)
    };
  }

  async loadReleaseReadinessContext(project: string) {
    return {
      pipelines: await this.pipelines.getRecent(project),
      nightlyFailures: await this.nightlyFailures.getRecent(project),
      riskTrend: await this.riskTrends.getLatest(project),
      flakiness: await this.flakiness.getLatest(project)
    };
  }
}
