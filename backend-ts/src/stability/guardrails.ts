import { Router } from "express";
import { LoadStabilityContext } from "../stability/context/loadStabilityContext";
import evaluateGuardrails from "../stability/guardrails/index";
import { StabilityDataService } from "../stability/data/stabilityData.service";

import { PrDiffsProvider } from "../stability/data/providers/pr_diffs.provider";
import { TestFilesProvider } from "../stability/data/providers/test_files.provider";
import { RiskTrendsProvider } from "../stability/data/providers/risk_trends.provider";
import { NightlyFailuresProvider } from "../stability/data/providers/nightly_failures.provider";
import { HealedPatternsProvider } from "../stability/data/providers/healed_patterns.provider";
import { PredictionsProvider } from "../stability/data/providers/predictions.provider";
import { PipelinesProvider } from "../stability/data/providers/pipelines.provider";
import { FlakinessProvider } from "../stability/data/providers/flakiness.provider";
import { HealingEffectivenessProvider } from "../stability/data/providers/healing_effectiveness.provider";

const dataService = new StabilityDataService(
  new PrDiffsProvider(),
  new TestFilesProvider(),
  new RiskTrendsProvider(),
  new NightlyFailuresProvider(),
  new HealedPatternsProvider(),
  new PredictionsProvider(),
  new PipelinesProvider(),
  new FlakinessProvider(),
  new HealingEffectivenessProvider()
);

const loadStabilityContext = new LoadStabilityContext(dataService);

const router = Router();

router.get("/:project", async (req, res) => {
  const project = req.params.project;

  const context = await loadStabilityContext.execute(project);
  const result = evaluateGuardrails(context);

  res.json(result);
});

export default router;
