import { Module } from "@nestjs/common";
import { StabilityController } from "./stability.controller";

import { StabilityDataService } from "./data/stabilityData.service";

import { PrDiffsProvider } from "./data/providers/pr_diffs.provider";
import { TestFilesProvider } from "./data/providers/test_files.provider";
import { RiskTrendsProvider } from "./data/providers/risk_trends.provider";
import { NightlyFailuresProvider } from "./data/providers/nightly_failures.provider";
import { HealedPatternsProvider } from "./data/providers/healed_patterns.provider";
import { PredictionsProvider } from "./data/providers/predictions.provider";
import { PipelinesProvider } from "./data/providers/pipelines.provider";
import { FlakinessProvider } from "./data/providers/flakiness.provider";
import { HealingEffectivenessProvider } from "./data/providers/healing_effectiveness.provider";

import { LoadStabilityContext } from "./context/loadStabilityContext";
import { LoadStabilityScoreContext } from "./context/loadStabilityScoreContext";
import { LoadReleaseReadinessContext } from "./context/loadReleaseReadinessContext";

@Module({
  controllers: [StabilityController],
  providers: [
    // Providers
    PrDiffsProvider,
    TestFilesProvider,
    RiskTrendsProvider,
    NightlyFailuresProvider,
    HealedPatternsProvider,
    PredictionsProvider,
    PipelinesProvider,
    FlakinessProvider,
    HealingEffectivenessProvider,

    // Data service
    StabilityDataService,

    // Context loaders
    LoadStabilityContext,
    LoadStabilityScoreContext,
    LoadReleaseReadinessContext
  ]
})
export class StabilityModule {}
