import { SelectorHistoryEntry } from './auto-rewrite-engine';
import { UIJourney } from './ui-journey-generator';
import { UIScenario } from './ui-scenario-engine';
import { UIStateGraph } from './ui-state-engine';

export interface ReinforcedSelector {
  requirementId: string;
  selector: string;
  failures: number;
  successes: number;
  lastOutcome?: 'failed' | 'passed';
  lastUpdatedAt: string;
}

export interface ReinforcedScenario {
  scenarioId: string;
  failures: number;
  successes: number;
  driftScore: number;
  lastOutcome?: 'failed' | 'passed';
  lastUpdatedAt: string;
}

export interface ReinforcedState {
  stateId: string;
  failures: number;
  successes: number;
  driftScore: number;
  lastOutcome?: 'failed' | 'passed';
  lastUpdatedAt: string;
}

export interface ReinforcementMemory {
  selectors: ReinforcedSelector[];
  scenarios: ReinforcedScenario[];
  states: ReinforcedState[];
}

export interface TestFailureLike {
  title: string;
  file?: string;
  error: string;
}

export interface RequirementLikeForReinforcement {
  id: string;
  description: string;
  selector?: string;
  evolvedSelector?: string;
  selectorHistory?: SelectorHistoryEntry[];
  page: string;
}

export class ReinforcementEngine {
  reinforce(
    failures: TestFailureLike[],
    requirements: RequirementLikeForReinforcement[],
    journeys: UIJourney[],
    scenarios: UIScenario[],
    stateGraph: UIStateGraph,
    existing?: ReinforcementMemory
  ): ReinforcementMemory {
    const memory: ReinforcementMemory = existing ?? {
      selectors: [],
      scenarios: [],
      states: []
    };

    this.reinforceSelectors(memory, failures, requirements);
    this.reinforceScenarios(memory, failures, scenarios);
    this.reinforceStates(memory, failures, stateGraph);

    return memory;
  }

  private reinforceSelectors(
    memory: ReinforcementMemory,
    failures: TestFailureLike[],
    requirements: RequirementLikeForReinforcement[]
  ) {
    for (const req of requirements) {
      const relatedFailures = failures.filter(f =>
        f.title.includes(req.description)
      );

      const outcome: 'failed' | 'passed' =
        relatedFailures.length > 0 ? 'failed' : 'passed';

      let entry = memory.selectors.find(s => s.requirementId === req.id);
      if (!entry) {
        entry = {
          requirementId: req.id,
          selector: req.evolvedSelector || req.selector || '',
          failures: 0,
          successes: 0,
          lastUpdatedAt: new Date().toISOString()
        };
        memory.selectors.push(entry);
      }

      if (outcome === 'failed') {
        entry.failures += 1;
      } else {
        entry.successes += 1;
      }

      entry.lastOutcome = outcome;
      entry.lastUpdatedAt = new Date().toISOString();
    }
  }

  private reinforceScenarios(
    memory: ReinforcementMemory,
    failures: TestFailureLike[],
    scenarios: UIScenario[]
  ) {
    for (const scenario of scenarios) {
      const relatedFailures = failures.filter(f =>
        f.title.includes(scenario.title)
      );

      const outcome: 'failed' | 'passed' =
        relatedFailures.length > 0 ? 'failed' : 'passed';

      let entry = memory.scenarios.find(s => s.scenarioId === scenario.id);
      if (!entry) {
        entry = {
          scenarioId: scenario.id,
          failures: 0,
          successes: 0,
          driftScore: scenario.driftRisk,
          lastUpdatedAt: new Date().toISOString()
        };
        memory.scenarios.push(entry);
      }

      if (outcome === 'failed') {
        entry.failures += 1;
        entry.driftScore = Math.min(1, entry.driftScore + 0.05);
      } else {
        entry.successes += 1;
        entry.driftScore = Math.max(0, entry.driftScore - 0.02);
      }

      entry.lastOutcome = outcome;
      entry.lastUpdatedAt = new Date().toISOString();
    }
  }

  private reinforceStates(
    memory: ReinforcementMemory,
    failures: TestFailureLike[],
    stateGraph: UIStateGraph
  ) {
    for (const state of stateGraph.states) {
      const relatedFailures = failures.filter(f =>
        f.title.includes(state.label) || f.title.includes(state.url)
      );

      const outcome: 'failed' | 'passed' =
        relatedFailures.length > 0 ? 'failed' : 'passed';

      let entry = memory.states.find(s => s.stateId === state.id);
      if (!entry) {
        entry = {
          stateId: state.id,
          failures: 0,
          successes: 0,
          driftScore: state.driftRisk,
          lastUpdatedAt: new Date().toISOString()
        };
        memory.states.push(entry);
      }

      if (outcome === 'failed') {
        entry.failures += 1;
        entry.driftScore = Math.min(1, entry.driftScore + 0.05);
      } else {
        entry.successes += 1;
        entry.driftScore = Math.max(0, entry.driftScore - 0.02);
      }

      entry.lastOutcome = outcome;
      entry.lastUpdatedAt = new Date().toISOString();
    }
  }
}
