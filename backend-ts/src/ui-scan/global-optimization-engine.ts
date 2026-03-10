import { ReinforcementMemory } from './reinforcement-engine';
import { UIStateGraph } from './ui-state-engine';
import { UIScenario } from './ui-scenario-engine';

export interface TestPlanItem {
  title: string;
  file?: string;
  priority: number; // 1 = highest
  reason: string;
}

export interface DriftHotspot {
  id: string;
  label: string;
  driftScore: number;
  type: 'state' | 'scenario';
}

export interface ExplorationPlan {
  targetUrls: string[];
  maxDepth: number;
  maxPages: number;
  maxActionsPerPage: number;
}

export interface SelectorEvolutionPlanItem {
  requirementId: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
}

export interface GlobalOptimizationResult {
  testPlan: TestPlanItem[];
  driftHotspots: DriftHotspot[];
  explorationPlan: ExplorationPlan;
  selectorEvolutionPlan: SelectorEvolutionPlanItem[];
  prunedScenarios: string[];
}

export class GlobalOptimizationEngine {
  optimize(
    allTestTitles: string[],
    scenarios: UIScenario[],
    stateGraph: UIStateGraph,
    reinforcement: ReinforcementMemory
  ): GlobalOptimizationResult {
    const testPlan = this.buildTestPlan(allTestTitles, scenarios, stateGraph, reinforcement);
    const driftHotspots = this.buildDriftHotspots(scenarios, stateGraph, reinforcement);
    const explorationPlan = this.buildExplorationPlan(stateGraph, driftHotspots);
    const selectorEvolutionPlan = this.buildSelectorEvolutionPlan(reinforcement);
    const prunedScenarios = this.pruneScenarios(scenarios, reinforcement);

    return {
      testPlan,
      driftHotspots,
      explorationPlan,
      selectorEvolutionPlan,
      prunedScenarios
    };
  }

  private buildTestPlan(
    allTestTitles: string[],
    scenarios: UIScenario[],
    stateGraph: UIStateGraph,
    reinforcement: ReinforcementMemory
  ): TestPlanItem[] {
    const items: TestPlanItem[] = [];

    for (const title of allTestTitles) {
      let priority = 3;
      let reason = 'Default priority.';

      const scenario = scenarios.find(s => title.includes(s.title));
      if (scenario) {
        const r = reinforcement.scenarios.find(x => x.scenarioId === scenario.id);
        const drift = r?.driftScore ?? scenario.driftRisk;
        if (drift > 0.7) {
          priority = 1;
          reason = 'High drift scenario.';
        } else if (drift > 0.4) {
          priority = 2;
          reason = 'Medium drift scenario.';
        } else {
          priority = 3;
          reason = 'Stable scenario.';
        }
      } else {
        const state = stateGraph.states.find(
          s => title.includes(s.label) || title.includes(s.url)
        );
        if (state) {
          const r = reinforcement.states.find(x => x.stateId === state.id);
          const drift = r?.driftScore ?? state.driftRisk;
          if (drift > 0.7) {
            priority = 1;
            reason = 'High drift state.';
          } else if (drift > 0.4) {
            priority = 2;
            reason = 'Medium drift state.';
          } else {
            priority = 3;
            reason = 'Stable state.';
          }
        }
      }

      items.push({ title, priority, reason });
    }

    return items.sort((a, b) => a.priority - b.priority);
  }

  private buildDriftHotspots(
    scenarios: UIScenario[],
    stateGraph: UIStateGraph,
    reinforcement: ReinforcementMemory
  ): DriftHotspot[] {
    const hotspots: DriftHotspot[] = [];

    for (const scenario of scenarios) {
      const r = reinforcement.scenarios.find(x => x.scenarioId === scenario.id);
      const drift = r?.driftScore ?? scenario.driftRisk;
      if (drift > 0.3) {
        hotspots.push({
          id: scenario.id,
          label: scenario.title,
          driftScore: drift,
          type: 'scenario'
        });
      }
    }

    for (const state of stateGraph.states) {
      const r = reinforcement.states.find(x => x.stateId === state.id);
      const drift = r?.driftScore ?? state.driftRisk;
      if (drift > 0.3) {
        hotspots.push({
          id: state.id,
          label: state.label,
          driftScore: drift,
          type: 'state'
        });
      }
    }

    return hotspots.sort((a, b) => b.driftScore - a.driftScore);
  }

  private buildExplorationPlan(
    stateGraph: UIStateGraph,
    hotspots: DriftHotspot[]
  ): ExplorationPlan {
    const hotspotStates = hotspots
      .filter(h => h.type === 'state')
      .map(h => stateGraph.states.find(s => s.id === h.id))
      .filter(Boolean) as { url: string }[];

    const targetUrls = Array.from(
      new Set(hotspotStates.map(s => s.url).filter(Boolean))
    );

    const maxDepth = targetUrls.length > 0 ? 3 : 2;
    const maxPages = targetUrls.length > 0 ? 20 : 10;
    const maxActionsPerPage = targetUrls.length > 0 ? 15 : 10;

    return {
      targetUrls,
      maxDepth,
      maxPages,
      maxActionsPerPage
    };
  }

  private buildSelectorEvolutionPlan(
    reinforcement: ReinforcementMemory
  ): SelectorEvolutionPlanItem[] {
    const items: SelectorEvolutionPlanItem[] = [];

    for (const sel of reinforcement.selectors) {
      const total = sel.failures + sel.successes;
      const failureRate = total > 0 ? sel.failures / total : 0;

      if (failureRate > 0.6) {
        items.push({
          requirementId: sel.requirementId,
          reason: 'High failure rate selector.',
          urgency: 'high'
        });
      } else if (failureRate > 0.3) {
        items.push({
          requirementId: sel.requirementId,
          reason: 'Moderate failure rate selector.',
          urgency: 'medium'
        });
      }
    }

    return items;
  }

  private pruneScenarios(
    scenarios: UIScenario[],
    reinforcement: ReinforcementMemory
  ): string[] {
    const pruned: string[] = [];

    for (const scenario of scenarios) {
      const r = reinforcement.scenarios.find(x => x.scenarioId === scenario.id);
      if (!r) continue;

      const total = r.failures + r.successes;
      const failureRate = total > 0 ? r.failures / total : 0;

      if (total >= 5 && failureRate < 0.05) {
        pruned.push(scenario.id);
      }
    }

    return pruned;
  }
}
