import { Module } from "@nestjs/common";

import { PrDiffsProvider } from "./providers/pr_diffs.provider";
import { TestFilesProvider } from "./providers/test_files.provider";
import { RiskTrendsProvider } from "./providers/risk_trends.provider";
import { NightlyFailuresProvider } from "./providers/nightly_failures.provider";
import { HealedPatternsProvider } from "./providers/healed_patterns.provider";
import { PredictionsProvider } from "./providers/predictions.provider";
import { PipelinesProvider } from "./providers/pipelines.provider";
import { FlakinessProvider } from "./providers/flakiness.provider";
import { HealingEffectivenessProvider } from "./providers/healing_effectiveness.provider";

import { StabilityDataService } from "./stabilityData.service";

@Module({
  providers: [
    PrDiffsProvider,
    TestFilesProvider,
    RiskTrendsProvider,
    NightlyFailuresProvider,
    HealedPatternsProvider,
    PredictionsProvider,
    PipelinesProvider,
    FlakinessProvider,
    HealingEffectivenessProvider,
    StabilityDataService
  ],
  exports: [StabilityDataService]
})
export class StabilityDataModule {}
