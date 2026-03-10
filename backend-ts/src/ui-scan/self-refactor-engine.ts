import { UIJourney } from './ui-journey-generator';
import { UIScenario } from './ui-scenario-engine';
import { UIStateGraph, UIStateNode, UIStateTransition } from './ui-state-engine';
import { ReinforcementMemory } from './reinforcement-engine';
import { RegressionMemory } from './regression-engine';

export interface RequirementRef {
  id: string;
  page: string;
  description: string;
  selector: string;
  evolvedSelector: string;
  type: string;
  action: string;        
  tags: string[];         
  meta: any;             
}


export interface SelfRefactorResult {
  requirements: RequirementRef[];
  journeys: UIJourney[];
  scenarios: UIScenario[];
  stateGraph: UIStateGraph;
  notes: string[];
}

export class SelfRefactorEngine {
  refactor(
    requirements: RequirementRef[],
    journeys: UIJourney[],
    scenarios: UIScenario[],
    stateGraph: UIStateGraph,
    reinforcement: ReinforcementMemory,
    regression: RegressionMemory | undefined
  ): SelfRefactorResult {
    const notes: string[] = [];

    const deduped = this.deduplicateRequirements(requirements, notes);
    const merged = this.mergeSelectors(deduped, reinforcement, notes);
    const compactJourneys = this.compactJourneys(journeys, notes);
    const compactScenarios = this.compactScenarios(scenarios, notes);
    const collapsedStateGraph = this.collapseStates(stateGraph, notes);

    this.cleanupOrphans(compactJourneys, compactScenarios, collapsedStateGraph, notes);
    this.useRegressionHints(merged, compactScenarios, collapsedStateGraph, regression, notes);

    return {
      requirements: merged,
      journeys: compactJourneys,
      scenarios: compactScenarios,
      stateGraph: collapsedStateGraph,
      notes
    };
  }

  private deduplicateRequirements(reqs: RequirementRef[], notes: string[]): RequirementRef[] {
    const map = new Map<string, RequirementRef>();

    for (const r of reqs) {
      const key = `${r.page}::${r.description}`.toLowerCase();
      if (!map.has(key)) map.set(key, r);
      else {
        const existing = map.get(key)!;
        existing.tags = Array.from(new Set([...(existing.tags ?? []), ...(r.tags ?? [])]));
        if (!existing.evolvedSelector && r.evolvedSelector) {
          existing.evolvedSelector = r.evolvedSelector;
        }
      }
    }

    const out = Array.from(map.values());
    if (out.length !== reqs.length) {
      notes.push(`Deduplicated requirements: ${reqs.length} → ${out.length}`);
    }
    return out;
  }

  private mergeSelectors(reqs: RequirementRef[], reinforcement: ReinforcementMemory, notes: string[]) {
    const bySel = new Map<string, RequirementRef[]>();

    for (const r of reqs) {
      const key = (r.evolvedSelector || r.selector).trim();
      if (!bySel.has(key)) bySel.set(key, []);
      bySel.get(key)!.push(r);
    }

    let merged = 0;

    for (const [selector, group] of bySel.entries()) {
      if (group.length <= 1) continue;

      const ids = group.map(g => g.id);
      const entries = reinforcement.selectors.filter(s => ids.includes(s.requirementId));

      const best = entries.sort((a, b) => {
        const ta = a.failures + a.successes;
        const tb = b.failures + b.successes;
        const ra = ta > 0 ? a.failures / ta : 0;
        const rb = tb > 0 ? b.failures / tb : 0;
        return ra - rb;
      })[0];

      if (!best) continue;

      for (const r of group) {
        if (r.id !== best.requirementId) {
          r.selector = selector;
          r.evolvedSelector = selector;
          merged++;
        }
      }
    }

    if (merged > 0) notes.push(`Merged selectors across ${merged} requirements.`);
    return reqs;
  }

  private compactJourneys(journeys: UIJourney[], notes: string[]): UIJourney[] {
    const seen = new Set<string>();
    const out: UIJourney[] = [];

    for (const j of journeys) {
      const key = j.steps.map(s => `${s.from}->${s.to}`).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        out.push(j);
      }
    }

    if (out.length !== journeys.length) {
      notes.push(`Compacted journeys: ${journeys.length} → ${out.length}`);
    }
    return out;
  }

  private compactScenarios(scenarios: UIScenario[], notes: string[]): UIScenario[] {
    const seen = new Set<string>();
    const out: UIScenario[] = [];

    for (const s of scenarios) {
      const key = s.steps.map(st => `${st.from}->${st.to}`).join('|');
      if (!seen.has(key)) {
        seen.add(key);
        out.push(s);
      }
    }

    if (out.length !== scenarios.length) {
      notes.push(`Compacted scenarios: ${scenarios.length} → ${out.length}`);
    }
    return out;
  }

  private collapseStates(stateGraph: UIStateGraph, notes: string[]): UIStateGraph {
    const byUrl = new Map<string, UIStateNode[]>();

    for (const st of stateGraph.states) {
      const key = st.url.toLowerCase();
      if (!byUrl.has(key)) byUrl.set(key, []);
      byUrl.get(key)!.push(st);
    }

    const newStates: UIStateNode[] = [];
    const idMap = new Map<string, string>();

    for (const [url, group] of byUrl.entries()) {
      if (group.length === 1) {
        newStates.push(group[0]);
        continue;
      }

      const base = { ...group[0] };
      base.invariants = Array.from(new Set(group.flatMap(g => g.invariants)));
      base.driftRisk = Math.max(...group.map(g => g.driftRisk));
      newStates.push(base);

      for (const g of group) idMap.set(g.id, base.id);
    }

    const newTransitions: UIStateTransition[] = stateGraph.transitions.map(t => {
      const fromId = (t as any).from ?? (t as any).source;
      const toId = (t as any).to ?? (t as any).target;

      const from = idMap.get(fromId) ?? fromId;
      const to = idMap.get(toId) ?? toId;

      return { ...t, from, to };
    });

    if (newStates.length !== stateGraph.states.length) {
      notes.push(`Collapsed states: ${stateGraph.states.length} → ${newStates.length}`);
    }

    return { states: newStates, transitions: newTransitions };
  }

  private cleanupOrphans(journeys: UIJourney[], scenarios: UIScenario[], stateGraph: UIStateGraph, notes: string[]) {
    const urls = new Set(stateGraph.states.map(s => s.url));

    const jBefore = journeys.length;
    const sBefore = scenarios.length;

    const jAfter = journeys.filter(j => j.steps.every(s => urls.has(s.from) && urls.has(s.to)));
    const sAfter = scenarios.filter(s => s.steps.every(st => urls.has(st.from) && urls.has(st.to)));

    if (jAfter.length !== jBefore) notes.push(`Removed ${jBefore - jAfter.length} orphan journeys.`);
    if (sAfter.length !== sBefore) notes.push(`Removed ${sBefore - sAfter.length} orphan scenarios.`);

    journeys.splice(0, journeys.length, ...jAfter);
    scenarios.splice(0, scenarios.length, ...sAfter);
  }

  private useRegressionHints(
    requirements: RequirementRef[],
    scenarios: UIScenario[],
    stateGraph: UIStateGraph,
    regression: RegressionMemory | undefined,
    notes: string[]
  ) {
    if (!regression) return;

    const highSel = regression.forecasts.filter(f => f.kind === 'selector' && f.riskScore > 0.7);
    const highSc = regression.forecasts.filter(f => f.kind === 'scenario' && f.riskScore > 0.7);
    const highSt = regression.forecasts.filter(f => f.kind === 'state' && f.riskScore > 0.7);

    if (highSel.length) notes.push(`Regression: ${highSel.length} high-risk selectors.`);
    if (highSc.length) notes.push(`Regression: ${highSc.length} high-risk scenarios.`);
    if (highSt.length) notes.push(`Regression: ${highSt.length} high-risk states.`);

    const selIds = new Set(highSel.map(f => f.refId));
    const scIds = new Set(highSc.map(f => f.refId));
    const stIds = new Set(highSt.map(f => f.refId));

    for (const r of requirements) {
      if (selIds.has(r.id)) r.meta = { ...(r.meta ?? {}), regressionRisk: 'high' };
    }

    for (const s of scenarios) {
      if (scIds.has(s.id)) s.meta = { ...(s.meta ?? {}), regressionRisk: 'high' };
    }

    for (const st of stateGraph.states) {
      if (stIds.has(st.id)) st.meta = { ...(st.meta ?? {}), regressionRisk: 'high' };
    }
  }
}
