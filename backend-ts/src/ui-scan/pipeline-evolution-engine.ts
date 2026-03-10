import { ReinforcementMemory } from './reinforcement-engine';
import { GlobalOptimizationResult } from './global-optimization-engine';
import { RegressionMemory } from './regression-engine';

export interface PipelineConfig {
  maxDepth: number;
  maxPages: number;
  maxActionsPerPage: number;
  enableExploration: boolean;
  enableJourneys: boolean;
  enableScenarios: boolean;
  enableStateGraph: boolean;
  enableOptimization: boolean;
  enableRegression: boolean;
  enableSelfRefactor: boolean;
}

export interface PipelineEvolutionRecord {
  timestamp: string;
  reason: string;
  config: PipelineConfig;
}

export interface PipelineEvolutionMemory {
  history: PipelineEvolutionRecord[];
  current: PipelineConfig;
}

export class PipelineEvolutionEngine {
  evolve(
    existing: PipelineEvolutionMemory | undefined,
    reinforcement: ReinforcementMemory,
    optimization: GlobalOptimizationResult,
    regression: RegressionMemory | undefined
  ): PipelineEvolutionMemory {
    const base: PipelineConfig =
      existing?.current ?? this.defaultConfig();

    const next = { ...base };

    const totalFailures =
      reinforcement.selectors.reduce((s, r) => s + r.failures, 0) +
      reinforcement.scenarios.reduce((s, r) => s + r.failures, 0) +
      reinforcement.states.reduce((s, r) => s + r.failures, 0);

    const highPriorityTests = optimization.testPlan.filter(t => t.priority === 1).length;
    const highRiskForecasts =
      regression?.forecasts.filter(f => f.riskScore > 0.7).length ?? 0;

    if (totalFailures > 20 || highRiskForecasts > 10) {
      next.maxDepth = Math.min(4, base.maxDepth + 1);
      next.maxPages = Math.min(30, base.maxPages + 5);
      next.maxActionsPerPage = Math.min(20, base.maxActionsPerPage + 3);
      next.enableExploration = true;
    } else if (totalFailures === 0 && highPriorityTests < 5) {
      next.maxDepth = Math.max(1, base.maxDepth - 1);
      next.maxPages = Math.max(5, base.maxPages - 2);
      next.maxActionsPerPage = Math.max(5, base.maxActionsPerPage - 2);
    }

    if (highPriorityTests === 0 && totalFailures === 0) {
      next.enableJourneys = false;
      next.enableScenarios = false;
      next.enableStateGraph = false;
    } else {
      next.enableJourneys = true;
      next.enableScenarios = true;
      next.enableStateGraph = true;
    }

    next.enableOptimization = true;
    next.enableRegression = true;
    next.enableSelfRefactor = true;

    const record: PipelineEvolutionRecord = {
      timestamp: new Date().toISOString(),
      reason: this.buildReason(totalFailures, highPriorityTests, highRiskForecasts),
      config: next
    };

    return {
      history: [...(existing?.history ?? []), record],
      current: next
    };
  }

  private defaultConfig(): PipelineConfig {
    return {
      maxDepth: 2,
      maxPages: 10,
      maxActionsPerPage: 10,
      enableExploration: true,
      enableJourneys: true,
      enableScenarios: true,
      enableStateGraph: true,
      enableOptimization: true,
      enableRegression: true,
      enableSelfRefactor: true
    };
  }

  private buildReason(
    totalFailures: number,
    highPriorityTests: number,
    highRiskForecasts: number
  ): string {
    return `Pipeline evolved based on failures=${totalFailures}, highPriorityTests=${highPriorityTests}, highRiskForecasts=${highRiskForecasts}.`;
  }
}
